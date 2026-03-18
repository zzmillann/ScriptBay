import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Github, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { postAuth, saveSession } from '../services/authClient';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        setIsLoading(true);
        setMensaje('');

        try {
            const data = await postAuth('/Login', { email, password });

            if (data.codigo !== 0) {
                setMensaje(data.mensaje || 'No se pudo iniciar sesión.');
                console.warn('[AUTH TRACE] login fallido ->', data);
                return;
            }

            saveSession({
                accessToken: data.accessToken,
                datosCliente: data.datosCliente
            });

            console.log('[AUTH TRACE] login correcto para:', data?.datosCliente?.email);
            setMensaje('Login correcto. Redirigiendo al perfil...');
            navigate('/profile');
        } catch (error) {
            console.error('[AUTH TRACE] error de red en login', error);
            setMensaje('Error de red al iniciar sesión. Revisa backend y consola.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-32">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card max-w-md w-full p-8 md:p-10"
            >
                <div className="text-center mb-10">
                    <div className="bg-linear-to-br from-primary to-accent p-3 rounded-2xl w-fit mx-auto mb-6">
                        <Terminal className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Bienvenido de Nuevo</h2>
                    <p className="text-white/40 font-normal">Continúa tu viaje en ScriptBay</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white/70 ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                className="input-field pl-12 h-12"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-bold text-white/70">Contraseña</label>
                            <a href="#" className="text-xs text-primary hover:underline">¿Olvidaste la clave?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="input-field pl-12 h-12"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="btn-primary w-full h-12 flex items-center justify-center gap-2 font-bold disabled:opacity-50">
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'} <ArrowRight className="w-4 h-4" />
                    </button>

                    {mensaje && (
                        <p className="text-center text-sm text-white/70">{mensaje}</p>
                    )}
                </form>

                <div className="mt-8">
                    <div className="relative flex items-center justify-center mb-6">
                        <div className="border-t border-glass-border w-full"></div>
                        <span className="absolute bg-darker px-4 text-xs text-white/30 uppercase tracking-widest">O continúa con</span>
                    </div>

                    <button className="flex items-center justify-center gap-3 w-full h-12 glass-card hover:bg-white/5 transition-all mb-8 font-bold">
                        <Github className="w-5 h-5" />
                        <span>GitHub</span>
                    </button>

                    <p className="text-center text-sm text-white/40 font-normal">
                        ¿No tienes cuenta? <Link to="/register" className="text-primary hover:underline font-bold">Crea una</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
