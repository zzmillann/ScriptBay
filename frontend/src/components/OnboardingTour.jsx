import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Trophy } from 'lucide-react';
import { getValidSession } from '../services/authClient';

const SESSION_KEY = 'scriptbay_session';

const PASOS = [
    {
        target: 'tour-productos',
        titulo: 'Bienvenido a ScriptBay',
        descripcion: 'Este es el marketplace donde encontrarás scripts, plugins, herramientas y mucho más creados por la comunidad.',
    },
    {
        target: 'tour-subastas',
        titulo: 'Subastas en tiempo real',
        descripcion: 'Participa en subastas y consigue productos exclusivos pujando contra otros usuarios.',
    },
    {
        target: 'tour-publicar',
        titulo: 'Publica el tuyo',
        descripcion: 'Aquí puedes subir y vender tus propios productos a toda la comunidad.',
    },
    {
        target: 'tour-wishlist',
        titulo: 'Lista de deseos',
        descripcion: 'Guarda los productos que te interesan para comprarlos más adelante.',
    },
    {
        target: 'tour-notificaciones',
        titulo: 'Notificaciones',
        descripcion: 'Recibe avisos de tus ventas, compras, pujas ganadas y actividad de la comunidad.',
    },
    {
        target: 'tour-compras',
        titulo: 'Mis compras',
        descripcion: 'Aquí están todos tus activos digitales comprados. Accede a ellos en cualquier momento.',
    },
    {
        target: 'tour-dashboard',
        titulo: 'Tu perfil y dashboard',
        descripcion: 'Desde aquí accedes a tu perfil, editas tu cuenta, ves tus ventas y estadísticas.',
    },
];

const PADDING = 10;
const TOOLTIP_W = 310;

const OnboardingTour = ({ onFin }) => {
    const [paso, setPaso] = useState(0);
    const [rect, setRect] = useState(null);
    const [completado, setCompletado] = useState(false);

    const actualizarRect = useCallback(() => {
        const el = document.querySelector(`[data-tour="${PASOS[paso].target}"]`);
        if (el) {
            const r = el.getBoundingClientRect();
            setRect({
                top: r.top - PADDING,
                left: r.left - PADDING,
                width: r.width + PADDING * 2,
                height: r.height + PADDING * 2,
                bottom: r.bottom + PADDING,
            });
        } else {
            setRect(null);
        }
    }, [paso]);

    useEffect(() => {
        actualizarRect();
        window.addEventListener('resize', actualizarRect);
        window.addEventListener('scroll', actualizarRect, true);
        return () => {
            window.removeEventListener('resize', actualizarRect);
            window.removeEventListener('scroll', actualizarRect, true);
        };
    }, [actualizarRect]);

    const marcarEnSesion = () => {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            s.datosCliente = { ...s.datosCliente, onboarding_completado: true };
            localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        } catch (_) {}
    };

    const llamarEndpoint = async (skip = false) => {
        try {
            const session = await getValidSession();
            if (!session?.accessToken) return;
            await fetch('http://localhost:3000/api/Cliente/CompletarOnboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ skip }),
            });
            marcarEnSesion();
        } catch (_) {}
    };

    const handleSiguiente = () => {
        if (paso < PASOS.length - 1) {
            setPaso((p) => p + 1);
        } else {
            handleCompletar();
        }
    };

    const handleCompletar = async () => {
        setCompletado(true);
        await llamarEndpoint(false);
        setTimeout(() => {
            onFin();
        }, 2800);
    };

    const handleSaltar = async () => {
        await llamarEndpoint(true);
        onFin();
    };

    if (!rect) return null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tooltipTop = rect.bottom + 12 < vh - 180
        ? rect.bottom + 12
        : rect.top - 12 - 170;

    const tooltipLeft = Math.max(12, Math.min(rect.left, vw - TOOLTIP_W - 12));

    return createPortal(
        <AnimatePresence>
            {!completado ? (
                <motion.div
                    key="tour-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none' }}
                >
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: rect.top, background: 'rgba(0,0,0,0.72)', pointerEvents: 'auto' }} />
                    <div style={{ position: 'fixed', top: rect.bottom, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)', pointerEvents: 'auto' }} />
                    <div style={{ position: 'fixed', top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height, background: 'rgba(0,0,0,0.72)', pointerEvents: 'auto' }} />
                    <div style={{ position: 'fixed', top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height, background: 'rgba(0,0,0,0.72)', pointerEvents: 'auto' }} />

                    <div
                        style={{
                            position: 'fixed',
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            borderRadius: 14,
                            boxShadow: '0 0 0 3px rgba(239,68,68,0.9), 0 0 18px 2px rgba(239,68,68,0.25)',
                            pointerEvents: 'none',
                            zIndex: 9991,
                        }}
                    />

                    <motion.div
                        key={paso}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{
                            position: 'fixed',
                            top: tooltipTop,
                            left: tooltipLeft,
                            width: TOOLTIP_W,
                            zIndex: 9999,
                            pointerEvents: 'auto',
                        }}
                        className="glass-card rounded-2xl p-5 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-1.5">
                                {PASOS.map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-1.5 rounded-full transition-all duration-300"
                                        style={{
                                            width: i === paso ? 24 : 10,
                                            background: i <= paso ? 'rgb(239,68,68)' : undefined,
                                        }}
                                        {...(i > paso ? { className: 'h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-all duration-300' } : {})}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleSaltar}
                                className="text-faint hover:text-base-secondary transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                aria-label="Saltar tour"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
                            Paso {paso + 1} de {PASOS.length}
                        </p>
                        <h3 className="text-base font-bold text-base-primary mb-1.5">{PASOS[paso].titulo}</h3>
                        <p className="text-sm text-base-secondary mb-4 leading-relaxed">{PASOS[paso].descripcion}</p>

                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={handleSaltar}
                                className="text-xs text-faint hover:text-base-secondary transition-colors"
                            >
                                Saltar
                            </button>
                            <button
                                onClick={handleSiguiente}
                                className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 rounded-xl"
                            >
                                {paso < PASOS.length - 1 ? 'Siguiente' : 'Completar'}
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    key="tour-logro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="glass-card rounded-2xl p-8 text-center shadow-2xl mx-4"
                        style={{ maxWidth: 360 }}
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}
                        >
                            <Trophy className="w-8 h-8 text-white" />
                        </motion.div>

                        <h3 className="text-xl font-bold text-base-primary mb-1">¡Logro desbloqueado!</h3>
                        <p className="text-primary font-semibold text-base mb-2">Primeros pasos</p>
                        <p className="text-sm text-base-secondary">Ya conoces ScriptBay. ¡Empieza a explorar!</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default OnboardingTour;
