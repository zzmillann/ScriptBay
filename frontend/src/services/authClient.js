const API_BASE_URL = 'http://localhost:3000/api/Cliente';

const SESSION_KEY = 'scriptbay_session';

export async function postAuth(path, payload) {
    console.log(`[AUTH TRACE] POST ${path} ->`, payload);

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`[AUTH TRACE] response ${path} <-`, data);

    return data;
}

export function saveSession(sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    window.dispatchEvent(new Event('scriptbay-auth-changed'));
    console.log('[AUTH TRACE] sesión guardada en localStorage');
}

export function getSession() {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession);
    } catch (error) {
        console.error('[AUTH TRACE] sesión inválida en localStorage, se elimina', error);
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('scriptbay-auth-changed'));
    console.log('[AUTH TRACE] sesión eliminada de localStorage');
}
