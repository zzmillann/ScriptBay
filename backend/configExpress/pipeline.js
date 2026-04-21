import cors from 'cors';
import express from 'express';
import endpointCliente from './Routes/endpointCliente.js';
import endpointProductos from './Routes/endpointProductos.js';
import endpointChatbot from './Routes/endpointChatbot.js';

export default (serverExpress) => {

    serverExpress.use(express.json());
    serverExpress.use(express.urlencoded({ extended: false }));
    serverExpress.use(cors());

    serverExpress.use('/api/Cliente', endpointCliente);
    serverExpress.use('/api/productos', endpointProductos);
    serverExpress.use('/api/chatbot', endpointChatbot);

};