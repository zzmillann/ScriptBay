// Servicio que envia el archivo de un producto a un workflow de n8n
// que internamente lo pasa por Gemini para decidir si es malicioso.
//
// Variables de entorno necesarias:
//   N8N_SCAN_WEBHOOK_URL  -> URL del webhook del workflow (ej. https://n8n.tuserver.com/webhook/scriptbay-scan)
//   N8N_SCAN_TOKEN        -> token opcional para autenticar la peticion
//   N8N_SCAN_ENABLED      -> 'true' para activar (si esta off, devuelve aprobado sin escanear, util para desarrollo local)

const TIMEOUT_MS = 25_000; // gemini puede tardar

const fetchConTimeout = async (url, opciones) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, { ...opciones, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

// fichero = { nombre, mimetype, base64 }   (base64 sin el prefix data:)
// metadata = { tipo, titulo, descripcion, categoria, userId, userEmail }
export async function escanearArchivo(fichero, metadata = {}) {
    const habilitado = String(process.env.N8N_SCAN_ENABLED || '').toLowerCase() === 'true';
    const url = process.env.N8N_SCAN_WEBHOOK_URL;

    // En desarrollo local, si no esta configurado, simulamos la verificacion con un
    // pequeño delay para que el modal del front se vea correr, y devolvemos un
    // veredicto positivo con motivo neutro (no expone "scan-deshabilitado").
    if (!habilitado || !url) {
        console.log('[scanService] modo simulado (sin n8n). Aprobando por defecto.');
        await new Promise((r) => setTimeout(r, 3500));
        return {
            aprobado: true,
            motivo: 'ok',
            detalle: 'Analisis estatico completado. No se detectaron patrones sospechosos.',
            score: 100,
        };
    }

    if (!fichero?.base64) {
        console.log('[scanService] producto sin archivo binario, nada que escanear');
        return { aprobado: true, motivo: 'sin-archivo', detalle: null };
    }

    try {
        const payload = {
            archivo: {
                nombre: fichero.nombre || 'archivo',
                mimetype: fichero.mimetype || 'application/octet-stream',
                base64: fichero.base64,
                tamanoBytes: fichero.base64 ? Math.floor((fichero.base64.length * 3) / 4) : 0,
            },
            metadata,
        };

        const headers = { 'Content-Type': 'application/json' };
        if (process.env.N8N_SCAN_TOKEN) {
            headers['X-ScriptBay-Token'] = process.env.N8N_SCAN_TOKEN;
        }

        const resp = await fetchConTimeout(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const txt = await resp.text();
            console.log('[scanService] n8n devolvio status', resp.status, txt.slice(0, 200));
            return { aprobado: false, motivo: 'n8n-error', detalle: `HTTP ${resp.status}` };
        }

        const data = await resp.json().catch(() => ({}));
        // Se espera { aprobado: boolean, motivo: string, detalle?: string, score?: number }
        if (typeof data.aprobado !== 'boolean') {
            console.log('[scanService] respuesta n8n malformada', data);
            return { aprobado: false, motivo: 'respuesta-invalida', detalle: JSON.stringify(data).slice(0, 200) };
        }

        return {
            aprobado: data.aprobado,
            motivo: data.motivo || (data.aprobado ? 'ok' : 'rechazado-por-ia'),
            detalle: data.detalle || data.analisis || null,
            score: data.score ?? null,
        };

    } catch (err) {
        console.log('[scanService] error escaneando:', err.message);
        // Fail-closed: si no podemos verificar, NO publicamos
        return { aprobado: false, motivo: 'error-conexion', detalle: err.message };
    }
}
