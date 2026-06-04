# Projeto IGOR - Machine Learning

Este repositório contém a inteligência artificial (Machine Learning) do **Projeto IGOR**. Ele utiliza o dataset **Online Shoppers Purchasing Intention (UCI 468)** para prever a intenção de compra de clientes em uma loja virtual, analisando o comportamento de navegação.

## 🚀 Estrutura do Projeto

O projeto é focado no back-end de Machine Learning e é composto principalmente pela pasta `ml/`:

- `ml/train_model.py`: Script para baixar o dataset, pré-processar os dados e treinar o modelo preditivo (Random Forest).
- `ml/api.py`: Uma API REST feita em Flask para servir as predições do modelo para outras aplicações.
- `ml/dashboard_app.py`: Um painel interativo (Dashboard) feito com Streamlit para visualizar as métricas de performance do modelo e quais fatores mais impactam a decisão de compra.
- `ml/requirements.txt`: Lista de dependências Python necessárias para rodar o projeto.

## ⚙️ Pré-requisitos

Certifique-se de ter o [Python 3.8+](https://www.python.org/downloads/) instalado na sua máquina.

## 🛠️ Instalação e Configuração

Siga os passos abaixo para configurar o projeto na sua máquina:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/NathanD3V1/Streetwear_CNPJOTO.git
   cd Streetwear_CNPJOTO
   ```

2. **Crie um ambiente virtual (Recomendado):**
   ```bash
   python -m venv venv
   
   # No Windows:
   venv\Scripts\activate
   
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r ml/requirements.txt
   ```
   *(Pode ser necessário rodar `pip install flask flask-cors` separadamente caso vá usar a API e não estejam no requirements).*

## 🧠 Como Usar

O fluxo do projeto é dividido em três etapas principais:

### 1. Treinar o Modelo
Antes de rodar a API ou o Dashboard, você precisa treinar o modelo para que a IA aprenda com os dados.
```bash
python ml/train_model.py
```
*Isso vai baixar o dataset, treinar o Random Forest e salvar os modelos e métricas de desempenho dentro da pasta `ml/output/` e o `model.joblib` na pasta `ml/`.*

### 2. Rodar o Dashboard Interativo (Streamlit)
Para ver os gráficos, entender a importância de cada métrica (como Tempo na Página, Taxa de Rejeição, etc) e avaliar a performance da IA:
```bash
streamlit run ml/dashboard_app.py
```
*Após rodar o comando, o navegador abrirá automaticamente na página do dashboard.*

### 3. Iniciar a API (Flask)
Se você quiser integrar essa Inteligência Artificial em um site ou sistema externo, você pode rodar a API:
```bash
python ml/api.py
```
Isso iniciará um servidor local expondo as seguintes rotas:
- **`POST /api/predict`**: Recebe os dados de comportamento de um visitante e retorna a probabilidade dele finalizar uma compra.
- **`GET /api/metrics`**: Retorna as métricas de acurácia, precisão e overview de uso do modelo em formato JSON.

## 🔒 Considerações
- O diretório principal contém apenas a lógica e o núcleo de inteligência de dados. Arquivos antigos de frontend foram removidos para manter o repositório direto e focado no ML.