const SESSION_KEY = 'cnpjoto_session';

export function isMockUser(user) {
    return user?.id?.startsWith('mock-');
}

export function saveMockSession(user, profile) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile }));
}

export function loadMockSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearMockSession() {
    localStorage.removeItem(SESSION_KEY);
}

export function restoreMockSession() {
    const session = loadMockSession();
    if (!session) return false;

    window.appState.user = session.user;
    window.appState.profile = session.profile;
    return true;
}
