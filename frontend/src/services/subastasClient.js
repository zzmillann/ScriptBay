import { getSession } from './authClient';

const API = 'http://localhost:3000/api/subastas';

const authHeaders = () => {
    const session = getSession();
    const token = session?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getSubastas() {
    const res = await fetch(`${API}/ObtenerSubastas`);
    return res.json();
}

export async function getSubasta(id) {
    const res = await fetch(`${API}/ObtenerSubasta/${id}`);
    return res.json();
}

export async function crearSubasta(payload) {
    const res = await fetch(`${API}/CrearSubasta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
    });
    return res.json();
}

export async function pujar(subastaId, cantidad) {
    const res = await fetch(`${API}/Pujar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subastaId, cantidad })
    });
    return res.json();
}

export async function pagarSubastaGanada(subastaId, metodoPago) {
    const res = await fetch(`${API}/PagarSubastaGanada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subastaId, metodoPago })
    });
    return res.json();
}

export async function getMisSubastas() {
    const res = await fetch(`${API}/MisSubastas`, {
        headers: authHeaders()
    });
    return res.json();
}

export async function cancelarSubasta(subastaId) {
    const res = await fetch(`${API}/CancelarSubasta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subastaId })
    });
    return res.json();
}

export async function eliminarSubasta(subastaId) {
    const res = await fetch(`${API}/EliminarSubasta/${subastaId}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    return res.json();
}

export async function compraInmediataDirecta(subastaId, metodoPago = 'visa') {
    const res = await fetch(`${API}/CompraInmediataDirecta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subastaId, metodoPago })
    });
    return res.json();
}
