import 'dotenv/config';
import express from 'express';
import configPipeline from './configExpress/pipeline.js';


const serverExpress = express();
configPipeline(serverExpress);

serverExpress.listen(3000, (error) => {
    if (error) {
        console.log(`error al levantar el servidor express: ${error}`);
    } else {
        console.log(`....servidor express levantado y escuchando en el puerto 3000...`);
    }
});

