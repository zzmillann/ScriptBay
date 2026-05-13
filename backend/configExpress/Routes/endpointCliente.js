import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.js';
import mailjetService from '../servicios/mailjetService.js';
const objetoRouter = express.Router();

// Configuracion de multer igual que en el proyecto de clase: memoria RAM y limite 5MB
const multerMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper: convierte el buffer de un fichero multer a data URL
const bufferADataUrl = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

objetoRouter.post('/Registro', async (req, res, next) => {

    try {

        const { email, password, nombre } = req.body // 1º extraer del body los datos del formulario

        const { data, error } = await supabase.auth.signUp({ email: email, password: password }) // 2º crear el usuario en supabase auth (guarda en auth.users de postgres)

        if (error) throw error //si pasa algo se lanza el error y se sale del try

        const user = data.user // 3º si todo ok, extraemos el objeto user

        if (user) {

            const { error: perfilError } = await supabase
                .from('perfiles') // 4º insertamos el resto de datos en la tabla 'perfiles'
                .insert({
                    id: user.id,
                    nombre: nombre
                })

            if (perfilError) throw perfilError //si pasa algo se lanza el error y se sale del try

            // 5º enviamos email de bienvenida personalizado con Mailjet (igual que en el proyecto de clase)
            // No bloqueamos el registro si falla el envio del email
            // Siempre se envia al email del .env para evitar limitaciones del plan trial de Mailjet
            await mailjetService.enviarBienvenida(process.env.MAILJET_EMAIL_FROM, nombre);
        }

        res.status(200).send({
            codigo: 0,
            mensaje: "Registro correcto. Revisa tu email"
        })

    } catch (error) {

        console.log(error)

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        })

    }

});




objetoRouter.post('/Login', async (req, res, next) => {
    try {

        const { email, password } = req.body // 1º extraer del body los datos del formulario

        const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password }) // 2º iniciar sesión en supabase auth

        if (error) throw error //si pasa algo se lanza el error y se sale del try

        const user = data.user // 3º si todo ok, extraemos el objeto user
        const session = data.session // 4º si todo ok, extraemos el objeto session

        const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id) // 5º buscar el perfil del usuario en la tabla 'perfiles'
            .single()

        res.status(200).send({
            codigo: 0,
            mensaje: "Login correcto",
            accessToken: session.access_token, // 6º si todo ok, devolvemos el token de acceso y los datos del cliente
            refreshToken: session.refresh_token,
            datosCliente: {
                ...user, // 7º si todo ok, devolvemos los datos del cliente
                ...perfil
            }
        })

    } catch (error) {

        console.log(error)

        res.status(200).send({
            codigo: 2,
            mensaje: error.message
        })

    }

});

objetoRouter.post('/Logout', async (req, res, next) => {
    try {

        const { error } = await supabase.auth.signOut() // 1º cerrar sesión en supabase auth

        if (error) throw error //si pasa algo se lanza el error y se sale del try

        res.status(200).send({
            codigo: 0,
            mensaje: "Logout correcto"
        })

    } catch (error) {

        console.log(error)

        res.status(200).send({
            codigo: 3,
            mensaje: error.message
        })

    }
});

objetoRouter.post('/RefreshToken', async (req, res, next) => {
    try {

        const { refreshToken } = req.body;

        if (!refreshToken) throw new Error('No se ha proporcionado refresh token');

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            mensaje: 'Token renovado correctamente',
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 1,
            mensaje: error.message
        });

    }
});

objetoRouter.post('/ActualizarPerfil',
    multerMiddleware.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),
    async (req, res, next) => {
    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { nombre, titular, ubicacion, educacion, github, linkedin, avatar, banner, avatar_offset, banner_offset, banner_zoom } = req.body;

        // Si llega fichero via multipart lo convertimos a data URL, si no usamos el valor de req.body
        const avatarFinal = req.files?.avatar?.[0] ? bufferADataUrl(req.files.avatar[0]) : (avatar || undefined);
        const bannerFinal = req.files?.banner?.[0] ? bufferADataUrl(req.files.banner[0]) : (banner || undefined);

        const payloadPerfil = {
            nombre,
            titular,
            ubicacion,
            educacion,
            github,
            linkedin,
            avatar: avatarFinal,
            banner: bannerFinal,
            avatar_offset,
            banner_offset,
            banner_zoom
        };

        let { error } = await supabase
            .from('perfiles')
            .update(payloadPerfil)
            .eq('id', user.id);

        if (error && error.message?.includes("'banner_zoom'")) {
            const { banner_zoom: _omitBannerZoom, ...payloadSinZoom } = payloadPerfil;
            const retry = await supabase
                .from('perfiles')
                .update(payloadSinZoom)
                .eq('id', user.id);
            error = retry.error;
        }

        if (error) throw error;

        res.status(200).send({
            codigo: 0,
            mensaje: 'Perfil actualizado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(200).send({
            codigo: 4,
            mensaje: error.message
        });

    }
});

objetoRouter.post('/PerfilUsuario', async (req, res, next) => {
    try {
        const {
            componentName,
            nombre,
            titular,
            educacion,
            github,
            linkedin,
            bannerImage,
            profileImage,
            bannerOffset,
            avatarOffset,
            updatedAt
        } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(200).send({
                codigo: 1,
                mensaje: 'El nombre del perfil es obligatorio'
            });
        }

        const perfilNormalizado = {
            componentName: componentName || 'PerfilLinked',
            nombre: nombre.trim(),
            titular: titular || '',
            educacion: Array.isArray(educacion) ? educacion : [],
            github: github || null,
            linkedin: linkedin || null,
            bannerImage: bannerImage || null,
            profileImage: profileImage || null,
            bannerOffset: bannerOffset || { x: 0, y: 0 },
            avatarOffset: avatarOffset || { x: 0, y: 0 },
            updatedAt: updatedAt || new Date().toISOString()
        };

        console.log('[PerfilUsuario] payload recibido:', {
            ...perfilNormalizado,
            bannerImage: perfilNormalizado.bannerImage ? 'data-url-recibido' : null,
            profileImage: perfilNormalizado.profileImage ? 'data-url-recibido' : null
        });

        return res.status(200).send({
            codigo: 0,
            mensaje: 'PerfilUsuario recibido en Node correctamente',
            datosPerfil: perfilNormalizado
        });
    } catch (error) {
        console.log(error);

        return res.status(200).send({
            codigo: 2,
            mensaje: error.message
        });
    }
});

objetoRouter.post('/EliminarCuenta', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError) throw authError;

        await supabase.from('notificaciones').delete().eq('user_id', user.id);
        await supabase.from('compras').delete().eq('user_id', user.id);
        await supabase.from('productos').delete().eq('user_id', user.id);
        await supabase.from('perfiles').delete().eq('id', user.id);

        const serviceRoleKey = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
            const adminSupabase = createClient(process.env.PROJECT_URL, serviceRoleKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            });
            await adminSupabase.auth.admin.deleteUser(user.id);
            console.log('[EliminarCuenta] Usuario eliminado completamente de auth:', user.id);
        } else {
            console.log('[EliminarCuenta] Sin SERVICE_ROLE - datos eliminados, registro auth pendiente:', user.id);
        }

        res.status(200).send({ codigo: 0, mensaje: 'Cuenta eliminada correctamente' });

    } catch (error) {
        console.log('ERROR en /EliminarCuenta:', error);
        res.status(200).send({ codigo: 1, mensaje: error.message });
    }
});

export default objetoRouter;
