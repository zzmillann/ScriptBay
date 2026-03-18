import React, { useEffect, useRef, useState } from 'react';
import { Camera, Github, Linkedin, MapPin, Move, Plus, Save, Trash2, Upload, User } from 'lucide-react';

const initialForm = {
    nombre: 'Juan Perez',
    titular: 'Desarrollador Full Stack',
    ubicacion: 'Madrid, Espana',
    educacion: ['Grado en Ingenieria Informatica - UPM'],
    github: '',
    linkedin: ''
};

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
    const [form, setForm] = useState(initialForm);
    const [nuevaEducacion, setNuevaEducacion] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerOffset, setBannerOffset] = useState({ x: 0, y: 0 });
    const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
    const [draggingTarget, setDraggingTarget] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const dragDataRef = useRef({ target: null, startX: 0, startY: 0, originX: 0, originY: 0 });

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

    const onDropFile = async (event, target) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];

        if (!file || !file.type.startsWith('image/')) {
            setFeedback({ type: 'error', message: 'Solo se permiten imagenes para banner y foto de perfil.' });
            return;
        }

        try {
            const imageUrl = await readFileAsDataUrl(file);
            if (target === 'banner') {
                setBannerUrl(imageUrl);
                setBannerOffset({ x: 0, y: 0 });
            } else {
                setAvatarUrl(imageUrl);
                setAvatarOffset({ x: 0, y: 0 });
            }
            setFeedback({ type: 'success', message: 'Imagen actualizada. Arrastrala para ajustar su posicion.' });
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
            } else {
                setAvatarUrl(imageUrl);
                setAvatarOffset({ x: 0, y: 0 });
            }
            setFeedback({ type: 'success', message: 'Imagen actualizada. Arrastrala para ajustar su posicion.' });
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

    const handleSave = async () => {
        const payload = {
            name: form.nombre,
            title: form.titular,
            location: form.ubicacion,
            education: form.educacion,
            github: form.github || '',
            linkedin: form.linkedin || '',
            avatar: avatarUrl || null,
            banner: bannerUrl || null,
            avatarOffset,
            bannerOffset
        };

        try {
            console.log('[PROFILE TRACE] Enviando datos a /CambiarPerfil ->', payload);

            const response = await fetch('http://localhost:3000/CambiarPerfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('[PROFILE TRACE] Respuesta de /CambiarPerfil <-', data);

            if (response.ok) {
                setFeedback({ type: 'success', message: 'Perfil guardado correctamente.' });
            } else {
                setFeedback({ type: 'error', message: data?.mensaje || 'No fue posible guardar el perfil.' });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Error inesperado al guardar el perfil.' });
        }
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
            <div className="glass-card overflow-hidden border-none">
                <div className="relative">
                    <div
                        className="relative h-40 sm:h-48 overflow-hidden border-b border-white/10 bg-linear-to-r from-primary/30 via-primary/20 to-accent/25"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => onDropFile(event, 'banner')}
                    >
                        {bannerUrl && (
                            <img
                                src={bannerUrl}
                                alt="Banner del perfil"
                                className={`absolute inset-0 w-full h-full object-cover select-none ${draggingTarget === 'banner' ? 'cursor-grabbing' : 'cursor-grab'}`}
                                style={{ transform: `translate(${bannerOffset.x}px, ${bannerOffset.y}px) scale(1.05)` }}
                                onMouseDown={(event) => onDragImageStart(event, 'banner')}
                                draggable={false}
                            />
                        )}

                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-darker/70" />

                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
                            <label className="glass-card border-none px-3 py-2 text-xs font-bold cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Banner
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => onSelectFile(event, 'banner')} />
                            </label>
                        </div>

                        <p className="absolute top-3 left-3 sm:top-4 sm:left-4 right-4 text-[11px] sm:text-xs text-white/70 flex items-center gap-2">
                            <Move className="w-3 h-3" />
                            Arrastra una imagen o subela y luego muevela para encuadrar.
                        </p>
                    </div>

                    <div className="px-6 sm:px-10 pb-8">
                        <div className="mt-4 sm:mt-5 flex flex-col md:flex-row gap-6 md:gap-8 md:items-end md:justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                                <div
                                    className="relative -mt-10 sm:-mt-12 md:-mt-16 w-32 h-32 rounded-full overflow-hidden border-4 border-darker bg-linear-to-br from-primary to-accent"
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => onDropFile(event, 'avatar')}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Foto de perfil"
                                            className={`absolute inset-0 w-full h-full object-cover select-none ${draggingTarget === 'avatar' ? 'cursor-grabbing' : 'cursor-grab'}`}
                                            style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px) scale(1.1)` }}
                                            onMouseDown={(event) => onDragImageStart(event, 'avatar')}
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold">{getInitials(form.nombre)}</div>
                                    )}
                                </div>

                                <div className="pb-2">
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{form.nombre || 'Tu nombre'}</h1>
                                    <p className="text-white/60 text-sm sm:text-base mt-1">{form.titular || 'Titular profesional'}</p>
                                    <div className="text-white/45 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <input
                                            className="bg-transparent border-b border-white/20 focus:border-primary/60 outline-hidden text-white/80 placeholder:text-white/40 px-0.5 py-0.5 w-full max-w-xs"
                                            value={form.ubicacion}
                                            onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                                            placeholder="Sin ubicacion"
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
                                    <label className="text-xs text-white/50 block mb-2">Nombre de usuario</label>
                                    <input
                                        className="input-field"
                                        value={form.nombre}
                                        onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                                        placeholder="Ej: Juan Perez"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-white/50 block mb-2">Titular profesional</label>
                                    <input
                                        className="input-field"
                                        value={form.titular}
                                        onChange={(event) => setForm((prev) => ({ ...prev, titular: event.target.value }))}
                                        placeholder="Ej: Frontend Engineer"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs text-white/50 block mb-2">Ubicacion</label>
                                    <input
                                        className="input-field"
                                        value={form.ubicacion}
                                        onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                                        placeholder="Ej: Madrid, Espana"
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="glass-card border-none p-6">
                            <h3 className="text-lg font-bold mb-4">Educacion</h3>

                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <input
                                    className="input-field"
                                    value={nuevaEducacion}
                                    onChange={(event) => setNuevaEducacion(event.target.value)}
                                    placeholder="Ej: Master en Ciberseguridad - UOC"
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
                                    <p className="text-sm text-white/40">Aun no agregaste items de educacion.</p>
                                )}

                                {form.educacion.map((item, index) => (
                                    <div key={`${item}-${index}`} className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                        <p className="text-sm text-white/90">{item}</p>
                                        <button
                                            type="button"
                                            onClick={() => removeEducacion(index)}
                                            className="text-white/60 hover:text-primary transition-colors"
                                            aria-label={`Eliminar educacion ${index + 1}`}
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
                                <label className="text-xs text-white/50 block mb-2">Repositorio GitHub (opcional)</label>
                                <div className="relative">
                                    <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input
                                        className="input-field pl-10"
                                        value={form.github}
                                        onChange={(event) => setForm((prev) => ({ ...prev, github: event.target.value }))}
                                        placeholder="https://github.com/tu-usuario"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/50 block mb-2">Perfil LinkedIn (opcional)</label>
                                <div className="relative">
                                    <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
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
                            <h3 className="text-lg font-bold mb-3">Vista rapida</h3>
                            <div className="text-sm space-y-2 text-white/70">
                                <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {form.nombre || 'Sin nombre'}</p>
                                <p>{form.educacion.length} item(s) de educacion</p>
                                <p>GitHub: {form.github ? 'configurado' : 'no configurado'}</p>
                                <p>LinkedIn: {form.linkedin ? 'configurado' : 'no configurado'}</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSave}
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
        </div>
    );
};

export default Profile;
