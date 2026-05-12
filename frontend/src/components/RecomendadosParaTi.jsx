import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { getRecomendados } from '../services/recomendacionesClient';
import { getSession } from '../services/authClient';
import { useWishlist } from '../context/WishlistContext';
import { normalizeImageUrl } from '../utils/imageUrl';

const normalizeProduct = (p) => ({
    id: p.id,
    title: p.titulo || '',
    category: p.categoria || p.tipo || '',
    price: Number(p.precio ?? 0),
    rating: 0,
    reviews: 0,
    image: normalizeImageUrl(p.imagen || ''),
    razon: p.razon || '',
});

const VISIBLES = 4;

const RecomendadosParaTi = () => {
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [offset, setOffset] = useState(0);
    const { wishlist } = useWishlist();

    useEffect(() => {
        const session = getSession();
        if (!session?.accessToken) {
            setCargando(false);
            return;
        }

        const wishlistIds = wishlist.map((p) => p.id);

        getRecomendados(wishlistIds)
            .then((data) => {
                if (data.codigo === 0 && data.recomendaciones.length > 0) {
                    setRecomendaciones(data.recomendaciones.map(normalizeProduct));
                }
            })
            .catch(() => {})
            .finally(() => setCargando(false));
    }, []);

    // No renderizar nada si no hay sesión o no hay recomendaciones y ya terminó de cargar
    if (!cargando && recomendaciones.length === 0) return null;

    const maxOffset = Math.max(0, recomendaciones.length - VISIBLES);
    const visibles = recomendaciones.slice(offset, offset + VISIBLES);

    const handleAnterior = () => setOffset((prev) => Math.max(0, prev - VISIBLES));
    const handleSiguiente = () => setOffset((prev) => Math.min(maxOffset, prev + VISIBLES));

    // Razón del primer producto visible como etiqueta del bloque
    const razonBloque = recomendaciones[offset]?.razon || '';

    return (
        <section className="mb-10">
            <div className="glass-card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-lg sm:text-xl font-bold text-base-primary">
                            Recomendados para ti
                        </h2>
                    </div>
                    {razonBloque && (
                        <span className="text-xs text-dimmed bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full px-3 py-1">
                            {razonBloque}
                        </span>
                    )}
                </div>

                {cargando ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: VISIBLES }).map((_, i) => (
                            <div
                                key={i}
                                className="h-72 rounded-2xl bg-zinc-100 dark:bg-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={offset}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                            >
                                {visibles.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        id={product.id}
                                        title={product.title}
                                        category={product.category}
                                        price={product.price}
                                        rating={product.rating}
                                        reviews={product.reviews}
                                        image={product.image}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {recomendaciones.length > VISIBLES && (
                            <div className="flex items-center justify-end gap-2 mt-5">
                                <button
                                    onClick={handleAnterior}
                                    disabled={offset === 0}
                                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-35 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-dimmed">
                                    {Math.floor(offset / VISIBLES) + 1} / {Math.ceil(recomendaciones.length / VISIBLES)}
                                </span>
                                <button
                                    onClick={handleSiguiente}
                                    disabled={offset >= maxOffset}
                                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-35 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default RecomendadosParaTi;
