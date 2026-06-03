-- ============================================
-- THE CNPJOTO STREET — Database Setup
-- Execute este SQL no Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- ============================================

-- 1. TABELAS
-- ============================================

-- Perfis de usuário (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Usuário',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  visitor_type TEXT DEFAULT 'novo' CHECK (visitor_type IN ('novo', 'retornante')),
  engagement_score INTEGER DEFAULT 0,
  segment TEXT DEFAULT 'novo' CHECK (segment IN ('novo', 'potencial', 'alto_valor', 'em_risco')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos streetwear
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 100,
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 15.90,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','confirmado','enviado','entregue','cancelado')),
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Lista de desejos
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Carrinho
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Promoções
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('desconto','frete_gratis','compre1_leve2','cupom','brinde')),
  title TEXT NOT NULL,
  description TEXT,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  value DECIMAL(10,2) DEFAULT 0,
  code TEXT,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sugestões inteligentes
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('alta','media','baixa')),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT,
  action_value DECIMAL(10,2),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aceita','ignorada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eventos do cliente (analytics)
CREATE TABLE IF NOT EXISTS customer_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view','wishlist_add','wishlist_remove','cart_add','cart_remove','purchase','login','signup')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRIGGER: Auto-criar perfil no cadastro
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_events ENABLE ROW LEVEL SECURITY;

-- PROFILES: Todos podem ler (para o admin ver clientes), usuário edita o próprio
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PRODUCTS: Leitura pública, admin gerencia
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_update" ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_delete" ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS: Usuário vê as próprias, admin vê todas
CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDER_ITEMS: Segue a mesma lógica dos pedidos
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
    AND (orders.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);

-- WISHLISTS: Usuário gerencia a própria, admin vê todas
CREATE POLICY "wishlists_select" ON wishlists FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "wishlists_insert" ON wishlists FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "wishlists_delete" ON wishlists FOR DELETE USING (customer_id = auth.uid());

-- CART_ITEMS: Usuário gerencia o próprio
CREATE POLICY "cart_select" ON cart_items FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "cart_insert" ON cart_items FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "cart_update" ON cart_items FOR UPDATE USING (customer_id = auth.uid());
CREATE POLICY "cart_delete" ON cart_items FOR DELETE USING (customer_id = auth.uid());

-- PROMOTIONS: Leitura pública (para mostrar no catálogo), admin gerencia
CREATE POLICY "promotions_select" ON promotions FOR SELECT USING (true);
CREATE POLICY "promotions_insert" ON promotions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "promotions_update" ON promotions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "promotions_delete" ON promotions FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SUGGESTIONS: Somente admin
CREATE POLICY "suggestions_select" ON suggestions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "suggestions_insert" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "suggestions_update" ON suggestions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "suggestions_delete" ON suggestions FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- CUSTOMER_EVENTS: Usuário insere, admin lê tudo
CREATE POLICY "events_select" ON customer_events FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "events_insert" ON customer_events FOR INSERT WITH CHECK (true);

-- 4. VIEWS para o Dashboard Admin
-- ============================================

-- View: Produtos mais desejados
CREATE OR REPLACE VIEW wishlist_ranking AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.price,
  p.category,
  p.image_url,
  COUNT(w.id) AS wishlist_count
FROM products p
LEFT JOIN wishlists w ON w.product_id = p.id
GROUP BY p.id, p.name, p.price, p.category, p.image_url
ORDER BY wishlist_count DESC;

-- View: Resumo de vendas por mês
CREATE OR REPLACE VIEW monthly_sales AS
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') AS month,
  COUNT(*) AS order_count,
  COALESCE(SUM(total), 0) AS revenue
FROM orders
WHERE status != 'cancelado'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- View: Resumo de clientes
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.visitor_type,
  p.engagement_score,
  p.segment,
  p.created_at,
  COALESCE(o.order_count, 0) AS total_orders,
  COALESCE(o.total_spent, 0) AS total_spent,
  COALESCE(w.wishlist_count, 0) AS wishlist_items,
  COALESCE(c.cart_count, 0) AS cart_items
FROM profiles p
LEFT JOIN (
  SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
  FROM orders WHERE status != 'cancelado' GROUP BY customer_id
) o ON o.customer_id = p.id
LEFT JOIN (
  SELECT customer_id, COUNT(*) AS wishlist_count FROM wishlists GROUP BY customer_id
) w ON w.customer_id = p.id
LEFT JOIN (
  SELECT customer_id, COUNT(*) AS cart_count FROM cart_items GROUP BY customer_id
) c ON c.customer_id = p.id
WHERE p.role = 'customer'
ORDER BY o.total_spent DESC NULLS LAST;

-- 5. SEED DATA — Produtos Streetwear
-- ============================================

INSERT INTO products (name, description, price, original_price, category, stock, featured, tags) VALUES
  ('Camiseta Oversized "CONCRETE JUNGLE"', 'Camiseta oversized 100% algodão com estampa exclusiva urban art. Corte largo e caimento solto, perfeita pra quem vive a rua.', 89.90, NULL, 'camisetas', 80, true, ARRAY['oversized','estampada','destaque']),
  ('Hoodie "SKULL DRIP"', 'Moletom com capuz pesado, estampa skull em silk screen. Bolso canguru e punhos canelados. O hoodie definitivo.', 199.90, NULL, 'moletons', 45, true, ARRAY['hoodie','skull','inverno']),
  ('Calça Cargo Tactical Preta', 'Calça cargo com 6 bolsos, tecido ripstop resistente. Ajuste no tornozelo com elástico. Estilo militar urbano.', 169.90, NULL, 'calcas', 60, true, ARRAY['cargo','tactical','preta']),
  ('Tênis de Skate "RAWSTREET"', 'Tênis vulcanizado com sola grip reforçada, camurça premium. Feito pra sessão pesada no concreto.', 299.90, NULL, 'tenis', 35, true, ARRAY['skate','vulcanizado','premium']),
  ('Boné 5-Panel "NOIZE"', 'Boné 5-panel com aba reta, logo bordado. Ajuste snapback. Essencial no kit streetwear.', 69.90, NULL, 'bones', 120, false, ARRAY['boné','5panel','snapback']),
  ('Camiseta Tie-Dye "CHAOS"', 'Camiseta tie-dye feita à mão, cada peça é única. Tingimento artesanal em tons de roxo e preto.', 99.90, NULL, 'camisetas', 40, false, ARRAY['tie-dye','artesanal','unica']),
  ('Jaqueta Corta-Vento "NIGHT RUNNER"', 'Jaqueta corta-vento com capuz embutido, detalhes refletivos. Leve, impermeável e com muito estilo.', 249.90, 299.90, 'jaquetas', 30, true, ARRAY['corta-vento','refletivo','impermeavel']),
  ('Bermuda Cargo Camuflada', 'Bermuda cargo em camuflado urbano, tecido sarja leve. 4 bolsos laterais com velcro.', 129.90, NULL, 'bermudas', 55, false, ARRAY['cargo','camuflada','verão']),
  ('Meia Cano Alto Listrada Pack 3', 'Kit com 3 pares de meias cano alto em algodão. Listras em preto/branco, preto/verde neon e preto/vermelho.', 49.90, NULL, 'acessorios', 200, false, ARRAY['meia','pack','cano-alto']),
  ('Shoulder Bag "GRIND"', 'Bolsa lateral em nylon balístico com zíper YKK. Alça ajustável, interior forrado. Cabe o essencial.', 79.90, NULL, 'acessorios', 90, false, ARRAY['shoulder-bag','nylon','urbana']),
  ('Moletom Crewneck "STREETS DON''T SLEEP"', 'Moletom sem capuz com estampa frontal e nas costas. Felpado por dentro, ideal pro rolê noturno.', 179.90, NULL, 'moletons', 50, false, ARRAY['crewneck','estampado','felpado']),
  ('Camiseta Raglan "SKATE OR DIE"', 'Camiseta raglan manga ¾ com estampa old school de skate. Modelagem regular.', 79.90, NULL, 'camisetas', 70, false, ARRAY['raglan','skate','old-school']),
  ('Calça Jeans Baggy Destroyed', 'Calça jeans baggy com puídos e rasgos estratégicos. Lavagem escura, cintura média.', 189.90, 229.90, 'calcas', 40, false, ARRAY['jeans','baggy','destroyed']),
  ('Bucket Hat "WAVEZ"', 'Chapéu bucket em sarja com estampa sublimada exclusiva. Aba curta, estilo 90s.', 59.90, NULL, 'bones', 100, false, ARRAY['bucket','hat','90s']),
  ('Pochete "TRAP"', 'Pochete em nylon com 2 compartimentos e zíper refletivo. Pode usar na cintura ou transversal.', 89.90, NULL, 'acessorios', 80, false, ARRAY['pochete','nylon','refletivo']),
  ('Kit Camisetas Básicas Oversized x3', 'Pack com 3 camisetas básicas oversized: preta, branca e cinza. Algodão 30.1 penteado.', 149.90, 179.90, 'camisetas', 60, true, ARRAY['pack','basica','oversized']),
  ('Hoodie Zip "UNDERGROUND"', 'Moletom com zíper frontal completo, capuz duplo e bolsos laterais. Estampa nas costas em relevo.', 219.90, NULL, 'moletons', 35, false, ARRAY['hoodie','zip','underground']),
  ('Short Tactel "FLOW"', 'Short tactel com forro em mesh, estampa all-over. Elástico na cintura com cordão.', 99.90, NULL, 'bermudas', 75, false, ARRAY['short','tactel','verão']),
  ('Tênis High Top "REVOLT"', 'Tênis cano alto em couro sintético com sola chunky. Inspiração skate 90s com conforto moderno.', 349.90, NULL, 'tenis', 25, true, ARRAY['high-top','chunky','90s']),
  ('Corrente Prata "CHAINS"', 'Corrente em aço inox com banho prata, 60cm. Fecho tipo parrot. Peso e presença.', 129.90, NULL, 'acessorios', 65, false, ARRAY['corrente','prata','metal']),
  ('Camiseta Manga Longa "NIGHTSHIFT"', 'Camiseta manga longa com estampa glow-in-the-dark. Brilha no escuro! Algodão premium.', 109.90, NULL, 'camisetas', 50, false, ARRAY['manga-longa','glow','dark']),
  ('Jaqueta Bomber "RIOT"', 'Jaqueta bomber em nylon com forro acolchoado. Patches e bordados exclusivos. Peça statement.', 289.90, 349.90, 'jaquetas', 20, true, ARRAY['bomber','patches','premium']),
  ('Calça Moletom "LAZY DAYS"', 'Calça jogger em moletom felpado, punho canelado. Máximo conforto pro dia a dia.', 139.90, NULL, 'calcas', 70, false, ARRAY['jogger','moletom','conforto']),
  ('Boné Dad Hat "MINIMALIST"', 'Boné dad hat em sarja lavada, logo pequeno bordado. Ajuste fivela. Casual e limpo.', 49.90, NULL, 'bones', 150, false, ARRAY['dad-hat','minimalista','lavado']),
  ('Bandana Paisley Preta', 'Bandana clássica paisley 100% algodão. Use no pescoço, cabeça ou no bolso. Cultura de rua.', 29.90, NULL, 'acessorios', 200, false, ARRAY['bandana','paisley','classica']),
  ('Hoodie "RACIONAIS 4P"', 'Moletom tribute com arte exclusiva inspirada na cultura hip hop nacional. Capuz, bolso canguru, felpado.', 229.90, NULL, 'moletons', 30, true, ARRAY['hoodie','hiphop','racionais','limitado']),
  ('Camiseta "VIELA" Estampada', 'Camiseta com arte de viela/beco urbano em serigrafia. Estampa grande nas costas, logo pequeno na frente.', 89.90, NULL, 'camisetas', 65, false, ARRAY['estampada','viela','urbana']),
  ('Tênis Vulcanizado "OLLIE"', 'Tênis low-top vulcanizado em canvas, sola de borracha natural. Leve e durável pra sessão diária.', 199.90, NULL, 'tenis', 45, false, ARRAY['vulcanizado','canvas','skate']),
  ('Mochila "BACKSTREET"', 'Mochila em cordura 1000D com compartimento notebook. Costuras reforçadas, alças acolchoadas.', 159.90, NULL, 'acessorios', 40, false, ARRAY['mochila','cordura','resistente']),
  ('Óculos de Sol "URBAN"', 'Óculos retangular em acetato preto, lentes espelhadas UV400. Estilo no rolê sob o sol.', 99.90, NULL, 'acessorios', 55, false, ARRAY['oculos','espelhado','uv400']);

-- Fim do setup!
-- Agora cadastre seu usuário admin pela aplicação e depois execute:
-- UPDATE profiles SET role = 'admin' WHERE email = 'SEU_EMAIL_AQUI';
