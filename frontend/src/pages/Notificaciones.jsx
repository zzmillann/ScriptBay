import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, Star, Info, Package, Trash2, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMisNotificaciones, postMarcarLeida, postMarcarTodasLeidas, deleteEliminar } from '../services/notificacionesClient';

const TIPOS = [
    { key: '', label: 'Todas' },
    { key: 'compra', label: 'Compras' },
    { key: 'review', label: 'Reseñas' },
    { key: 'publicaciones', label: 'Publicaciones' }
];

const tiempoRelativo = (fecha) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora mismo';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)}d`;
};

const textoNotif = (tipo, datos) => {
    if (tipo === 'compra') return `Tu producto "${datos.titulo}" fue comprado por ${datos.precio} €`;
    if (tipo === 'review') return datos.texto || 'Nueva reseña en tu producto';
    if (tipo === 'publicaciones') return `${datos.vendedorNombre || 'Un usuario'} publicó: "${datos.titulo}"`;
    return datos.mensaje || 'Notificación del sistema';
};

const iconoNotif = (tipo) => {
    if (tipo === 'compra') return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    if (tipo === 'review') return <Star className="w-4 h-4 text-yellow-500" />;
    if (tipo === 'publicaciones') return <Package className="w-4 h-4 text-purple-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
};

const linkNotif = (datos) => {
    if (datos.productoId) return `/producto/${datos.productoId}`;
    if (datos.subastaId) return `/subastas/${datos.subastaId}`;
    return '#';
};

const Notificaciones = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [pagina, setPagina] = useState(1);
    const [tipoActivo, setTipoActivo] = useState('');
    const [loading, setLoading] = useState(true);

    const cargar = async (p = pagina, t = tipoActivo) => {
        setLoading(true);
        try {
            const data = await getMisNotificaciones(p, t, '');
            if (data.codigo === 0) {
                setNotificaciones(data.notificaciones);
                setTotal(data.total);
                setTotalPaginas(data.totalPaginas);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar(1, tipoActivo);
        setPagina(1);
    }, [tipoActivo]);

    useEffect(() => {
        cargar(pagina, tipoActivo);
    }, [pagina]);

    const handleMarcarLeida = async (id) => {
        await postMarcarLeida(id);
        setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
    };

    const handleMarcarTodas = async () => {
        await postMarcarTodasLeidas();
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    };

    const handleEliminar = async (id) => {
        await deleteEliminar(id);
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Bell className="w-6 h-6 text-primary" />
                        <h1 className="text-3xl font-bold text-base-primary">Notificaciones</h1>
                        {total > 0 && (
                            <span className="text-sm text-faint font-normal">({total})</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleMarcarTodas}
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-150"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Marcar todas como leídas
                    </button>
                </div>

                <div className="flex gap-1 mt-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-1 w-fit">
                    {TIPOS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTipoActivo(t.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${tipoActivo === t.key ? 'bg-white dark:bg-zinc-700 text-base-primary shadow-sm' : 'text-base-secondary hover:text-base-primary'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="surface-card p-4 animate-pulse flex gap-3 items-start">
                            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notificaciones.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-28 gap-5 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center">
                        <Bell className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-base-primary font-semibold text-lg">Sin notificaciones</p>
                        <p className="text-base-secondary text-sm mt-1">
                            Cuando alguien compre tus productos aparecerán aquí.
                        </p>
                    </div>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                        {notificaciones.map((n, i) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.25, delay: i * 0.04 }}
                                className={`surface-card p-4 flex items-start gap-3 group transition-colors duration-150 ${!n.leida ? 'border-l-2 border-primary' : ''}`}
                            >
                                <div className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    {iconoNotif(n.tipo)}
                                </div>

                                <Link
                                    to={linkNotif(n.datos)}
                                    className="flex-1 min-w-0"
                                    onClick={() => { if (!n.leida) handleMarcarLeida(n.id); }}
                                >
                                    <p className={`text-sm leading-snug ${!n.leida ? 'font-medium text-base-primary' : 'text-base-secondary'}`}>
                                        {textoNotif(n.tipo, n.datos)}
                                    </p>
                                    <p className="text-xs text-faint mt-0.5">{tiempoRelativo(n.created_at)}</p>
                                </Link>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                                    {!n.leida && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarcarLeida(n.id)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
                                            title="Marcar como leída"
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleEliminar(n.id)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {!n.leida && (
                                    <span className="mt-2 shrink-0 w-2 h-2 rounded-full bg-primary" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {totalPaginas > 1 && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-center justify-center gap-2 mt-8"
                >
                    <button
                        type="button"
                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                        disabled={pagina === 1}
                        className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-base-secondary disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-150"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-faint px-3">
                        {pagina} / {totalPaginas}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                        disabled={pagina === totalPaginas}
                        className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-base-secondary disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-150"
                    >
                        Siguiente
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default Notificaciones;
