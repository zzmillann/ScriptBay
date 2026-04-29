import express from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';
import stripeService from '../servicios/stripeService.js';
import paypalService from '../servicios/paypalService.js';
const objetoRouter = express.Router();

// Configuracion de multer igual que en el proyecto de clase: memoria RAM y limite 5MB
const multerMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper: convierte el buffer de un fichero multer a data URL
const bufferADataUrl = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

objetoRouter.post('/GuardarProducto',
    multerMiddleware.fields([{ name: 'imagen', maxCount: 1 }, { name: 'archivo', maxCount: 1 }]),
    async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { tipo, titulo, descripcion, imagen, categoria, precio, archivo, telefono, email, github, linkedin } = req.body;

        // Si llega fichero via multipart lo convertimos a data URL, si no usamos el valor de req.body (base64 o null)
        const imagenFinal = req.files?.imagen?.[0] ? bufferADataUrl(req.files.imagen[0]) : (imagen || null);
        const archivoFinal = req.files?.archivo?.[0] ? bufferADataUrl(req.files.archivo[0]) : (archivo || null);

        const { error } = await supabase
            .from('productos')
            .insert({
                user_id: user.id,
                tipo,
                titulo,
                descripcion,
                imagen: imagenFinal,
                categoria: categoria || null,
                precio: precio ?? null,
                archivo: archivoFinal,
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

objetoRouter.post('/ActualizarProducto',
    multerMiddleware.fields([{ name: 'imagen', maxCount: 1 }, { name: 'archivo', maxCount: 1 }]),
    async (req, res, next) => {

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

        const imagenFinal = req.files?.imagen?.[0] ? bufferADataUrl(req.files.imagen[0]) : (imagen || null);
        const archivoFinal = req.files?.archivo?.[0] ? bufferADataUrl(req.files.archivo[0]) : (archivo || null);

        const { error } = await supabase
            .from('productos')
            .update({
                tipo,
                titulo,
                descripcion,
                imagen: imagenFinal,
                categoria: categoria || null,
                precio: precio ?? null,
                archivo: archivoFinal,
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

        const { titulo, precio, metodoPago } = req.body;

        console.log("Producto a comprar:", titulo, "| Precio:", precio, "EUR", "| Metodo de pago:", metodoPago || 'visa');

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

        const cardIdStripe = await stripeService.Stage2_CreateCardForCustomer(customerIdStripe, metodoPago || 'visa');
        if (!cardIdStripe) throw new Error('No se ha podido crear la CARD en Stripe para el CUSTOMER');

        console.log("Stage 2 completado - Card Stripe ID:", cardIdStripe);

        const resultadoPago = await stripeService.Stage3_CreateChargeForCustomer(
            customerIdStripe,
            cardIdStripe,
            precio,
            `Compra en ScriptBay: ${titulo}`
        );
        if (!resultadoPago) throw new Error('No se ha podido procesar el pago en Stripe');

        const { idPaymentIntent, compraBlockchain } = resultadoPago;

        console.log("Stage 3 completado - Payment Intent ID:", idPaymentIntent);
        console.log("Blockchain Hash:", compraBlockchain);
        console.log("=== PAGO COMPLETADO ===");
        console.log("Resumen - Cliente:", user.email, "| Producto:", titulo, "| Importe:", precio, "EUR | PaymentIntent:", idPaymentIntent);

        res.status(200).send({
            codigo: 0,
            mensaje: 'Pago procesado correctamente',
            paymentIntentId: idPaymentIntent,
            blockchainHash: compraBlockchain
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});

// ─── PAYPAL ──────────────────────────────────────────────────────────────────

// 1º PASO: el frontend llama a este endpoint para iniciar el pago con PayPal
// Devuelve la URL de aprobacion de PayPal que el frontend abre en un popup
objetoRouter.post('/IniciarPagoPayPal', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        const { idProducto, titulo, precio } = req.body;
        if (!idProducto || !titulo || precio === undefined) throw new Error('Faltan datos del producto');

        console.log("=== INICIO DE PAGO PAYPAL ===");
        console.log("Usuario:", user.email, "| Producto:", titulo, "| Precio:", precio, "EUR");

        // Stage 1: crear la orden en PayPal
        const order = await paypalService.Stage1_createOrderPayPal(user.id, idProducto, titulo, precio);
        if (!order) throw new Error('No se ha podido crear la orden de pago en PayPal');

        // Buscamos el link de aprobacion que PayPal devuelve en el array links
        const urlAprobacion = order.links.find(link => link.rel === 'approve')?.href;
        if (!urlAprobacion) throw new Error('PayPal no devolvio URL de aprobacion');

        console.log("PayPal Order ID:", order.id, "| URL aprobacion:", urlAprobacion);

        res.status(200).send({
            codigo: 0,
            mensaje: 'Orden PayPal creada correctamente',
            orderId: order.id,
            urlAprobacion
        });

    } catch (error) {
        console.log('ERROR en /IniciarPagoPayPal:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// 2º PASO: PayPal redirige aqui tras aprobacion o cancelacion del usuario en el popup
// Captura el pago y usa postMessage para comunicar el resultado a la ventana padre
// (tecnica del proyecto de clase: el popup se cierra solo y avisa al padre)
objetoRouter.get('/PaypalCallback', async (req, res, next) => {
    try {
        const { idUsuario, idProducto, titulo, precio, token: orderId, cancel } = req.query;

        console.log("=== PAYPAL CALLBACK ===", req.query);

        // Si el usuario cancelo en PayPal
        if (cancel === 'true') throw new Error('El usuario ha cancelado el pago en PayPal');
        if (!orderId) throw new Error('No se recibio el token (orderId) de PayPal en el callback');

        // Stage 2: capturamos el pago
        const capturaResult = await paypalService.Stage2_captureOrderPayPal(orderId);
        if (!capturaResult) throw new Error('No se pudo capturar la orden de PayPal');
        if (capturaResult.status !== 'COMPLETED') throw new Error(`Pago no completado. Estado: ${capturaResult.status}`);

        console.log("PayPal pago capturado OK - Order ID:", orderId);

        // Enviamos HTML con JS al popup para que se cierre y notifique al padre
        // (misma tecnica que en el proyecto de clase con window.opener.postMessage)
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <body>
                <script>
                    window.opener.postMessage({
                        tipo: 'PAYPAL_OK',
                        idProducto: '${idProducto}',
                        orderId: '${orderId}',
                        captureResult: ${JSON.stringify(capturaResult)}
                    }, '*');
                    window.close();
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.log('ERROR en /PaypalCallback:', error);

        // Aunque haya error seguimos usando postMessage para avisar al padre
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <body>
                <script>
                    window.opener.postMessage({
                        tipo: 'PAYPAL_ERROR',
                        error: '${error.message.replace(/'/g, "\\'")}'
                    }, '*');
                    window.close();
                </script>
            </body>
            </html>
        `);
    }
});

// ─────────────────────────────────────────────────────────────────────────────

export default objetoRouter;
