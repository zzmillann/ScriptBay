import { getSession } from './authClient';

const API = 'http://localhost:3000/api/notificaciones';

const authHeaders = () => {
    const session = getSession();
    const token = session?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getCountNoLeidas() {
    const res = await fetch(`${API}/NoLeidas/count`, { headers: authHeaders() });
    return res.json();
}

export async function getMisNotificaciones(pagina = 1, tipo = '', leida = '') {
    const params = new URLSearchParams({ pagina });
    if (tipo) params.set('tipo', tipo);
    if (leida !== '') params.set('leida', leida);
    const res = await fetch(`${API}/MisNotificaciones?${params}`, { headers: authHeaders() });
    return res.json();
}

export async function postMarcarLeida(id) {
    const res = await fetch(`${API}/MarcarLeida/${id}`, {
        method: 'POST',
        headers: authHeaders()
    });
    return res.json();
}

export async function postMarcarTodasLeidas() {
    const res = await fetch(`${API}/MarcarTodasLeidas`, {
        method: 'POST',
        headers: authHeaders()
    });
    return res.json();
}

export async function deleteEliminar(id) {
    const res = await fetch(`${API}/Eliminar/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    return res.json();
}
