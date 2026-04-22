import React, { useEffect, useRef, useState } from 'react';
import { Search, ShoppingCart, Menu, X, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession, getSession, postAuth } from '../services/authClient';
import ProfilePreviewModal from './ProfilePreviewModal';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false);
    const [session, setSession] = useState(getSession());
    const avatarMenuRef = useRef(null);
    const navigate = useNavigate();

    const userData = session?.datosCliente || {};
    const username = userData.username || userData.nombre || userData.email?.split('@')[0] || 'Usuario';
    const avatarUrl = userData.avatarUrl || userData.avatar || '';
    const avatarInitial = username.charAt(0).toUpperCase();
    const productsPath = '/profile?tab=productos';

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
                setIsAvatarMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsAvatarMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const data = await postAuth('/Logout', {});

            if (data.codigo !== 0) {
                console.warn('[AUTH TRACE] logout devolvió error de API ->', data);
            }

            setIsAvatarMenuOpen(false);
            clearSession();
            console.log('[AUTH TRACE] logout ejecutado');
            navigate('/login');
        } catch (error) {
            console.error('[AUTH TRACE] error de red en logout', error);
        }
    };

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 my-4 border-none !rounded-2xl">
            <div className="max-w-7xl mx-auto px-8 lg:px-10 h-[76px] flex items-center gap-4 lg:gap-5">
                {/* IZQUIERDA: Logo + Publicar + Carrito */}
                <div className="hidden md:flex items-center gap-4 shrink-0">
                    <Link to="/" className="flex items-center gap-2 group shrink-0">
                        <span className="text-2xl lg:text-[1.75rem] font-bold tracking-tight leading-none">
                            Script<span className="gradient-text">Bay</span>
                        </span>
                    </Link>
                    <Link
                        to="/create-product"
                        className="btn-primary btn-shine text-base px-5 py-2.5 shadow-none border border-primary/40 bg-primary/15 shrink-0"
                    >
                        Publicar producto
                    </Link>
                    <Link to="/cart" className="icon-control relative w-12 h-12">
                        <ShoppingCart className="w-7 h-7 text-faint" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                    </Link>
                </div>

                {/* CENTRO: Búsqueda */}
                <div className="hidden md:block flex-1 min-w-0 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-faint w-4.5 h-4.5" />
                    <input
                        type="text"
                        placeholder="Buscar servicios, scripts, plugins..."
                        className="input-field pl-11 h-11 text-sm"
                    />
                </div>

                {/* DERECHA */}
                <div className="flex items-center gap-3 lg:gap-4 ml-auto">
                    <Link to="/" className="md:hidden flex items-center gap-2 group">
                        <span className="text-2xl font-bold tracking-tight leading-none">
                            Script<span className="gradient-text">Bay</span>
                        </span>
                    </Link>

                    {session ? null : (
                        <>
                            <Link to="/login" className="hidden md:block text-base link-primary">
                                Iniciar Sesión
                            </Link>
                            <Link to="/register" className="hidden md:block btn-primary text-base py-2.5 px-5 shadow-none font-bold">
                                Unirse Ahora
                            </Link>
                        </>
                    )}
                    {session ? (
                        <div className="relative" ref={avatarMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                                className="hidden md:flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm text-white transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_18px_rgba(255,30,80,0.25)]"
                                aria-label="Abrir menú de usuario"
                                aria-expanded={isAvatarMenuOpen}
                            >
                                <div className="text-right leading-tight max-w-[180px]">
                                    <p className="text-sm font-semibold text-base-primary truncate">{username}</p>
                                    <p className="text-xs text-subtle truncate">{session?.datosCliente?.email || 'Sesión activa'}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full border border-primary/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 font-bold transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_0_2px_rgba(255,40,80,0.45),0_0_24px_rgba(168,85,247,0.35)]">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={`Avatar de ${username}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg">{avatarInitial}</span>
                                    )}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                                className="md:hidden relative w-14 h-14 rounded-full border border-primary/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-white font-bold transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_0_2px_rgba(255,40,80,0.45),0_0_24px_rgba(168,85,247,0.35)]"
                                aria-label="Abrir menú de usuario"
                                aria-expanded={isAvatarMenuOpen}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={`Avatar de ${username}`} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg">{avatarInitial}</span>
                                )}
                            </button>

                            {isAvatarMenuOpen && (
                                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-darker/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.45)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-sm font-semibold text-base-primary truncate">{username}</p>
                                        <p className="text-xs text-faint truncate">{userData.email || 'Cuenta activa'}</p>
                                    </div>

                                    <div className="p-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAvatarMenuOpen(false);
                                                setIsProfilePreviewOpen(true);
                                            }}
                                            className="block w-full text-left rounded-xl px-3 py-2 text-sm text-base-secondary border border-transparent hover:border-primary/40 hover:bg-primary/12 hover:text-primary hover:shadow-[0_0_14px_rgba(255,30,80,0.18)] transition-all"
                                        >
                                            Ver perfil
                                        </button>
                                        <Link
                                            to="/profile?tab=editar"
                                            onClick={() => setIsAvatarMenuOpen(false)}
                                            className="block rounded-xl px-3 py-2 text-sm text-base-secondary hover:bg-primary/15 hover:text-primary transition-colors"
                                        >
                                            Editar perfil
                                        </Link>
                                        <Link
                                            to={productsPath}
                                            onClick={() => setIsAvatarMenuOpen(false)}
                                            className="block rounded-xl px-3 py-2 text-sm text-base-secondary hover:bg-primary/15 hover:text-primary transition-colors"
                                        >
                                            Mis productos
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                    {session && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-base-secondary border border-white/10 bg-black/20 hover:border-primary/40 hover:bg-primary/12 hover:text-primary hover:shadow-[0_0_14px_rgba(255,30,80,0.18)] transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    )}
                    <button
                        className="md:hidden icon-control text-base-primary"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden px-6 pb-6 pt-2 border-t border-zinc-200 dark:border-glass-border">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="input-field"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link to="/" className="menu-item">Mercado</Link>
                        <Link to="/create-product" className="menu-item">Publicar</Link>
                        <Link to="/profile" className="menu-item">Perfil</Link>
                        <Link to="/settings" className="menu-item">Configuración</Link>
                        {session ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setIsProfilePreviewOpen(true);
                                    }}
                                    className="menu-item text-left border border-transparent hover:border-primary/40 hover:bg-primary/12 hover:shadow-[0_0_14px_rgba(255,30,80,0.18)] transition-all"
                                >
                                    Ver perfil
                                </button>
                                <Link to="/profile?tab=editar" className="menu-item">Editar perfil</Link>
                                <Link to={productsPath} className="menu-item">Mis productos</Link>
                                <button onClick={handleLogout} className="menu-item text-left">Cerrar sesión</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="menu-item">Iniciar sesión</Link>
                                <Link to="/register" className="menu-item">Registrarse</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
        <ProfilePreviewModal isOpen={isProfilePreviewOpen} onClose={() => setIsProfilePreviewOpen(false)} session={session} />
        </>
    );
};

export default Navbar;
