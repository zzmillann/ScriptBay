import express from 'express';
import { supabase } from '../supabaseClient.js';
import stripeService from '../servicios/stripeService.js';
import { crearNotificacion } from '../servicios/notificacionHelper.js';

const objetoRouter = express.Router();

// ── Helper: extraer y validar token ───────────────────────────────────────────
const getAuthUser = async (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw new Error('No autorizado');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
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

// ── Helper: calcular fecha_fin según duración ─────────────────────────────────
const calcularFechaFin = (duracion) => {
    const ahora = new Date();
    if (duracion === '1h')  return new Date(ahora.getTime() + 1  * 60 * 60 * 1000).toISOString();
    if (duracion === '24h') return new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString();
    if (duracion === '7d')  return new Date(ahora.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString();
    throw new Error('Duración inválida. Usa: 1h, 24h o 7d');
};

// ── Helper: cerrar subastas expiradas (se llama antes de cada listado) ─────────
const cerrarSubastasExpiradas = async () => {
    const ahora = new Date().toISOString();
    const { data: expiradas } = await supabase
        .from('subastas')
        .select('id, precio_actual')
        .eq('estado', 'activa')
        .lt('fecha_fin', ahora);

    if (!expiradas || expiradas.length === 0) return;

    for (const subasta of expiradas) {
        // Buscar la puja más alta
        const { data: mejorPuja } = await supabase
            .from('pujas')
            .select('user_id, cantidad')
            .eq('subasta_id', subasta.id)
            .order('cantidad', { ascending: false })
            .limit(1)
            .single();

        if (mejorPuja) {
            await supabase.from('subastas').update({
                estado: 'cerrada',
                ganador_id: mejorPuja.user_id,
                puja_ganadora: mejorPuja.cantidad
            }).eq('id', subasta.id);
        } else {
            // Sin pujas: cerrar sin ganador
            await supabase.from('subastas').update({ estado: 'cerrada' }).eq('id', subasta.id);
        }
    }
};

// ─── POST /CrearSubasta ───────────────────────────────────────────────────────
objetoRouter.post('/CrearSubasta', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { productoId, precioSalida, duracion, precioCompraInmediata, incrementoPuja } = req.body;

        if (!productoId || !precioSalida || !duracion) {
            throw new Error('Faltan campos obligatorios: productoId, precioSalida, duracion');
        }

        const incrementoNum = incrementoPuja ? Number(incrementoPuja) : 0.01;
        if (incrementoNum < 0.01) throw new Error('El incremento mínimo por puja debe ser al menos 0.01 €');

        // Verificar que el producto pertenece al vendedor
        const { data: producto, error: prodError } = await supabase
            .from('productos')
            .select('id, user_id, titulo')
            .eq('id', productoId)
            .single();

        if (prodError || !producto) throw new Error('Producto no encontrado');
        if (producto.user_id !== user.id) throw new Error('No tienes permisos sobre este producto');

        // Verificar que no hay subasta activa para este producto
        const { data: subastaExistente } = await supabase
            .from('subastas')
            .select('id')
            .eq('producto_id', productoId)
            .eq('estado', 'activa')
            .single();

        if (subastaExistente) throw new Error('Ya existe una subasta activa para este producto');

        const fechaFin = calcularFechaFin(duracion);

        const { data: nuevaSubasta, error } = await supabase
            .from('subastas')
            .insert({
                producto_id: productoId,
                vendedor_id: user.id,
                precio_salida: Number(precioSalida),
                precio_actual: Number(precioSalida),
                precio_compra_inmediata: precioCompraInmediata ? Number(precioCompraInmediata) : null,
                incremento_puja: incrementoNum,
                duracion,
                fecha_fin: fechaFin,
                estado: 'activa'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(200).send({ codigo: 0, mensaje: 'Subasta creada correctamente', subasta: nuevaSubasta });

    } catch (error) {
        console.log('ERROR en /CrearSubasta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── GET /ObtenerSubastas ─────────────────────────────────────────────────────
objetoRouter.get('/ObtenerSubastas', async (req, res) => {
    try {
        await cerrarSubastasExpiradas();

        const { data: subastas, error } = await supabase
            .from('subastas')
            .select(`
                id, precio_salida, precio_actual, precio_compra_inmediata,
                duracion, fecha_fin, estado, created_at,
                productos (id, titulo, imagen, categoria, tipo)
            `)
            .eq('estado', 'activa')
            .order('fecha_fin', { ascending: true });

        if (error) throw error;

        // Enriquecer con el número de pujas de cada subasta
        const conPujas = await Promise.all(
            (subastas || []).map(async (s) => {
                const { count } = await supabase
                    .from('pujas')
                    .select('id', { count: 'exact', head: true })
                    .eq('subasta_id', s.id);
                return { ...s, total_pujas: count || 0 };
            })
        );

        res.status(200).send({ codigo: 0, subastas: conPujas });

    } catch (error) {
        console.log('ERROR en /ObtenerSubastas:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message, subastas: [] });
    }
});

// ─── GET /ObtenerSubasta/:id ──────────────────────────────────────────────────
objetoRouter.get('/ObtenerSubasta/:id', async (req, res) => {
    try {
        await cerrarSubastasExpiradas();

        const { id } = req.params;

        const { data: subasta, error } = await supabase
            .from('subastas')
            .select(`
                id, precio_salida, precio_actual, precio_compra_inmediata, incremento_puja,
                duracion, fecha_fin, estado, ganador_id, puja_ganadora, created_at, vendedor_id,
                productos (id, titulo, descripcion, imagen, categoria, tipo, precio)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Historial de pujas con nombre del pujador (tabla perfiles)
        const { data: pujas } = await supabase
            .from('pujas')
            .select('id, cantidad, created_at, user_id')
            .eq('subasta_id', id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Obtener nombres de los pujadores
        const userIds = [...new Set((pujas || []).map((p) => p.user_id))];
        let perfilesMap = {};
        if (userIds.length > 0) {
            const { data: perfiles } = await supabase
                .from('perfiles')
                .select('id, nombre, avatar_url')
                .in('id', userIds);
            (perfiles || []).forEach((p) => { perfilesMap[p.id] = p; });
        }

        const pujasEnriquecidas = (pujas || []).map((p) => ({
            ...p,
            nombre: perfilesMap[p.user_id]?.nombre || 'Usuario',
            avatar_url: perfilesMap[p.user_id]?.avatar_url || null
        }));

        res.status(200).send({ codigo: 0, subasta: { ...subasta, pujas: pujasEnriquecidas } });

    } catch (error) {
        console.log('ERROR en /ObtenerSubasta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

objetoRouter.get('/ObtenerChatSubasta/:idSubasta', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { idSubasta } = req.params;
        const { buyerId } = req.query;

        const { data: subasta, error: subastaError } = await supabase
            .from('subastas')
            .select('id, producto_id, vendedor_id')
            .eq('id', idSubasta)
            .single();

        if (subastaError || !subasta) throw new Error('Subasta no encontrada');

        const isSeller = subasta.vendedor_id === user.id;
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

        if (compradorId === subasta.vendedor_id) throw new Error('No puedes abrir un chat contigo mismo');

        const thread = await ensureSocialThread({
            contexto: 'subasta',
            contextoId: subasta.id,
            productoId: subasta.producto_id,
            subastaId: subasta.id,
            compradorId,
            vendedorId: subasta.vendedor_id
        });

        const { data: messages, error: messageError } = await supabase
            .from('social_messages')
            .select('id, thread_id, sender_id, contenido, created_at, leido_at')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: true });

        if (messageError) throw messageError;

        const participantIds = [...new Set([compradorId, subasta.vendedor_id, ...(messages || []).map((message) => message.sender_id)])];
        const { data: profiles } = await supabase
            .from('perfiles')
            .select('id, nombre, avatar_url')
            .in('id', participantIds);

        const profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
        const peerId = user.id === compradorId ? subasta.vendedor_id : compradorId;

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
        console.log('ERROR en /ObtenerChatSubasta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message, messages: [] });
    }
});

objetoRouter.post('/EnviarMensajeSubasta', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { subastaId, buyerId, contenido } = req.body;

        if (!subastaId) throw new Error('Subasta requerida');

        const messageText = String(contenido || '').trim();
        if (messageText.length < 2) throw new Error('Escribe un mensaje valido');

        const { data: subasta, error: subastaError } = await supabase
            .from('subastas')
            .select('id, producto_id, vendedor_id')
            .eq('id', subastaId)
            .single();

        if (subastaError || !subasta) throw new Error('Subasta no encontrada');

        const isSeller = subasta.vendedor_id === user.id;
        const compradorId = isSeller ? buyerId : user.id;
        if (!compradorId) throw new Error('No se pudo resolver el comprador del hilo');
        if (compradorId === subasta.vendedor_id) throw new Error('No puedes enviarte mensajes a ti mismo');

        const thread = await ensureSocialThread({
            contexto: 'subasta',
            contextoId: subasta.id,
            productoId: subasta.producto_id,
            subastaId: subasta.id,
            compradorId,
            vendedorId: subasta.vendedor_id
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

        const recipientId = user.id === compradorId ? subasta.vendedor_id : compradorId;
        if (recipientId && recipientId !== user.id) {
            await crearNotificacion(recipientId, 'mensaje', {
                contexto: 'subasta',
                subastaId: subasta.id,
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
        console.log('ERROR en /EnviarMensajeSubasta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── POST /Pujar ──────────────────────────────────────────────────────────────
objetoRouter.post('/Pujar', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { subastaId, cantidad } = req.body;

        if (!subastaId || cantidad === undefined) throw new Error('Faltan campos: subastaId, cantidad');

        // Obtener la subasta con lock implícito
        const { data: subasta, error: subError } = await supabase
            .from('subastas')
            .select('id, estado, fecha_fin, precio_actual, precio_salida, vendedor_id, precio_compra_inmediata, incremento_puja')
            .eq('id', subastaId)
            .single();

        if (subError || !subasta) throw new Error('Subasta no encontrada');
        if (subasta.estado !== 'activa') throw new Error('La subasta ya ha finalizado');
        if (new Date() > new Date(subasta.fecha_fin)) throw new Error('El tiempo de la subasta ha expirado');
        if (subasta.vendedor_id === user.id) throw new Error('No puedes pujar en tu propia subasta');

        const cantidadNum = Number(cantidad);
        const incremento = Number(subasta.incremento_puja ?? 0.01);
        const minPuja = Number(subasta.precio_actual) + incremento;

        if (cantidadNum < minPuja) {
            throw new Error(`La puja mínima es ${minPuja.toFixed(2)} € (precio actual + incremento de ${incremento.toFixed(2)} €)`);
        }

        // Insertar puja
        const { error: pujaError } = await supabase
            .from('pujas')
            .insert({ subasta_id: subastaId, user_id: user.id, cantidad: cantidadNum });

        if (pujaError) throw pujaError;

        // Actualizar precio actual en la subasta
        await supabase
            .from('subastas')
            .update({ precio_actual: cantidadNum })
            .eq('id', subastaId);

        // Si la puja iguala o supera el precio de compra inmediata → cerrar automáticamente
        const esCi = subasta.precio_compra_inmediata && cantidadNum >= Number(subasta.precio_compra_inmediata);

        if (esCi) {
            await supabase.from('subastas').update({
                estado: 'cerrada',
                ganador_id: user.id,
                puja_ganadora: cantidadNum
            }).eq('id', subastaId);

            return res.status(200).send({
                codigo: 0,
                mensaje: '¡Compra inmediata realizada! Has ganado la subasta.',
                precioActual: cantidadNum,
                comprainmediata: true
            });
        }

        res.status(200).send({ codigo: 0, mensaje: 'Puja registrada correctamente', precioActual: cantidadNum });

    } catch (error) {
        console.log('ERROR en /Pujar:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── POST /PagarSubastaGanada ─────────────────────────────────────────────────
// El ganador llama a este endpoint para completar el pago vía Stripe
objetoRouter.post('/PagarSubastaGanada', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { subastaId, metodoPago } = req.body;

        if (!subastaId) throw new Error('Falta subastaId');

        const { data: subasta, error: subError } = await supabase
            .from('subastas')
            .select(`
                id, estado, ganador_id, puja_ganadora, stripe_payment_intent,
                productos (titulo),
                vendedor:vendedor_id (id)
            `)
            .eq('id', subastaId)
            .single();

        if (subError || !subasta) throw new Error('Subasta no encontrada');
        if (subasta.estado !== 'cerrada') throw new Error('La subasta aún no ha finalizado');
        if (subasta.ganador_id !== user.id) throw new Error('No eres el ganador de esta subasta');
        if (subasta.stripe_payment_intent) throw new Error('Esta subasta ya fue pagada');

        // Obtener perfil del ganador para Stripe
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre, ubicacion, stripe_customer_id')
            .eq('id', user.id)
            .single();

        const nombreCliente = perfil?.nombre || user.email;
        let customerIdStripe = perfil?.stripe_customer_id || null;

        if (!customerIdStripe) {
            customerIdStripe = await stripeService.Stage1_CreateCustomer(nombreCliente, user.email, perfil?.ubicacion);
            if (!customerIdStripe) throw new Error('No se pudo crear el cliente en Stripe');
            await supabase.from('perfiles').update({ stripe_customer_id: customerIdStripe }).eq('id', user.id);
        }

        const cardIdStripe = await stripeService.Stage2_CreateCardForCustomer(customerIdStripe, metodoPago || 'visa');
        if (!cardIdStripe) throw new Error('No se pudo crear la tarjeta en Stripe');

        const resultadoPago = await stripeService.Stage3_CreateChargeForCustomer(
            customerIdStripe,
            cardIdStripe,
            subasta.puja_ganadora,
            `Subasta ScriptBay: ${subasta.productos?.titulo}`
        );
        if (!resultadoPago) throw new Error('No se pudo procesar el pago en Stripe');

        const { idPaymentIntent } = resultadoPago;

        // Marcar la subasta como pagada
        await supabase.from('subastas').update({ stripe_payment_intent: idPaymentIntent }).eq('id', subastaId);

        // Registrar en compras
        await supabase.from('compras').insert({
            user_id: user.id,
            producto_id: subasta.productos?.id || null,
            titulo: subasta.productos?.titulo || 'Subasta ScriptBay',
            precio: subasta.puja_ganadora,
            metodo_pago: 'Stripe (Subasta)',
            id_transaccion: idPaymentIntent
        });

        await crearNotificacion(subasta.vendedor?.id, 'compra', {
            titulo: subasta.productos?.titulo || 'Subasta ScriptBay',
            precio: subasta.puja_ganadora,
            compradorId: user.id,
            subastaId,
            metodo: 'Stripe (Subasta)'
        });

        res.status(200).send({ codigo: 0, mensaje: 'Pago de subasta procesado correctamente', paymentIntentId: idPaymentIntent });

    } catch (error) {
        console.log('ERROR en /PagarSubastaGanada:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── POST /CompraInmediataDirecta ─────────────────────────────────────────────
// Cierra la subasta al precio de compra inmediata Y procesa el pago Stripe en un solo paso
objetoRouter.post('/CompraInmediataDirecta', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { subastaId, metodoPago } = req.body;

        if (!subastaId) throw new Error('Falta subastaId');

        const { data: subasta, error: subError } = await supabase
            .from('subastas')
            .select('id, estado, fecha_fin, vendedor_id, precio_compra_inmediata, stripe_payment_intent, productos(id, titulo)')
            .eq('id', subastaId)
            .single();

        if (subError || !subasta) throw new Error('Subasta no encontrada');
        if (subasta.estado !== 'activa') throw new Error('La subasta ya ha finalizado');
        if (new Date() > new Date(subasta.fecha_fin)) throw new Error('El tiempo de la subasta ha expirado');
        if (subasta.vendedor_id === user.id) throw new Error('No puedes comprar tu propia subasta');
        if (!subasta.precio_compra_inmediata) throw new Error('Esta subasta no tiene precio de compra inmediata');

        const precioCi = Number(subasta.precio_compra_inmediata);

        // Cerrar la subasta inmediatamente con este comprador como ganador
        await supabase.from('subastas').update({
            estado: 'cerrada',
            ganador_id: user.id,
            puja_ganadora: precioCi,
            precio_actual: precioCi
        }).eq('id', subastaId);

        // Registrar la puja de compra inmediata en el historial
        await supabase.from('pujas').insert({
            subasta_id: subastaId,
            user_id: user.id,
            cantidad: precioCi
        });

        // Stripe: obtener/crear cliente
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre, ubicacion, stripe_customer_id')
            .eq('id', user.id)
            .single();

        const nombreCliente = perfil?.nombre || user.email;
        let customerIdStripe = perfil?.stripe_customer_id || null;

        if (!customerIdStripe) {
            customerIdStripe = await stripeService.Stage1_CreateCustomer(nombreCliente, user.email, perfil?.ubicacion);
            if (!customerIdStripe) throw new Error('No se pudo crear el cliente en Stripe');
            await supabase.from('perfiles').update({ stripe_customer_id: customerIdStripe }).eq('id', user.id);
        }

        const cardIdStripe = await stripeService.Stage2_CreateCardForCustomer(customerIdStripe, metodoPago || 'visa');
        if (!cardIdStripe) throw new Error('No se pudo crear la tarjeta en Stripe');

        const resultadoPago = await stripeService.Stage3_CreateChargeForCustomer(
            customerIdStripe,
            cardIdStripe,
            precioCi,
            `Compra inmediata ScriptBay: ${subasta.productos?.titulo}`
        );
        if (!resultadoPago) throw new Error('No se pudo procesar el pago en Stripe');

        const { idPaymentIntent } = resultadoPago;

        // Marcar como pagada
        await supabase.from('subastas').update({ stripe_payment_intent: idPaymentIntent }).eq('id', subastaId);

        // Registrar en historial de compras
        await supabase.from('compras').insert({
            user_id: user.id,
            producto_id: subasta.productos?.id || null,
            titulo: subasta.productos?.titulo || 'Subasta ScriptBay',
            precio: precioCi,
            metodo_pago: 'Stripe (Compra Inmediata)',
            id_transaccion: idPaymentIntent
        });

        await crearNotificacion(subasta.vendedor_id, 'compra', {
            titulo: subasta.productos?.titulo || 'Subasta ScriptBay',
            precio: precioCi,
            compradorId: user.id,
            subastaId,
            metodo: 'Stripe (Compra Inmediata)'
        });

        res.status(200).send({ codigo: 0, mensaje: '¡Compra realizada! El producto es tuyo.', paymentIntentId: idPaymentIntent });

    } catch (error) {
        console.log('ERROR en /CompraInmediataDirecta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── GET /MisSubastas ─────────────────────────────────────────────────────────
objetoRouter.get('/MisSubastas', async (req, res) => {
    try {
        const user = await getAuthUser(req);

        const { data: subastas, error } = await supabase
            .from('subastas')
            .select(`
                id, precio_salida, precio_actual, precio_compra_inmediata,
                duracion, fecha_fin, estado, ganador_id, puja_ganadora, created_at,
                productos (id, titulo, imagen, categoria)
            `)
            .eq('vendedor_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).send({ codigo: 0, subastas: subastas || [] });

    } catch (error) {
        console.log('ERROR en /MisSubastas:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message, subastas: [] });
    }
});

// ─── POST /CancelarSubasta ────────────────────────────────────────────────────
objetoRouter.post('/CancelarSubasta', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { subastaId } = req.body;
        if (!subastaId) throw new Error('Falta subastaId');

        const { data: subasta } = await supabase
            .from('subastas')
            .select('id, vendedor_id, estado')
            .eq('id', subastaId)
            .single();

        if (!subasta) throw new Error('Subasta no encontrada');
        if (subasta.vendedor_id !== user.id) throw new Error('No tienes permisos sobre esta subasta');
        if (subasta.estado !== 'activa') throw new Error('Solo se pueden cancelar subastas activas');

        // Solo se puede cancelar si no hay pujas
        const { count } = await supabase
            .from('pujas')
            .select('id', { count: 'exact', head: true })
            .eq('subasta_id', subastaId);

        if (count > 0) throw new Error('No se puede cancelar: ya hay pujas registradas');

        await supabase.from('subastas').update({ estado: 'cancelada' }).eq('id', subastaId);

        res.status(200).send({ codigo: 0, mensaje: 'Subasta cancelada correctamente' });

    } catch (error) {
        console.log('ERROR en /CancelarSubasta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

// ─── DELETE /EliminarSubasta/:id ──────────────────────────────────────────────
objetoRouter.delete('/EliminarSubasta/:id', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { id } = req.params;

        const { data: subasta, error: subError } = await supabase
            .from('subastas')
            .select('id, vendedor_id, estado, stripe_payment_intent')
            .eq('id', id)
            .single();

        if (subError || !subasta) throw new Error('Subasta no encontrada');
        if (subasta.vendedor_id !== user.id) throw new Error('No tienes permisos para eliminar esta subasta');
        if (subasta.stripe_payment_intent) throw new Error('No se puede eliminar una subasta que ya fue pagada');

        // Borrar pujas primero (aunque el CASCADE lo haría, lo hacemos explícito)
        await supabase.from('pujas').delete().eq('subasta_id', id);
        await supabase.from('subastas').delete().eq('id', id);

        res.status(200).send({ codigo: 0, mensaje: 'Subasta eliminada correctamente' });

    } catch (error) {
        console.log('ERROR en /EliminarSubasta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

export default objetoRouter;
