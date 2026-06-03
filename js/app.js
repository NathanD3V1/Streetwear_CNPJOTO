// js/app.js
import { supabase } from './supabase.js';
import { initVisualEffects } from './effects.js';
import { restoreMockSession, clearMockSession, isMockUser } from './utils/session.js';
import { refreshNavBadges } from './utils/badges.js';

window.appState = {
    user: null,
    profile: null,
    cart: []
};

let isNavigating = false;

const routes = {
    home: renderHome,
    catalog: renderCatalog,
    cart: renderCart,
    wishlist: renderWishlist,
    login: renderLogin,
    admin: renderAdmin,
};

async function initApp() {
    console.log('Initializing THE CNPJOTO STREET...');

    if (restoreMockSession()) {
        updateNavUI();
        refreshNavBadges();
    }

    setupNavigation();

    const hash = window.location.hash.replace('#', '') || 'home';
    navigate(hash, true);

    initVisualEffects();
    initAuthSession();
}

async function initAuthSession() {
    if (!window.supabase) return;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
            await handleAuthSuccess(session.user);
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await handleAuthSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                window.appState.user = null;
                window.appState.profile = null;
                clearMockSession();
                updateNavUI();
                refreshNavBadges();
                navigate('home', true);
            }
        });
    } catch (err) {
        console.error('Supabase Error:', err);
    }
}

async function handleAuthSuccess(user) {
    window.appState.user = user;

    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (data) {
        window.appState.profile = data;
    }

    updateNavUI();
    refreshNavBadges();
}

export function updateNavUI() {
    const { user, profile } = window.appState;

    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const adminBtn = document.getElementById('nav-admin-btn');

    if (!loginBtn || !logoutBtn || !adminBtn) return;

    if (user) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');

        if (profile && profile.role === 'admin') {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        adminBtn.classList.add('hidden');
    }
}

function setupNavigation() {
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(e.currentTarget.getAttribute('data-route'));
        });
    });

    document.getElementById('nav-logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
    });

    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    window.addEventListener('hashchange', () => {
        if (isNavigating) return;
        const hash = window.location.hash.replace('#', '') || 'home';
        navigate(hash, true);
    });
}

async function handleLogout() {
    if (isMockUser(window.appState.user)) {
        window.appState.user = null;
        window.appState.profile = null;
        clearMockSession();
        updateNavUI();
        refreshNavBadges();
        showToast('Você saiu da conta.');
        navigate('home');
        return;
    }

    await supabase.auth.signOut();
    showToast('Você saiu da conta.');
}

export function navigate(route, skipHashUpdate = false) {
    const content = document.getElementById('app-content');
    if (!content) return;

    if (!skipHashUpdate) {
        isNavigating = true;
        window.location.hash = route;
        isNavigating = false;
    }

    content.className = '';
    void content.offsetWidth;
    content.className = 'view-enter';

    const navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.classList.remove('active');

    if (routes[route]) {
        routes[route](content);
    } else {
        content.innerHTML = `
            <div class="container" style="text-align:center; padding: 100px 0;">
                <h1 class="glitch-text" data-text="404">404</h1>
                <p>Página não encontrada no asfalto.</p>
                <a href="#home" class="btn btn-primary" style="margin-top:1rem;">VOLTAR</a>
            </div>
        `;
    }
}

async function renderHome(container) {
    container.innerHTML = `
        <section class="hero">
            <div class="hero-bg"></div>
            <div class="hero-content">
                <p class="hero-tag">DROP SS26 — NOVA COLEÇÃO</p>
                <h1 class="hero-title glitch-text" data-text="VISTA A RUA">VISTA A RUA</h1>
                <p class="hero-subtitle">Streetwear underground direto do asfalto.<br>Peças oversized, cargos, hoodies e tênis de skate.</p>
                <div class="hero-actions">
                    <a href="#catalog" class="btn btn-neon">EXPLORAR COLEÇÃO →</a>
                    <a href="#login" class="btn">ENTRAR NA CENA</a>
                </div>
            </div>
        </section>

        <div class="marquee-bar">
            <div class="marquee-track">
                <span>OVERSIZED</span><span>•</span><span>CARGO</span><span>•</span>
                <span>SKATE</span><span>•</span><span>HOODIE</span><span>•</span>
                <span>UNDERGROUND</span><span>•</span><span>STREETWEAR</span><span>•</span>
                <span>OVERSIZED</span><span>•</span><span>CARGO</span><span>•</span>
                <span>SKATE</span><span>•</span><span>HOODIE</span><span>•</span>
                <span>UNDERGROUND</span><span>•</span><span>STREETWEAR</span><span>•</span>
            </div>
        </div>

        <section class="home-section container">
            <div class="section-header">
                <h2>🔥 EM DESTAQUE</h2>
                <a href="#catalog" class="text-neon section-link">Ver tudo →</a>
            </div>
            <div id="home-featured-grid" class="home-featured-grid"></div>
        </section>

        <section class="home-section container">
            <div class="section-header">
                <h2>NAVEGAR POR CATEGORIA</h2>
            </div>
            <div class="home-categories">
                <a href="#catalog" class="home-cat-card" data-cat="camisetas">
                    <span class="home-cat-icon">👕</span><span>Camisetas</span>
                </a>
                <a href="#catalog" class="home-cat-card" data-cat="moletons">
                    <span class="home-cat-icon">🧥</span><span>Moletons</span>
                </a>
                <a href="#catalog" class="home-cat-card" data-cat="calcas">
                    <span class="home-cat-icon">👖</span><span>Calças</span>
                </a>
                <a href="#catalog" class="home-cat-card" data-cat="tenis">
                    <span class="home-cat-icon">👟</span><span>Tênis</span>
                </a>
                <a href="#catalog" class="home-cat-card" data-cat="jaquetas">
                    <span class="home-cat-icon">🌃</span><span>Jaquetas</span>
                </a>
                <a href="#catalog" class="home-cat-card" data-cat="acessorios">
                    <span class="home-cat-icon">🎒</span><span>Acessórios</span>
                </a>
            </div>
        </section>

        <section class="home-manifesto">
            <div class="container home-manifesto-inner">
                <div class="manifesto-text">
                    <h2 class="glitch-text" data-text="A RUA NÃO DORME">A RUA NÃO DORME</h2>
                    <p>The Cnpjoto Street nasceu no concreto — inspirada em skate, hip hop e a cultura das vielas. Cada peça é pensada pra quem vive o rolê, não só pra postar foto.</p>
                    <ul class="manifesto-list">
                        <li>✦ 30+ peças exclusivas</li>
                        <li>✦ Estilo oversized & baggy</li>
                        <li>✦ Frete pra todo Brasil</li>
                        <li>✦ Drop limitado toda temporada</li>
                    </ul>
                    <a href="#catalog" class="btn btn-primary">VER CATÁLOGO COMPLETO</a>
                </div>
                <div class="manifesto-stats">
                    <div class="stat-card"><span class="stat-num text-neon">30+</span><span class="stat-label">Peças</span></div>
                    <div class="stat-card"><span class="stat-num text-neon">8</span><span class="stat-label">Categorias</span></div>
                    <div class="stat-card"><span class="stat-num text-neon">🔥</span><span class="stat-label">Destaques</span></div>
                </div>
            </div>
        </section>

        <section class="home-gallery-section">
            <div class="section-header container">
                <h2>#CNPJOTOSTREET</h2>
                <p class="text-muted">Looks da comunidade — inspiração streetwear</p>
            </div>
            <div class="home-gallery-wrap">
                <div id="home-gallery-track" class="home-gallery-track"></div>
            </div>
        </section>

        <section class="home-cta container">
            <div class="home-cta-box">
                <h2>PRIMEIRA COMPRA?</h2>
                <p>Cadastre-se e monte seu kit streetwear. Frete fixo R$ 15,90.</p>
                <a href="#login" class="btn btn-neon">CRIAR CONTA →</a>
            </div>
        </section>
    `;
    import('./client/home.js').then(m => m.initHome());
}

function renderCatalog(container) {
    container.innerHTML = `
        <div class="container">
            <div class="catalog-header">
                <div>
                    <h2>Catálogo</h2>
                    <p id="catalog-count" class="catalog-subtitle">Carregando coleção...</p>
                </div>
                <div class="catalog-toolbar">
                    <input type="search" id="catalog-search" class="catalog-search" placeholder="Buscar peças, estilos, tags...">
                    <select id="catalog-sort" class="catalog-sort">
                        <option value="featured">Destaques primeiro</option>
                        <option value="price-asc">Menor preço</option>
                        <option value="price-desc">Maior preço</option>
                        <option value="name">Nome A-Z</option>
                    </select>
                </div>
            </div>
            <div class="filters">
                <button class="filter-btn active" data-category="todos">TODOS</button>
                <button class="filter-btn" data-category="camisetas">CAMISETAS</button>
                <button class="filter-btn" data-category="moletons">MOLETONS</button>
                <button class="filter-btn" data-category="calcas">CALÇAS</button>
                <button class="filter-btn" data-category="tenis">TÊNIS</button>
                <button class="filter-btn" data-category="jaquetas">JAQUETAS</button>
                <button class="filter-btn" data-category="bermudas">BERMUDAS</button>
                <button class="filter-btn" data-category="bones">BONÉS</button>
                <button class="filter-btn" data-category="acessorios">ACESSÓRIOS</button>
            </div>
            <p id="catalog-result-count" class="catalog-result-count"></p>
            <div id="catalog-grid" class="product-grid">
                <div style="text-align:center; padding:50px; grid-column:1/-1;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                </div>
            </div>
        </div>
    `;
    import('./client/catalog.js').then(module => module.initCatalog());
}

function renderCart(container) {
    container.innerHTML = '<div class="container" style="padding:80px 0;text-align:center;"><div class="spinner" style="margin:0 auto;"></div></div>';
    import('./client/cart.js').then(module => module.initCart());
}

function renderWishlist(container) {
    container.innerHTML = '<div class="container" style="padding:80px 0;text-align:center;"><div class="spinner" style="margin:0 auto;"></div></div>';
    import('./client/wishlist.js').then(module => module.initWishlist());
}

function renderLogin(container) {
    if (window.appState.user) {
        navigate('home');
        return;
    }
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-header">
                <h2>ENTRAR NA CENA</h2>
            </div>
            <form id="login-form">
                <div class="form-group">
                    <label>E-MAIL</label>
                    <input type="email" id="email" class="form-control" required placeholder="seu@email.com">
                </div>
                <div class="form-group">
                    <label>SENHA</label>
                    <input type="password" id="password" class="form-control" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">LOGIN</button>
            </form>
            <p style="text-align:center; margin-top:1rem; font-size:0.8rem; font-family:var(--font-mono)">
                Não tem conta? <a href="#" id="show-signup" class="text-neon">Cadastre-se</a>
            </p>
            <p style="text-align:center; margin-top:0.5rem; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-secondary);">
                Demo: use email com "admin" para painel admin
            </p>
        </div>
    `;
    import('./auth.js').then(module => module.initAuth());
}

function renderAdmin(container) {
    const isAdmin = window.appState.profile?.role === 'admin';
    if (!window.appState.user || !isAdmin) {
        showToast('Acesso restrito.', 'error');
        navigate('home');
        return;
    }

    container.innerHTML = `
        <div class="admin-layout">
            <aside class="admin-sidebar">
                <div class="admin-menu">
                    <div class="admin-menu-item active" data-admin-view="dashboard">Dashboard</div>
                    <div class="admin-menu-item" data-admin-view="suggestions">Inteligência 🧠</div>
                    <div class="admin-menu-item" data-admin-view="promotions">Promoções</div>
                    <div class="admin-menu-item" data-admin-view="customers">Clientes</div>
                </div>
            </aside>
            <main class="admin-content" id="admin-content-area">
                <div class="spinner"></div>
            </main>
        </div>
    `;
    import('./admin/dashboard.js').then(module => module.initAdmin());
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:none; border:none; color:inherit; cursor:pointer;" onclick="this.parentElement.classList.add('fade-out'); setTimeout(() => this.parentElement.remove(), 300)">✕</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

window.showToast = showToast;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
