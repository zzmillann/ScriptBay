import { getSession } from './authClient';

const API_BASE_URL = 'http://localhost:3000/api/Cliente';

export async function postPerfilUsuario(payload) {
    const session = getSession();
    const accessToken = session?.accessToken;

    const response = await fetch(`${API_BASE_URL}/PerfilUsuario`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    return data;
}
