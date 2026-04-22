import { getSession, refreshSession } from './authClient';

const API_BASE_URL = 'http://localhost:3000/api/productos';

export async function postPagarProducto(titulo, precio) {
    let session = getSession();
    let accessToken = session?.accessToken;

    const response = await fetch(`${API_BASE_URL}/PagarProducto`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ titulo, precio })
    });

    const data = await response.json();

    if (data.mensaje && data.mensaje.toLowerCase().includes('expired')) {
        const sesionRenovada = await refreshSession();
        if (!sesionRenovada) return { codigo: 1, mensaje: 'La sesión ha expirado. Por favor, inicia sesión de nuevo.' };

        const response2 = await fetch(`${API_BASE_URL}/PagarProducto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sesionRenovada.accessToken}`
            },
            body: JSON.stringify({ titulo, precio })
        });

        return await response2.json();
    }

    return data;
}
