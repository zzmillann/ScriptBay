import express from 'express';
const objetoRouter = express.Router();

objetoRouter.post('/Registro', async (req, res, next) => {
    try {
        // 1º extraer del body los datos del formulario: const { email, password, nombre } = req.body;
        // 2º crear el usuario en supabase auth (guarda en auth.users de postgres):
        //    const { data, error } = await supabase.auth.signUp({ email, password });
        //    if (error) throw new Error(error.message);
        // 3º si tienes tabla propia 'perfiles' para datos extra (nombre, avatar...):
        //    await supabase.from('perfiles').insert({ id: data.user.id, nombre });
        // 4º supabase manda el email de confirmacion automaticamente si lo tienes activado en el dashboard
        // 5º enviar respuesta al cliente react:
        //    res.status(200).send({ codigo: 0, mensaje: 'Registro ok, revisa tu email' });
    } catch (error) {
        console.log(`error en registro: ${error}`);
        res.status(200).send({ codigo: 1, mensaje: `error en registro: ${error}` });
    }
});

objetoRouter.post('/Login', async (req, res, next) => {
    try {
        // 1º extraer del body: const { email, password } = req.body;
        // 2º autenticar con supabase (comprueba contra auth.users de postgres):
        //    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        //    if (error) throw new Error(error.message);
        // 3º de la respuesta sacas el token JWT y los datos del usuario:
        //    const { session, user } = data;
        //    session.access_token  <-- JWT para mandarlo al cliente react y guardarlo en el state global
        // 4º si tienes tabla 'perfiles' para datos extra, haces un select:
        //    const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
        // 5º enviar respuesta al cliente react con datos del usuario y el token:
        //    res.status(200).send({ codigo: 0, mensaje: 'Login ok', datosCliente: { ...user, ...perfil }, accessToken: session.access_token });
    } catch (error) {
        console.log(`error en login: ${error}`);
        res.status(200).send({ codigo: 2, mensaje: `error en login: ${error}` });
    }
});

objetoRouter.post('/Logout', async (req, res, next) => {
    try {
        // 1º cerrar la sesion en supabase (invalida el token JWT en el servidor):
        //    const { error } = await supabase.auth.signOut();
        //    if (error) throw new Error(error.message);
        // 2º enviar respuesta al cliente react para que limpie el state global y el localStorage:
        //    res.status(200).send({ codigo: 0, mensaje: 'Logout ok' });
    } catch (error) {
        console.log(`error en logout: ${error}`);
        res.status(200).send({ codigo: 3, mensaje: `error en logout: ${error}` });
    }
});

export default objetoRouter;
