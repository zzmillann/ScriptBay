import express from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';
import stripeService from '../servicios/stripeService.js';
import paypalService from '../servicios/paypalService.js';
import { generarFacturaPDF } from '../servicios/facturaService.js';
import mailjetService from '../servicios/mailjetService.js';
import { crearNotificacion } from '../servicios/notificacionHelper.js';
const objetoRouter = express.Router();

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

        const { data: nuevoProducto, error } = await supabase
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
            })
            .select('id')
            .single();

        if (error) throw error;

        const { data: perfilVendedor } = await supabase
            .from('perfiles')
            .select('nombre')
            .eq('id', user.id)
            .single();

        const { data: otrosUsuarios } = await supabase
            .from('perfiles')
            .select('id')
            .neq('id', user.id);

        if (otrosUsuarios && otrosUsuarios.length > 0) {
            await supabase.from('notificaciones').insert(
                otrosUsuarios.map((p) => ({
                    user_id: p.id,
                    tipo: 'publicaciones',
                    datos: {
                        titulo,
                        tipo,
                        categoria: categoria || null,
                        productoId: nuevoProducto.id,
                        vendedorNombre: perfilVendedor?.nombre || 'Un usuario'
                    }
                }))
            );
        }

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

        const { titulo, precio, metodoPago, idProducto } = req.body;

        console.log("Producto a comprar:", titulo, "| Precio:", precio, "EUR", "| Metodo de pago:", metodoPago || 'visa');

        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre, ubicacion, stripe_customer_id')
            .eq('id', user.id)
            .single();

        const nombreCliente = perfil?.nombre || user.email;

        console.log("Nombre del cliente en Stripe:", nombreCliente);

        let customerIdStripe = perfil?.stripe_customer_id || null;

        if (customerIdStripe) {
            console.log("Stage 1 omitido - reutilizando Customer Stripe existente:", customerIdStripe);
        } else {
            customerIdStripe = await stripeService.Stage1_CreateCustomer(nombreCliente, user.email, perfil?.ubicacion);
            if (!customerIdStripe) throw new Error('No se ha podido crear el CUSTOMER en Stripe');

            // Guardamos el ID del Customer en el perfil para reutilizarlo en futuras compras
            await supabase.from('perfiles').update({ stripe_customer_id: customerIdStripe }).eq('id', user.id);
            console.log("Stage 1 completado - Customer Stripe ID guardado en perfil:", customerIdStripe);
        }

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

        await supabase.from('compras').insert({
            user_id: user.id,
            producto_id: idProducto || null,
            titulo,
            precio,
            metodo_pago: 'Stripe',
            id_transaccion: idPaymentIntent,
            blockchain_hash: compraBlockchain || null
        });
        console.log('Compra Stripe guardada en BD para el historial del usuario');

        if (idProducto) {
            const { data: productoVendedor } = await supabase
                .from('productos')
                .select('user_id')
                .eq('id', idProducto)
                .single();
            if (productoVendedor?.user_id && productoVendedor.user_id !== user.id) {
                await crearNotificacion(productoVendedor.user_id, 'compra', {
                    titulo,
                    precio,
                    compradorId: user.id,
                    productoId: idProducto,
                    metodo: 'Stripe'
                });
            }
        }

        const fechaPago = new Date();
        const numFactura = `SB-${fechaPago.getFullYear()}${String(fechaPago.getMonth() + 1).padStart(2, '0')}${String(fechaPago.getDate()).padStart(2, '0')}-${idPaymentIntent.slice(-6).toUpperCase()}`;
        generarFacturaPDF({
            nombre: nombreCliente,
            email: user.email,
            titulo,
            precio,
            idTransaccion: idPaymentIntent,
            metodoPago: 'Stripe',
            fecha: fechaPago,
            blockchainHash: compraBlockchain || null
        }).then(pdfBuffer => mailjetService.enviarFactura(process.env.MAILJET_EMAIL_FROM, nombreCliente, pdfBuffer, numFactura))
          .catch(err => console.log('[Factura] Error generando/enviando factura Stripe:', err));

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

        if (idUsuario) {
            await supabase.from('compras').insert({
                user_id: idUsuario,
                producto_id: idProducto || null,
                titulo: decodeURIComponent(titulo || 'Producto ScriptBay'),
                precio: parseFloat(precio) || 0,
                metodo_pago: 'PayPal',
                id_transaccion: orderId
            });
            console.log('Compra PayPal guardada en BD para el historial del usuario');

            if (idProducto) {
                const { data: productoVendedor } = await supabase
                    .from('productos')
                    .select('user_id')
                    .eq('id', idProducto)
                    .single();
                if (productoVendedor?.user_id && productoVendedor.user_id !== idUsuario) {
                    await crearNotificacion(productoVendedor.user_id, 'compra', {
                        titulo: decodeURIComponent(titulo || 'Producto ScriptBay'),
                        precio: parseFloat(precio) || 0,
                        compradorId: idUsuario,
                        productoId: idProducto,
                        metodo: 'PayPal'
                    });
                }
            }
        }

        const emailPayPal = capturaResult?.payer?.email_address || null;
        const nombrePayPal = `${capturaResult?.payer?.name?.given_name || ''} ${capturaResult?.payer?.name?.surname || ''}`.trim() || emailPayPal;
        if (emailPayPal) {
            const fechaPayPal = new Date();
            const numFacturaPayPal = `SB-${fechaPayPal.getFullYear()}${String(fechaPayPal.getMonth() + 1).padStart(2, '0')}${String(fechaPayPal.getDate()).padStart(2, '0')}-${orderId.slice(-6).toUpperCase()}`;
            generarFacturaPDF({
                nombre: nombrePayPal,
                email: emailPayPal,
                titulo: decodeURIComponent(titulo || 'Producto ScriptBay'),
                precio: precio || '0',
                idTransaccion: orderId,
                metodoPago: 'PayPal',
                fecha: fechaPayPal
            }).then(pdfBuffer => mailjetService.enviarFactura(process.env.MAILJET_EMAIL_FROM, nombrePayPal, pdfBuffer, numFacturaPayPal))
              .catch(err => console.log('[Factura] Error generando/enviando factura PayPal:', err));
        }

        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            tipo: 'PAYPAL_OK',
                            idProducto: '${idProducto}',
                            orderId: '${orderId}',
                            captureResult: ${JSON.stringify(capturaResult)}
                        }, '*');
                    }
                    window.close();
                <\/script>
            </body>
            </html>
        `);

    } catch (error) {
        console.log('ERROR en /PaypalCallback:', error);

        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            tipo: 'PAYPAL_ERROR',
                            error: '${error.message.replace(/'/g, "\\'")}'  
                        }, '*');
                    }
                    window.close();
                <\/script>
            </body>
            </html>
        `);
    }
});

objetoRouter.get('/MisCompras', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        const { data: compras, error } = await supabase
            .from('compras')
            .select('*, productos(id, imagen, tipo, categoria)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).send({ codigo: 0, compras: compras || [] });

    } catch (error) {
        console.log('ERROR en /MisCompras:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message, compras: [] });
    }
});

// Ventas de mis productos (para el dashboard del vendedor)
objetoRouter.get('/MisVentas', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        // 1. Obtener los ids de los productos del usuario
        const { data: misProductos, error: prodError } = await supabase
            .from('productos')
            .select('id, titulo, precio')
            .eq('user_id', user.id);

        if (prodError) throw prodError;

        if (!misProductos || misProductos.length === 0) {
            return res.status(200).send({ codigo: 0, ventas: [], resumen: { totalVentas: 0, ingresoTotal: 0, productosMasVendidos: [] } });
        }

        const idsProductos = misProductos.map((p) => p.id);

        // 2. Obtener todas las compras de esos productos
        const { data: ventas, error: ventasError } = await supabase
            .from('compras')
            .select('*')
            .in('producto_id', idsProductos)
            .order('created_at', { ascending: false });

        if (ventasError) throw ventasError;

        const ventasData = ventas || [];

        // 3. Calcular resumen
        const ingresoTotal = ventasData.reduce((acc, v) => acc + (Number(v.precio) || 0), 0);

        // Ventas por producto
        const contadorProductos = {};
        for (const venta of ventasData) {
            const prod = misProductos.find((p) => p.id === venta.producto_id);
            const titulo = prod?.titulo || venta.titulo || 'Desconocido';
            if (!contadorProductos[venta.producto_id]) {
                contadorProductos[venta.producto_id] = { titulo, ventas: 0, ingresos: 0 };
            }
            contadorProductos[venta.producto_id].ventas += 1;
            contadorProductos[venta.producto_id].ingresos += Number(venta.precio) || 0;
        }

        const productosMasVendidos = Object.values(contadorProductos)
            .sort((a, b) => b.ventas - a.ventas)
            .slice(0, 5);

        // Ventas agrupadas por mes (últimos 6 meses)
        const ventasPorMes = {};
        const ahora = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const key = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
            ventasPorMes[key] = { mes: key, ventas: 0, ingresos: 0 };
        }
        for (const venta of ventasData) {
            const d = new Date(venta.created_at);
            const key = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
            if (ventasPorMes[key]) {
                ventasPorMes[key].ventas += 1;
                ventasPorMes[key].ingresos += Number(venta.precio) || 0;
            }
        }

        res.status(200).send({
            codigo: 0,
            ventas: ventasData,
            resumen: {
                totalVentas: ventasData.length,
                ingresoTotal: Number(ingresoTotal.toFixed(2)),
                productosMasVendidos,
                ventasPorMes: Object.values(ventasPorMes),
            }
        });

    } catch (error) {
        console.log('ERROR en /MisVentas:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message, ventas: [], resumen: {} });
    }
});

// ─── RECOMENDACIONES (collaborative filtering básico por categoría) ───────────

objetoRouter.get('/Recomendados', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        // IDs de la wishlist enviados desde el frontend como ?wishlist=id1,id2,id3
        const wishlistIds = req.query.wishlist
            ? req.query.wishlist.split(',').filter(Boolean)
            : [];

        // 1. Historial de compras del usuario
        const { data: misCompras, error: comprasError } = await supabase
            .from('compras')
            .select('producto_id, titulo')
            .eq('user_id', user.id);

        if (comprasError) throw comprasError;

        const misProductosIds = (misCompras || [])
            .filter(c => c.producto_id)
            .map(c => c.producto_id);

        // 2. Categorías de los productos comprados -> razonPorCategoria[categoria] = titulo que la motiva
        const razonPorCategoria = {};

        if (misProductosIds.length > 0) {
            const { data: productosComprados } = await supabase
                .from('productos')
                .select('id, titulo, categoria')
                .in('id', misProductosIds);

            (productosComprados || []).forEach(p => {
                if (p.categoria && !razonPorCategoria[p.categoria]) {
                    razonPorCategoria[p.categoria] = p.titulo;
                }
            });
        }

        // 3. Categorías de la wishlist (complementan las compras)
        if (wishlistIds.length > 0) {
            const { data: productosWishlist } = await supabase
                .from('productos')
                .select('id, titulo, categoria')
                .in('id', wishlistIds);

            (productosWishlist || []).forEach(p => {
                if (p.categoria && !razonPorCategoria[p.categoria]) {
                    razonPorCategoria[p.categoria] = p.titulo;
                }
            });
        }

        const categoriasDeInteres = Object.keys(razonPorCategoria);

        // ── Sin historial ni wishlist: devolver los productos globalmente más comprados ──
        if (categoriasDeInteres.length === 0) {
            const { data: todasCompras } = await supabase
                .from('compras')
                .select('producto_id')
                .not('producto_id', 'is', null);

            const frecuenciaGlobal = {};
            (todasCompras || []).forEach(c => {
                frecuenciaGlobal[c.producto_id] = (frecuenciaGlobal[c.producto_id] || 0) + 1;
            });

            const idsPopulares = Object.entries(frecuenciaGlobal)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id]) => id);

            if (idsPopulares.length === 0) {
                return res.status(200).send({ codigo: 0, recomendaciones: [] });
            }

            const { data: productosPopulares } = await supabase
                .from('productos')
                .select('id, titulo, categoria, precio, imagen, tipo')
                .in('id', idsPopulares)
                .neq('user_id', user.id);

            const resultado = (productosPopulares || [])
                .map(p => ({ ...p, score: frecuenciaGlobal[p.id] || 0, razon: 'Popular en ScriptBay' }))
                .sort((a, b) => b.score - a.score);

            return res.status(200).send({ codigo: 0, recomendaciones: resultado });
        }

        // 4. Candidatos: productos en esas categorías que el usuario NO ha comprado y no son suyos
        let queryBuilder = supabase
            .from('productos')
            .select('id, titulo, categoria, precio, imagen, tipo')
            .in('categoria', categoriasDeInteres)
            .neq('user_id', user.id);

        if (misProductosIds.length > 0) {
            queryBuilder = queryBuilder.not('id', 'in', `(${misProductosIds.join(',')})`);
        }

        const { data: candidatos } = await queryBuilder;

        if (!candidatos || candidatos.length === 0) {
            return res.status(200).send({ codigo: 0, recomendaciones: [] });
        }

        // 5. Collaborative filtering: cuántos otros usuarios compraron cada candidato
        const candidatoIds = candidatos.map(p => p.id);

        const { data: comprasOtros } = await supabase
            .from('compras')
            .select('producto_id')
            .neq('user_id', user.id)
            .in('producto_id', candidatoIds);

        const frecuencia = {};
        (comprasOtros || []).forEach(c => {
            if (c.producto_id) {
                frecuencia[c.producto_id] = (frecuencia[c.producto_id] || 0) + 1;
            }
        });

        // 6. Ordenar por score (compras de otros usuarios) y devolver top 8
        const recomendados = candidatos
            .map(p => ({
                ...p,
                score: frecuencia[p.id] || 0,
                razon: razonPorCategoria[p.categoria]
                    ? `Porque compraste "${razonPorCategoria[p.categoria]}"`
                    : `Popular en ${p.categoria}`
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);

        res.status(200).send({ codigo: 0, recomendaciones: recomendados });

    } catch (error) {
        console.log('ERROR en /Recomendados:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message, recomendaciones: [] });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

export default objetoRouter;
