import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Zap, ArrowLeft, Clock, TrendingUp, Trophy, AlertCircle, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import Countdown from '../components/Countdown';
import { getSubasta, pujar, pagarSubastaGanada, cancelarSubasta, eliminarSubasta, compraInmediataDirecta } from '../services/subastasClient';
import { getSession } from '../services/authClient';
import { normalizeImageUrl } from '../utils/imageUrl';

// ── Confetti ligero (sin dependencia externa) ──────────────────────────────────
const COLORES_CONFETTI = ['#ff1a1a', '#ff4d4d', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

const lanzarConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const particulas = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: -10,
        r: Math.random() * 7 + 3,
        d: Math.random() * 60 + 20,
        color: COLORES_CONFETTI[Math.floor(Math.random() * COLORES_CONFETTI.length)],
        tilt: Math.random() * 10 - 5,
        velocidadX: Math.random() * 4 - 2,
        velocidadY: Math.random() * 3 + 2,
    }));

    let frame = 0;
    const animar = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach((p) => {
            p.y += p.velocidadY;
            p.x += p.velocidadX + Math.sin(frame / 20) * 0.5;
            p.tilt += 0.1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
        frame++;
        if (frame < 200) requestAnimationFrame(animar);
        else canvas.remove();
    };
    requestAnimationFrame(animar);
};

// ── Avatar inicial ─────────────────────────────────────────────────────────────
const Avatar = ({ nombre, avatarUrl, size = 8 }) => {
    const inicial = (nombre || 'U')[0].toUpperCase();
    const bg = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'];
    const color = bg[inicial.charCodeAt(0) % bg.length];
    return avatarUrl ? (
        <img src={avatarUrl} alt={nombre} className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-white/20`} />
    ) : (
        <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/20`}>
            {inicial}
        </div>
    );
};

const POLL_MS = 5_000; // Polling cada 5 s para pujas en tiempo real

const SubastaDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [subasta, setSubasta] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Puja
    const [cantidadPuja, setCantidadPuja] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [feedbackPuja, setFeedbackPuja] = useState(null); // { tipo: 'ok'|'error', msg }
    const [sacudir, setSacudir] = useState(false);
    const precioAnteriorRef = useRef(null);

    // Pago subasta ganada
    const [pagando, setPagando] = useState(false);
    const [feedbackPago, setFeedbackPago] = useState(null);

    // Compra inmediata directa
    const [comprando, setComprando] = useState(false);
    const [feedbackCI, setFeedbackCI] = useState(null);

    // Precio subido mientras miras
    const [precioSubio, setPrecioSubio] = useState(false);

    // Gestión vendedor
    const [cancelando, setCancelando] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);
    const [feedbackVendedor, setFeedbackVendedor] = useState(null);

    const [expirado, setExpirado] = useState(false);

    const session = getSession();
    const miId = session?.datosCliente?.id ?? null;

    const cargar = useCallback(async () => {
        try {
            const data = await getSubasta(id);
            if (data.codigo === 0) {
                const nueva = data.subasta;
                // Si el precio subió mientras el usuario tenía valor escrito → sacudir input
                if (
                    precioAnteriorRef.current !== null &&
                    Number(nueva.precio_actual) > Number(precioAnteriorRef.current)
                ) {
                    setSacudir(true);
                    setTimeout(() => setSacudir(false), 600);
                    setPrecioSubio(true);
                }
                precioAnteriorRef.current = nueva.precio_actual;
                setSubasta(nueva);
                setError(null);
            } else {
                setError(data.mensaje || 'Error al cargar subasta');
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargar();
        const interval = setInterval(cargar, POLL_MS);
        return () => clearInterval(interval);
    }, [cargar]);

    const handlePujar = async (e) => {
        e.preventDefault();
        if (!cantidadPuja || enviando) return;
        setEnviando(true);
        setFeedbackPuja(null);

        const data = await pujar(id, Number(cantidadPuja));

        if (data.codigo === 0) {
            setFeedbackPuja({ tipo: 'ok', msg: data.comprainmediata ? '¡Compra inmediata! Ganaste la subasta.' : 'Puja registrada correctamente.' });
            setCantidadPuja('');
            if (data.comprainmediata) {
                lanzarConfetti();
                setTimeout(() => cargar(), 800);
            } else {
                cargar();
            }
        } else {
            setFeedbackPuja({ tipo: 'error', msg: data.mensaje });
            setSacudir(true);
            setTimeout(() => setSacudir(false), 600);
        }
        setEnviando(false);
    };

    const handleCompraInmediata = async () => {
        if (comprando) return;
        setComprando(true);
        setFeedbackCI(null);
        const data = await compraInmediataDirecta(id, 'visa');
        if (data.codigo === 0) {
            lanzarConfetti();
            setFeedbackCI({ tipo: 'ok', msg: data.mensaje });
            setTimeout(() => cargar(), 800);
        } else {
            setFeedbackCI({ tipo: 'error', msg: data.mensaje });
        }
        setComprando(false);
    };

    const handleCancelar = async () => {
        if (cancelando) return;
        setCancelando(true);
        setFeedbackVendedor(null);
        try {
            const data = await cancelarSubasta(id);
            if (data.codigo === 0) {
                setFeedbackVendedor({ tipo: 'ok', msg: 'Subasta cancelada correctamente.' });
                setTimeout(() => cargar(), 1000);
            } else {
                setFeedbackVendedor({ tipo: 'error', msg: data.mensaje });
            }
        } catch {
            setFeedbackVendedor({ tipo: 'error', msg: 'Error al cancelar la subasta.' });
        } finally {
            setCancelando(false);
        }
    };

    const handleEliminar = async () => {
        if (eliminando) return;
        setEliminando(true);
        setFeedbackVendedor(null);
        try {
            const data = await eliminarSubasta(id);
            if (data.codigo === 0) {
                navigate('/subastas');
            } else {
                setFeedbackVendedor({ tipo: 'error', msg: data.mensaje });
                setConfirmarEliminar(false);
            }
        } catch {
            setFeedbackVendedor({ tipo: 'error', msg: 'Error al eliminar la subasta.' });
            setConfirmarEliminar(false);
        } finally {
            setEliminando(false);
        }
    };

    const handlePagar = async () => {
        setPagando(true);
        setFeedbackPago(null);
        const data = await pagarSubastaGanada(id, 'visa');
        if (data.codigo === 0) {
            lanzarConfetti();
            setFeedbackPago({ tipo: 'ok', msg: '¡Pago completado! El producto es tuyo.' });
            cargar();
        } else {
            setFeedbackPago({ tipo: 'error', msg: data.mensaje });
        }
        setPagando(false);
    };

    const handleExpire = useCallback(() => {
        setExpirado(true);
        setTimeout(cargar, 1500);
    }, [cargar]);

    // ── Renders condicionales ───────────────────────────────────────────────────
    if (cargando) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12 mt-16">
                <div className="h-96 rounded-3xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
            </div>
        );
    }

    if (error || !subasta) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12 mt-16 text-center text-dimmed">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-primary" />
                <p>{error || 'Subasta no encontrada'}</p>
                <Link to="/subastas" className="btn-secondary mt-6 inline-flex">← Volver</Link>
            </div>
        );
    }

    const producto = subasta.productos || {};
    const pujas    = subasta.pujas || [];
    const imagenSrc = normalizeImageUrl(producto.imagen || '');
    const fallbackImg = `https://picsum.photos/seed/sub-${subasta.id}/800/500`;

    const precioSalida  = Number(subasta.precio_salida);
    const precioActual  = Number(subasta.precio_actual);
    const precioCi      = subasta.precio_compra_inmediata ? Number(subasta.precio_compra_inmediata) : null;
    const incremento    = Number(subasta.incremento_puja ?? 0.01);
    const maximo        = precioCi ?? precioSalida * 2;
    const progreso      = Math.min(100, ((precioActual - precioSalida) / Math.max(maximo - precioSalida, 1)) * 100);

    const activa       = subasta.estado === 'activa' && !expirado;
    const soyGanador   = subasta.ganador_id === miId;
    const yaFuePageada = !!subasta.stripe_payment_intent;
    const minPuja      = (precioActual + incremento).toFixed(2);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 mt-16">
            {/* Botón volver */}
            <Link to="/subastas" className="btn-secondary inline-flex mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Volver a subastas
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── Columna izquierda: imagen + info ─────────────────────── */}
                <div className="lg:col-span-3 flex flex-col gap-6">

                    {/* Imagen */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-3xl overflow-hidden h-72 bg-zinc-100 dark:bg-black"
                    >
                        <img
                            src={imagenSrc || fallbackImg}
                            alt={producto.titulo}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = fallbackImg; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Badge LIVE */}
                        <div className="absolute top-4 left-4">
                            {activa ? (
                                <span className="inline-flex items-center gap-1.5 bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    LIVE
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-zinc-700/90 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                    CERRADA
                                </span>
                            )}
                        </div>

                        {/* Countdown */}
                        {activa && (
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Clock className="w-3.5 h-3.5 text-white/70" />
                                    <span className="text-[10px] text-white/70 uppercase tracking-wide">Cierra en</span>
                                </div>
                                <Countdown fechaFin={subasta.fecha_fin} onExpire={handleExpire} size="md" />
                            </div>
                        )}
                    </motion.div>

                    {/* Título y descripción */}
                    <div className="glass-card p-5">
                        <h1 className="text-2xl font-bold text-base-primary mb-2">{producto.titulo || 'Producto'}</h1>
                        {producto.descripcion && (
                            <p className="text-subtle text-sm leading-relaxed line-clamp-4">{producto.descripcion}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                            {producto.categoria && (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-base-secondary">
                                    {producto.categoria}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Historial de pujas */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-bold text-base-primary mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Historial de pujas
                        </h2>
                        {pujas.length === 0 ? (
                            <p className="text-dimmed text-sm text-center py-6">Sin pujas todavía. ¡Sé el primero!</p>
                        ) : (
                            <ul className="space-y-2.5">
                                <AnimatePresence initial={false}>
                                    {pujas.map((p, i) => (
                                        <motion.li
                                            key={p.id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.25, delay: i * 0.03 }}
                                            className="flex items-center gap-3"
                                        >
                                            <Avatar nombre={p.nombre} avatarUrl={p.avatar_url} size={7} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-base-primary truncate">{p.nombre}</p>
                                                <p className="text-[10px] text-dimmed">
                                                    {new Date(p.created_at).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                                </p>
                                            </div>
                                            <span className={`text-sm font-bold shrink-0 ${i === 0 ? 'text-primary' : 'text-base-secondary'}`}>
                                                {Number(p.cantidad).toFixed(2)} €
                                                {i === 0 && <span className="ml-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Top</span>}
                                            </span>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )}
                    </div>
                </div>

                {/* ── Columna derecha: precio + pujar ──────────────────────── */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* Panel de precio */}
                    <div className="glass-card p-5 flex flex-col gap-4">
                        <div>
                            <p className="text-xs text-dimmed uppercase tracking-wide mb-1">
                                {pujas.length > 0 ? 'Puja actual' : 'Precio de salida'}
                            </p>
                            <p className="text-4xl font-bold text-primary leading-none">
                                {precioActual.toFixed(2)} €
                            </p>
                            {pujas.length > 0 && (
                                <p className="text-xs text-dimmed mt-1">Salida: {precioSalida.toFixed(2)} €</p>
                            )}
                            <p className="text-xs text-dimmed mt-0.5">
                                Incremento por puja: <span className="font-semibold text-base-secondary">+{incremento.toFixed(2)} €</span>
                            </p>
                        </div>

                        {/* Barra de progreso */}
                        <div>
                            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                                    animate={{ width: `${progreso}%` }}
                                    transition={{ duration: 0.6 }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[11px] text-dimmed">
                                <span>{precioSalida.toFixed(2)} €</span>
                                {precioCi && <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{precioCi.toFixed(2)} €</span>}
                            </div>
                        </div>
                    </div>

                    {/* Aviso precio subido mientras miras */}
                    <AnimatePresence>
                        {precioSubio && activa && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-center justify-between gap-2 rounded-xl border border-yellow-300 dark:border-yellow-400/40 bg-yellow-50 dark:bg-yellow-400/10 px-4 py-2.5 text-xs text-yellow-800 dark:text-yellow-300"
                            >
                                <span>
                                    <TrendingUp className="inline w-3.5 h-3.5 mr-1" />
                                    <strong>El precio ha subido.</strong> Puja mínima: <strong>{minPuja} €</strong>
                                </span>
                                <button onClick={() => setPrecioSubio(false)} className="shrink-0 opacity-60 hover:opacity-100">×</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Panel compra inmediata (destacado, separado de la puja) */}
                    {activa && precioCi && miId && subasta.vendedor_id !== miId && (
                        <div className="rounded-2xl border-2 border-yellow-300 dark:border-yellow-400/40 bg-yellow-50 dark:bg-yellow-400/5 p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">Compra inmediata</p>
                                    <p className="text-[11px] text-yellow-700 dark:text-yellow-400/80">
                                        Paga ahora y gana la subasta al instante. No necesitas esperar.
                                    </p>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 leading-none">
                                {precioCi.toFixed(2)} €
                            </p>
                            <button
                                onClick={handleCompraInmediata}
                                disabled={comprando}
                                className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                {comprando ? 'Procesando pago...' : `Comprar ahora por ${precioCi.toFixed(2)} €`}
                            </button>
                            {feedbackCI && (
                                <p className={`text-xs flex items-center gap-1.5 ${
                                    feedbackCI.tipo === 'ok' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                }`}>
                                    {feedbackCI.tipo === 'ok'
                                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                                    {feedbackCI.msg}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Panel de puja / ganador */}
                    {activa && miId && subasta.vendedor_id !== miId && (
                        <div className="glass-card p-5">
                            <h2 className="text-sm font-bold text-base-primary mb-3 flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-primary" />
                                Realizar puja
                            </h2>
                            <form onSubmit={handlePujar} className="flex flex-col gap-3">
                                <div>
                                    <label className="text-xs text-dimmed mb-1 block">
                                        Tu oferta (mín. {minPuja} €)
                                    </label>
                                    <motion.div
                                        animate={sacudir ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <input
                                            type="number"
                                            min={minPuja}
                                            step="0.01"
                                            value={cantidadPuja}
                                            onChange={(e) => setCantidadPuja(e.target.value)}
                                            placeholder={`≥ ${minPuja} €`}
                                            className="w-full rounded-xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-black/40 px-4 py-2.5 text-sm text-base-primary outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </motion.div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={enviando || !cantidadPuja}
                                    className="btn-primary py-2.5 text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {enviando ? 'Enviando...' : 'Pujar ahora'}
                                </button>
                            </form>

                            {/* Feedback puja */}
                            <AnimatePresence>
                                {feedbackPuja && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className={`mt-3 text-xs rounded-xl px-3 py-2 flex items-center gap-2 ${
                                            feedbackPuja.tipo === 'ok'
                                                ? 'bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                                                : 'bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                        }`}
                                    >
                                        {feedbackPuja.tipo === 'ok'
                                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                            : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        }
                                        {feedbackPuja.msg}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Panel ganador: pago */}
                    {!activa && soyGanador && !yaFuePageada && (
                        <div className="glass-card p-5 border-primary/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <h2 className="text-sm font-bold text-base-primary">¡Has ganado la subasta!</h2>
                            </div>
                            <p className="text-xs text-dimmed mb-4">
                                Puja ganadora: <strong className="text-primary">{Number(subasta.puja_ganadora).toFixed(2)} €</strong>.
                                Completa el pago con Stripe para recibir el producto.
                            </p>
                            <button
                                onClick={handlePagar}
                                disabled={pagando}
                                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
                            >
                                {pagando ? 'Procesando pago...' : `Pagar ${Number(subasta.puja_ganadora).toFixed(2)} € con Stripe`}
                            </button>
                            {feedbackPago && (
                                <p className={`mt-3 text-xs ${feedbackPago.tipo === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {feedbackPago.msg}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Subasta ganada y ya pagada */}
                    {!activa && soyGanador && yaFuePageada && (
                        <div className="glass-card p-5 border-green-400/30 bg-green-50/50 dark:bg-green-400/5">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <p className="text-sm font-bold">Pago completado — el producto es tuyo.</p>
                            </div>
                        </div>
                    )}

                    {/* Subasta cerrada sin ser el ganador */}
                    {!activa && !soyGanador && (
                        <div className="glass-card p-5 text-center text-dimmed text-sm">
                            {subasta.ganador_id
                                ? 'Esta subasta ya tiene ganador.'
                                : 'Esta subasta cerró sin pujas.'}
                        </div>
                    )}

                    {/* Sin sesión */}
                    {activa && !miId && (
                        <div className="glass-card p-5 text-center">
                            <p className="text-dimmed text-sm mb-3">Inicia sesión para pujar.</p>
                            <Link to="/login" className="btn-primary text-sm px-6">Iniciar sesión</Link>
                        </div>
                    )}

                    {/* Soy el vendedor */}
                    {miId && subasta.vendedor_id === miId && (
                        <div className="glass-card p-5 flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-base-primary flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-primary" />
                                Gestión de tu subasta
                            </h2>

                            {activa && (
                                <p className="text-xs text-dimmed">
                                    Eres el vendedor. No puedes pujar en tu propia subasta.
                                </p>
                            )}

                            {/* Cancelar (solo si activa y sin pujas) */}
                            {activa && (
                                <button
                                    onClick={handleCancelar}
                                    disabled={cancelando || eliminando}
                                    className="btn-secondary py-2 text-xs w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    {cancelando ? 'Cancelando...' : 'Cancelar subasta'}
                                </button>
                            )}

                            {/* Eliminar permanentemente */}
                            {!confirmarEliminar ? (
                                <button
                                    onClick={() => setConfirmarEliminar(true)}
                                    disabled={cancelando || eliminando}
                                    className="py-2 text-xs w-full flex items-center justify-center gap-2 rounded-xl border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/5 hover:bg-red-100 dark:hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Eliminar subasta
                                </button>
                            ) : (
                                <div className="rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-400/5 p-3 flex flex-col gap-2">
                                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold text-center">
                                        ¿Seguro? Esta acción es irreversible.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setConfirmarEliminar(false)}
                                            className="flex-1 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-white/15 text-dimmed hover:text-base-primary transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleEliminar}
                                            disabled={eliminando}
                                            className="flex-1 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {feedbackVendedor && (
                                <p className={`text-xs flex items-center gap-1.5 ${
                                    feedbackVendedor.tipo === 'ok'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {feedbackVendedor.tipo === 'ok'
                                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                                    {feedbackVendedor.msg}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubastaDetalle;
