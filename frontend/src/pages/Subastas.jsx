import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Plus, RefreshCw } from 'lucide-react';
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

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 mt-16 min-h-screen">

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="glass-card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Gavel className="w-6 h-6 text-primary" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-base-primary">Subastas en vivo</h1>
                        {subastas.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                {subastas.length} activa{subastas.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-subtle text-sm max-w-xl">
                        Puja en tiempo real por scripts, plugins y servicios digitales. El precio sube con cada puja — gana el que más ofrezca al cierre.
                    </p>
                    {ultimaActualizacion && (
                        <p className="text-[11px] text-dimmed mt-2">
                            Actualizado: {ultimaActualizacion.toLocaleTimeString('es-ES')}
                        </p>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={cargar}
                        className="btn-secondary px-4 py-2 text-sm"
                        aria-label="Refrescar subastas"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refrescar
                    </button>
                    <Link to="/subastas/crear" className="btn-primary px-5 py-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Crear subasta
                    </Link>
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
                    <button onClick={cargar} className="btn-secondary mt-4 px-6">
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
                    <Link to="/subastas/crear" className="btn-primary px-6">
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
