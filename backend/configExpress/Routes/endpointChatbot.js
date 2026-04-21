import express from 'express';

const objetoRouter = express.Router();
const N8N_WEBHOOK_URL = 'https://n8n.srv1584504.hstgr.cloud/webhook/cd2f0116-db3f-4547-8851-09a32b15ac89';

objetoRouter.post('/enviar', async (req, res, next) => {
    try {
        const { message, sessionId } = req.body;

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId })
        });

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const textData = await response.text();
            data = { output: textData }; // Envolvemos el texto plano en un objeto para el frontend
        }

        res.status(200).send(data);

    } catch (error) {
        console.error('Error en proxy de chatbot:', error);
        res.status(200).send({
            codigo: 1,
            mensaje: 'Error al contactar con el asistente de IA',
            error: error.message
        });
    }
});

export default objetoRouter;
