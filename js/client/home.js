// js/client/home.js
import { initScrollReveal } from '../effects.js';
import { MOCK_PRODUCTS, CATEGORY_LABELS, getFeaturedProducts, getProductImage } from '../data/products.js';
import { HOME_GALLERY } from '../data/productImages.js';

export function initHome() {
    renderFeatured();
    renderGallery();
    initScrollReveal();
}

function renderFeatured() {
    const grid = document.getElementById('home-featured-grid');
    if (!grid) return;

    const featured = getFeaturedProducts(6);
    grid.innerHTML = featured.map((p, i) => {
        const price = formatCurrency(p.price);
        const original = p.original_price ? formatCurrency(p.original_price) : '';
        return `
            <a href="#catalog" class="home-product-card reveal" style="transition-delay:${i * 80}ms">
                <div class="home-product-img">
                    <img src="${getProductImage(p)}" alt="${p.name}" loading="lazy">
                    ${p.featured ? '<span class="badge badge-red home-badge">🔥 HOT</span>' : ''}
                </div>
                <div class="home-product-info">
                    <span class="product-category">${CATEGORY_LABELS[p.category]}</span>
                    <h3>${p.name}</h3>
                    <div class="product-price-row">
                        <span class="price text-neon">${price}</span>
                        ${original ? `<span class="price-original">${original}</span>` : ''}
                    </div>
                </div>
            </a>`;
    }).join('');
}

function renderGallery() {
    const track = document.getElementById('home-gallery-track');
    if (!track) return;

    const imgs = [...HOME_GALLERY, ...HOME_GALLERY];
    track.innerHTML = imgs.map(src =>
        `<div class="home-gallery-item"><img src="${src}" alt="Streetwear look" loading="lazy"></div>`
    ).join('');
}

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export { MOCK_PRODUCTS };
