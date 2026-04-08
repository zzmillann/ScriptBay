import express from 'express';
import { supabase } from '../supabaseClient.js';
const objetoRouter = express.Router();

objetoRouter.post('/GuardarProducto', async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { tipo, titulo, descripcion, imagen, categoria, precio, archivo, telefono, email, github, linkedin } = req.body;

        const { error } = await supabase
            .from('productos')
            .insert({
                user_id: user.id,
                tipo,
                titulo,
                descripcion,
                imagen: imagen || null,
                categoria: categoria || null,
                precio: precio ?? null,
                archivo: archivo || null,
                telefono: telefono || null,
                email: email || null,
                github: github || null,
                linkedin: linkedin || null
            });

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            mensaje: 'Producto guardado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});


objetoRouter.get('/ObtenerProductos', async (req, res, next) => {

    try {

        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            productos: data
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});


objetoRouter.get('/MisProductos', async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            productos: data
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});

export default objetoRouter;
