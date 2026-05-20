import { getValidSession } from './authClient';

const API = 'http://localhost:3000/api/notificaciones';

// Devuelve los headers con un access token VALIDO (auto-refresca si caduca).
// Si no hay sesion utilizable, devuelve {} y la peticion fallara con codigo:1, lo cual ya manejamos en la UI.
const authHeaders = async () => {
    const session = await getValidSession();
    const token = session?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getCountNoLeidas() {
    const res = await fetch(`${API}/NoLeidas/count`, { headers: await authHeaders() });
    return res.json();
}

export async function getMisNotificaciones(pagina = 1, tipo = '', leida = '') {
    const params = new URLSearchParams({ pagina });
    if (tipo) params.set('tipo', tipo);
    if (leida !== '') params.set('leida', leida);
    const res = await fetch(`${API}/MisNotificaciones?${params}`, { headers: await authHeaders() });
    return res.json();
}

export async function postMarcarLeida(id) {
    const res = await fetch(`${API}/MarcarLeida/${id}`, {
        method: 'POST',
        headers: await authHeaders()
    });
    return res.json();
}

export async function postMarcarTodasLeidas() {
    const res = await fetch(`${API}/MarcarTodasLeidas`, {
        method: 'POST',
        headers: await authHeaders()
    });
    return res.json();
}

export async function deleteEliminar(id) {
    const res = await fetch(`${API}/Eliminar/${id}`, {
        method: 'DELETE',
        headers: await authHeaders()
    });
    return res.json();
}
