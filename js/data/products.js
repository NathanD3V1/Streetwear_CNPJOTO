// js/data/products.js — Catálogo THE CNPJOTO STREET
import { PRODUCT_IMAGES, resolveProductImage, normalizeProductName } from './productImages.js';
import { attachSizeStock } from './sizes.js';

const raw = [
  { id: 'a1000001-0000-4000-8000-000000000001', name: 'Camiseta Oversized "CONCRETE JUNGLE"', description: 'Camiseta oversized 100% algodão com estampa exclusiva urban art.', price: 89.90, original_price: null, category: 'camisetas', stock: 80, featured: true, tags: ['oversized', 'estampada', 'destaque'] },
  { id: 'a1000001-0000-4000-8000-000000000002', name: 'Hoodie "SKULL DRIP"', description: 'Moletom com capuz pesado, estampa skull em silk screen.', price: 199.90, original_price: null, category: 'moletons', stock: 45, featured: true, tags: ['hoodie', 'skull', 'inverno'] },
  { id: 'a1000001-0000-4000-8000-000000000003', name: 'Calça Cargo Tactical Preta', description: 'Calça cargo com 6 bolsos, tecido ripstop resistente.', price: 169.90, original_price: null, category: 'calcas', stock: 60, featured: true, tags: ['cargo', 'tactical', 'preta'] },
  { id: 'a1000001-0000-4000-8000-000000000004', name: 'Tênis de Skate "RAWSTREET"', description: 'Tênis vulcanizado com sola grip reforçada, camurça premium.', price: 299.90, original_price: null, category: 'tenis', stock: 35, featured: true, tags: ['skate', 'vulcanizado', 'premium'] },
  { id: 'a1000001-0000-4000-8000-000000000005', name: 'Boné 5-Panel "NOIZE"', description: 'Boné 5-panel com aba reta, logo bordado. Ajuste snapback.', price: 69.90, original_price: null, category: 'bones', stock: 120, featured: false, tags: ['boné', '5panel', 'snapback'] },
  { id: 'a1000001-0000-4000-8000-000000000006', name: 'Camiseta Tie-Dye "CHAOS"', description: 'Camiseta tie-dye feita à mão, cada peça é única.', price: 99.90, original_price: null, category: 'camisetas', stock: 40, featured: false, tags: ['tie-dye', 'artesanal', 'unica'] },
  { id: 'a1000001-0000-4000-8000-000000000007', name: 'Jaqueta Corta-Vento "NIGHT RUNNER"', description: 'Jaqueta corta-vento com capuz embutido, detalhes refletivos.', price: 249.90, original_price: 299.90, category: 'jaquetas', stock: 30, featured: true, tags: ['corta-vento', 'refletivo', 'impermeavel'] },
  { id: 'a1000001-0000-4000-8000-000000000008', name: 'Bermuda Cargo Camuflada', description: 'Bermuda cargo em camuflado urbano, tecido sarja leve.', price: 129.90, original_price: null, category: 'bermudas', stock: 55, featured: false, tags: ['cargo', 'camuflada', 'verão'] },
  { id: 'a1000001-0000-4000-8000-000000000009', name: 'Meia Cano Alto Listrada Pack 3', description: 'Kit com 3 pares de meias cano alto em algodão.', price: 49.90, original_price: null, category: 'acessorios', stock: 200, featured: false, tags: ['meia', 'pack', 'cano-alto'] },
  { id: 'a1000001-0000-4000-8000-000000000010', name: 'Shoulder Bag "GRIND"', description: 'Bolsa lateral em nylon balístico com zíper YKK.', price: 79.90, original_price: null, category: 'acessorios', stock: 90, featured: false, tags: ['shoulder-bag', 'nylon', 'urbana'] },
  { id: 'a1000001-0000-4000-8000-000000000011', name: 'Moletom Crewneck "STREETS DON\'T SLEEP"', description: 'Moletom sem capuz com estampa frontal e nas costas.', price: 179.90, original_price: null, category: 'moletons', stock: 50, featured: false, tags: ['crewneck', 'estampado', 'felpado'] },
  { id: 'a1000001-0000-4000-8000-000000000012', name: 'Camiseta Raglan "SKATE OR DIE"', description: 'Camiseta raglan manga ¾ com estampa old school de skate.', price: 79.90, original_price: null, category: 'camisetas', stock: 70, featured: false, tags: ['raglan', 'skate', 'old-school'] },
  { id: 'a1000001-0000-4000-8000-000000000013', name: 'Calça Jeans Baggy Destroyed', description: 'Calça jeans baggy com puídos e rasgos estratégicos.', price: 189.90, original_price: 229.90, category: 'calcas', stock: 40, featured: false, tags: ['jeans', 'baggy', 'destroyed'] },
  { id: 'a1000001-0000-4000-8000-000000000014', name: 'Bucket Hat "WAVEZ"', description: 'Chapéu bucket em sarja com estampa sublimada exclusiva.', price: 59.90, original_price: null, category: 'bones', stock: 100, featured: false, tags: ['bucket', 'hat', '90s'] },
  { id: 'a1000001-0000-4000-8000-000000000015', name: 'Pochete "TRAP"', description: 'Pochete em nylon com 2 compartimentos e zíper refletivo.', price: 89.90, original_price: null, category: 'acessorios', stock: 80, featured: false, tags: ['pochete', 'nylon', 'refletivo'] },
  { id: 'a1000001-0000-4000-8000-000000000016', name: 'Kit Camisetas Básicas Oversized x3', description: 'Pack com 3 camisetas básicas oversized: preta, branca e cinza.', price: 149.90, original_price: 179.90, category: 'camisetas', stock: 60, featured: true, tags: ['pack', 'basica', 'oversized'] },
  { id: 'a1000001-0000-4000-8000-000000000017', name: 'Hoodie Zip "UNDERGROUND"', description: 'Moletom com zíper frontal completo, capuz duplo e bolsos laterais.', price: 219.90, original_price: null, category: 'moletons', stock: 35, featured: false, tags: ['hoodie', 'zip', 'underground'] },
  { id: 'a1000001-0000-4000-8000-000000000018', name: 'Short Tactel "FLOW"', description: 'Short tactel com forro em mesh, estampa all-over.', price: 99.90, original_price: null, category: 'bermudas', stock: 75, featured: false, tags: ['short', 'tactel', 'verão'] },
  { id: 'a1000001-0000-4000-8000-000000000019', name: 'Tênis High Top "REVOLT"', description: 'Tênis cano alto em couro sintético com sola chunky.', price: 349.90, original_price: null, category: 'tenis', stock: 25, featured: true, tags: ['high-top', 'chunky', '90s'] },
  { id: 'a1000001-0000-4000-8000-000000000020', name: 'Corrente Prata "CHAINS"', description: 'Corrente em aço inox com banho prata, 60cm.', price: 129.90, original_price: null, category: 'acessorios', stock: 65, featured: false, tags: ['corrente', 'prata', 'metal'] },
  { id: 'a1000001-0000-4000-8000-000000000021', name: 'Camiseta Manga Longa "NIGHTSHIFT"', description: 'Camiseta manga longa com estampa glow-in-the-dark.', price: 109.90, original_price: null, category: 'camisetas', stock: 50, featured: false, tags: ['manga-longa', 'glow', 'dark'] },
  { id: 'a1000001-0000-4000-8000-000000000022', name: 'Jaqueta Bomber "RIOT"', description: 'Jaqueta bomber em nylon com forro acolchoado.', price: 289.90, original_price: 349.90, category: 'jaquetas', stock: 20, featured: true, tags: ['bomber', 'patches', 'premium'] },
  { id: 'a1000001-0000-4000-8000-000000000023', name: 'Calça Moletom "LAZY DAYS"', description: 'Calça jogger em moletom felpado, punho canelado.', price: 139.90, original_price: null, category: 'calcas', stock: 70, featured: false, tags: ['jogger', 'moletom', 'conforto'] },
  { id: 'a1000001-0000-4000-8000-000000000024', name: 'Boné Dad Hat "MINIMALIST"', description: 'Boné dad hat em sarja lavada, logo pequeno bordado.', price: 49.90, original_price: null, category: 'bones', stock: 150, featured: false, tags: ['dad-hat', 'minimalista', 'lavado'] },
  { id: 'a1000001-0000-4000-8000-000000000025', name: 'Bandana Paisley Preta', description: 'Bandana clássica paisley 100% algodão.', price: 29.90, original_price: null, category: 'acessorios', stock: 200, featured: false, tags: ['bandana', 'paisley', 'classica'] },
  { id: 'a1000001-0000-4000-8000-000000000026', name: 'Hoodie "RACIONAIS 4P"', description: 'Moletom tribute com arte exclusiva inspirada na cultura hip hop nacional.', price: 229.90, original_price: null, category: 'moletons', stock: 30, featured: true, tags: ['hoodie', 'hiphop', 'racionais', 'limitado'] },
  { id: 'a1000001-0000-4000-8000-000000000027', name: 'Camiseta "VIELA" Estampada', description: 'Camiseta com arte de viela/beco urbano em serigrafia.', price: 89.90, original_price: null, category: 'camisetas', stock: 65, featured: false, tags: ['estampada', 'viela', 'urbana'] },
  { id: 'a1000001-0000-4000-8000-000000000028', name: 'Tênis Vulcanizado "OLLIE"', description: 'Tênis low-top vulcanizado em canvas, sola de borracha natural.', price: 199.90, original_price: null, category: 'tenis', stock: 45, featured: false, tags: ['vulcanizado', 'canvas', 'skate'] },
  { id: 'a1000001-0000-4000-8000-000000000029', name: 'Mochila "BACKSTREET"', description: 'Mochila em cordura 1000D com compartimento notebook.', price: 159.90, original_price: null, category: 'acessorios', stock: 40, featured: false, tags: ['mochila', 'cordura', 'resistente'] },
  { id: 'a1000001-0000-4000-8000-000000000030', name: 'Óculos de Sol "URBAN"', description: 'Óculos retangular em acetato preto, lentes espelhadas UV400.', price: 99.90, original_price: null, category: 'acessorios', stock: 55, featured: false, tags: ['oculos', 'espelhado', 'uv400'] },
];

const MOCK_BY_NAME = Object.fromEntries(
  raw.map(p => [normalizeProductName(p.name), p])
);

export const MOCK_PRODUCTS = raw.map(p => attachSizeStock({
  ...p,
  image_url: PRODUCT_IMAGES[p.id],
}));

export const CATEGORY_LABELS = {
  camisetas: 'Camisetas',
  moletons: 'Moletons',
  calcas: 'Calças',
  tenis: 'Tênis',
  bones: 'Bonés',
  jaquetas: 'Jaquetas',
  bermudas: 'Bermudas',
  acessorios: 'Acessórios',
};

export const HOME_CATEGORIES = [
  { key: 'camisetas', label: 'Camisetas', icon: '👕' },
  { key: 'moletons', label: 'Moletons', icon: '🧥' },
  { key: 'calcas', label: 'Calças', icon: '👖' },
  { key: 'tenis', label: 'Tênis', icon: '👟' },
  { key: 'jaquetas', label: 'Jaquetas', icon: '🌃' },
  { key: 'acessorios', label: 'Acessórios', icon: '🎒' },
];

export function enrichProduct(product) {
  const mock = MOCK_BY_NAME[normalizeProductName(product.name)];
  const base = mock || product;
  return attachSizeStock({
    ...product,
    image_url: resolveProductImage(base),
    id: product.id || mock?.id,
    size_stock: mock?.size_stock || product.size_stock,
  });
}

export function mergeCatalogProducts(remoteProducts) {
  if (!remoteProducts?.length) return MOCK_PRODUCTS;

  return MOCK_PRODUCTS.map(mock => {
    const remote = remoteProducts.find(p => normalizeProductName(p.name) === normalizeProductName(mock.name));
    if (!remote) return mock;
    return attachSizeStock({
      ...mock,
      ...remote,
      image_url: PRODUCT_IMAGES[mock.id],
      size_stock: mock.size_stock,
    });
  });
}

export function enrichProducts(products) {
  return products.map(enrichProduct);
}

export function getFeaturedProducts(limit = 6) {
  return MOCK_PRODUCTS.filter(p => p.featured).slice(0, limit);
}

export function getProductImage(product) {
  return resolveProductImage(product);
}
