import { getSession, refreshSession } from './authClient';

const API_BASE_URL = 'http://localhost:3000/api/productos';

// Llama al backend para crear la orden de PayPal y obtener la URL de aprobacion
export async function postIniciarPagoPayPal(idProducto, titulo, precio, wallet) {
    let session = getSession();
    let accessToken = session?.accessToken;

    const response = await fetch(`${API_BASE_URL}/IniciarPagoPayPal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ idProducto, titulo, precio, wallet })
    });

    const data = await response.json();

    // Si el token ha expirado, lo renovamos y reintentamos (igual que en stripeClient)
    if (data.mensaje && data.mensaje.toLowerCase().includes('expired')) {
        const sesionRenovada = await refreshSession();
        if (!sesionRenovada) return { codigo: 1, mensaje: 'La sesión ha expirado. Por favor, inicia sesión de nuevo.' };

        const response2 = await fetch(`${API_BASE_URL}/IniciarPagoPayPal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sesionRenovada.accessToken}`
            },
            body: JSON.stringify({ idProducto, titulo, precio, wallet })
        });

        return await response2.json();
    }

    return data;
}
