import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock3, Gavel, Plus, Radio, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubastaCard from '../components/SubastaCard';
import { getSubastas } from '../services/subastasClient';

const POLL_INTERVAL_MS = 15_000; // Refresca la lista cada 15 s para tener datos frescos

const Subastas = () => {
    const [subastas, setSubastas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError]   = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

    const cargar = useCallback(async () => {
        try {
            const data = await getSubastas();
            if (data.codigo === 0) {
                setSubastas(data.subastas);
                setUltimaActualizacion(new Date());
                setError(null);
            } else {
                setError(data.mensaje || 'Error al cargar subastas');
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        const interval = setInterval(cargar, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [cargar]);

    const handleExpire = useCallback(() => {
        // Cuando una subasta expira en cliente, refrescamos la lista
        setTimeout(cargar, 1500);
    }, [cargar]);

    const totalPujas = subastas.reduce((acc, item) => acc + Number(item.total_pujas || 0), 0);
    const mediaPujas = subastas.length > 0 ? (totalPujas / subastas.length).toFixed(1) : '0.0';
    const endingSoon = subastas
        .filter((item) => item?.fecha_fin)
        .sort((a, b) => new Date(a.fecha_fin).getTime() - new Date(b.fecha_fin).getTime())
        .slice(0, 4);
    const liveFeed = endingSoon.map((item, index) => {
        const titulo = item?.productos?.titulo || item?.titulo || `Subasta #${item.id}`;
        return {
            id: item.id || index,
            title: titulo,
            pujas: Number(item.total_pujas || 0),
            price: Number(item.precio_actual || item.precio_salida || 0),
        };
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 mt-16 min-h-screen">

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="glass-card relative overflow-hidden p-6 sm:p-8 mb-8"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,26,26,0.14),transparent_42%)]" />
                <div className="pointer-events-none absolute inset-y-0 left-[34%] hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />
                <div className="pointer-events-none absolute inset-y-0 left-[72%] hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

                <div className="relative z-10 grid gap-7 lg:grid-cols-[1.05fr_1fr_auto] lg:items-center">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-300 shadow-[0_0_18px_rgba(239,68,68,0.22)]">
                                <Gavel className="h-6 w-6" />
                            </span>
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                                    Live Market
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-primary">Subastas en vivo</h1>
                            </div>
                        </div>

                        <p className="text-subtle text-sm max-w-xl leading-relaxed">
                            Mercado en tiempo real para activos digitales premium. Pujas activas, cierres dinámicos y ejecución continua.
                        </p>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            <div className="ds-hover-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Subastas activas</p>
                                <p className="mt-1 text-lg font-semibold text-zinc-100">{subastas.length}</p>
                            </div>
                            <div className="ds-hover-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Pujas en curso</p>
                                <p className="mt-1 text-lg font-semibold text-zinc-100">{totalPujas}</p>
                            </div>
                            <div className="ds-hover-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Media por subasta</p>
                                <p className="mt-1 text-lg font-semibold text-zinc-100">{mediaPujas}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative min-h-[180px] rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950/70 via-zinc-900/45 to-black/40 p-4 sm:p-5">
                        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_18%_14%,rgba(255,26,26,0.16),transparent_40%)]" />
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                                <Activity className="h-3.5 w-3.5 text-red-300" /> Actividad reciente
                            </div>

                            <div className="mt-4 space-y-2">
                                {liveFeed.length === 0 && (
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-500">
                                        Sin eventos live en este momento.
                                    </div>
                                )}

                                {liveFeed.map((event, index) => (
                                    <motion.div
                                        key={event.id}
                                        className="ds-hover-row flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                                        initial={{ opacity: 0.6, y: 3 }}
                                        animate={{ opacity: [0.65, 1, 0.75], y: 0 }}
                                        transition={{ duration: 3.4 + index * 0.45, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-zinc-200">{event.title}</p>
                                            <p className="text-[11px] text-zinc-500">{event.pujas} puja{event.pujas !== 1 ? 's' : ''}</p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold text-zinc-200">{event.price.toFixed(2)} EUR</span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-400">
                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-zinc-500" />
                                    {Math.max(1, totalPujas)} interacción{Math.max(1, totalPujas) !== 1 ? 'es' : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                                    Mercado online
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-full flex-col justify-between gap-4 lg:min-w-[220px]">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Estado del feed</p>
                            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                                <Radio className="h-4 w-4 text-red-300" />
                                Actualización en tiempo real
                            </p>
                            {ultimaActualizacion && (
                                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-zinc-400">
                                    <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
                                    Último sync: {ultimaActualizacion.toLocaleTimeString('es-ES')}
                                </p>
                            )}
                        </div>

                        <Link to="/subastas/crear" className="btn-live-cta w-full">
                            <Plus className="w-4 h-4" />
                            Crear subasta
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Estados */}
            {cargando && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-80 rounded-3xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            )}

            {!cargando && error && (
                <div className="glass-card p-10 text-center text-dimmed">
                    <p className="font-semibold text-base-primary mb-1">Error</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={cargar} className="ds-btn-neutral mt-4 px-6">
                        <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                </div>
            )}

            {!cargando && !error && subastas.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-16 flex flex-col items-center gap-5 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Gavel className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-base-primary font-semibold text-lg">Sin subastas activas</p>
                        <p className="text-dimmed text-sm mt-1">Sé el primero en crear una subasta para tu producto.</p>
                    </div>
                    <Link to="/subastas/crear" className="btn-live-cta px-6">
                        <Plus className="w-4 h-4" /> Crear subasta
                    </Link>
                </motion.div>
            )}

            {!cargando && !error && subastas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {subastas.map((s) => (
                        <SubastaCard key={s.id} subasta={s} onExpire={handleExpire} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Subastas;
