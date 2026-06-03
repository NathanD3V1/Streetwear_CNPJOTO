// js/client/wishlist.js
import { supabase } from '../supabase.js';
import { showToast, navigate } from '../app.js';
import { isMockUser } from '../utils/session.js';
import {
    getMockWishlistItems,
    removeMockWishlistById,
    removeMockWishlistByProductId,
    addToMockCart,
} from '../utils/mockStore.js';
import { refreshNavBadges } from '../utils/badges.js';
import { CATEGORY_LABELS, getProductImage } from '../data/products.js';

export async function initWishlist() {
    const container = document.getElementById('app-content');
    const user = window.appState.user;

    if (!user) {
        showToast('Faça login para ver seus desejos.', 'error');
        navigate('login');
        return;
    }

    if (isMockUser(user)) {
        renderWishlist(container, getMockWishlistItems());
        return;
    }

    try {
        const { data: wishlists, error } = await supabase
            .from('wishlists')
            .select('id, product_id, products(*)')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderWishlist(container, wishlists || []);
    } catch (err) {
        console.error(err);
        renderWishlist(container, getMockWishlistItems());
        showToast('Modo offline: lista local.', 'info');
    }
}

function renderWishlist(container, wishlists) {
    refreshNavBadges();

    if (!wishlists || wishlists.length === 0) {
        container.innerHTML = `
            <div class="container" style="padding: 50px 0; text-align: center;">
                <h2>SUA LISTA DE DESEJOS ESTÁ VAZIA</h2>
                <p class="text-muted" style="margin: 1rem 0;">Adicione produtos que você curtiu no catálogo.</p>
                <a href="#catalog" class="btn btn-primary">IR PARA CATÁLOGO</a>
            </div>
        `;
        return;
    }

    const gridHtml = wishlists.map(item => {
        const product = item.products;
        if (!product) return '';

        const imgUrl = product.image_url || getProductImage(product);
        const priceFmt = formatCurrency(product.price);
        const originalPriceFmt = product.original_price ? formatCurrency(product.original_price) : '';
        const categoryLabel = CATEGORY_LABELS[product.category] || product.category;

        let badgesHtml = '';
        if (product.original_price && product.original_price > product.price) {
            const discount = Math.round((1 - product.price / product.original_price) * 100);
            badgesHtml += `<span class="badge badge-neon">-${discount}% OFF</span>`;
        }

        return `
            <div class="product-card reveal active">
                <div class="tilt-wrapper">
                    <div class="product-badges">${badgesHtml}</div>
                    <button class="wishlist-btn active" data-product="${product.id}" data-id="${item.id}" title="Remover dos desejos">❤️</button>
                    <div class="product-image-container">
                        <img src="${imgUrl}" alt="${product.name}" loading="lazy">
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${categoryLabel}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price-row">
                        <span class="price text-neon">${priceFmt}</span>
                        ${originalPriceFmt ? `<span class="price-original">${originalPriceFmt}</span>` : ''}
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" data-product="${product.id}">+ MOVER PRO CARRINHO</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="container">
            <h2 style="margin: var(--space-4) 0;">LISTA DE DESEJOS</h2>
            <div class="product-grid">${gridHtml}</div>
        </div>
    `;

    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await removeWish(e.currentTarget.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await moveToCart(e.currentTarget.getAttribute('data-product'));
        });
    });
}

async function removeWish(wishId) {
    const user = window.appState.user;

    if (isMockUser(user)) {
        removeMockWishlistById(wishId);
        showToast('Removido dos desejos.');
        initWishlist();
        return;
    }

    try {
        await supabase.from('wishlists').delete().eq('id', wishId);
        showToast('Removido dos desejos.');
        initWishlist();
    } catch {
        showToast('Erro ao remover.', 'error');
    }
}

async function moveToCart(productId) {
    const user = window.appState.user;

    if (isMockUser(user)) {
        addToMockCart(productId);
        removeMockWishlistByProductId(productId);
        showToast('Movido para o carrinho!');
        refreshNavBadges();
        initWishlist();
        return;
    }

    try {
        const { data: existing } = await supabase
            .from('cart_items')
            .select('*')
            .eq('customer_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        if (existing) {
            await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
        } else {
            await supabase.from('cart_items').insert([{ customer_id: user.id, product_id: productId, quantity: 1 }]);
        }

        await supabase.from('wishlists').delete().eq('customer_id', user.id).eq('product_id', productId);
        showToast('Movido para o carrinho!');
        refreshNavBadges();
        initWishlist();
    } catch (err) {
        console.error(err);
        showToast('Erro ao mover pro carrinho.', 'error');
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
