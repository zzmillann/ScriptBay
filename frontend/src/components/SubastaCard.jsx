import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gavel, Zap } from 'lucide-react';
import Countdown from './Countdown';
import { normalizeImageUrl } from '../utils/imageUrl';

const SubastaCard = ({ subasta, onExpire }) => {
    const [expirado, setExpirado] = useState(false);
    const producto = subasta.productos || {};

    const imagenSrc = normalizeImageUrl(producto.imagen || '');
    const fallbackImg = `https://picsum.photos/seed/sub-${subasta.id}/640/420`;

    const precioSalida  = Number(subasta.precio_salida);
    const precioActual  = Number(subasta.precio_actual);
    const precioCi      = subasta.precio_compra_inmediata ? Number(subasta.precio_compra_inmediata) : null;

    // Progreso: de precio_salida hacia precio_compra_inmediata (o el doble si no hay CI)
    const maximo = precioCi ?? precioSalida * 2;
    const progreso = Math.min(100, ((precioActual - precioSalida) / Math.max(maximo - precioSalida, 1)) * 100);

    const hayPujas = precioActual > precioSalida;

    const handleExpire = () => {
        setExpirado(true);
        onExpire?.();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -4, scale: 1.012 }}
            className="surface-card flex flex-col overflow-hidden
                       hover:border-primary/25 dark:hover:border-primary/20
                       hover:shadow-[0_12px_40px_-12px_rgba(255,26,26,0.18)]"
        >
            {/* Imagen */}
            <div className="relative h-44 overflow-hidden bg-zinc-100 dark:bg-black shrink-0">
                <img
                    src={imagenSrc || fallbackImg}
                    alt={producto.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = fallbackImg; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                {/* Badge LIVE / EXPIRADO */}
                <div className="absolute top-3 left-3">
                    {!expirado ? (
                        <span className="inline-flex items-center gap-1.5 bg-primary/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVE
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 bg-zinc-700/90 text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            CERRADA
                        </span>
                    )}
                </div>

                {/* Categoría */}
                <div className="absolute top-3 right-3">
                    <span className="bg-white/90 dark:bg-dark/80 backdrop-blur-md text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
                        {producto.categoria || producto.tipo || 'Script'}
                    </span>
                </div>

                {/* Countdown sobre imagen */}
                <div className="absolute bottom-3 left-3">
                    {!expirado && (
                        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-2.5 py-1.5">
                            <Countdown fechaFin={subasta.fecha_fin} onExpire={handleExpire} size="sm" />
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                <h3 className="font-bold text-base-primary text-sm line-clamp-2 leading-snug">
                    {producto.titulo || 'Producto en subasta'}
                </h3>

                {/* Precios */}
                <div className="flex items-end justify-between gap-2">
                    <div>
                        <p className="text-[10px] text-dimmed uppercase tracking-wide mb-0.5">
                            {hayPujas ? 'Puja actual' : 'Salida'}
                        </p>
                        <p className="text-lg font-bold text-primary leading-none">
                            {precioActual.toFixed(2)} €
                        </p>
                    </div>
                    {precioCi && (
                        <div className="text-right">
                            <p className="text-[10px] text-dimmed uppercase tracking-wide mb-0.5">Compra ya</p>
                            <p className="text-xs font-semibold text-base-secondary flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                {precioCi.toFixed(2)} €
                            </p>
                        </div>
                    )}
                </div>

                {/* Barra de progreso */}
                <div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                            initial={{ width: 0 }}
                            animate={{ width: `${progreso}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-dimmed">{precioSalida.toFixed(2)} €</span>
                        {precioCi && <span className="text-[10px] text-dimmed">{precioCi.toFixed(2)} €</span>}
                    </div>
                </div>

                {/* Pujas y botón */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100 dark:border-white/5">
                    <span className="text-xs text-dimmed flex items-center gap-1">
                        <Gavel className="w-3.5 h-3.5" />
                        {subasta.total_pujas ?? 0} puja{(subasta.total_pujas ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <Link
                        to={`/subastas/${subasta.id}`}
                        className={`btn-primary text-xs px-4 py-1.5 ${expirado ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {expirado ? 'Ver resultado' : 'Pujar →'}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default SubastaCard;
