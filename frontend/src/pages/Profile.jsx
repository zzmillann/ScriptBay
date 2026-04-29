import React, { useEffect, useRef, useState } from 'react';
import { Camera, Github, Linkedin, MapPin, Move, Plus, Save, Trash2, Upload, User, Box, BriefcaseBusiness, BarChart3, TrendingUp, Pencil, Star, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getSession, getValidSession, saveSession } from '../services/authClient.js';
import { normalizeImageUrl } from '../utils/imageUrl.js';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
});

const getInitials = (name) => name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const parseApiResponse = async (response, defaultMessage) => {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const raw = await response.text();
        throw new Error(`${defaultMessage}. El servidor devolvió contenido no JSON.`);
    }

    return response.json();
};

const Profile = () => {
    const location = useLocation();
    const [form, setForm] = useState({ nombre: '', titular: '', ubicacion: '', educacion: [], github: '', linkedin: '' });
    const [nuevaEducacion, setNuevaEducacion] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerOffset, setBannerOffset] = useState({ x: 0, y: 0 });
    const [bannerZoom, setBannerZoom] = useState(1);
    const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
    const [draggingTarget, setDraggingTarget] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const dragDataRef = useRef({ target: null, startX: 0, startY: 0, originX: 0, originY: 0 });

    const [isDraggingBanner, setIsDraggingBanner] = useState(false);
    const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
    const [misProductos, setMisProductos] = useState([]);
    const [misCompras, setMisCompras] = useState([]);
    const [activeSection, setActiveSection] = useState('productos');
    const [catalogFilter, setCatalogFilter] = useState('productos');
    const user = getSession()?.datosCliente || {};

    const isServiceProduct = (product) => String(product?.tipo || '').toLowerCase() === 'servicio';
    const publishedCount = misProductos.filter((p) => !isServiceProduct(p)).length;
    const activeServicesCount = misProductos.filter(isServiceProduct).length;
    const purchases = user?.totalPurchases ?? 0;
    const salesCount = user?.totalSales ?? (publishedCount * 3);

    const mockRating = 4.6;
    const mockReviews = 12;
    const sellerRating = user?.rating ?? mockRating;
    const sellerReviews = user?.reviewsCount ?? mockReviews;
    const sellerSales = salesCount;
    const catalogItems = misProductos.filter((product) => {
        if (catalogFilter === 'servicios') return isServiceProduct(product);
        return !isServiceProduct(product);
    });

    const getActiveSession = async () => getValidSession();

    const cargarMisCompras = async () => {
        const session = await getActiveSession();
        if (!session?.accessToken) return;

        try {
            const response = await fetch('http://localhost:3000/api/productos/MisCompras', {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const data = await parseApiResponse(response, 'No se pudieron cargar tus compras');
            if (data.codigo === 0) setMisCompras(data.compras || []);
        } catch (error) {
            console.log(error);
        }
    };

    const cargarMisProductos = async () => {
        const session = await getActiveSession();
        if (!session?.accessToken) return;

        try {
            const response = await fetch('http://localhost:3000/api/productos/MisProductos', {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`
                }
            });
            const data = await parseApiResponse(response, 'No se pudieron cargar tus productos');
            if (data.codigo === 0) {
                setMisProductos(data.productos || []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const session = getSession();
        if (!session) return;
        const d = session.datosCliente;
        setForm({
            nombre: d.nombre || '',
            titular: d.titular || '',
            ubicacion: d.ubicacion || '',
            educacion: d.educacion || [],
            github: d.github || '',
            linkedin: d.linkedin || ''
        });
        if (d.avatar) {
            setAvatarUrl(d.avatar);
            setAvatarOffset(d.avatar_offset || { x: 0, y: 0 });
        }
        if (d.banner) {
            setBannerUrl(d.banner);
            setBannerOffset(d.banner_offset || { x: 0, y: 0 });
            setBannerZoom(Number(d.banner_zoom) || 1);
        }

        cargarMisProductos();
        cargarMisCompras();
    }, []);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab === 'editar' || tab === 'productos' || tab === 'compras') {
            setActiveSection(tab);
        }
    }, [location.search]);

    const handleEliminarProducto = async (idProducto) => {
        const session = await getActiveSession();
        if (!session?.accessToken) {
            setFeedback({ type: 'error', message: 'Debes iniciar sesión para eliminar productos.' });
            return;
        }

        const confirmado = window.confirm('¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.');
        if (!confirmado) return;

        try {
            const response = await fetch('http://localhost:3000/api/productos/EliminarProducto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({ id: idProducto })
            });
            const data = await parseApiResponse(response, 'No se pudo eliminar la publicación');

            if (data.codigo !== 0) {
                throw new Error(data.mensaje || 'No se pudo eliminar la publicación.');
            }

            setFeedback({ type: 'success', message: 'Publicación eliminada correctamente.' });
            setMisProductos((prev) => prev.filter((item) => String(item.id) !== String(idProducto)));
        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Error al eliminar publicación.' });
        }
    };

    useEffect(() => {
        const handleMouseMove = (event) => {
            const drag = dragDataRef.current;
            if (!drag.target) {
                return;
            }

            const nextX = drag.originX + (event.clientX - drag.startX);
            const nextY = drag.originY + (event.clientY - drag.startY);

            if (drag.target === 'banner') {
                setBannerOffset({ x: nextX, y: nextY });
            }

            if (drag.target === 'avatar') {
                setAvatarOffset({ x: nextX, y: nextY });
            }
        };

        const handleMouseUp = () => {
            dragDataRef.current = { target: null, startX: 0, startY: 0, originX: 0, originY: 0 };
            setDraggingTarget(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const onDragImageStart = (event, target) => {
        const origin = target === 'banner' ? bannerOffset : avatarOffset;
        dragDataRef.current = {
            target,
            startX: event.clientX,
            startY: event.clientY,
            originX: origin.x,
            originY: origin.y
        };
        setDraggingTarget(target);
    };

    const handleDragOver = (e, target) => {
        e.preventDefault();
        if (target === 'banner') setIsDraggingBanner(true);
        if (target === 'avatar') setIsDraggingAvatar(true);
    };

    const handleDragLeave = (e, target) => {
        e.preventDefault();
        if (target === 'banner') setIsDraggingBanner(false);
        if (target === 'avatar') setIsDraggingAvatar(false);
    };

    const onDropFile = async (event, target) => {
        event.preventDefault();
        if (target === 'banner') setIsDraggingBanner(false);
        if (target === 'avatar') setIsDraggingAvatar(false);
        
        const file = event.dataTransfer.files?.[0];

        if (!file || !file.type.startsWith('image/')) {
            setFeedback({ type: 'error', message: 'Solo se permiten imágenes para banner y foto de perfil.' });
            return;
        }

        try {
            const imageUrl = await readFileAsDataUrl(file);
            if (target === 'banner') {
                setBannerUrl(imageUrl);
                setBannerOffset({ x: 0, y: 0 });
                setBannerZoom(1);
            } else {
                setAvatarUrl(imageUrl);
                setAvatarOffset({ x: 0, y: 0 });
            }
            setFeedback({ type: 'success', message: 'Imagen lista para previsualizar. Arrástrala para encuadrar y guarda el perfil.' });
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        }
    };

    const onSelectFile = async (event, target) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        try {
            const imageUrl = await readFileAsDataUrl(file);
            if (target === 'banner') {
                setBannerUrl(imageUrl);
                setBannerOffset({ x: 0, y: 0 });
                setBannerZoom(1);
            } else {
                setAvatarUrl(imageUrl);
                setAvatarOffset({ x: 0, y: 0 });
            }
            setFeedback({ type: 'success', message: 'Imagen lista para previsualizar. Arrástrala para encuadrar y guarda el perfil.' });
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        } finally {
            event.target.value = '';
        }
    };

    const addEducacion = () => {
        const cleanedValue = nuevaEducacion.trim();
        if (!cleanedValue) {
            return;
        }

        setForm((prev) => ({ ...prev, educacion: [...prev.educacion, cleanedValue] }));
        setNuevaEducacion('');
    };

    const removeEducacion = (indexToDelete) => {
        setForm((prev) => ({
            ...prev,
            educacion: prev.educacion.filter((_, index) => index !== indexToDelete)
        }));
    };

    const HandlerGuardarPerfil = async () => {
        const session = await getActiveSession();
        if (!session) {
            setFeedback({ type: 'error', message: 'Debes iniciar sesión para guardar el perfil.' });
            return;
        }

        const payload = {
            nombre: form.nombre,
            titular: form.titular,
            ubicacion: form.ubicacion,
            educacion: form.educacion,
            github: form.github || '',
            linkedin: form.linkedin || '',
            avatar: avatarUrl || null,
            banner: bannerUrl || null,
            avatar_offset: avatarOffset,
            banner_offset: bannerOffset,
            banner_zoom: bannerZoom
        };

        const sessionPayload = {
            ...payload,
            banner_zoom: bannerZoom
        };

        try {
            const response = await fetch('http://localhost:3000/api/Cliente/ActualizarPerfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await parseApiResponse(response, 'No fue posible guardar el perfil');

            if (data.codigo !== 0) {
                setFeedback({ type: 'error', message: data.mensaje || 'No fue posible guardar el perfil.' });
                return;
            }

            saveSession({
                ...session,
                datosCliente: {
                    ...session.datosCliente,
                    ...sessionPayload
                }
            });

            setFeedback({ type: 'success', message: 'Perfil guardado correctamente.' });

        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Error inesperado al guardar el perfil.' });
        }
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
            <div className="glass-card overflow-hidden border-none">
                {activeSection === 'editar' && (
                <div className="relative">
                    <div
                        className={`relative h-56 sm:h-72 lg:h-80 overflow-hidden border-b border-zinc-200 dark:border-white/10 bg-linear-to-r from-primary/30 via-primary/20 to-accent/25 transition-all duration-300 ${isDraggingBanner ? 'brightness-75 outline outline-4 outline-primary -outline-offset-4' : ''}`}
                        onDragEnter={(event) => handleDragOver(event, 'banner')}
                        onDragOver={(event) => handleDragOver(event, 'banner')}
                        onDragLeave={(event) => handleDragLeave(event, 'banner')}
                        onDrop={(event) => onDropFile(event, 'banner')}
                    >
                        {isDraggingBanner && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-darker/50 backdrop-blur-sm pointer-events-none">
                                <span className="text-white font-bold bg-primary px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xl animate-bounce">
                                    <Upload className="w-5 h-5" /> Suelta aquí para previsualizar
                                </span>
                            </div>
                        )}
                        {bannerUrl && (
                            <>
                                <img
                                    src={bannerUrl}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-35 pointer-events-none"
                                    draggable={false}
                                />
                                <img
                                    src={bannerUrl}
                                    alt="Banner del perfil"
                                    className={`absolute inset-0 w-full h-full object-contain select-none ${draggingTarget === 'banner' ? 'cursor-grabbing' : 'cursor-grab'}`}
                                    style={{ transform: `translate(${bannerOffset.x}px, ${bannerOffset.y}px) scale(${bannerZoom})` }}
                                    onMouseDown={(event) => onDragImageStart(event, 'banner')}
                                    draggable={false}
                                />
                            </>
                        )}

                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-darker/70" />

                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
                            <label className="btn-secondary px-3 py-2 text-xs font-bold cursor-pointer">
                                <Upload className="w-4 h-4" /> Banner
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => onSelectFile(event, 'banner')} />
                            </label>
                        </div>

                        {bannerUrl && (
                            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 w-44 rounded-2xl bg-darker/65 backdrop-blur-md border border-white/10 px-3 py-2">
                                <div className="flex items-center justify-between text-[11px] text-white/80 mb-1.5">
                                    <span>Zoom del banner</span>
                                    <span>{Math.round(bannerZoom * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="2.2"
                                    step="0.05"
                                    value={bannerZoom}
                                    onChange={(event) => setBannerZoom(Number(event.target.value))}
                                    className="w-full accent-primary"
                                />
                            </div>
                        )}

                        <p className="absolute top-3 left-3 sm:top-4 sm:left-4 right-4 text-[11px] sm:text-xs text-subtle flex items-center gap-2">
                            <Move className="w-3 h-3" />
                            Arrastra una imagen o súbela y luego muévela para encuadrar.
                        </p>
                    </div>

                    <div className="px-6 sm:px-10 pb-8">
                        <div className="mt-4 sm:mt-5 flex flex-col md:flex-row gap-6 md:gap-8 md:items-end md:justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                                <div
                                    className={`relative -mt-10 sm:-mt-12 md:-mt-16 w-32 h-32 rounded-full overflow-hidden border-4 bg-linear-to-br from-primary to-accent transition-all duration-300 ${isDraggingAvatar ? 'border-primary outline outline-2 outline-primary outline-offset-2 brightness-75 bg-darker' : 'border-darker'}`}
                                    onDragEnter={(event) => handleDragOver(event, 'avatar')}
                                    onDragOver={(event) => handleDragOver(event, 'avatar')}
                                    onDragLeave={(event) => handleDragLeave(event, 'avatar')}
                                    onDrop={(event) => onDropFile(event, 'avatar')}
                                >
                                    {isDraggingAvatar && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-darker/60 backdrop-blur-sm pointer-events-none">
                                            <Upload className="w-8 h-8 text-primary animate-pulse" />
                                        </div>
                                    )}
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Foto de perfil"
                                            className={`absolute inset-0 w-full h-full object-contain select-none ${draggingTarget === 'avatar' ? 'cursor-grabbing' : 'cursor-grab'}`}
                                            style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
                                            onMouseDown={(event) => onDragImageStart(event, 'avatar')}
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold">{getInitials(form.nombre)}</div>
                                    )}
                                </div>

                                <div className="pb-2">
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{form.nombre || 'Tu nombre'}</h1>
                                    <p className="text-dimmed text-sm sm:text-base mt-1">{form.titular || 'Titular profesional'}</p>
                                    <div className="text-faint text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <input
                                            className="bg-transparent border-b border-zinc-300 dark:border-white/20 focus:border-primary/60 outline-hidden text-zinc-700 dark:text-white/80 placeholder:text-zinc-400 dark:placeholder:text-white/40 px-0.5 py-0.5 w-full max-w-xs"
                                            value={form.ubicacion}
                                            onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                                            placeholder="Sin ubicación"
                                        />
                                    </div>
                                </div>
                            </div>

                            <label className="btn-primary text-sm cursor-pointer flex items-center justify-center gap-2 w-full md:w-auto">
                                <Camera className="w-4 h-4" />
                                Cambiar foto
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => onSelectFile(event, 'avatar')} />
                            </label>
                        </div>
                    </div>
                </div>
                )}

                <div className="px-6 sm:px-10 pb-10">
                    {/* Barra de navegacion entre secciones del perfil */}
                    <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-white/10">
                        {[
                            { key: 'productos', label: 'Mis publicaciones', icon: <Box className="w-4 h-4" /> },
                            { key: 'compras',   label: 'Mis compras',       icon: <ShoppingBag className="w-4 h-4" /> },
                            { key: 'editar',    label: 'Editar perfil',     icon: <Pencil className="w-4 h-4" /> }
                        ].map(({ key, label, icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveSection(key)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px ${
                                    activeSection === key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-subtle hover:text-base-primary hover:border-zinc-400 dark:hover:border-white/30'
                                }`}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </div>
                    {activeSection === 'productos' && (
                        <div className="mb-8 sm:mb-10 rounded-3xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_top_left,rgba(255,26,26,0.18),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(28,0,0,0.24))] backdrop-blur-sm shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] px-4 sm:px-6 py-5 sm:py-6">
                            <div className="pointer-events-none absolute" />
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-start gap-5 lg:gap-6">
                                <div className="flex items-center gap-4 sm:gap-5">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-primary/35 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center text-xl font-bold text-base-primary shadow-[0_10px_26px_-16px_rgba(255,26,26,0.55)]">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Foto de perfil"
                                                className="w-full h-full object-cover"
                                                style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
                                            />
                                        ) : (
                                            <span>{getInitials(form.nombre || 'DEV RINK')}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1 mb-2">
                                            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-primary">Panel de vendedor</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-base-primary leading-tight">{form.nombre || 'DEV-RINK'}</h2>
                                        <p className="mt-1 text-sm font-medium text-zinc-200 dark:text-zinc-100">Automatizacion y sistemas que escalan tu negocio</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto lg:min-w-[560px] lg:ml-2 lg:mr-3">
                                    <div className="rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-default">
                                        <div className="flex items-center gap-2 text-faint text-xs">
                                            <Box className="w-3.5 h-3.5 text-zinc-300" />
                                            Productos
                                        </div>
                                        <p className="text-lg font-bold text-base-primary mt-1">{publishedCount}</p>
                                        <p className="text-[11px] text-dimmed">Publicados</p>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-default">
                                        <div className="flex items-center gap-2 text-faint text-xs">
                                            <BriefcaseBusiness className="w-3.5 h-3.5 text-zinc-300" />
                                            Servicios
                                        </div>
                                        <p className="text-lg font-bold text-base-primary mt-1">{activeServicesCount}</p>
                                        <p className="text-[11px] text-dimmed">Activos</p>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-default">
                                        <div className="flex items-center gap-2 text-faint text-xs">
                                            <BarChart3 className="w-3.5 h-3.5 text-zinc-300" />
                                            Compras
                                        </div>
                                        <p className="text-lg font-bold text-base-primary mt-1">{purchases}</p>
                                        <p className="text-[11px] text-dimmed">Realizadas</p>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-default">
                                        <div className="flex items-center gap-2 text-faint text-xs">
                                            <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
                                            Ventas
                                        </div>
                                        <p className="text-lg font-bold text-base-primary mt-1">{sellerSales}</p>
                                        <p className="text-[11px] text-dimmed">Totales</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'editar' && (
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                            <section className="space-y-6">
                                <div className="glass-card border-none p-6">
                                    <h2 className="text-xl font-bold mb-5">Editar perfil</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-dimmed block mb-2">Nombre de usuario</label>
                                    <input
                                        className="input-field"
                                        value={form.nombre}
                                        onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-dimmed block mb-2">Titular profesional</label>
                                    <input
                                        className="input-field"
                                        value={form.titular}
                                        onChange={(event) => setForm((prev) => ({ ...prev, titular: event.target.value }))}
                                        placeholder="Ej: Frontend Engineer"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs text-dimmed block mb-2">Ubicación</label>
                                    <input
                                        className="input-field"
                                        value={form.ubicacion}
                                        onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                                        placeholder="Ej: Madrid, España"
                                    />
                                </div>

                            </div>
                                </div>

                                <div className="glass-card border-none p-6">
                                    <h3 className="text-lg font-bold mb-4">Educación</h3>

                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <input
                                    className="input-field"
                                    value={nuevaEducacion}
                                    onChange={(event) => setNuevaEducacion(event.target.value)}
                                    placeholder="Ej: Máster en Ciberseguridad - UOC"
                                />
                                <button
                                    type="button"
                                    onClick={addEducacion}
                                    className="btn-primary text-sm flex items-center justify-center gap-2 sm:w-auto"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>

                            <div className="space-y-2">
                                {form.educacion.length === 0 && (
                                    <p className="text-sm text-faint">Aún no agregaste ítems de educación.</p>
                                )}

                                {form.educacion.map((item, index) => (
                                    <div key={`${item}-${index}`} className="bg-zinc-100 dark:bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                        <p className="text-sm text-base-primary">{item}</p>
                                        <button
                                            type="button"
                                            onClick={() => removeEducacion(index)}
                                            className="text-dimmed hover:text-primary transition-colors"
                                            aria-label={`Eliminar educación ${index + 1}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                                </div>
                            </section>

                            <aside className="space-y-6">
                                <div className="glass-card border-none p-6 space-y-4">
                                    <h3 className="text-lg font-bold">Enlaces opcionales</h3>

                            <div>
                                <label className="text-xs text-dimmed block mb-2">Repositorio GitHub (opcional)</label>
                                <div className="relative">
                                    <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                                    <input
                                        className="input-field pl-10"
                                        value={form.github}
                                        onChange={(event) => setForm((prev) => ({ ...prev, github: event.target.value }))}
                                        placeholder="https://github.com/tu-usuario"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-dimmed block mb-2">Perfil LinkedIn (opcional)</label>
                                <div className="relative">
                                    <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                                    <input
                                        className="input-field pl-10"
                                        value={form.linkedin}
                                        onChange={(event) => setForm((prev) => ({ ...prev, linkedin: event.target.value }))}
                                        placeholder="https://www.linkedin.com/in/tu-perfil"
                                    />
                                </div>
                            </div>
                                </div>

                                <div className="glass-card border-none p-6">
                                    <h3 className="text-lg font-bold mb-3">Vista rápida</h3>
                                    <div className="text-sm space-y-2 text-subtle">
                                        <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {form.nombre || 'Sin nombre'}</p>
                                        <p>{form.educacion.length} ítem(s) de educación</p>
                                        <p>GitHub: {form.github ? 'configurado' : 'no configurado'}</p>
                                        <p>LinkedIn: {form.linkedin ? 'configurado' : 'no configurado'}</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={HandlerGuardarPerfil}
                                        className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Guardar perfil
                                    </button>

                                    {feedback.message && (
                                        <p className={`text-xs mt-3 ${feedback.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {feedback.message}
                                        </p>
                                    )}
                                </div>
                            </aside>
                        </div>
                    )}

                    {activeSection === 'productos' && (
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,26,26,0.13),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] py-6 px-6 sm:py-7 sm:px-8 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)]">
                            <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-[3px] border-primary/50 bg-linear-to-br from-primary to-accent text-white flex items-center justify-center text-4xl font-bold shadow-[0_20px_50px_-18px_rgba(255,26,26,0.75)]">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Foto de perfil"
                                            className="w-full h-full object-contain"
                                            style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
                                        />
                                    ) : (
                                        <span>{getInitials(form.nombre || 'Usuario')}</span>
                                    )}
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-base-primary">{form.nombre || 'Tu nombre'}</p>
                                <p className="text-sm sm:text-base text-amber-300">⭐ {sellerRating} ({sellerReviews} valoraciones)</p>
                                {sellerReviews > 10 && <p className="text-xs text-emerald-400">✔ Vendedor verificado</p>}
                                <div className="mt-1 flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCatalogFilter('productos')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${catalogFilter === 'productos'
                                            ? 'border-primary/45 bg-primary/15 text-primary shadow-[0_0_18px_rgba(255,26,26,0.2)]'
                                            : 'border-zinc-300/70 dark:border-white/10 bg-zinc-100/85 dark:bg-white/5 text-subtle hover:border-primary/35 hover:text-primary'
                                        }`}
                                    >
                                        Productos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCatalogFilter('servicios')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${catalogFilter === 'servicios'
                                            ? 'border-primary/45 bg-primary/15 text-primary shadow-[0_0_18px_rgba(255,26,26,0.2)]'
                                            : 'border-zinc-300/70 dark:border-white/10 bg-zinc-100/85 dark:bg-white/5 text-subtle hover:border-primary/35 hover:text-primary'
                                        }`}
                                    >
                                        Servicios
                                    </button>
                                </div>
                            </div>

                            <div className="relative mt-5 sm:mt-6 rounded-2xl border border-white/[0.05] bg-white/85 dark:bg-black/30 backdrop-blur-md p-4 sm:p-6 shadow-[0_0_30px_rgba(255,0,80,0.15),0_0_60px_rgba(255,0,80,0.08)] transition-all duration-300 ease-out hover:shadow-[0_0_40px_rgba(255,0,80,0.25),0_0_80px_rgba(255,0,80,0.12)]">
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(255,0,80,0.05),transparent_70%)]" />
                                {catalogItems.length === 0 ? (
                                    <p className="text-faint text-sm text-center">
                                        {misProductos.length === 0
                                            ? 'Todavía no has publicado productos.'
                                            : `No hay ${catalogFilter} en tu catálogo todavía.`}
                                    </p>
                                ) : (
                                    <div className={catalogItems.length === 1 ? 'max-w-md mx-auto' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                                        {catalogItems.map((product) => {
                                            const imageUrl = normalizeImageUrl(product.imagen) || `https://picsum.photos/seed/profile-${product.id}/500/320`;
                                            const productType = String(product?.type ?? product?.tipo ?? '').toLowerCase();
                                            const isService = productType === 'service' || productType === 'servicio' || isServiceProduct(product);
                                            const toneHoverClass = isService
                                                ? 'hover:border-blue-500/45 hover:shadow-blue-500/30'
                                                : 'hover:border-purple-500/45 hover:shadow-purple-500/30';
                                            const productRating = Number(product?.rating_promedio ?? product?.rating ?? 4.8);
                                            const productReviews = Number(product?.total_resenas ?? product?.resenas ?? 12);
                                            const productBadge = product.id % 3 === 0 ? 'Top' : 'Nuevo';

                                            return (
                                                <article
                                                    key={product.id}
                                                    className={`group rounded-2xl overflow-hidden border border-zinc-300/70 dark:border-white/10 bg-white dark:bg-zinc-900/95 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg ${toneHoverClass}`}
                                                >
                                                    <Link to={`/producto/${product.id}`} className="block">
                                                        <div className="relative w-full h-44 bg-zinc-100 dark:bg-black overflow-hidden rounded-t-xl">
                                                            <img
                                                                src={imageUrl}
                                                                alt={product.titulo || 'Producto'}
                                                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                            />
                                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                                                            <span className="absolute top-2.5 right-2.5 rounded-full bg-red-500/20 text-red-200 text-[10px] px-2 py-1 border border-red-400/35 backdrop-blur-sm">
                                                                {productBadge}
                                                            </span>
                                                        </div>
                                                    </Link>

                                                    <div className="px-3 py-2 flex flex-col gap-1.5">
                                                        <Link to={`/producto/${product.id}`} className="block">
                                                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 min-h-10">
                                                                {product.titulo || 'Producto sin título'}
                                                            </h3>
                                                        </Link>

                                                        {product.descripcion && (
                                                            <p className="text-xs text-zinc-500/85 dark:text-zinc-400/80 line-clamp-2">{product.descripcion}</p>
                                                        )}

                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                            <span>{productRating.toFixed(1)} ({productReviews})</span>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xl font-semibold text-red-500 drop-shadow-[0_0_8px_rgba(255,59,59,0.35)]">{Number(product.precio ?? 0)}€</span>
                                                            <div className="flex gap-2">
                                                                <Link
                                                                    to={`/edit-product/${product.id}`}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-400/35 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:border-zinc-300/60 hover:text-zinc-100 transition-all duration-200"
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                    Editar
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEliminarProducto(product.id)}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/45 bg-red-500/75 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-red-500 hover:border-red-400/75 transition-all duration-200"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeSection === 'compras' && (
                        <div>
                            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" /> Mis compras
                            </h2>

                            {misCompras.length === 0 ? (
                                <div className="text-center py-16 text-faint">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p className="text-base">Todavía no has realizado ninguna compra.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {misCompras.map((compra) => (
                                        <div
                                            key={compra.id}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-base-primary truncate">{compra.titulo}</p>
                                                <p className="text-xs text-dimmed mt-0.5">
                                                    {new Date(compra.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {' · '}{compra.metodo_pago}
                                                    {' · '}<span className="font-mono text-zinc-400">{compra.id_transaccion?.slice(-10)}</span>
                                                </p>
                                                {compra.blockchain_hash && (
                                                    <p className="text-[11px] text-emerald-400 mt-0.5 truncate">
                                                        ⛓ {compra.blockchain_hash.slice(0, 20)}…
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xl font-bold text-primary shrink-0">{Number(compra.precio)}€</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
