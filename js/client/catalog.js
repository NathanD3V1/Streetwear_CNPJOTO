// js/client/catalog.js
import { supabase } from '../supabase.js';
import { showToast } from '../app.js';
import { initScrollReveal } from '../effects.js';
import { MOCK_PRODUCTS, CATEGORY_LABELS, getProductImage, mergeCatalogProducts } from '../data/products.js';
import { getDefaultSize, getSizeStock } from '../data/sizes.js';
import { isMockUser } from '../utils/session.js';
import { addToMockCart, addToMockWishlist, removeMockWishlistByProductId, getMockWishlistRaw } from '../utils/mockStore.js';
import { addPreorder } from '../utils/preorders.js';
import { refreshNavBadges } from '../utils/badges.js';

let allProducts = [];
let wishlistIds = new Set();
let activeCategory = 'todos';
let activeSort = 'featured';
let searchQuery = '';
let controlsBound = false;

export async function initCatalog() {
    const countEl = document.getElementById('catalog-count');
    controlsBound = false;

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        allProducts = (!error && data?.length) ? mergeCatalogProducts(data) : MOCK_PRODUCTS;
        if (!data?.length) console.warn('Usando catálogo local (mock data).');
    } catch {
        allProducts = MOCK_PRODUCTS;
    }

    await loadWishlistState();
    applyFiltersAndRender();
    setupCatalogControls();

    if (countEl) countEl.textContent = `${allProducts.length} peças disponíveis`;
}

async function loadWishlistState() {
    wishlistIds = new Set();
    const user = window.appState.user;
    if (!user) return;

    if (isMockUser(user)) {
        getMockWishlistRaw().forEach(id => wishlistIds.add(id));
        return;
    }

    try {
        const { data } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('customer_id', user.id);
        data?.forEach(item => wishlistIds.add(item.product_id));
    } catch { /* offline */ }
}

function setupCatalogControls() {
    if (controlsBound) return;
    controlsBound = true;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeCategory = e.currentTarget.dataset.category || 'todos';
            applyFiltersAndRender();
        });
    });

    document.getElementById('catalog-search')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        applyFiltersAndRender();
    });

    document.getElementById('catalog-sort')?.addEventListener('change', (e) => {
        activeSort = e.target.value;
        applyFiltersAndRender();
    });
}

function applyFiltersAndRender() {
    const grid = document.getElementById('catalog-grid');
    const resultCount = document.getElementById('catalog-result-count');
    if (!grid) return;

    let filtered = [...allProducts];

    if (activeCategory !== 'todos') {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(p => {
            const haystack = [p.name, p.description, p.category, CATEGORY_LABELS[p.category], ...(p.tags || [])]
                .join(' ').toLowerCase();
            return haystack.includes(searchQuery);
        });
    }

    filtered = sortProducts(filtered, activeSort);
    renderProducts(filtered, grid);

    if (resultCount) {
        resultCount.textContent = filtered.length === allProducts.length
            ? `${filtered.length} produtos`
            : `${filtered.length} de ${allProducts.length} produtos`;
    }
}

function sortProducts(products, sort) {
    const list = [...products];
    switch (sort) {
        case 'price-asc': return list.sort((a, b) => a.price - b.price);
        case 'price-desc': return list.sort((a, b) => b.price - a.price);
        case 'name': return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        default:
            return list.sort((a, b) => {
                const feat = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
                return feat !== 0 ? feat : a.name.localeCompare(b.name, 'pt-BR');
            });
    }
}

function renderProducts(products, grid) {
    if (!products.length) {
        grid.innerHTML = `
            <div class="catalog-empty">
                <span class="catalog-empty-icon">🔍</span>
                <h3>Nenhuma peça encontrada</h3>
                <p>Tente outro filtro ou termo de busca.</p>
            </div>`;
        return;
    }

    grid.innerHTML = '';

    products.forEach((product, index) => {
        const imgUrl = getProductImage(product);
        const priceFmt = formatCurrency(product.price);
        const originalPriceFmt = product.original_price ? formatCurrency(product.original_price) : '';

        let badgesHtml = '';
        if (product.original_price && product.original_price > product.price) {
            badgesHtml += `<span class="badge badge-neon">-${Math.round((1 - product.price / product.original_price) * 100)}% OFF</span>`;
        }
        if (product.featured) badgesHtml += `<span class="badge badge-red">🔥 HOT</span>`;
        if (product.stock !== undefined && product.stock <= 10) {
            badgesHtml += `<span class="badge badge-outline">ÚLTIMAS UNIDADES</span>`;
        }

        const defaultSize = getDefaultSize(product);
        const sizesHtml = (product.size_stock || []).map(s => {
            const out = s.stock === 0;
            const active = s.size === defaultSize ? ' active' : '';
            const outClass = out ? ' out' : '';
            return `<button type="button" class="size-btn${active}${outClass}" data-size="${s.size}" title="${out ? 'Esgotado — encomendar' : `${s.stock} un.`}">${s.size}</button>`;
        }).join('');

        const defaultStock = getSizeStock(product, defaultSize);
        const actionClass = defaultStock > 0 ? 'btn-primary add-to-cart-btn' : 'btn-neon preorder-btn';
        const actionLabel = defaultStock > 0 ? '+ CARRINHO' : '📦 ENCOMENDAR';

        const card = document.createElement('div');
        card.className = 'product-card reveal';
        card.dataset.productId = product.id;
        card.style.transitionDelay = `${Math.min(index * 50, 400)}ms`;
        card.innerHTML = `
            <div class="tilt-wrapper" data-tilt>
                <div class="product-badges">${badgesHtml}</div>
                <button class="wishlist-btn${wishlistIds.has(product.id) ? ' active' : ''}" data-id="${product.id}">❤️</button>
                <div class="product-image-container">
                    <img src="${imgUrl}" alt="${escapeHtml(product.name)}" loading="lazy">
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${CATEGORY_LABELS[product.category] || product.category}</span>
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
                <div class="product-price-row">
                    <span class="price text-neon">${priceFmt}</span>
                    ${originalPriceFmt ? `<span class="price-original">${originalPriceFmt}</span>` : ''}
                </div>
                <div class="size-selector">
                    <span class="size-label">Tamanho</span>
                    <div class="size-options">${sizesHtml}</div>
                </div>
                <p class="size-hint text-muted">${defaultStock > 0 ? `${defaultStock} un. no tamanho ${defaultSize}` : `Tamanho ${defaultSize} esgotado — encomende`}</p>
                <button type="button" class="btn ${actionClass} product-action-btn" data-id="${product.id}" data-size="${defaultSize}">
                    ${actionLabel}
                </button>
            </div>`;
        grid.appendChild(card);
    });

    attachProductEvents();
    initTiltEffect();
    initScrollReveal();
}

function attachProductEvents() {
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.productId;
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        card.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                card.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const size = btn.dataset.size;
                const stock = getSizeStock(product, size);
                const actionBtn = card.querySelector('.product-action-btn');
                const hint = card.querySelector('.size-hint');

                actionBtn.dataset.size = size;
                if (stock > 0) {
                    actionBtn.className = 'btn btn-primary product-action-btn add-to-cart-btn';
                    actionBtn.textContent = '+ CARRINHO';
                    hint.textContent = `${stock} un. no tamanho ${size}`;
                } else {
                    actionBtn.className = 'btn btn-neon product-action-btn preorder-btn';
                    actionBtn.textContent = '📦 ENCOMENDAR';
                    hint.textContent = `Tamanho ${size} esgotado — encomende e avisamos quando chegar`;
                }
            });
        });

        card.querySelector('.product-action-btn')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const size = btn.dataset.size;
            const stock = getSizeStock(product, size);
            if (stock > 0) addToCart(product.id, size);
            else placePreorder(product, size);
        });
    });

    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleWishlist(e.currentTarget, e.currentTarget.getAttribute('data-id'));
        });
    });
}

function initTiltEffect() {
    document.querySelectorAll('[data-tilt]').forEach(wrapper => {
        wrapper.onmousemove = (e) => {
            const rect = wrapper.getBoundingClientRect();
            const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
            const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
            wrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };
        wrapper.onmouseleave = () => {
            wrapper.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        };
    });
}

async function addToCart(productId, size) {
    const user = window.appState.user;
    if (!user) { showToast('Faça login para adicionar ao carrinho.', 'error'); return; }

    const product = allProducts.find(p => p.id === productId);

    if (isMockUser(user)) {
        addToMockCart(productId, size);
        showToast(`Adicionado ao carrinho — tamanho ${size}!`);
        refreshNavBadges();
        return;
    }

    try {
        const { data: existing } = await supabase
            .from('cart_items').select('*')
            .eq('customer_id', user.id).eq('product_id', productId).maybeSingle();

        if (existing) {
            await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
        } else {
            await supabase.from('cart_items').insert([{
                customer_id: user.id,
                product_id: productId,
                quantity: 1,
                metadata: { size },
            }]);
        }
        showToast(`Adicionado ao carrinho — tamanho ${size}!`);
        refreshNavBadges();
    } catch {
        addToMockCart(productId, size);
        showToast(`Adicionado (modo local) — tamanho ${size}.`, 'info');
        refreshNavBadges();
    }
}

function placePreorder(product, size) {
    const user = window.appState.user;
    if (!user) {
        showToast('Faça login para encomendar.', 'error');
        return;
    }

    addPreorder({
        productId: product.id,
        productName: product.name,
        size,
        price: product.price,
    });

    showToast(`Encomenda registrada! ${product.name} — tam. ${size}. Avisaremos quando chegar. 📦`, 'info');
}

async function toggleWishlist(btn, productId) {
    const user = window.appState.user;
    if (!user) { showToast('Faça login para salvar favoritos.', 'error'); return; }

    const isActive = btn.classList.contains('active');

    if (isMockUser(user)) {
        if (isActive) {
            removeMockWishlistByProductId(productId);
            wishlistIds.delete(productId);
            btn.classList.remove('active');
            showToast('Removido dos desejos.');
        } else {
            addToMockWishlist(productId);
            wishlistIds.add(productId);
            btn.classList.add('active');
            showToast('Adicionado aos desejos! ❤️');
        }
        refreshNavBadges();
        return;
    }

    try {
        if (isActive) {
            await supabase.from('wishlists').delete().eq('customer_id', user.id).eq('product_id', productId);
            wishlistIds.delete(productId);
            btn.classList.remove('active');
            showToast('Removido dos desejos.');
        } else {
            await supabase.from('wishlists').insert([{ customer_id: user.id, product_id: productId }]);
            wishlistIds.add(productId);
            btn.classList.add('active');
            showToast('Adicionado aos desejos! ❤️');
        }
        refreshNavBadges();
    } catch {
        if (isActive) {
            removeMockWishlistByProductId(productId);
            wishlistIds.delete(productId);
            btn.classList.remove('active');
        } else {
            addToMockWishlist(productId);
            wishlistIds.add(productId);
            btn.classList.add('active');
        }
        showToast('Salvo localmente.', 'info');
        refreshNavBadges();
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
