import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProductCard = ({ id, title, category, price, rating, reviews, image }) => {
    return (
        <Link to={`/producto/${id}`} className="block h-full">
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -5, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                className="surface-card group flex h-full flex-col overflow-hidden
                           hover:border-primary/25 dark:hover:border-primary/20
                           hover:shadow-[0_12px_40px_-12px_rgba(255,26,26,0.18),0_2px_8px_rgba(0,0,0,0.08)]
                           dark:hover:shadow-[0_20px_45px_-25px_rgba(239,68,68,0.4),0_0_16px_rgba(168,85,247,0.2)]"
            >
                {/* Imagen */}
                <motion.div layoutId={`product-image-${id}`} className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-black">
                    <img
                        src={image || `https://picsum.photos/seed/card-${id}/640/420`}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-900/70 dark:from-darker to-transparent opacity-60" />
                    <div className="absolute top-4 right-4">
                        <span className="bg-white/90 dark:bg-dark/80 backdrop-blur-md text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20 shadow-sm dark:shadow-none">
                            {category}
                        </span>
                    </div>
                </motion.div>

                {/* Contenido */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="label-muted">{rating} ({reviews})</span>
                    </div>

                    <motion.h3
                        layoutId={`product-title-${id}`}
                        className="text-base-primary text-lg font-bold mb-1 group-hover:text-primary transition-colors leading-tight"
                    >
                        {title}
                    </motion.h3>

                    <p className="text-base-secondary text-sm mb-4 line-clamp-2">
                        Script de alto rendimiento optimizado para aplicaciones modernas e integración fluida.
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                        <div>
                            <span className="label-muted block">Desde</span>
                            <motion.span
                                layoutId={`product-price-${id}`}
                                className="text-base-primary text-xl font-bold"
                            >
                                {price}€
                            </motion.span>
                        </div>
                        <span className="flex items-center justify-center p-3 rounded-xl
                                         border border-zinc-200 dark:border-white/10
                                         bg-zinc-100 dark:bg-white/5
                                         shadow-sm dark:shadow-none
                                         transition-all duration-300 group/btn
                                         hover:border-primary/30 hover:bg-primary/90
                                         hover:shadow-[0_0_14px_rgba(239,68,68,0.45)]">
                            <ShoppingCart className="w-5 h-5 text-zinc-600 dark:text-white group-hover/btn:text-white group-hover/btn:scale-110 transition-all" />
                        </span>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
};

export default ProductCard;
