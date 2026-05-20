import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import endpointCliente from './Routes/endpointCliente.js';
import endpointProductos from './Routes/endpointProductos.js';
import endpointChatbot from './Routes/endpointChatbot.js';
import endpointSubastas from './Routes/endpointSubastas.js';
import endpointNotificaciones from './Routes/endpointNotificaciones.js';

// Se regenera cada vez que arranca el proceso. El frontend lo usa para detectar
// reinicio del backend y forzar logout + desconectar wallet en dev.
const STARTUP_ID = randomUUID();
console.log('[BOOT] STARTUP_ID:', STARTUP_ID);

export default (serverExpress) => {

    serverExpress.use(cookieParser());
    serverExpress.use(express.json({ limit: '12mb' }));
    serverExpress.use(express.urlencoded({ extended: false, limit: '12mb' }));
    serverExpress.use(cors());

    // Health/handshake: devuelve el id de boot. No requiere autenticacion.
    serverExpress.get('/api/health', (req, res) => {
        res.status(200).send({ codigo: 0, startupId: STARTUP_ID, ts: Date.now() });
    });

    serverExpress.use('/api/Cliente', endpointCliente);
    serverExpress.use('/api/productos', endpointProductos);
    serverExpress.use('/api/chatbot', endpointChatbot);
    serverExpress.use('/api/subastas', endpointSubastas);
    serverExpress.use('/api/notificaciones', endpointNotificaciones);

};