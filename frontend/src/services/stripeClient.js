import { getSession } from './authClient';

const API_BASE_URL = 'http://localhost:3000/api/productos';

export async function postPagarProducto(titulo, precio) {
    const session = getSession();
    const accessToken = session?.accessToken;

    const response = await fetch(`${API_BASE_URL}/PagarProducto`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ titulo, precio })
    });

    const data = await response.json();
    return data;
}
