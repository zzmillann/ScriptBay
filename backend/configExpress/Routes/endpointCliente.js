import express from 'express';
import { supabase } from '../supabaseClient.js';
const objetoRouter = express.Router();

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

objetoRouter.post('/ActualizarPerfil', async (req, res, next) => {
    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) throw new Error('No autorizado');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError) throw authError;

        const { nombre, titular, ubicacion, educacion, github, linkedin, avatar, banner, avatar_offset, banner_offset } = req.body;

        const { error } = await supabase
            .from('perfiles')
            .update({ nombre, titular, ubicacion, educacion, github, linkedin, avatar, banner, avatar_offset, banner_offset })
            .eq('id', user.id);

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

export default objetoRouter;
