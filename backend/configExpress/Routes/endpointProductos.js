import express from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';
import stripeService from '../servicios/stripeService.js';
import paypalService from '../servicios/paypalService.js';
import { registroCompraStripe, verificarTxSepolia } from '../../services/blockchainservice.js';
import { generarFacturaPDF } from '../servicios/facturaService.js';
import mailjetService from '../servicios/mailjetService.js';
import { crearNotificacion } from '../servicios/notificacionHelper.js';
import { escanearArchivo } from '../servicios/scanService.js';
const objetoRouter = express.Router();

const multerMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper: convierte el buffer de un fichero multer a data URL
const bufferADataUrl = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

const getAuthUser = async (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw new Error('No autorizado');

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
};

const buildReviewSummary = (reviews = []) => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + Number(review.estrellas || 0), 0);
    const average = total ? Number((sum / total).toFixed(1)) : 0;
    const distribution = [5, 4, 3, 2, 1].map((value) => ({
        stars: value,
        count: reviews.filter((review) => Number(review.estrellas) === value).length
    }));

    return { average, total, distribution };
};

const mapRatingsByProduct = (reviews = []) => {
    return reviews.reduce((acc, review) => {
        const productId = review.producto_id;
        if (!acc[productId]) acc[productId] = [];
        acc[productId].push(review);
        return acc;
    }, {});
};

const ensureSocialThread = async ({ contexto, contextoId, productoId = null, subastaId = null, compradorId, vendedorId }) => {
    const { data, error } = await supabase
        .from('social_threads')
        .upsert({
            contexto,
            contexto_id: contextoId,
            producto_id: productoId,
            subasta_id: subastaId,
            comprador_id: compradorId,
            vendedor_id: vendedorId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'contexto,contexto_id,comprador_id,vendedor_id' })
        .select('*')
        .single();

    if (error) throw error;
    return data;
};

objetoRouter.post('/GuardarProducto',
    multerMiddleware.fields([{ name: 'imagen', maxCount: 1 }, { name: 'archivo', maxCount: 1 }]),
    async (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { tipo, titulo, descripcion, imagen, categoria, precio, precio_sbt, archivo, telefono, email, github, linkedin } = req.body;

        // Si llega fichero via multipart lo convertimos a data URL.
        // Si NO llega multipart pero el body trae "archivo" como string data URL, lo usamos.
        // Si llega como objeto/JSON (metadata sin binario) lo descartamos -> evita guardar basura.
        const imagenFinal = req.files?.imagen?.[0]
            ? bufferADataUrl(req.files.imagen[0])
            : (typeof imagen === 'string' && imagen.startsWith('data:') ? imagen : (typeof imagen === 'string' ? imagen : null));
        const archivoFinal = req.files?.archivo?.[0]
            ? bufferADataUrl(req.files.archivo[0])
            : (typeof archivo === 'string' && archivo.startsWith('data:') ? archivo : null);

        // FormData manda todo como string; normalizamos numericos.
        const toNumOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
        const precioFinal = toNumOrNull(precio);
        const precioSbtFinal = toNumOrNull(precio_sbt);

        // ─── Escaneo n8n + Gemini ─────────────────────────────────────────
        // Si hay archivo binario, lo mandamos al workflow para que Gemini lo valide.
        // Si NO esta aprobado, abortamos el insert.
        let veredictoIa = null;
        const ficheroSubido = req.files?.archivo?.[0];
        if (ficheroSubido) {
            veredictoIa = await escanearArchivo(
                {
                    nombre: ficheroSubido.originalname,
                    mimetype: ficheroSubido.mimetype,
                    base64: ficheroSubido.buffer.toString('base64'),
                },
                { tipo, titulo, descripcion, categoria, userId: user.id, userEmail: user.email }
            );
            console.log('[GuardarProducto] Veredicto IA:', veredictoIa);
            if (!veredictoIa.aprobado) {
                return res.status(200).send({
                    codigo: 2, // codigo especifico para "rechazado por IA"
                    mensaje: `Producto rechazado por la IA de seguridad: ${veredictoIa.motivo}`,
                    veredicto: veredictoIa,
                });
            }
        }

        const { data: nuevoProducto, error } = await supabase
            .from('productos')
            .insert({
                user_id: user.id,
                tipo,
                titulo,
                descripcion,
                imagen: imagenFinal,
                categoria: categoria || null,
                precio: precioFinal,
                precio_sbt: precioSbtFinal,
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
            mensaje: 'Producto guardado correctamente',
            veredicto: veredictoIa,
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

        const { data: productReviews } = await supabase
            .from('producto_reviews')
            .select('estrellas')
            .eq('producto_id', producto.id);

        const ratingSummary = buildReviewSummary(productReviews || []);

        // Numero real de ventas: filas en 'compras' para este producto.
        const { count: ventasCount } = await supabase
            .from('compras')
            .select('id', { count: 'exact', head: true })
            .eq('producto_id', producto.id);

        res.status(200).send({
            codigo: 0,
            producto: {
                ...producto,
                perfiles: perfil,
                rating: ratingSummary.average,
                reviews: ratingSummary.total,
                ventas: ventasCount || 0,
                rating_summary: ratingSummary
            }
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

        const productIds = (data || []).map((product) => product.id).filter(Boolean);
        let ratingsMap = {};

        if (productIds.length > 0) {
            const { data: reviewRows } = await supabase
                .from('producto_reviews')
                .select('producto_id, estrellas')
                .in('producto_id', productIds);

            const groupedReviews = mapRatingsByProduct(reviewRows || []);
            ratingsMap = Object.fromEntries(
                Object.entries(groupedReviews).map(([productId, reviews]) => [productId, buildReviewSummary(reviews)])
            );
        }

        // Adjuntamos el perfil del vendedor (nombre/avatar) para mostrarlo en las tarjetas.
        const sellerIds = [...new Set((data || []).map((product) => product.user_id).filter(Boolean))];
        let perfilesMap = {};

        if (sellerIds.length > 0) {
            const { data: perfiles } = await supabase
                .from('perfiles')
                .select('id, nombre, avatar_url')
                .in('id', sellerIds);

            perfilesMap = Object.fromEntries((perfiles || []).map((perfil) => [perfil.id, perfil]));
        }

        const enrichedProducts = (data || []).map((product) => {
            const ratingSummary = ratingsMap[product.id] || { average: 0, total: 0, distribution: [] };
            return {
                ...product,
                perfiles: perfilesMap[product.user_id] || null,
                rating: ratingSummary.average,
                reviews: ratingSummary.total,
                rating_summary: ratingSummary
            };
        });

        res.status(200).send({
            codigo: 0,
            productos: enrichedProducts
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

        const { id, tipo, titulo, descripcion, imagen, categoria, precio, precio_sbt, archivo, telefono, email, github, linkedin } = req.body;

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

        const imagenFinal = req.files?.imagen?.[0]
            ? bufferADataUrl(req.files.imagen[0])
            : (typeof imagen === 'string' && imagen.startsWith('data:') ? imagen : (typeof imagen === 'string' ? imagen : null));
        const archivoFinal = req.files?.archivo?.[0]
            ? bufferADataUrl(req.files.archivo[0])
            : (typeof archivo === 'string' && archivo.startsWith('data:') ? archivo : null);

        const toNumOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
        const updateFields = {
            tipo,
            titulo,
            descripcion,
            imagen: imagenFinal,
            categoria: categoria || null,
            precio: toNumOrNull(precio),
            precio_sbt: toNumOrNull(precio_sbt),
            telefono: telefono || null,
            email: email || null,
            github: github || null,
            linkedin: linkedin || null,
        };
        // Solo pisamos el archivo si vino uno nuevo (binario o data URL), si no respetamos el existente.
        if (archivoFinal) updateFields.archivo = archivoFinal;

        const { error } = await supabase
            .from('productos')
            .update(updateFields)
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

        const { titulo, precio, metodoPago, idProducto, wallet } = req.body;

        const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
        const productoIdFinal = isValidUUID(idProducto) ? idProducto : null;

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
            `Compra en ScriptBay: ${titulo}`,
            wallet // <-- SE LA PASAMOS AL STAGE 3
        );
        if (!resultadoPago) throw new Error('No se ha podido procesar el pago en Stripe');

        const { idPaymentIntent, compraBlockchain, tokenId } = resultadoPago;

        console.log("Stage 3 completado - Payment Intent ID:", idPaymentIntent);
        console.log("Blockchain Hash:", compraBlockchain);
        console.log("=== PAGO COMPLETADO ===");
        console.log("Resumen - Cliente:", user.email, "| Producto:", titulo, "| Importe:", precio, "EUR | PaymentIntent:", idPaymentIntent);

        const { error: insertError } = await supabase.from('compras').insert({
            user_id: user.id,
            producto_id: productoIdFinal,
            titulo,
            precio,
            metodo_pago: 'Stripe',
            id_transaccion: idPaymentIntent,
            blockchain_hash: compraBlockchain || null
        });
        if (insertError) console.log('[PagarProducto] Error guardando compra:', insertError.message);
        console.log('Compra Stripe guardada en BD para el historial del usuario');

        if (productoIdFinal) {
            const { data: productoVendedor } = await supabase
                .from('productos')
                .select('user_id')
                .eq('id', productoIdFinal)
                .single();
            if (productoVendedor?.user_id && productoVendedor.user_id !== user.id) {
                await crearNotificacion(productoVendedor.user_id, 'compra', {
                    titulo,
                    precio,
                    compradorId: user.id,
                    productoId: productoIdFinal,
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
            blockchainHash: compraBlockchain,
            tokenId: tokenId
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }

});

// ─── CHECKOUT DEL CARRITO (varios productos, un solo cobro y un solo NFT) ─────
objetoRouter.post('/PagarCarrito', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        const { items, metodoPago, wallet } = req.body;
        if (!Array.isArray(items) || items.length === 0) throw new Error('El carrito está vacío');

        console.log('=== INICIO PAGO CARRITO ===');
        console.log('Comprador:', user.email, '| items:', items.length, '| wallet:', wallet || '(sin wallet)');

        // Normalizamos cada linea: precio total = precio unitario * cantidad.
        const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
        const lineas = items.map((it) => {
            const cantidad = Math.max(1, Number(it.qty) || 1);
            const precioUnit = Number(it.precio) || 0;
            return {
                id: it.id,
                titulo: it.titulo || 'Producto ScriptBay',
                cantidad,
                total: precioUnit * cantidad,
            };
        });

        const totalCarrito = lineas.reduce((acc, l) => acc + l.total, 0);
        if (totalCarrito <= 0) throw new Error('El total del carrito no es válido');

        const titulosResumen = lineas.map((l) => l.titulo).join(', ');
        const descripcion = `Compra ScriptBay (${lineas.length} productos): ${titulosResumen}`.slice(0, 480);

        // 1) Cliente Stripe (reutilizamos el del perfil si existe)
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre, ubicacion, stripe_customer_id')
            .eq('id', user.id)
            .single();

        const nombreCliente = perfil?.nombre || user.email;
        let customerIdStripe = perfil?.stripe_customer_id || null;

        if (!customerIdStripe) {
            customerIdStripe = await stripeService.Stage1_CreateCustomer(nombreCliente, user.email, perfil?.ubicacion);
            if (!customerIdStripe) throw new Error('No se ha podido crear el CUSTOMER en Stripe');
            await supabase.from('perfiles').update({ stripe_customer_id: customerIdStripe }).eq('id', user.id);
        }

        // 2) Tarjeta
        const cardIdStripe = await stripeService.Stage2_CreateCardForCustomer(customerIdStripe, metodoPago || 'visa');
        if (!cardIdStripe) throw new Error('No se ha podido crear la CARD en Stripe');

        // 3) Un solo cargo por el TOTAL + un solo NFT (si hay wallet) para toda la compra
        const resultadoPago = await stripeService.Stage3_CreateChargeForCustomer(
            customerIdStripe,
            cardIdStripe,
            totalCarrito,
            descripcion,
            wallet
        );
        if (!resultadoPago) throw new Error('No se ha podido procesar el pago en Stripe');

        const { idPaymentIntent, compraBlockchain, tokenId } = resultadoPago;
        console.log('Carrito pagado - PaymentIntent:', idPaymentIntent, '| Total:', totalCarrito, 'EUR | tokenId:', tokenId);

        // 4) Una fila de compra por cada producto (misma transaccion y mismo hash blockchain)
        const filasCompra = lineas.map((l) => ({
            user_id: user.id,
            producto_id: isValidUUID(l.id) ? l.id : null,
            titulo: l.titulo,
            precio: l.total,
            metodo_pago: 'Stripe',
            id_transaccion: idPaymentIntent,
            blockchain_hash: compraBlockchain || null,
        }));

        const { error: insertError } = await supabase.from('compras').insert(filasCompra);
        if (insertError) console.log('[PagarCarrito] Error guardando compras:', insertError.message);

        // 5) Notificar a cada vendedor (best-effort)
        for (const l of lineas) {
            if (!isValidUUID(l.id)) continue;
            const { data: productoVendedor } = await supabase
                .from('productos')
                .select('user_id')
                .eq('id', l.id)
                .single();
            if (productoVendedor?.user_id && productoVendedor.user_id !== user.id) {
                await crearNotificacion(productoVendedor.user_id, 'compra', {
                    titulo: l.titulo,
                    precio: l.total,
                    compradorId: user.id,
                    productoId: l.id,
                    metodo: 'Stripe',
                });
            }
        }

        // 6) Una sola factura por el total (best-effort)
        const fechaPago = new Date();
        const numFactura = `SB-${fechaPago.getFullYear()}${String(fechaPago.getMonth() + 1).padStart(2, '0')}${String(fechaPago.getDate()).padStart(2, '0')}-${idPaymentIntent.slice(-6).toUpperCase()}`;
        generarFacturaPDF({
            nombre: nombreCliente,
            email: user.email,
            titulo: `${lineas.length} productos: ${titulosResumen}`,
            precio: totalCarrito,
            idTransaccion: idPaymentIntent,
            metodoPago: 'Stripe',
            fecha: fechaPago,
            blockchainHash: compraBlockchain || null,
        }).then((pdfBuffer) => mailjetService.enviarFactura(process.env.MAILJET_EMAIL_FROM, nombreCliente, pdfBuffer, numFactura))
          .catch((err) => console.log('[Factura] Error generando/enviando factura carrito:', err));

        res.status(200).send({
            codigo: 0,
            mensaje: 'Pago del carrito procesado correctamente',
            paymentIntentId: idPaymentIntent,
            blockchainHash: compraBlockchain,
            tokenId,
            total: totalCarrito,
            productos: lineas.length,
        });

    } catch (error) {
        console.log('ERROR en /PagarCarrito:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
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

        const { idProducto, titulo, precio, wallet } = req.body;
        if (!idProducto || !titulo || precio === undefined) throw new Error('Faltan datos del producto');

        console.log("=== INICIO DE PAGO PAYPAL ===");
        console.log("Usuario:", user.email, "| Producto:", titulo, "| Precio:", precio, "EUR", "| Wallet:", wallet || '(sin wallet)');

        // Stage 1: crear la orden en PayPal
        const order = await paypalService.Stage1_createOrderPayPal(user.id, idProducto, titulo, precio, wallet);
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
        const { idUsuario, idProducto, titulo, precio, token: orderId, cancel, wallet } = req.query;

        console.log("=== PAYPAL CALLBACK ===", req.query);

        // Si el usuario cancelo en PayPal
        if (cancel === 'true') throw new Error('El usuario ha cancelado el pago en PayPal');
        if (!orderId) throw new Error('No se recibio el token (orderId) de PayPal en el callback');

        // Stage 2: capturamos el pago
        const capturaResult = await paypalService.Stage2_captureOrderPayPal(orderId);
        if (!capturaResult) throw new Error('No se pudo capturar la orden de PayPal');
        if (capturaResult.status !== 'COMPLETED') throw new Error(`Pago no completado. Estado: ${capturaResult.status}`);

        console.log("PayPal pago capturado OK - Order ID:", orderId);

        let blockchainHash = null;
        let tokenIdNft = null;
        if (wallet) {
            try {
                const fechaActual = new Date();
                const fecha = fechaActual.getDate();
                const hora = fechaActual.getHours();
                const mintResult = await registroCompraStripe(
                    wallet,
                    'paypal_customer', 'paypal_card', Math.round(parseFloat(precio || 0)), 'eur',
                    `Compra ScriptBay PayPal: ${decodeURIComponent(titulo || '')}`, true,
                    true, 'paypal', true, fecha, hora, orderId
                );
                blockchainHash = mintResult?.tx || null;
                tokenIdNft = mintResult?.tokenId || null;
                console.log('PayPal NFT minteado - tx:', blockchainHash, '| tokenId:', tokenIdNft);
            } catch (mintError) {
                console.log('[PayPalCallback] Error minteando NFT:', mintError.message);
            }
        } else {
            console.log('PayPal sin wallet conectada - no se mintea NFT');
        }

        if (idUsuario) {
            await supabase.from('compras').insert({
                user_id: idUsuario,
                producto_id: idProducto || null,
                titulo: decodeURIComponent(titulo || 'Producto ScriptBay'),
                precio: parseFloat(precio) || 0,
                metodo_pago: 'PayPal',
                id_transaccion: orderId,
                blockchain_hash: blockchainHash
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

// ─── PAGO CRYPTO (SBT) ───────────────────────────────────────────────────────
// El frontend ya ha enviado el transfer de SBT al marketplace y nos pasa el txHash.
// Verificamos en cadena, guardamos compra y minteamos licencia NFT al comprador.
objetoRouter.post('/RegistrarCompraCrypto', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        const { idProducto, titulo, precio, txHash, wallet } = req.body;
        if (!txHash) throw new Error('Falta txHash');
        if (!wallet) throw new Error('Falta wallet del comprador');

        console.log('=== INICIO PAGO CRYPTO (SBT) ===');
        console.log('Comprador:', user.email, '| txHash:', txHash, '| wallet:', wallet);

        // Verificacion on-chain del transfer
        const receipt = await verificarTxSepolia(txHash);
        if (!receipt) throw new Error('No se pudo verificar la transaccion en Sepolia');
        if (receipt.status !== 'success' && receipt.status !== 1) {
            throw new Error(`La transaccion ${txHash} no fue exitosa`);
        }

        const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
        const productoIdFinal = isValidUUID(idProducto) ? idProducto : null;

        // Mintea la licencia NFT al comprador
        let blockchainHash = null;
        let tokenIdNft = null;
        try {
            const fechaActual = new Date();
            const fecha = fechaActual.getDate();
            const hora = fechaActual.getHours();
            const mintResult = await registroCompraStripe(
                wallet,
                'sbt_customer', 'sbt_card', Math.round(parseFloat(precio || 0)), 'sbt',
                `Compra ScriptBay SBT: ${titulo}`, true,
                true, 'sbt', true, fecha, hora, txHash
            );
            blockchainHash = mintResult?.tx || null;
            tokenIdNft = mintResult?.tokenId || null;
            console.log('Licencia NFT minteada - tx:', blockchainHash, '| tokenId:', tokenIdNft);
        } catch (mintError) {
            console.log('[RegistrarCompraCrypto] Error minteando NFT:', mintError.message);
        }

        const { error: insertError } = await supabase.from('compras').insert({
            user_id: user.id,
            producto_id: productoIdFinal,
            titulo,
            precio,
            metodo_pago: 'SBT',
            id_transaccion: txHash,
            blockchain_hash: blockchainHash || txHash,
        });
        if (insertError) console.log('[RegistrarCompraCrypto] Error guardando compra:', insertError.message);

        if (productoIdFinal) {
            const { data: productoVendedor } = await supabase
                .from('productos')
                .select('user_id')
                .eq('id', productoIdFinal)
                .single();
            if (productoVendedor?.user_id && productoVendedor.user_id !== user.id) {
                await crearNotificacion(productoVendedor.user_id, 'compra', {
                    titulo,
                    precio,
                    compradorId: user.id,
                    productoId: productoIdFinal,
                    metodo: 'SBT',
                });
            }
        }

        res.status(200).send({
            codigo: 0,
            mensaje: 'Pago en SBT registrado correctamente',
            txHash,
            blockchainHash: blockchainHash || txHash,
            tokenId: tokenIdNft,
        });

    } catch (error) {
        console.log('ERROR en /RegistrarCompraCrypto:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── DESCARGA DEL ARCHIVO COMPRADO ──────────────────────────────────────────
// Solo el comprador (con compra registrada en esa fila) o el vendedor pueden bajar el archivo.
objetoRouter.get('/DescargarArchivo/:idProducto', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        const { idProducto } = req.params;

        // 1) cargamos producto (necesitamos archivo + vendedor)
        const { data: producto, error: prodError } = await supabase
            .from('productos')
            .select('id, user_id, titulo, archivo')
            .eq('id', idProducto)
            .single();
        if (prodError) throw prodError;
        if (!producto?.archivo) {
            return res.status(200).send({ codigo: 1, mensaje: 'Este producto no tiene archivo descargable.' });
        }

        // 2) acceso: vendedor siempre puede, comprador solo si tiene compra registrada
        const esVendedor = producto.user_id === user.id;
        let esComprador = false;
        if (!esVendedor) {
            const { data: compra } = await supabase
                .from('compras')
                .select('id')
                .eq('user_id', user.id)
                .eq('producto_id', idProducto)
                .limit(1);
            esComprador = (compra || []).length > 0;
        }
        if (!esVendedor && !esComprador) {
            return res.status(403).send({ codigo: 2, mensaje: 'No tienes una compra registrada de este producto.' });
        }

        // 3) devolvemos como data URL para que el front lo trate
        res.status(200).send({
            codigo: 0,
            titulo: producto.titulo,
            archivo: producto.archivo,
        });

    } catch (error) {
        console.log('ERROR en /DescargarArchivo:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// Descarga por id de compra: util para compras historicas sin producto_id enlazado.
objetoRouter.get('/DescargarArchivoCompra/:idCompra', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        const { idCompra } = req.params;

        const { data: compra, error: compraError } = await supabase
            .from('compras')
            .select('id, user_id, titulo, producto_id')
            .eq('id', idCompra)
            .single();

        if (compraError) throw compraError;
        if (!compra) throw new Error('Compra no encontrada');
        if (compra.user_id !== user.id) {
            return res.status(403).send({ codigo: 2, mensaje: 'No tienes acceso a esta compra.' });
        }

        let producto = null;

        if (compra.producto_id) {
            const { data: p } = await supabase
                .from('productos')
                .select('id, titulo, archivo')
                .eq('id', compra.producto_id)
                .single();
            producto = p || null;
        }

        if (!producto && compra.titulo) {
            const { data: pByTitle } = await supabase
                .from('productos')
                .select('id, titulo, archivo')
                .eq('titulo', compra.titulo)
                .limit(1);
            producto = (pByTitle || [])[0] || null;
        }

        if (!producto?.archivo) {
            return res.status(200).send({ codigo: 1, mensaje: 'No se encontró archivo descargable para esta compra.' });
        }

        res.status(200).send({
            codigo: 0,
            titulo: producto.titulo || compra.titulo || 'producto',
            archivo: producto.archivo,
        });

    } catch (error) {
        console.log('ERROR en /DescargarArchivoCompra:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

objetoRouter.get('/MisCompras', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        let compras = [];
        const { data: comprasJoin, error: joinError } = await supabase
            .from('compras')
            .select('*, productos(id, titulo, imagen, tipo, categoria)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!joinError) {
            compras = comprasJoin || [];
        } else {
            console.log('[MisCompras] Join con productos fallido, cargando sin join:', joinError.message);
            const { data: comprasSolas, error: solasError } = await supabase
                .from('compras')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (solasError) throw solasError;

            const ids = (comprasSolas || []).map(c => c.producto_id).filter(Boolean);
            let productosMap = {};
            if (ids.length > 0) {
                const { data: prods } = await supabase
                    .from('productos')
                    .select('id, titulo, imagen, tipo, categoria')
                    .in('id', ids);
                (prods || []).forEach(p => { productosMap[p.id] = p; });
            }
            compras = (comprasSolas || []).map(c => ({
                ...c,
                productos: productosMap[c.producto_id] || null
            }));
        }

        // Recuperacion para compras historicas sin producto_id:
        // intentamos enlazar por titulo para habilitar acceso e imagen en el frontend.
        const unresolvedTitles = [...new Set(
            (compras || [])
                .filter((c) => !c.producto_id && c.titulo)
                .map((c) => String(c.titulo).trim())
                .filter(Boolean)
        )];

        if (unresolvedTitles.length > 0) {
            const { data: productosByTitle } = await supabase
                .from('productos')
                .select('id, titulo, imagen, tipo, categoria')
                .in('titulo', unresolvedTitles);

            const titleMap = {};
            (productosByTitle || []).forEach((p) => {
                const key = String(p.titulo || '').trim().toLowerCase();
                if (key && !titleMap[key]) titleMap[key] = p;
            });

            compras = (compras || []).map((c) => {
                if (c.producto_id) return c;
                const key = String(c.titulo || '').trim().toLowerCase();
                const match = key ? titleMap[key] : null;
                if (!match) return c;
                return {
                    ...c,
                    producto_id: match.id,
                    productos: c.productos || match
                };
            });
        }

        res.status(200).send({ codigo: 0, compras });

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

            objetoRouter.get('/ObtenerReviewsProducto/:idProducto', async (req, res) => {
                try {
                    const { idProducto } = req.params;
                    const authHeader = req.headers['authorization'];
                    const token = authHeader && authHeader.split(' ')[1];

                    let viewer = null;
                    if (token) {
                        const { data: { user } } = await supabase.auth.getUser(token);
                        viewer = user || null;
                    }

                    const { data: reviews, error } = await supabase
                        .from('producto_reviews')
                        .select('id, producto_id, user_id, compra_id, estrellas, comentario, created_at, updated_at')
                        .eq('producto_id', idProducto)
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    const reviewerIds = [...new Set((reviews || []).map((review) => review.user_id).filter(Boolean))];
                    let profilesMap = {};
                    if (reviewerIds.length > 0) {
                        const { data: profiles } = await supabase
                            .from('perfiles')
                            .select('id, nombre, avatar_url')
                            .in('id', reviewerIds);

                        profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
                    }

                    const summary = buildReviewSummary(reviews || []);
                    const viewerReview = viewer ? (reviews || []).find((review) => review.user_id === viewer.id) : null;
                    let canReview = false;

                    if (viewer) {
                        const { data: verifiedPurchase } = await supabase
                            .from('compras')
                            .select('id')
                            .eq('user_id', viewer.id)
                            .eq('producto_id', idProducto)
                            .limit(1)
                            .maybeSingle();
                        canReview = Boolean(verifiedPurchase);
                    }

                    res.status(200).send({
                        codigo: 0,
                        summary,
                        canReview,
                        viewerReview: viewerReview ? {
                            ...viewerReview,
                            author: {
                                id: viewerReview.user_id,
                                nombre: profilesMap[viewerReview.user_id]?.nombre || 'Tu cuenta',
                                avatar_url: profilesMap[viewerReview.user_id]?.avatar_url || null
                            }
                        } : null,
                        reviews: (reviews || []).map((review) => ({
                            ...review,
                            verified: Boolean(review.compra_id),
                            author: {
                                id: review.user_id,
                                nombre: profilesMap[review.user_id]?.nombre || 'Usuario verificado',
                                avatar_url: profilesMap[review.user_id]?.avatar_url || null
                            }
                        }))
                    });
                } catch (error) {
                    console.log(error);
                    res.status(200).send({ codigo: 1, mensaje: error.message, summary: { average: 0, total: 0, distribution: [] }, reviews: [] });
                }
            });

            objetoRouter.post('/CrearReviewProducto', async (req, res) => {
                try {
                    const user = await getAuthUser(req);
                    const { productoId, estrellas, comentario } = req.body;

                    if (!productoId) throw new Error('Producto requerido');

                    const score = Number(estrellas);
                    if (!Number.isInteger(score) || score < 1 || score > 5) {
                        throw new Error('La valoracion debe estar entre 1 y 5 estrellas');
                    }

                    const text = String(comentario || '').trim();
                    if (text.length < 12) throw new Error('Escribe un comentario con algo mas de contexto');

                    const { data: verifiedPurchase, error: purchaseError } = await supabase
                        .from('compras')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('producto_id', productoId)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (purchaseError) throw purchaseError;
                    if (!verifiedPurchase) throw new Error('Solo puedes reseñar productos que hayas comprado');

                    const { error } = await supabase
                        .from('producto_reviews')
                        .upsert({
                            producto_id: productoId,
                            user_id: user.id,
                            compra_id: verifiedPurchase.id,
                            estrellas: score,
                            comentario: text,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'producto_id,user_id' });

                    if (error) throw error;

                    res.status(200).send({ codigo: 0, mensaje: 'Reseña guardada correctamente' });
                } catch (error) {
                    console.log(error);
                    res.status(200).send({ codigo: 1, mensaje: error.message });
                }
            });

            objetoRouter.get('/ObtenerChatProducto/:idProducto', async (req, res) => {
                try {
                    const user = await getAuthUser(req);
                    const { idProducto } = req.params;
                    const { buyerId } = req.query;

                    const { data: producto, error: productError } = await supabase
                        .from('productos')
                        .select('id, titulo, user_id')
                        .eq('id', idProducto)
                        .single();

                    if (productError || !producto) throw new Error('Producto no encontrado');

                    const isSeller = producto.user_id === user.id;
                    const compradorId = isSeller ? buyerId : user.id;
                    if (!compradorId) {
                        return res.status(200).send({
                            codigo: 0,
                            role: isSeller ? 'seller' : 'buyer',
                            needsBuyerSelection: isSeller,
                            thread: null,
                            peer: null,
                            messages: []
                        });
                    }

                    if (compradorId === producto.user_id) throw new Error('No puedes abrir un chat contigo mismo');

                    const thread = await ensureSocialThread({
                        contexto: 'producto',
                        contextoId: producto.id,
                        productoId: producto.id,
                        compradorId,
                        vendedorId: producto.user_id
                    });

                    const { data: messages, error: messageError } = await supabase
                        .from('social_messages')
                        .select('id, thread_id, sender_id, contenido, created_at, leido_at')
                        .eq('thread_id', thread.id)
                        .order('created_at', { ascending: true });

                    if (messageError) throw messageError;

                    const participantIds = [...new Set([compradorId, producto.user_id, ...(messages || []).map((message) => message.sender_id)])];
                    const { data: profiles } = await supabase
                        .from('perfiles')
                        .select('id, nombre, avatar_url')
                        .in('id', participantIds);

                    const profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
                    const peerId = user.id === compradorId ? producto.user_id : compradorId;

                    res.status(200).send({
                        codigo: 0,
                        role: isSeller ? 'seller' : 'buyer',
                        needsBuyerSelection: false,
                        thread,
                        peer: peerId ? {
                            id: peerId,
                            nombre: profilesMap[peerId]?.nombre || 'Usuario',
                            avatar_url: profilesMap[peerId]?.avatar_url || null
                        } : null,
                        messages: (messages || []).map((message) => ({
                            ...message,
                            author: {
                                id: message.sender_id,
                                nombre: profilesMap[message.sender_id]?.nombre || 'Usuario',
                                avatar_url: profilesMap[message.sender_id]?.avatar_url || null
                            }
                        }))
                    });
                } catch (error) {
                    console.log(error);
                    res.status(200).send({ codigo: 1, mensaje: error.message, messages: [] });
                }
            });

            objetoRouter.post('/EnviarMensajeProducto', async (req, res) => {
                try {
                    const user = await getAuthUser(req);
                    const { productoId, buyerId, contenido } = req.body;

                    if (!productoId) throw new Error('Producto requerido');

                    const messageText = String(contenido || '').trim();
                    if (messageText.length < 2) throw new Error('Escribe un mensaje valido');

                    const { data: producto, error: productError } = await supabase
                        .from('productos')
                        .select('id, titulo, user_id')
                        .eq('id', productoId)
                        .single();

                    if (productError || !producto) throw new Error('Producto no encontrado');

                    const isSeller = producto.user_id === user.id;
                    const compradorId = isSeller ? buyerId : user.id;
                    if (!compradorId) throw new Error('No se pudo resolver el comprador del hilo');
                    if (compradorId === producto.user_id) throw new Error('No puedes enviarte mensajes a ti mismo');

                    const thread = await ensureSocialThread({
                        contexto: 'producto',
                        contextoId: producto.id,
                        productoId: producto.id,
                        compradorId,
                        vendedorId: producto.user_id
                    });

                    const { data: insertedMessage, error: insertError } = await supabase
                        .from('social_messages')
                        .insert({
                            thread_id: thread.id,
                            sender_id: user.id,
                            contenido: messageText
                        })
                        .select('id, thread_id, sender_id, contenido, created_at, leido_at')
                        .single();

                    if (insertError) throw insertError;

                    await supabase
                        .from('social_threads')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', thread.id);

                    const recipientId = user.id === compradorId ? producto.user_id : compradorId;
                    if (recipientId && recipientId !== user.id) {
                        await crearNotificacion(recipientId, 'mensaje', {
                            contexto: 'producto',
                            productoId: producto.id,
                            titulo: producto.titulo,
                            preview: messageText.slice(0, 120),
                            threadId: thread.id
                        });
                    }

                    const { data: profile } = await supabase
                        .from('perfiles')
                        .select('id, nombre, avatar_url')
                        .eq('id', user.id)
                        .single();

                    res.status(200).send({
                        codigo: 0,
                        mensaje: 'Mensaje enviado',
                        thread,
                        message: {
                            ...insertedMessage,
                            author: {
                                id: user.id,
                                nombre: profile?.nombre || 'Usuario',
                                avatar_url: profile?.avatar_url || null
                            }
                        }
                    });
                } catch (error) {
                    console.log(error);
                    res.status(200).send({ codigo: 1, mensaje: error.message });
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
                const { data: recientes } = await supabase
                    .from('productos')
                    .select('id, titulo, categoria, precio, imagen, tipo')
                    .neq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(8);
                const fallback = (recientes || []).map(p => ({ ...p, score: 0, razon: 'Recién publicado en ScriptBay' }));
                return res.status(200).send({ codigo: 0, recomendaciones: fallback });
            }

            const { data: productosPopulares } = await supabase
                .from('productos')
                .select('id, titulo, categoria, precio, imagen, tipo')
                .in('id', idsPopulares)
                .neq('user_id', user.id);

            const popularesFinales = (productosPopulares || [])
                .map(p => ({ ...p, score: frecuenciaGlobal[p.id] || 0, razon: 'Popular en ScriptBay' }))
                .sort((a, b) => b.score - a.score);

            if (popularesFinales.length === 0) {
                const { data: recientes } = await supabase
                    .from('productos')
                    .select('id, titulo, categoria, precio, imagen, tipo')
                    .neq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(8);
                const fallback = (recientes || []).map(p => ({ ...p, score: 0, razon: 'Recién publicado en ScriptBay' }));
                return res.status(200).send({ codigo: 0, recomendaciones: fallback });
            }

            return res.status(200).send({ codigo: 0, recomendaciones: popularesFinales });
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
            const { data: recientes } = await supabase
                .from('productos')
                .select('id, titulo, categoria, precio, imagen, tipo')
                .neq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(8);
            const fallback = (recientes || []).map(p => ({ ...p, score: 0, razon: 'Recién publicado en ScriptBay' }));
            return res.status(200).send({ codigo: 0, recomendaciones: fallback });
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
