import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProductCard = ({ id, title, category, price, rating, reviews, image }) => {
    return (
        <Link to={`/producto/${id}`} className="block">
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -5, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                className="glass-card group overflow-hidden border-white/10 bg-white/[0.035] transition-all duration-300 hover:border-violet-500/25 hover:bg-violet-500/[0.045] hover:shadow-[0_20px_45px_-25px_rgba(239,68,68,0.4),0_0_16px_rgba(168,85,247,0.2)]"
            >
           
            <motion.div layoutId={`product-image-${id}`} className="relative h-48 overflow-hidden bg-black">
                <img
                    src={image || `https://picsum.photos/seed/card-${id}/640/420`}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-darker to-transparent opacity-60"></div>
                <div className="absolute top-4 right-4">
                    <span className="bg-dark/80 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.2 rounded-full border border-primary/20">
                        {category}
                    </span>
                </div>
            </motion.div>

   
            <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-white/50">{rating} ({reviews})</span>
                </div>
                <motion.h3 layoutId={`product-title-${id}`} className="text-lg font-bold mb-1 group-hover:text-primary transition-colors leading-tight">{title}</motion.h3>
                <p className="text-sm text-white/40 mb-4 line-clamp-2">Script de alto rendimiento optimizado para aplicaciones modernas e integración fluida.</p>

                <div className="flex items-center justify-between mt-auto">
                    <div>
                        <span className="text-xs text-white/40 block">Desde</span>
                        <motion.span layoutId={`product-price-${id}`} className="text-xl font-bold">{price}€</motion.span>
                    </div>
                    <span className="flex items-center justify-center p-3 rounded-xl bg-white/5 transition-all duration-300 group/btn hover:bg-primary/90 hover:shadow-[0_0_14px_rgba(239,68,68,0.45)]">
                        <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    </span>
                </div>
            </div>
            </motion.article>
        </Link>
    );
};

export default ProductCard;
