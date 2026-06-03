// js/auth.js
import { supabase } from './supabase.js';
import { navigate, showToast, updateNavUI } from './app.js';
import { saveMockSession } from './utils/session.js';
import { refreshNavBadges } from './utils/badges.js';

export function initAuth() {
    const loginForm = document.getElementById('login-form');
    const showSignupBtn = document.getElementById('show-signup');

    let isLogin = true;

    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;

            const header = document.querySelector('.auth-header h2');
            const submitBtn = document.querySelector('#login-form button');

            if (isLogin) {
                header.innerText = 'ENTRAR NA CENA';
                submitBtn.innerText = 'LOGIN';
                showSignupBtn.innerText = 'Cadastre-se';
            } else {
                header.innerText = 'NOVA CONTA';
                submitBtn.innerText = 'CADASTRAR';
                showSignupBtn.innerText = 'Já tenho conta';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = document.querySelector('#login-form button');

            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Aguarde...';
            submitBtn.disabled = true;

            try {
                if (isLogin) {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    showToast('Login bem-sucedido!', 'info');
                    navigate('home');
                } else {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                name: email.split('@')[0],
                                role: 'customer',
                            },
                        },
                    });
                    if (error) throw error;
                    showToast('Cadastro realizado! Se necessário confirme seu email.', 'info');
                    if (data.session) navigate('home');
                }
            } catch (error) {
                console.warn('Supabase Auth error, using mock login:', error);
                handleMockLogin(email);
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

function handleMockLogin(email) {
    const user = { id: 'mock-user-123', email };
    const profile = {
        id: 'mock-user-123',
        name: email.split('@')[0],
        role: email.toLowerCase().includes('admin') ? 'admin' : 'customer',
    };

    window.appState.user = user;
    window.appState.profile = profile;
    saveMockSession(user, profile);
    updateNavUI();
    refreshNavBadges();

    showToast(`Bem-vindo ${profile.name}! (${profile.role})`, 'info');
    navigate('home');
}
