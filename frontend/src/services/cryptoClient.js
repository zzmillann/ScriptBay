import { getSession, refreshSession } from './authClient';

const API_BASE_URL = 'http://localhost:3000/api/productos';

const peticion = async (token, body) =>
  fetch(`${API_BASE_URL}/RegistrarCompraCrypto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

export async function postRegistrarCompraCrypto(payload) {
  const session = getSession();
  const accessToken = session?.accessToken;
  const response = await peticion(accessToken, payload);
  const data = await response.json();

  if (data?.mensaje && data.mensaje.toLowerCase().includes('expired')) {
    const sesionRenovada = await refreshSession();
    if (!sesionRenovada) return { codigo: 1, mensaje: 'La sesión ha expirado. Inicia sesión de nuevo.' };
    const response2 = await peticion(sesionRenovada.accessToken, payload);
    return await response2.json();
  }

  return data;
}
