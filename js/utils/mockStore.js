import { MOCK_PRODUCTS } from '../data/products.js';

const CART_KEY = 'mock_cart';
const WISHLIST_KEY = 'mock_wishlist';

function read(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getAllProducts() {
    return MOCK_PRODUCTS;
}

export function getProductById(id) {
    return MOCK_PRODUCTS.find(p => p.id === id) || null;
}

export function getMockCartRaw() {
    return read(CART_KEY);
}

export function getMockCartItems() {
    return getMockCartRaw()
        .map((item, index) => {
            const product = getProductById(item.product_id);
            if (!product) return null;
            return {
                id: `mock-cart-${index}`,
                product_id: item.product_id,
                quantity: item.quantity,
                size: item.size || null,
                products: product,
            };
        })
        .filter(Boolean);
}

export function addToMockCart(productId, size = null) {
    const cart = getMockCartRaw();
    const existing = cart.find(item => item.product_id === productId && item.size === size);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product_id: productId, quantity: 1, size });
    }
    write(CART_KEY, cart);
}

export function updateMockCartItem(cartItemId, quantity) {
    const cart = getMockCartItems();
    const item = cart.find(i => i.id === cartItemId);
    if (!item) return;

    const raw = getMockCartRaw();
    const target = raw.find(r => r.product_id === item.product_id && r.size === item.size);
    if (target) {
        target.quantity = quantity;
        write(CART_KEY, raw);
    }
}

export function removeMockCartItem(cartItemId) {
    const cart = getMockCartItems();
    const item = cart.find(i => i.id === cartItemId);
    if (!item) return;

    const raw = getMockCartRaw().filter(r => !(r.product_id === item.product_id && r.size === item.size));
    write(CART_KEY, raw);
}

export function clearMockCart() {
    write(CART_KEY, []);
}

export function getMockWishlistRaw() {
    return read(WISHLIST_KEY);
}

export function getMockWishlistItems() {
    return getMockWishlistRaw()
        .map((productId, index) => {
            const product = getProductById(productId);
            if (!product) return null;
            return {
                id: `mock-wish-${index}`,
                product_id: productId,
                products: product,
            };
        })
        .filter(Boolean);
}

export function addToMockWishlist(productId) {
    const list = getMockWishlistRaw();
    if (!list.includes(productId)) {
        list.push(productId);
        write(WISHLIST_KEY, list);
    }
}

export function removeMockWishlistByProductId(productId) {
    write(WISHLIST_KEY, getMockWishlistRaw().filter(id => id !== productId));
}

export function removeMockWishlistById(wishId) {
    const items = getMockWishlistItems();
    const item = items.find(i => i.id === wishId);
    if (item) removeMockWishlistByProductId(item.product_id);
}

export function mockCheckout() {
    const items = getMockCartItems();
    let subtotal = 0;
    items.forEach(i => { subtotal += i.products.price * i.quantity; });
    const total = subtotal + 15.90;
    clearMockCart();
    return { subtotal, shipping: 15.90, total, items };
}
