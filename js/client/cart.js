// js/client/cart.js
import { supabase } from '../supabase.js';
import { showToast, navigate } from '../app.js';
import { isMockUser } from '../utils/session.js';
import {
    getMockCartItems,
    updateMockCartItem,
    removeMockCartItem,
    mockCheckout,
} from '../utils/mockStore.js';
import { refreshNavBadges } from '../utils/badges.js';
import { getProductImage } from '../data/products.js';
import { getPreorders, removePreorder } from '../utils/preorders.js';

export async function initCart() {
    const container = document.getElementById('app-content');
    const user = window.appState.user;

    if (!user) {
        showToast('Faça login para ver seu carrinho.', 'error');
        navigate('login');
        return;
    }

    if (isMockUser(user)) {
        renderCart(container, getMockCartItems());
        return;
    }

    try {
        const { data: cartItems, error } = await supabase
            .from('cart_items')
            .select('id, quantity, product_id, products(*)')
            .eq('customer_id', user.id);

        if (error) throw error;
        renderCart(container, cartItems || []);
    } catch (err) {
        console.error(err);
        renderCart(container, getMockCartItems());
        showToast('Modo offline: carrinho local.', 'info');
    }
}

function renderCart(container, cartItems) {
    refreshNavBadges();

    if (!cartItems || cartItems.length === 0) {
        const preordersHtml = renderPreordersSection();
        container.innerHTML = `
            <div class="container" style="padding: 50px 0; text-align: center;">
                <h2>SEU CARRINHO ESTÁ VAZIO</h2>
                <p class="text-muted" style="margin: 1rem 0;">Vá para o catálogo e escolha suas peças.</p>
                <a href="#catalog" class="btn btn-primary">IR PARA CATÁLOGO</a>
            </div>
            ${preordersHtml ? `<div class="container">${preordersHtml}</div>` : ''}
        `;
        attachPreorderEvents();
        return;
    }

    let subtotal = 0;
    const itemsHtml = cartItems.map(item => {
        const product = item.products;
        if (!product) return '';
        subtotal += product.price * item.quantity;

        const imgUrl = product.image_url || getProductImage(product);
        const priceFmt = formatCurrency(product.price);

        return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${imgUrl}" alt="${product.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${product.name}</h3>
                    ${item.size ? `<span class="cart-item-size">Tam. ${item.size}</span>` : ''}
                    <span class="cart-item-price">${priceFmt}</span>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn dec-btn" data-id="${item.id}" data-qty="${item.quantity}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn inc-btn" data-id="${item.id}" data-qty="${item.quantity}">+</button>
                </div>
                <button class="btn btn-danger remove-btn" data-id="${item.id}">✕</button>
            </div>
        `;
    }).join('');

    const subtotalFmt = formatCurrency(subtotal);
    const shippingFmt = formatCurrency(15.90);
    const totalFmt = formatCurrency(subtotal + 15.90);
    const preordersHtml = renderPreordersSection();

    container.innerHTML = `
        <div class="container">
            <h2 style="margin-bottom: var(--space-4);">SEU CARRINHO</h2>
            <div class="cart-container">
                <div class="cart-items">${itemsHtml}</div>
                <div class="cart-summary">
                    <h3>RESUMO</h3>
                    <div style="margin: var(--space-3) 0;">
                        <div class="summary-row"><span>Subtotal</span><span>${subtotalFmt}</span></div>
                        <div class="summary-row"><span>Frete</span><span>${shippingFmt}</span></div>
                        <div class="summary-row summary-total"><span>TOTAL</span><span>${totalFmt}</span></div>
                    </div>
                    <button id="checkout-btn" class="btn btn-neon" style="width:100%;">FINALIZAR COMPRA</button>
                </div>
            </div>
            ${preordersHtml}
        </div>
    `;

    attachCartEvents();
    attachPreorderEvents();
}

function renderPreordersSection() {
    const preorders = getPreorders();
    if (!preorders.length) return '';

    const itemsHtml = preorders.map(item => `
        <div class="preorder-item" data-id="${item.id}">
            <div class="preorder-info">
                <strong>${item.product_name}</strong>
                <span class="text-muted">Tam. ${item.size} · ${formatCurrency(item.price)} · x${item.quantity}</span>
                <span class="preorder-status">${item.status === 'pendente' ? '📦 Aguardando reposição' : item.status}</span>
            </div>
            <button type="button" class="btn btn-outline preorder-cancel-btn" data-id="${item.id}">Cancelar</button>
        </div>
    `).join('');

    return `
        <section class="preorders-section">
            <h3>MINHAS ENCOMENDAS</h3>
            <p class="text-muted preorder-desc">Peças esgotadas que você pediu para avisarmos quando chegarem.</p>
            <div class="preorders-list">${itemsHtml}</div>
        </section>
    `;
}

function attachPreorderEvents() {
    document.querySelectorAll('.preorder-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            removePreorder(btn.dataset.id);
            showToast('Encomenda cancelada.');
            initCart();
        });
    });
}

function attachCartEvents() {
    document.querySelectorAll('.inc-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const qty = parseInt(e.currentTarget.getAttribute('data-qty'), 10);
            await updateQuantity(id, qty + 1);
        });
    });

    document.querySelectorAll('.dec-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const qty = parseInt(e.currentTarget.getAttribute('data-qty'), 10);
            if (qty > 1) await updateQuantity(id, qty - 1);
            else await removeItem(id);
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await removeItem(e.currentTarget.getAttribute('data-id'));
        });
    });

    document.getElementById('checkout-btn').addEventListener('click', async () => {
        const btn = document.getElementById('checkout-btn');
        btn.disabled = true;
        btn.innerText = 'PROCESSANDO...';
        setTimeout(() => handleCheckout(), 1200);
    });
}

async function updateQuantity(cartItemId, newQuantity) {
    const user = window.appState.user;

    if (isMockUser(user)) {
        updateMockCartItem(cartItemId, newQuantity);
        initCart();
        return;
    }

    try {
        await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId);
        initCart();
    } catch {
        showToast('Erro ao atualizar quantidade.', 'error');
    }
}

async function removeItem(cartItemId) {
    const user = window.appState.user;

    if (isMockUser(user)) {
        removeMockCartItem(cartItemId);
        showToast('Item removido.');
        initCart();
        return;
    }

    try {
        await supabase.from('cart_items').delete().eq('id', cartItemId);
        showToast('Item removido.');
        initCart();
    } catch {
        showToast('Erro ao remover item.', 'error');
    }
}

async function handleCheckout() {
    const user = window.appState.user;

    if (isMockUser(user)) {
        const order = mockCheckout();
        if (!order.items.length) {
            showToast('Carrinho vazio.', 'error');
            return;
        }
        showToast(`COMPRA FINALIZADA! Total: ${formatCurrency(order.total)} 🛹🔥`);
        refreshNavBadges();
        navigate('home');
        return;
    }

    try {
        const { data: cartItems } = await supabase
            .from('cart_items')
            .select('*, products(*)')
            .eq('customer_id', user.id);

        if (!cartItems?.length) {
            showToast('Carrinho vazio.', 'error');
            return;
        }

        let subtotal = 0;
        cartItems.forEach(i => { subtotal += i.products.price * i.quantity; });
        const total = subtotal + 15.90;

        const { data: order, error } = await supabase.from('orders').insert([{
            customer_id: user.id,
            subtotal,
            shipping: 15.90,
            total,
            status: 'confirmado',
        }]).select().single();

        if (error) throw error;

        const orderItems = cartItems.map(i => ({
            order_id: order.id,
            product_id: i.product_id,
            product_name: i.products.name,
            quantity: i.quantity,
            unit_price: i.products.price,
        }));

        await supabase.from('order_items').insert(orderItems);
        await supabase.from('cart_items').delete().eq('customer_id', user.id);

        await supabase.from('customer_events').insert([{
            customer_id: user.id,
            event_type: 'purchase',
            metadata: { order_id: order.id, total },
        }]);

        showToast('COMPRA FINALIZADA COM SUCESSO! 🛹🔥');
        refreshNavBadges();
        navigate('home');
    } catch (err) {
        console.error(err);
        showToast('Erro ao finalizar compra.', 'error');
        const btn = document.getElementById('checkout-btn');
        if (btn) {
            btn.innerText = 'FINALIZAR COMPRA';
            btn.disabled = false;
        }
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
