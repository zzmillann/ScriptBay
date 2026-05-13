import { supabase } from '../supabaseClient.js';

export const crearNotificacion = async (userId, tipo, datos) => {
    try {
        await supabase.from('notificaciones').insert({ user_id: userId, tipo, datos });
    } catch (error) {
        console.log('[Notificaciones] Error al crear notificación:', error);
    }
};
