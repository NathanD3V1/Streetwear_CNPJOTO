-- =========================================================================================
-- THE CNPJOTO STREET — INTELIGÊNCIA DE DADOS E MACHINE LEARNING
-- =========================================================================================
-- Objetivo: Criação de uma Base de Dados própria para rastreamento de comportamento 
-- e treinamento de modelos de Machine Learning (Formato semelhante aos datasets do UCI).
-- 
-- Como usar: Copie todo este código e execute no SQL Editor do seu painel do Supabase.
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 1. ESTRUTURA PRINCIPAL: Tabela de Sessões de Clientes (ml_customer_sessions)
-- -----------------------------------------------------------------------------------------
-- Esta tabela atua como um "Data Lake" para capturar as interações dos usuários no site.
-- Cada linha representa uma sessão única de navegação, contendo métricas comportamentais
-- que mais tarde serão usadas para treinar algoritmos de ML (ex: prever a intenção de compra).
CREATE TABLE IF NOT EXISTS ml_customer_sessions (
    -- Identificadores Básicos
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Se o usuário fizer login, vincula ao perfil. Nulo para visitantes anônimos.
    session_id TEXT NOT NULL,                                    -- Identificador único do cookie/navegador para esta sessão.
    
    -- ==========================================
    -- FEATURES COMPORTAMENTAIS (Variáveis Independentes)
    -- ==========================================
    
    -- A. Engajamento Administrativo
    -- Páginas de gerenciamento da conta (Ex: Meu perfil, Meus pedidos, Configurações).
    administrative_views INTEGER DEFAULT 0,                 -- Total de páginas administrativas visitadas.
    administrative_duration DECIMAL(10,2) DEFAULT 0.0,      -- Tempo total gasto (em segundos) nessas páginas.
    
    -- B. Engajamento Informativo
    -- Páginas institucionais (Ex: Sobre nós, Política de troca, Contato).
    informational_views INTEGER DEFAULT 0,                  -- Total de páginas de informação visitadas.
    informational_duration DECIMAL(10,2) DEFAULT 0.0,       -- Tempo total gasto nessas páginas.
    
    -- C. Engajamento com Produto
    -- Páginas do catálogo ou detalhes do produto (Ex: Visualização de camisetas, tênis).
    product_related_views INTEGER DEFAULT 0,                -- Quantidade de produtos visualizados.
    product_related_duration DECIMAL(10,2) DEFAULT 0.0,     -- Tempo total examinando produtos.
    
    -- ==========================================
    -- MÉTRICAS ANALÍTICAS DO GOOGLE ANALYTICS/NATIVAS
    -- ==========================================
    bounce_rate DECIMAL(5,4) DEFAULT 0.0,                   -- Taxa de Rejeição: % de visitantes que entram e saem sem interagir.
    exit_rate DECIMAL(5,4) DEFAULT 0.0,                     -- Taxa de Saída: % de saídas do site a partir desta página específica.
    page_value DECIMAL(10,2) DEFAULT 0.0,                   -- Valor médio da página (baseado no valor das compras que passaram por ela).
    
    -- ==========================================
    -- CONTEXTO TEMPORAL E TECNOLÓGICO
    -- ==========================================
    special_day DECIMAL(3,2) DEFAULT 0.0,                   -- Proximidade a datas comemorativas (Ex: 0.0 a 1.0 para Black Friday, Dia dos Namorados).
    month TEXT NOT NULL,                                    -- Mês da sessão (Ex: 'Jan', 'Feb', 'Mar'...) para análise de sazonalidade.
    operating_system INTEGER DEFAULT 1,                     -- SO do usuário (1 = Windows, 2 = Mac, 3 = Android, 4 = iOS...).
    browser INTEGER DEFAULT 1,                              -- Navegador utilizado (1 = Chrome, 2 = Safari, 3 = Firefox...).
    region INTEGER DEFAULT 1,                               -- Região geográfica ou estado do acesso.
    traffic_type INTEGER DEFAULT 1,                         -- Origem do acesso (1 = Direto, 2 = Busca Orgânica, 3 = Tráfego Pago...).
    visitor_type TEXT CHECK (visitor_type IN ('New_Visitor', 'Returning_Visitor', 'Other')), -- Classificação do visitante.
    is_weekend BOOLEAN DEFAULT false,                       -- Flag booleana: True se a sessão ocorreu em um final de semana.
    
    -- ==========================================
    -- A VARIÁVEL ALVO (TARGET)
    -- ==========================================
    revenue BOOLEAN DEFAULT false,                          -- O resultado final: O cliente finalizou uma compra durante esta sessão? (True/False)
    
    -- Metadados da Tabela
    created_at TIMESTAMPTZ DEFAULT NOW(),                   -- Data e hora de início/criação da sessão.
    updated_at TIMESTAMPTZ DEFAULT NOW(),                   -- Última vez que a sessão foi atualizada.
    
    UNIQUE(session_id)                                      -- Garante que não teremos sessões duplicadas.
);

-- -----------------------------------------------------------------------------------------
-- 2. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- -----------------------------------------------------------------------------------------
-- Protegemos a tabela para que visitantes não acessem os dados de navegação de outros.
ALTER TABLE ml_customer_sessions ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: Inserção
-- Permite que o frontend (qualquer usuário ou visitante) crie um novo registro de sessão ao entrar no site.
CREATE POLICY "Anyone can insert ml sessions" ON ml_customer_sessions 
FOR INSERT WITH CHECK (true);

-- POLÍTICA 2: Atualização
-- Permite que o script de tracking no frontend atualize as métricas (ex: tempo na página, cliques)
-- da sessão atual em andamento.
CREATE POLICY "Anyone can update their own ml session" ON ml_customer_sessions 
FOR UPDATE USING (true); 
-- NOTA: Em produção rigorosa, a clausula USING deveria filtrar pelo `session_id` que está salvo no cookie do usuário.

-- POLÍTICA 3: Leitura (Acesso Exclusivo para ML e BI)
-- Apenas usuários com a role de 'admin' no sistema podem ler toda a base. 
-- Isso é crucial para que os scripts em Python possam extrair os dados e treinar os modelos com segurança.
CREATE POLICY "Admins can view all ml sessions" ON ml_customer_sessions 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- -----------------------------------------------------------------------------------------
-- 3. AUTOMAÇÃO DE METADADOS (Trigger de Atualização)
-- -----------------------------------------------------------------------------------------
-- Função executada automaticamente sempre que houver um UPDATE na linha.
-- Garante que o campo `updated_at` reflita a exata hora da última interação do cliente.
CREATE OR REPLACE FUNCTION update_ml_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove o gatilho caso ele já exista (para evitar erros ao rodar o script novamente).
DROP TRIGGER IF EXISTS trigger_update_ml_session ON ml_customer_sessions;

-- Associa a função de atualização de tempo à tabela de sessões.
CREATE TRIGGER trigger_update_ml_session
    BEFORE UPDATE ON ml_customer_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_session_timestamp();
