import { getSession } from './authClient';

const API_BASE_URL = 'http://localhost:3000/api/productos';

/**
 * Obtiene recomendaciones personalizadas para el usuario autenticado.
 * @param {string[]} wishlistIds - IDs de los productos en la wishlist del usuario.
 */
export async function getRecomendados(wishlistIds = []) {
    const session = getSession();
    const accessToken = session?.accessToken;

    if (!accessToken) return { codigo: 1, recomendaciones: [] };

    const params = new URLSearchParams();
    if (wishlistIds.length > 0) {
        params.set('wishlist', wishlistIds.join(','));
    }

    const url = `${API_BASE_URL}/Recomendados${wishlistIds.length > 0 ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.json();
}
