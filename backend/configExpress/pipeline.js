import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import endpointCliente from './Routes/endpointCliente.js';
import endpointProductos from './Routes/endpointProductos.js';
import endpointChatbot from './Routes/endpointChatbot.js';
import endpointSubastas from './Routes/endpointSubastas.js';

export default (serverExpress) => {

    serverExpress.use(cookieParser());
    serverExpress.use(express.json({ limit: '12mb' }));
    serverExpress.use(express.urlencoded({ extended: false, limit: '12mb' }));
    serverExpress.use(cors());

    serverExpress.use('/api/Cliente', endpointCliente);
    serverExpress.use('/api/productos', endpointProductos);
    serverExpress.use('/api/chatbot', endpointChatbot);
    serverExpress.use('/api/subastas', endpointSubastas);

};