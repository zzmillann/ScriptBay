import cors from 'cors';
import express from 'express';
import endpointCliente from './Routes/endpointCliente.js';

export default (serverExpress) => {

    serverExpress.use(express.json());
    serverExpress.use(express.urlencoded({ extended: false }));
    serverExpress.use(cors());

    serverExpress.use('/api/Cliente', endpointCliente);

};