import { apiUrl } from './apiBase';
import { getValidSession } from './authClient';

const PRODUCTS_API = apiUrl('/api/productos');
const AUCTIONS_API = apiUrl('/api/subastas');

const buildHeaders = async (needsAuth = false) => {
    if (!needsAuth) return {};

    const session = await getValidSession();
    const token = session?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestJson = async (url, { method = 'GET', body, needsAuth = false } = {}) => {
    const headers = await buildHeaders(needsAuth);
    const response = await fetch(url, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

    return response.json();
};

export const getProductReviews = (productId) => requestJson(`${PRODUCTS_API}/ObtenerReviewsProducto/${productId}`, { needsAuth: true });

export const postProductReview = ({ productoId, estrellas, comentario }) => requestJson(`${PRODUCTS_API}/CrearReviewProducto`, {
    method: 'POST',
    body: { productoId, estrellas, comentario },
    needsAuth: true
});

export const getProductChat = ({ productoId, buyerId }) => {
    const url = new URL(`${PRODUCTS_API}/ObtenerChatProducto/${productoId}`);
    if (buyerId) url.searchParams.set('buyerId', buyerId);
    return requestJson(url.toString(), { needsAuth: true });
};

export const postProductMessage = ({ productoId, buyerId, contenido }) => requestJson(`${PRODUCTS_API}/EnviarMensajeProducto`, {
    method: 'POST',
    body: { productoId, buyerId, contenido },
    needsAuth: true
});

export const getAuctionChat = ({ subastaId, buyerId }) => {
    const url = new URL(`${AUCTIONS_API}/ObtenerChatSubasta/${subastaId}`);
    if (buyerId) url.searchParams.set('buyerId', buyerId);
    return requestJson(url.toString(), { needsAuth: true });
};

export const postAuctionMessage = ({ subastaId, buyerId, contenido }) => requestJson(`${AUCTIONS_API}/EnviarMensajeSubasta`, {
    method: 'POST',
    body: { subastaId, buyerId, contenido },
    needsAuth: true
});