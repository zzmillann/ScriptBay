import cors from 'cors';
import express from 'express';
import endpointCliente from './Routes/endpointCliente.js';
import endpointProductos from './Routes/endpointProductos.js';
import endpointChatbot from './Routes/endpointChatbot.js';

export default (serverExpress) => {

    serverExpress.use(express.json({ limit: '12mb' }));
    serverExpress.use(express.urlencoded({ extended: false, limit: '12mb' }));
    serverExpress.use(cors());

    serverExpress.use('/api/Cliente', endpointCliente);
    serverExpress.use('/api/productos', endpointProductos);
    serverExpress.use('/api/chatbot', endpointChatbot);

};