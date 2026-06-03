import { supabase } from '../supabase.js';
import { isMockUser } from './session.js';
import { getMockCartRaw, getMockWishlistRaw } from './mockStore.js';

export async function refreshNavBadges() {
    await Promise.all([updateCartBadge(), updateWishlistBadge()]);
}

async function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const user = window.appState.user;
    if (!user) {
        badge.classList.add('hidden');
        badge.textContent = '0';
        return;
    }

    if (isMockUser(user)) {
        const count = getMockCartRaw().reduce((sum, item) => sum + item.quantity, 0);
        badge.classList.toggle('hidden', count === 0);
        badge.textContent = count;
        return;
    }

    try {
        const { data } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('customer_id', user.id);

        const count = data ? data.reduce((sum, item) => sum + item.quantity, 0) : 0;
        badge.classList.toggle('hidden', count === 0);
        badge.textContent = count;
    } catch {
        badge.classList.add('hidden');
    }
}

async function updateWishlistBadge() {
    const badge = document.getElementById('wishlist-count');
    if (!badge) return;

    const user = window.appState.user;
    if (!user) {
        badge.classList.add('hidden');
        badge.textContent = '0';
        return;
    }

    if (isMockUser(user)) {
        const count = getMockWishlistRaw().length;
        badge.classList.toggle('hidden', count === 0);
        badge.textContent = count;
        return;
    }

    try {
        const { data } = await supabase
            .from('wishlists')
            .select('id')
            .eq('customer_id', user.id);

        const count = data ? data.length : 0;
        badge.classList.toggle('hidden', count === 0);
        badge.textContent = count;
    } catch {
        badge.classList.add('hidden');
    }
}
