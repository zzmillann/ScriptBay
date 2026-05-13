import express from 'express';
import { supabase } from '../supabaseClient.js';

const objetoRouter = express.Router();

const getAuthUser = async (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw new Error('No autorizado');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
};

objetoRouter.get('/NoLeidas/count', async (req, res) => {
    try {
        const user = await getAuthUser(req);

        const { count, error } = await supabase
            .from('notificaciones')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('leida', false);

        if (error) throw error;

        res.status(200).send({ codigo: 0, count: count || 0 });

    } catch (error) {
        console.log(error);
        res.status(200).send({ codigo: 1, mensaje: error.message, count: 0 });
    }
});

objetoRouter.get('/MisNotificaciones', async (req, res) => {
    try {
        const user = await getAuthUser(req);

        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = 10;
        const tipo = req.query.tipo || null;
        const leida = req.query.leida !== undefined && req.query.leida !== '' ? req.query.leida === 'true' : null;

        let query = supabase
            .from('notificaciones')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range((pagina - 1) * porPagina, pagina * porPagina - 1);

        if (tipo) query = query.eq('tipo', tipo);
        if (leida !== null) query = query.eq('leida', leida);

        const { data, count, error } = await query;

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            notificaciones: data || [],
            total: count || 0,
            pagina,
            totalPaginas: Math.ceil((count || 0) / porPagina)
        });

    } catch (error) {
        console.log(error);
        res.status(200).send({ codigo: 1, mensaje: error.message, notificaciones: [] });
    }
});

objetoRouter.post('/MarcarLeida/:id', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).send({ codigo: 0, mensaje: 'Notificación marcada como leída' });

    } catch (error) {
        console.log(error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

objetoRouter.post('/MarcarTodasLeidas', async (req, res) => {
    try {
        const user = await getAuthUser(req);

        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('user_id', user.id)
            .eq('leida', false);

        if (error) throw error;

        res.status(200).send({ codigo: 0, mensaje: 'Todas las notificaciones marcadas como leídas' });

    } catch (error) {
        console.log(error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

objetoRouter.delete('/Eliminar/:id', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('notificaciones')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).send({ codigo: 0, mensaje: 'Notificación eliminada' });

    } catch (error) {
        console.log(error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

export default objetoRouter;
