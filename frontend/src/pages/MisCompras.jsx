import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ExternalLink, CreditCard, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getValidSession } from '../services/authClient';

const API = 'http://localhost:3000/api/productos';

const formatFecha = (iso) => {
    try {
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
};

const badgeMetodo = (metodo) => {
    const m = String(metodo || '').toLowerCase();
    if (m.includes('stripe')) return { label: 'Stripe', cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300' };
    if (m.includes('paypal')) return { label: 'PayPal', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' };
    return { label: metodo, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' };
};

const MisCompras = () => {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                const session = await getValidSession();
                if (!session?.accessToken) {
                    setError('Inicia sesión para ver tus compras.');
                    setLoading(false);
                    return;
                }
                const res = await fetch(`${API}/MisCompras`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                const data = await res.json();
                if (data.codigo !== 0) throw new Error(data.mensaje || 'Error al cargar compras');
                setCompras(data.compras || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold text-base-primary">Mis Compras</h1>
                </div>
                <div className="flex flex-col gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="surface-card p-4 animate-pulse flex gap-4">
                            <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-1">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold text-base-primary">Mis Compras</h1>
                </div>
                <p className="text-base-secondary text-sm">
                    {compras.length === 0
                        ? 'Aún no has comprado nada.'
                        : `${compras.length} compra${compras.length !== 1 ? 's' : ''} realizadas`}
                </p>
            </motion.div>

            {compras.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-28 gap-5 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center">
                        <ShoppingBag className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-base-primary font-semibold text-lg">Sin compras todavía</p>
                        <p className="text-base-secondary text-sm mt-1">Explora el marketplace y encuentra tu próximo recurso.</p>
                    </div>
                    <Link to="/" className="btn-primary text-sm px-5 py-2">Explorar productos</Link>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                        {compras.map((compra, i) => {
                            const imagen = compra.productos?.imagen || null;
                            const productoId = compra.producto_id || null;
                            const badge = badgeMetodo(compra.metodo_pago);

                            return (
                                <motion.div
                                    key={compra.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: i * 0.04 }}
                                    className="surface-card p-4 flex items-center gap-4"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                        {imagen ? (
                                            <img
                                                src={imagen}
                                                alt={compra.titulo}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-base-primary truncate">{compra.titulo}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-xs text-faint flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" />
                                                {compra.id_transaccion ? compra.id_transaccion.slice(-10) : '—'}
                                            </span>
                                            <span className="text-xs text-faint">{formatFecha(compra.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-base font-bold text-base-primary">
                                            {Number(compra.precio).toFixed(2)} €
                                        </span>
                                        {productoId && (
                                            <Link
                                                to={`/mis-compras/${productoId}/acceso`}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors duration-150"
                                            >
                                                Acceder
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default MisCompras;
