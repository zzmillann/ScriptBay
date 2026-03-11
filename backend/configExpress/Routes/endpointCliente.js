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

export default objetoRouter;
