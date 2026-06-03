// js/supabase.js
// Supabase Client Initialization

const SUPABASE_URL = 'https://zjkantlqeplejsgybjny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqa2FudGxxZXBsZWpzZ3liam55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDM1MDcsImV4cCI6MjA5NjAxOTUwN30.xKLhe6Bk_ECHNIRx1UDCvEneyINBSDd3YFm9Z0P30sc';

// @supabase/supabase-js is loaded globally via CDN in index.html
function createOfflineClient() {
    const noop = () => Promise.resolve({ data: null, error: null });
    const chain = () => new Proxy({}, {
        get: (_, prop) => ['select', 'insert', 'update', 'delete', 'eq', 'single', 'maybeSingle', 'order'].includes(prop)
            ? chain()
            : noop,
    });

    return {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Offline') }),
            signUp: () => Promise.resolve({ data: null, error: new Error('Offline') }),
            signOut: () => Promise.resolve({ error: null }),
        },
        from: () => chain(),
    };
}

export const supabase = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createOfflineClient();
