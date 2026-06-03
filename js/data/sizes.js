// Tamanhos por categoria + estoque simulado por peça

export const SIZE_SETS = {
  clothing: ['P', 'M', 'G', 'GG'],
  shoes: ['38', '39', '40', '41', '42', '43'],
  oneSize: ['ÚNICO'],
};

export function getSizesForCategory(category) {
  if (category === 'tenis') return SIZE_SETS.shoes;
  if (['bones', 'acessorios'].includes(category)) return SIZE_SETS.oneSize;
  return SIZE_SETS.clothing;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  return Math.abs(h);
}

export function buildSizeStock(product) {
  const sizes = getSizesForCategory(product.category);
  const base = hashCode(product.id || product.name);

  return sizes.map((size, i) => {
    const roll = (base + i * 17 + size.charCodeAt(0)) % 10;
    let stock = roll < 3 ? 0 : roll < 6 ? 2 : roll < 9 ? 5 : 8;
    if (product.stock === 0) stock = 0;
    return { size, stock };
  });
}

export function attachSizeStock(product) {
  return {
    ...product,
    size_stock: product.size_stock || buildSizeStock(product),
  };
}

export function getSizeStock(product, size) {
  const entry = (product.size_stock || buildSizeStock(product)).find(s => s.size === size);
  return entry ? entry.stock : 0;
}

export function getDefaultSize(product) {
  const stock = product.size_stock || buildSizeStock(product);
  const available = stock.find(s => s.stock > 0);
  return available ? available.size : stock[0]?.size;
}
