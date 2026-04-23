import express from 'express';
import { supabase } from '../supabaseClient.js';
import stripeService from '../servicios/stripeService.js';
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


objetoRouter.get('/ObtenerProductoPorId/:id', async (req, res, next) => {

    try {

        const { id } = req.params;

        const { data: producto, error } = await supabase
            .from('productos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', producto.user_id)
            .single();

        res.status(200).send({
            codigo: 0,
            producto: { ...producto, perfiles: perfil }
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

objetoRouter.post('/ActualizarProducto', async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { id, tipo, titulo, descripcion, imagen, categoria, precio, archivo, telefono, email, github, linkedin } = req.body;

        if (!id) throw new Error('ID de producto requerido');

        const { data: productoExistente, error: fetchError } = await supabase
            .from('productos')
            .select('id,user_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        if (!productoExistente || productoExistente.user_id !== user.id) {
            throw new Error('No tienes permisos para editar este producto');
        }

        const { error } = await supabase
            .from('productos')
            .update({
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
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            mensaje: 'Producto actualizado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});

objetoRouter.post('/EliminarProducto', async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { id } = req.body;
        if (!id) throw new Error('ID de producto requerido');

        const { data: productoExistente, error: fetchError } = await supabase
            .from('productos')
            .select('id,user_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        if (!productoExistente || productoExistente.user_id !== user.id) {
            throw new Error('No tienes permisos para eliminar este producto');
        }

        const { error } = await supabase
            .from('productos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            mensaje: 'Producto eliminado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});


objetoRouter.post('/PagarProducto', async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        console.log("=== INICIO DE PAGO ===");
        console.log("Usuario comprador - ID:", user.id, "| Email:", user.email);

        const { titulo, precio } = req.body;

        console.log("Producto a comprar:", titulo, "| Precio:", precio, "EUR");

        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre')
            .eq('id', user.id)
            .single();

        const nombreCliente = perfil?.nombre || user.email;

        console.log("Nombre del cliente en Stripe:", nombreCliente);

        const customerIdStripe = await stripeService.Stage1_CreateCustomer(nombreCliente, user.email);
        if (!customerIdStripe) throw new Error('No se ha podido crear el CUSTOMER en Stripe');

        console.log("Stage 1 completado - Customer Stripe ID:", customerIdStripe);

        const cardIdStripe = await stripeService.Stage2_CreateCardForCustomer(customerIdStripe);
        if (!cardIdStripe) throw new Error('No se ha podido crear la CARD en Stripe para el CUSTOMER');

        console.log("Stage 2 completado - Card Stripe ID:", cardIdStripe);

        const paymentIntentId = await stripeService.Stage3_CreateChargeForCustomer(
            customerIdStripe,
            cardIdStripe,
            precio,
            `Compra en ScriptBay: ${titulo}`
        );
        if (!paymentIntentId) throw new Error('No se ha podido procesar el pago en Stripe');

        console.log("Stage 3 completado - Payment Intent ID:", paymentIntentId);
        console.log("=== PAGO COMPLETADO ===");
        console.log("Resumen - Cliente:", user.email, "| Producto:", titulo, "| Importe:", precio, "EUR | PaymentIntent:", paymentIntentId);

        res.status(200).send({
            codigo: 0,
            mensaje: 'Pago procesado correctamente',
            paymentIntentId
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
