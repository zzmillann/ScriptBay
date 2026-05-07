import React, { useEffect, useRef, useState } from 'react';
import { Search, ShoppingCart, Menu, X, LogOut, User, LayoutDashboard, Plus, Pencil, Heart, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession, getSession, postAuth } from '../services/authClient';
import ProfilePreviewModal from './ProfilePreviewModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWishlist } from '../context/WishlistContext';

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
    const { wishlist } = useWishlist();

    useEffect(() => {
        const refreshSession = () => setSession(getSession());
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
            if (event.key === 'Escape') setIsAvatarMenuOpen(false);
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
            <nav className="fixed top-0 left-0 right-0 z-50 mx-3 mt-3">
                <div className="bg-white dark:bg-[#121212] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_6px_24px_-4px_rgba(0,0,0,0.14)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_4px_28px_rgba(0,0,0,0.8)]">
                    <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center gap-5">

                        {/* IZQUIERDA: Logo */}
                        <Link to="/" className="shrink-0 flex items-center">
                            <span className="text-xl lg:text-2xl font-bold tracking-tight leading-none">
                                Script<span className="gradient-text">Bay</span>
                            </span>
                        </Link>

                        {/* CENTRO: Búsqueda */}
                        <div className="hidden md:block flex-1 min-w-0 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar servicios, scripts, plugins..."
                                className="input-field pl-10 h-10 text-sm"
                            />
                        </div>

                        {/* DERECHA: acciones + avatar */}
                        <div className="flex items-center gap-2 lg:gap-3 ml-auto">

                            {/* Wallet Connect - Clean & Modern */}
                            <div className="hidden sm:block scale-90 origin-right">
                                <ConnectButton
                                    showBalance={false}
                                    accountStatus="avatar"
                                    chainStatus="icon"
                                    label="Conectar Wallet"

                                />
                            </div>

                            {/* Móvil: logo centrado */}
                            <Link to="/" className="md:hidden flex items-center">
                                <span className="text-xl font-bold tracking-tight leading-none">
                                    Script<span className="gradient-text">Bay</span>
                                </span>
                            </Link>

                            {/* Sin sesión */}
                            {!session && (
                                <>
                                    <Link to="/login" className="hidden md:block text-sm link-primary px-2 py-1.5">
                                        Iniciar sesión
                                    </Link>
                                    <Link to="/register" className="hidden md:block btn-primary text-sm px-4 py-2">
                                        Unirse
                                    </Link>
                                </>
                            )}

                            {/* Con sesión */}
                            {session && (
                                <>
                                    {/* Publicar producto — menos dominante */}
                                    <Link
                                        to="/create-product"
                                        className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50 bg-transparent dark:bg-transparent text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Publicar
                                    </Link>

                                    {/* Favoritos */}
                                    <Link
                                        to="/wishlist"
                                        className="icon-control relative flex items-center justify-center w-9 h-9"
                                        aria-label="Mis favoritos"
                                    >
                                        <Heart className="w-[18px] h-[18px] text-faint" />
                                        {wishlist.length > 0 && (
                                            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[10px] font-bold bg-primary text-white rounded-full leading-none">
                                                {wishlist.length > 99 ? '99+' : wishlist.length}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Carrito */}
                                    <Link
                                        to="/cart"
                                        className="icon-control relative flex items-center justify-center w-9 h-9"
                                        aria-label="Carrito de compras"
                                    >
                                        <ShoppingCart className="w-[18px] h-[18px] text-faint" />
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                                    </Link>

                                    {/* Avatar + dropdown */}
                                    <div className="relative" ref={avatarMenuRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                                            className="w-9 h-9 rounded-full border border-zinc-300/70 dark:border-zinc-700/70 overflow-hidden flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-sm transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-[0_0_0_2px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_0_2px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                            aria-label="Abrir menú de usuario"
                                            aria-expanded={isAvatarMenuOpen}
                                        >
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={`Avatar de ${username}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{avatarInitial}</span>
                                            )}
                                        </button>

                                        {isAvatarMenuOpen && (
                                            <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#181818] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_16px_40px_-8px_rgba(0,0,0,0.14)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.7)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                                                {/* Cabecera */}
                                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80">
                                                    <p className="text-sm font-semibold text-base-primary truncate">{username}</p>
                                                    <p className="text-xs text-faint truncate mt-0.5">{userData.email || 'Cuenta activa'}</p>
                                                </div>

                                                {/* Opciones principales */}
                                                <div className="p-1.5 flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAvatarMenuOpen(false);
                                                            setIsProfilePreviewOpen(true);
                                                        }}
                                                        className="flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                    >
                                                        <User className="w-4 h-4 shrink-0 text-faint" />
                                                        Perfil / Cuenta
                                                    </button>
                                                    <Link
                                                        to="/profile?tab=editar"
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                    >
                                                        <Pencil className="w-4 h-4 shrink-0 text-faint" />
                                                        Editar perfil
                                                    </Link>
                                                    <Link
                                                        to={productsPath}
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4 shrink-0 text-faint" />
                                                        Mis productos
                                                    </Link>
                                                    <Link
                                                        to="/dashboard"
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                    >
                                                        <BarChart3 className="w-4 h-4 shrink-0 text-faint" />
                                                        Dashboard ventas
                                                    </Link>
                                                </div>

                                                {/* Separador */}
                                                <div className="mx-3 border-t border-zinc-100 dark:border-zinc-800/80" />

                                                {/* Cerrar sesión */}
                                                <div className="p-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500 transition-all duration-150 hover:bg-red-50/80 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                                                    >
                                                        <LogOut className="w-4 h-4 shrink-0" />
                                                        Cerrar sesión
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Hamburguesa móvil */}
                            <button
                                type="button"
                                className="md:hidden icon-control flex items-center justify-center w-9 h-9 text-base-primary"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Menú móvil */}
                    {isMenuOpen && (
                        <div className="md:hidden px-5 pb-5 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                            <div className="relative mb-3">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="input-field pl-10 h-10 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Link to="/" className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Mercado</Link>
                                {session && (
                                    <>
                                        <Link to="/create-product" className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Publicar producto</Link>
                                        <Link to="/cart" className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Carrito</Link>
                                        <button
                                            type="button"
                                            onClick={() => { setIsMenuOpen(false); setIsProfilePreviewOpen(true); }}
                                            className="menu-item text-sm text-left"
                                        >
                                            Perfil / Cuenta
                                        </button>
                                        <Link to="/profile?tab=editar" className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Editar perfil</Link>
                                        <Link to={productsPath} className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Mis productos</Link>
                                        <div className="my-1 border-t border-zinc-200/60 dark:border-white/[0.07]" />
                                        <button
                                            type="button"
                                            onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                            className="menu-item text-sm text-left text-zinc-500 dark:text-white/40 hover:text-red-600 dark:hover:text-primary"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </>
                                )}
                                {!session && (
                                    <>
                                        <Link to="/login" className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Iniciar sesión</Link>
                                        <Link to="/register" className="menu-item text-sm" onClick={() => setIsMenuOpen(false)}>Registrarse</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            <ProfilePreviewModal isOpen={isProfilePreviewOpen} onClose={() => setIsProfilePreviewOpen(false)} session={session} />
        </>
    );
};

export default Navbar;
