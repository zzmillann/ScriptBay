import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';

const products = [
    { id: 1, title: 'Plantilla React E-commerce', category: 'Frontend', price: 49, rating: 4.8, reviews: 124 },
    { id: 2, title: 'Optimizador SEO Automático', category: 'Python', price: 29, rating: 4.9, reviews: 89 },
    { id: 3, title: 'Dashboard UI Kit Pro', category: 'Diseño', price: 79, rating: 4.7, reviews: 215 },
    { id: 4, title: 'Motor de Chat Real-time', category: 'Backend', price: 99, rating: 5.0, reviews: 45 },
    { id: 5, title: 'Plugin de Seguridad Auth', category: 'Seguridad', price: 39, rating: 4.6, reviews: 156 },
    { id: 6, title: 'Framework de Bot Discord', category: 'Herramientas', price: 19, rating: 4.8, reviews: 312 },
    { id: 7, title: 'API de Procesamiento Imagen', category: 'Cloud', price: 59, rating: 4.5, reviews: 67 },
    { id: 8, title: 'Adaptador Crypto Wallet', category: 'Web3', price: 89, rating: 4.7, reviews: 92 },
];

const Home = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the motion
    const springConfig = { damping: 25, stiffness: 150 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    // Map mouse position to smaller movement for parallax
    const titleX = useTransform(smoothX, [-400, 400], [-30, 30]);
    const titleY = useTransform(smoothY, [-400, 400], [-15, 15]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
            {/* Rest of the content starts here */}

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                    {['Todos', 'Scripts', 'Diseño', 'Plugins', 'Servicios', 'Backend'].map((tag) => (
                        <button key={tag} className="px-5 py-2 glass-card border-none hover:bg-primary/20 transition-all text-sm whitespace-nowrap font-bold">
                            {tag}
                        </button>
                    ))}
                </div>
                <button className="flex items-center gap-2 px-5 py-2 glass-card hover:bg-white/5 transition-all text-sm w-full md:w-auto justify-center font-bold">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtrar y Ordenar
                </button>
            </div>

            {/* Cuadrícula de Productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>

            <div className="mt-16 text-center">
                <button className="btn-primary flex items-center gap-2 mx-auto font-bold py-3 px-8 text-lg">
                    Ver Todos los Servicios <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Home;
