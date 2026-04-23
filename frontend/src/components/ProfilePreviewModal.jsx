import React, { useEffect, useMemo, useState } from 'react';
import { Github, GraduationCap, Linkedin, MapPin, Package, User, X } from 'lucide-react';

const getInitials = (value) => {
    if (!value) return 'U';

    return value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'U';
};

const withHttps = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const ProfilePreviewModal = ({ isOpen, onClose, session }) => {
    const [productos, setProductos] = useState([]);
    const [isLoadingProductos, setIsLoadingProductos] = useState(false);

    const user = session?.datosCliente || {};
    const username = useMemo(
        () => user.username || user.nombre || user.email?.split('@')[0] || 'Usuario',
        [user]
    );
    const bannerUrl = user.banner || '';
    const avatarUrl = user.avatar || user.avatarUrl || '';
    const bannerOffset = user.banner_offset || { x: 0, y: 0 };
    const avatarOffset = user.avatar_offset || { x: 0, y: 0 };
    const bannerZoom = Number(user.banner_zoom) || 1;
    const educacion = Array.isArray(user.educacion) ? user.educacion : [];
    const githubUrl = withHttps(user.github || '');
    const linkedinUrl = withHttps(user.linkedin || '');

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !session?.accessToken) return;

        const controller = new AbortController();

        const cargarProductos = async () => {
            try {
                setIsLoadingProductos(true);
                const response = await fetch('http://localhost:3000/api/productos/MisProductos', {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    },
                    signal: controller.signal
                });
                const data = await response.json();

                if (data.codigo === 0 && Array.isArray(data.productos)) {
                    setProductos(data.productos);
                } else {
                    setProductos([]);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setProductos([]);
                }
            } finally {
                setIsLoadingProductos(false);
            }
        };

        cargarProductos();

        return () => controller.abort();
    }, [isOpen, session]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md p-4 sm:p-8"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="mx-auto h-full max-w-6xl flex items-center justify-center">
                <div className="w-full max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center mb-5 sm:mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mt-1">Vista previa de perfil</h2>
                        <p className="text-base sm:text-lg text-white mt-1">Así es como otros usuarios ven este perfil en ScriptBay.</p>
                    </div>

                    <div className="group relative w-full rounded-3xl overflow-hidden border border-white/10 bg-darker/95 shadow-[0_25px_80px_-28px_rgba(255,30,80,0.4),0_10px_40px_-20px_rgba(168,85,247,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_34px_110px_-34px_rgba(255,30,80,0.6),0_20px_56px_-24px_rgba(168,85,247,0.5)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full border border-white/15 bg-black/40 text-white/80 hover:text-white hover:border-primary/60 hover:shadow-[0_0_18px_rgba(255,30,80,0.45)] transition-all"
                        aria-label="Cerrar vista previa de perfil"
                    >
                        <X className="w-5 h-5 mx-auto" />
                    </button>

                    <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden border-b border-zinc-200 dark:border-white/10 bg-linear-to-r from-primary/30 via-primary/20 to-accent/25 transition-all duration-300">
                        {bannerUrl ? (
                            <>
                                <img
                                    src={bannerUrl}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 pointer-events-none"
                                />
                                <img
                                    src={bannerUrl}
                                    alt={`Banner de ${username}`}
                                    className="absolute inset-0 w-full h-full object-contain select-none"
                                    style={{ transform: `translate(${bannerOffset.x}px, ${bannerOffset.y}px) scale(${bannerZoom})` }}
                                />
                            </>
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
                    </div>

                    <div className="px-6 sm:px-10 pb-10">
                        <div className="mt-4 sm:mt-5 flex flex-col md:flex-row gap-6 md:gap-8 md:items-end md:justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                                <div className="relative -mt-10 sm:-mt-12 md:-mt-16 w-32 h-32 rounded-full overflow-hidden border-4 border-darker bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-4xl font-bold">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={`Avatar de ${username}`}
                                            className="w-full h-full object-contain"
                                            style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
                                        />
                                    ) : (
                                        <span>{getInitials(username)}</span>
                                    )}
                                </div>

                                <div className="pb-2">
                                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-primary">{username}</h2>
                                    <p className="text-dimmed text-sm sm:text-base mt-1">{user.titular || 'Titular profesional'}</p>
                                    <div className="text-faint text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{user.ubicacion || 'Sin ubicación'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                            <section className="space-y-6">
                                <div className="glass-card border-none p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,80,0.15),0_0_18px_rgba(168,85,247,0.15)] hover:border-primary/30">
                                    <h3 className="text-xl font-bold mb-5">Perfil público</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-dimmed block mb-2">Nombre de usuario</label>
                                            <input className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-zinc-700 dark:text-white/90" value={username} disabled readOnly />
                                        </div>

                                        <div>
                                            <label className="text-xs text-dimmed block mb-2">Titular profesional</label>
                                            <input className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-zinc-700 dark:text-white/90" value={user.titular || ''} disabled readOnly placeholder="Sin titular" />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="text-xs text-dimmed block mb-2">Ubicación</label>
                                            <input className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-zinc-700 dark:text-white/90" value={user.ubicacion || ''} disabled readOnly placeholder="Sin ubicación" />
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card border-none p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,80,0.15),0_0_18px_rgba(168,85,247,0.15)] hover:border-primary/30">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-primary" /> Educación
                                    </h3>

                                    {educacion.length > 0 ? (
                                        <div className="space-y-2">
                                            {educacion.map((item, index) => (
                                                <div key={`${item}-${index}`} className="bg-zinc-100 dark:bg-white/5 rounded-xl px-4 py-3">
                                                    <p className="text-sm text-base-primary">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-faint">Aún no hay formación añadida.</p>
                                    )}
                                </div>
                            </section>

                            <aside className="space-y-6">
                                <div className="glass-card border-none p-6 space-y-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,80,0.15),0_0_18px_rgba(168,85,247,0.15)] hover:border-primary/30">
                                    <h3 className="text-lg font-bold">Enlaces</h3>

                                    <div>
                                        <label className="text-xs text-dimmed block mb-2">Repositorio GitHub</label>
                                        <div className="relative">
                                            <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                                            {githubUrl ? (
                                                <a
                                                    href={githubUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="input-field pl-10 flex items-center"
                                                >
                                                    {user.github}
                                                </a>
                                            ) : (
                                                <input className="input-field pl-10" value="" disabled readOnly placeholder="No configurado" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-dimmed block mb-2">Perfil LinkedIn</label>
                                        <div className="relative">
                                            <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                                            {linkedinUrl ? (
                                                <a
                                                    href={linkedinUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="input-field pl-10 flex items-center"
                                                >
                                                    {user.linkedin}
                                                </a>
                                            ) : (
                                                <input className="input-field pl-10" value="" disabled readOnly placeholder="No configurado" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card border-none p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,80,0.15),0_0_18px_rgba(168,85,247,0.15)] hover:border-primary/30">
                                    <h3 className="text-lg font-bold mb-3">Vista rápida</h3>
                                    <div className="text-sm space-y-2 text-subtle">
                                        <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {username}</p>
                                        <p>{educacion.length} ítem(s) de educación</p>
                                        <p>GitHub: {user.github ? 'configurado' : 'no configurado'}</p>
                                        <p>LinkedIn: {user.linkedin ? 'configurado' : 'no configurado'}</p>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <div className="mt-8 glass-card border-none p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,80,0.15),0_0_18px_rgba(168,85,247,0.15)] hover:border-primary/30">
                            <h3 className="text-lg font-bold text-base-primary flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-primary" />
                                Productos publicados
                            </h3>

                            {isLoadingProductos ? (
                                <p className="text-sm text-faint">Cargando productos...</p>
                            ) : productos.length > 0 ? (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {productos.map((producto) => (
                                        <article key={producto.id} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                                            <p className="text-sm font-semibold text-base-primary line-clamp-1">{producto.titulo || 'Producto sin título'}</p>
                                            <p className="text-xs text-faint mt-1">
                                                {(producto.categoria || 'General')} · {typeof producto.precio === 'number' ? `${producto.precio}€` : 'Precio no definido'}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-faint">Este usuario aún no tiene productos publicados.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default ProfilePreviewModal;
