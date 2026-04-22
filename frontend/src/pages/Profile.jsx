import React, { useEffect, useRef, useState } from 'react';
import { Camera, Github, Linkedin, MapPin, Move, Plus, Save, Trash2, Upload, User } from 'lucide-react';
import { getSession, saveSession } from '../services/authClient.js';
import ProductCard from '../components/ProductCard.jsx';

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

const Profile = () => {
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

        const cargarMisProductos = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/productos/MisProductos', {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                });
                const data = await response.json();
                if (data.codigo === 0) {
                    setMisProductos(data.productos);
                }
            } catch (error) {
                console.log(error);
            }
        };
        cargarMisProductos();
    }, []);

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
        const session = getSession();
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
            banner_offset: bannerOffset
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

            const data = await response.json();

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

                <div className="px-6 sm:px-10 pb-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
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
            </div>

            <div className="mt-10 px-6 sm:px-10 pb-10">
                <h2 className="text-2xl font-bold mb-1 text-base-primary">Mis productos publicados</h2>
                <p className="text-sm text-subtle mb-6">Aquí aparecen los productos que tú has creado para vender en el marketplace.</p>
                {misProductos.length === 0 ? (
                    <p className="text-faint text-sm">Todavía no has publicado productos.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {misProductos.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.titulo}
                                category={product.categoria || product.tipo}
                                price={product.precio ?? 0}
                                rating={0}
                                reviews={0}
                                image={product.imagen}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
