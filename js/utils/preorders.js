const KEY = 'mock_preorders';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addPreorder({ productId, productName, size, price }) {
  const list = read();
  const exists = list.find(i => i.product_id === productId && i.size === size);
  if (exists) {
    exists.quantity += 1;
  } else {
    list.push({
      id: `pre-${Date.now()}`,
      product_id: productId,
      product_name: productName,
      size,
      price,
      quantity: 1,
      status: 'pendente',
      created_at: new Date().toISOString(),
    });
  }
  write(list);
}

export function getPreorders() {
  return read();
}

export function removePreorder(id) {
  write(read().filter(i => i.id !== id));
}
