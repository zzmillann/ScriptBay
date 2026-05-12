import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Euro, Clock, Zap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { crearSubasta } from '../services/subastasClient';
import { getValidSession } from '../services/authClient';

const API_PRODUCTOS = 'http://localhost:3000/api/productos';

const DURACIONES = [
    { value: '1h',  label: '1 hora' },
    { value: '24h', label: '24 horas' },
    { value: '7d',  label: '7 días' },
];

const CrearSubasta = () => {
    const navigate = useNavigate();

    const [misProductos, setMisProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(true);

    const [form, setForm] = useState({
        productoId: '',
        precioSalida: '',
        duracion: '24h',
        precioCompraInmediata: '',
        incrementoPuja: '1',
    });

    const [enviando, setEnviando] = useState(false);
    const [feedback, setFeedback] = useState(null); // { tipo: 'ok'|'error', msg }

    // Cargar mis productos para el selector
    useEffect(() => {
        const cargar = async () => {
            try {
                const session = await getValidSession();
                if (!session?.accessToken) { navigate('/login'); return; }

                const res = await fetch(`${API_PRODUCTOS}/MisProductos`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                const data = await res.json();
                if (data.codigo === 0) setMisProductos(data.productos || []);
            } catch {
                // silencioso
            } finally {
                setCargandoProductos(false);
            }
        };
        cargar();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);

        if (!form.productoId) { setFeedback({ tipo: 'error', msg: 'Selecciona un producto.' }); return; }
        if (!form.precioSalida || Number(form.precioSalida) <= 0) { setFeedback({ tipo: 'error', msg: 'El precio de salida debe ser mayor que 0.' }); return; }
        if (!form.incrementoPuja || Number(form.incrementoPuja) < 0.01) { setFeedback({ tipo: 'error', msg: 'El incremento por puja debe ser al menos 0.01 €.' }); return; }
        if (form.precioCompraInmediata && Number(form.precioCompraInmediata) <= Number(form.precioSalida)) {
            setFeedback({ tipo: 'error', msg: 'El precio de compra inmediata debe ser mayor que el precio de salida.' });
            return;
        }

        setEnviando(true);
        const data = await crearSubasta({
            productoId: form.productoId,
            precioSalida: Number(form.precioSalida),
            duracion: form.duracion,
            incrementoPuja: Number(form.incrementoPuja),
            precioCompraInmediata: form.precioCompraInmediata ? Number(form.precioCompraInmediata) : undefined,
        });
        setEnviando(false);

        if (data.codigo === 0) {
            setFeedback({ tipo: 'ok', msg: '¡Subasta creada correctamente!' });
            setTimeout(() => navigate(`/subastas/${data.subasta.id}`), 1200);
        } else {
            setFeedback({ tipo: 'error', msg: data.mensaje });
        }
    };

    const inputCls = 'w-full rounded-xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-black/40 px-4 py-2.5 text-sm text-base-primary outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-dimmed';
    const labelCls = 'block text-xs font-semibold text-dimmed mb-1.5 uppercase tracking-wide';

    return (
        <div className="max-w-xl mx-auto px-6 py-12 mt-16">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <Link to="/subastas" className="btn-secondary inline-flex text-sm mb-6">← Volver a subastas</Link>

                <div className="glass-card p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Gavel className="w-6 h-6 text-primary" />
                        <h1 className="text-2xl font-bold text-base-primary">Crear subasta</h1>
                    </div>

                    {cargandoProductos ? (
                        <div className="h-40 rounded-2xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
                    ) : misProductos.length === 0 ? (
                        <div className="text-center py-10 text-dimmed text-sm">
                            <p className="mb-4">No tienes productos publicados.</p>
                            <Link to="/create-product" className="btn-primary px-6">Crear producto</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                            {/* Producto */}
                            <div>
                                <label className={labelCls}>Producto a subastar</label>
                                <select
                                    name="productoId"
                                    value={form.productoId}
                                    onChange={handleChange}
                                    className={inputCls}
                                    required
                                >
                                    <option value="">— Selecciona un producto —</option>
                                    {misProductos.map((p) => (
                                        <option key={p.id} value={p.id}>{p.titulo}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Precio salida */}
                            <div>
                                <label className={labelCls}>
                                    <Euro className="inline w-3.5 h-3.5 mr-1" />
                                    Precio de salida
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="precioSalida"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.precioSalida}
                                        onChange={handleChange}
                                        className={`${inputCls} pr-10`}
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dimmed text-sm font-semibold">€</span>
                                </div>
                            </div>

                            {/* Duración */}
                            <div>
                                <label className={labelCls}>
                                    <Clock className="inline w-3.5 h-3.5 mr-1" />
                                    Duración
                                </label>
                                <div className="flex gap-2">
                                    {DURACIONES.map((d) => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, duracion: d.value }))}
                                            className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                                form.duracion === d.value
                                                    ? 'bg-primary text-white border-primary shadow-[0_8px_20px_-10px_rgba(255,26,26,0.7)]'
                                                    : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-base-primary hover:border-primary/30 hover:text-primary'
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Incremento por puja */}
                            <div>
                                <label className={labelCls}>
                                    <TrendingUp className="inline w-3.5 h-3.5 mr-1 text-primary" />
                                    Incremento mínimo por puja
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="incrementoPuja"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="1.00"
                                        value={form.incrementoPuja}
                                        onChange={handleChange}
                                        className={`${inputCls} pr-10`}
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dimmed text-sm font-semibold">€</span>
                                </div>
                                <p className="text-[11px] text-dimmed mt-1">
                                    Cada nueva puja debe superar la anterior en al menos esta cantidad.
                                    {form.precioSalida && form.incrementoPuja
                                        ? ` Primera puja mínima: ${(Number(form.precioSalida) + Number(form.incrementoPuja)).toFixed(2)} €`
                                        : ''}
                                </p>
                            </div>

                            {/* Precio compra inmediata (opcional) */}
                            <div>
                                <label className={labelCls}>
                                    <Zap className="inline w-3.5 h-3.5 mr-1 text-yellow-500" />
                                    Precio de compra inmediata <span className="normal-case font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="precioCompraInmediata"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Dejar vacío para no activarlo"
                                        value={form.precioCompraInmediata}
                                        onChange={handleChange}
                                        className={`${inputCls} pr-10`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dimmed text-sm font-semibold">€</span>
                                </div>
                                <p className="text-[11px] text-dimmed mt-1">Si alguien puja esta cantidad, gana la subasta al instante.</p>
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
                                    feedback.tipo === 'ok'
                                        ? 'bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                                        : 'bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                }`}>
                                    {feedback.tipo === 'ok'
                                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        : <AlertCircle className="w-4 h-4 shrink-0" />}
                                    {feedback.msg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={enviando}
                                className="btn-primary w-full py-3 text-sm disabled:opacity-50"
                            >
                                {enviando ? 'Creando subasta...' : 'Crear subasta'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CrearSubasta;
