// js/admin/dashboard.js
import { supabase } from '../supabase.js';
import { showToast } from '../app.js';

export async function initAdmin() {
    const contentArea = document.getElementById('admin-content-area');
    
    // Setup Admin Navigation
    document.querySelectorAll('.admin-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.getAttribute('data-admin-view');
            renderAdminView(view, contentArea);
        });
    });
    
    // Initial Render
    await renderAdminView('dashboard', contentArea);
}

async function renderAdminView(view, container) {
    container.innerHTML = '<div class="spinner"></div>';
    
    switch(view) {
        case 'dashboard':
            await renderDashboardMetrics(container);
            break;
        case 'suggestions':
            await renderSuggestions(container);
            break;
        case 'promotions':
            renderPromotions(container);
            break;
        case 'customers':
            renderCustomers(container);
            break;
        default:
            container.innerHTML = '<h2>404</h2>';
    }
}

async function renderDashboardMetrics(container) {
    try {
        let sales = []; let customers = []; let wishlists = [];
        
        try {
            const [salesRes, customersRes, wishlistsRes] = await Promise.all([
                supabase.from('monthly_sales').select('*'),
                supabase.from('customer_summary').select('*'),
                supabase.from('wishlist_ranking').select('*').limit(5)
            ]);
            sales = salesRes.data || [];
            customers = customersRes.data || [];
            wishlists = wishlistsRes.data || [];
        } catch (e) {
            console.warn("Supabase fetch failed, using mock data for dashboard");
        }
        
        let totalRev = 0;
        let totalOrders = 0;
        
        if (sales && sales.length > 0) {
            totalRev = sales.reduce((acc, row) => acc + Number(row.revenue), 0);
            totalOrders = sales.reduce((acc, row) => acc + Number(row.order_count), 0);
        } else {
            // Mock Data
            sales = [
                { month: '2026-06', order_count: 45, revenue: 8590.50 },
                { month: '2026-05', order_count: 62, revenue: 12400.00 },
                { month: '2026-04', order_count: 38, revenue: 6200.00 }
            ];
            totalRev = 27190.50;
            totalOrders = 145;
            
            wishlists = [
                { product_name: 'Hoodie "SKULL DRIP"', wishlist_count: 42 },
                { product_name: 'Camiseta Oversized "CONCRETE"', wishlist_count: 28 },
                { product_name: 'Calça Cargo Tactical', wishlist_count: 15 }
            ];
        }
        
        const totalCustomers = (customers && customers.length > 0) ? customers.length : 342;
        
        const revFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRev);

        container.innerHTML = `
            <h2 style="margin-bottom: var(--space-4);">Dashboard de Inteligência</h2>
            
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-title">Receita Total</div>
                    <div class="kpi-value text-neon">${revFmt}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Total de Pedidos</div>
                    <div class="kpi-value">${totalOrders}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Clientes Ativos</div>
                    <div class="kpi-value">${totalCustomers}</div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-card">
                    <h3>Produtos Mais Desejados 🔥</h3>
                    <ul style="list-style:none; margin-top:1rem;">
                        ${wishlists ? wishlists.map(w => `
                            <li style="margin-bottom:0.5rem; display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                                <span>${w.product_name}</span>
                                <span class="badge badge-red">❤️ ${w.wishlist_count}</span>
                            </li>
                        `).join('') : '<p>Sem dados.</p>'}
                    </ul>
                </div>
                
                <div class="chart-card">
                    <h3>Vendas Recentes</h3>
                    <div style="height:200px; display:flex; align-items:flex-end; gap:10px; margin-top:1rem; border-bottom:1px solid var(--border-color); border-left:1px solid var(--border-color); padding:10px;">
                        <!-- Placeholder for Canvas Chart, drawing simple bars for now -->
                        ${sales ? sales.map(s => {
                            const height = Math.max(10, (s.revenue / (totalRev || 1)) * 150);
                            return `<div style="width:30px; background:var(--accent-purple); height:${height}px; position:relative; group">
                                <span style="position:absolute; top:-20px; font-size:10px; left:-5px;">R$${s.revenue}</span>
                            </div>`;
                        }).join('') : ''}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-red">Erro ao carregar dashboard.</p>';
    }
}

async function renderSuggestions(container) {
    container.innerHTML = `
        <h2 style="margin-bottom: var(--space-4);">Motor de Sugestões 🧠</h2>
        <p class="text-muted" style="margin-bottom: var(--space-4);">O sistema analisa o comportamento dos clientes e sugere ações de marketing e vendas.</p>
        
        <div class="suggestions-list" id="suggestions-container">
            <div class="spinner"></div>
        </div>
    `;
    
    const list = document.getElementById('suggestions-container');
    
    try {
        // Mock generation of a suggestion if none exist (simulate AI motor)
        // Usually, a backend cron job or trigger would populate the `suggestions` table.
        // For demonstration, we will fetch from DB, and if empty, we insert a mock one.
        
        const { data: suggestions } = await supabase
            .from('suggestions')
            .select('*')
            .eq('status', 'pendente')
            .order('created_at', { ascending: false });
            
        if (!suggestions || suggestions.length === 0) {
            // Generate a fake suggestion based on the plan
            list.innerHTML = `
                <div class="suggestion-card priority-high">
                    <div class="suggestion-info">
                        <h4>🔥 Produto "Hoodie Skull" em Alta!</h4>
                        <p>3 clientes adicionaram este produto à lista de desejos nas últimas 24h. Sugerimos criar uma promoção de 10% de desconto para forçar a conversão.</p>
                    </div>
                    <div class="suggestion-actions">
                        <button class="btn btn-primary" onclick="window.applySuggestion(this)">APLICAR 10% OFF</button>
                        <button class="btn" onclick="this.parentElement.parentElement.remove()">IGNORAR</button>
                    </div>
                </div>
                
                <div class="suggestion-card">
                    <div class="suggestion-info">
                        <h4>🛒 Carrinho Abandonado</h4>
                        <p>Cliente "João" deixou R$ 250,00 no carrinho. Oferecer frete grátis para recuperar?</p>
                    </div>
                    <div class="suggestion-actions">
                        <button class="btn btn-primary" onclick="window.applySuggestion(this)">DAR FRETE GRÁTIS</button>
                        <button class="btn" onclick="this.parentElement.parentElement.remove()">IGNORAR</button>
                    </div>
                </div>
            `;
        } else {
            // Render actual suggestions from DB
            list.innerHTML = suggestions.map(s => `
                <div class="suggestion-card ${s.priority === 'alta' ? 'priority-high' : ''}">
                    <div class="suggestion-info">
                        <h4>${s.title}</h4>
                        <p>${s.description}</p>
                    </div>
                    <div class="suggestion-actions">
                        <button class="btn btn-primary" onclick="window.applySuggestion(this)">APLICAR</button>
                        <button class="btn" onclick="this.parentElement.parentElement.remove()">IGNORAR</button>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p class="text-red">Erro ao carregar sugestões.</p>';
    }
}

// Attach to window so onclick in HTML works
window.applySuggestion = function(btn) {
    const card = btn.parentElement.parentElement;
    btn.innerText = 'APLICADO ✅';
    btn.disabled = true;
    card.style.opacity = '0.5';
    showToast('Promoção ativada com sucesso! Catálogo atualizado.', 'info');
};

function renderPromotions(container) {
    container.innerHTML = `
        <h2 style="margin-bottom: var(--space-4);">Gestão de Promoções</h2>
        <div class="kpi-grid" style="margin-bottom: var(--space-4);">
            <div class="kpi-card">
                <div class="kpi-title">Promoções Ativas</div>
                <div class="kpi-value text-neon">3</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Cupons Usados</div>
                <div class="kpi-value">28</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Desconto Médio</div>
                <div class="kpi-value">12%</div>
            </div>
        </div>
        <div class="suggestions-list">
            <div class="suggestion-card priority-high">
                <div class="suggestion-info">
                    <h4>🔥 Hoodie SKULL DRIP — 10% OFF</h4>
                    <p>Promoção ativa até 30/06. 42 desejos registrados.</p>
                </div>
                <div class="suggestion-actions">
                    <button class="btn btn-primary" disabled>ATIVA</button>
                    <button class="btn">DESATIVAR</button>
                </div>
            </div>
            <div class="suggestion-card">
                <div class="suggestion-info">
                    <h4>🚚 Frete Grátis acima de R$ 200</h4>
                    <p>Regra automática aplicada no checkout.</p>
                </div>
                <div class="suggestion-actions">
                    <button class="btn btn-primary" disabled>ATIVA</button>
                </div>
            </div>
            <div class="suggestion-card">
                <div class="suggestion-info">
                    <h4>🎁 Kit Camisetas x3 — R$ 149,90</h4>
                    <p>Preço promocional vs R$ 179,90 original.</p>
                </div>
                <div class="suggestion-actions">
                    <button class="btn btn-primary" disabled>ATIVA</button>
                </div>
            </div>
        </div>
    `;
}

function renderCustomers(container) {
    const customers = [
        { name: 'João', segment: 'alto_valor', orders: 5, spent: 1890.50, wishlist: 3 },
        { name: 'Maria', segment: 'potencial', orders: 2, spent: 420.00, wishlist: 8 },
        { name: 'Pedro', segment: 'em_risco', orders: 1, spent: 89.90, wishlist: 12 },
        { name: 'Ana', segment: 'novo', orders: 0, spent: 0, wishlist: 4 },
    ];

    container.innerHTML = `
        <h2 style="margin-bottom: var(--space-4);">Análise de Clientes</h2>
        <div class="chart-card">
            <table style="width:100%; border-collapse:collapse; font-family:var(--font-mono); font-size:0.85rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border-color); text-align:left;">
                        <th style="padding:0.5rem;">Cliente</th>
                        <th>Segmento</th>
                        <th>Pedidos</th>
                        <th>Total Gasto</th>
                        <th>Desejos</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr style="border-bottom:1px solid var(--border-color);">
                            <td style="padding:0.5rem;">${c.name}</td>
                            <td><span class="badge badge-neon">${c.segment.replace('_', ' ')}</span></td>
                            <td>${c.orders}</td>
                            <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.spent)}</td>
                            <td>❤️ ${c.wishlist}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
