import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, User, Settings, Menu, X, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clearSession, getSession, postAuth } from '../services/authClient';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [session, setSession] = useState(getSession());

    useEffect(() => {
        const refreshSession = () => {
            setSession(getSession());
        };

        window.addEventListener('storage', refreshSession);
        window.addEventListener('scriptbay-auth-changed', refreshSession);

        return () => {
            window.removeEventListener('storage', refreshSession);
            window.removeEventListener('scriptbay-auth-changed', refreshSession);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const data = await postAuth('/Logout', {});

            if (data.codigo !== 0) {
                console.warn('[AUTH TRACE] logout devolvió error de API ->', data);
            }

            clearSession();
            console.log('[AUTH TRACE] logout ejecutado');
        } catch (error) {
            console.error('[AUTH TRACE] error de red en logout', error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 my-4 border-none !rounded-2xl">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-bold tracking-tight">
                        Script<span className="gradient-text">Bay</span>
                    </span>
                </Link>

                {/* Desktop Search */}
                <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar servicios, scripts, plugins..."
                            className="input-field pl-10 h-10"
                        />
                    </div>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-4">
                    {session ? (
                        <>
                            <span className="hidden md:block text-sm text-white/70">{session?.datosCliente?.email || 'Sesión activa'}</span>
                            <button onClick={handleLogout} className="hidden md:block text-sm font-bold hover:text-primary transition-colors">
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hidden md:block text-sm font-bold hover:text-primary transition-colors">
                                Iniciar Sesión
                            </Link>
                            <Link to="/register" className="hidden md:block btn-primary text-sm py-2 px-4 shadow-none font-bold">
                                Unirse Ahora
                            </Link>
                        </>
                    )}
                    <Link to="/cart" className="p-2 hover:bg-white/5 rounded-xl transition-colors relative">
                        <ShoppingCart className="w-5 h-5 text-white/70" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                    </Link>
                    <Link to="/profile" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <User className="w-5 h-5 text-white/70" />
                    </Link>
                    <button
                        className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden px-6 pb-6 pt-2 border-t border-glass-border">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="input-field"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link to="/" className="p-3 hover:bg-white/5 rounded-xl transition-colors">Mercado</Link>
                        <Link to="/profile" className="p-3 hover:bg-white/5 rounded-xl transition-colors">Perfil</Link>
                        <Link to="/settings" className="p-3 hover:bg-white/5 rounded-xl transition-colors">Configuración</Link>
                        {session ? (
                            <button onClick={handleLogout} className="p-3 text-left hover:bg-white/5 rounded-xl transition-colors">Cerrar sesión</button>
                        ) : (
                            <>
                                <Link to="/login" className="p-3 hover:bg-white/5 rounded-xl transition-colors">Iniciar sesión</Link>
                                <Link to="/register" className="p-3 hover:bg-white/5 rounded-xl transition-colors">Registrarse</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
