import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    const titleX = useTransform(smoothX, [-400, 400], [-30, 30]);
    const titleY = useTransform(smoothY, [-400, 400], [-15, 15]);

    const [productos, setProductos] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const PRODUCTOS_POR_PAGINA = 40;
    const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
    const productosPagina = productos.slice((paginaActual - 1) * PRODUCTOS_POR_PAGINA, paginaActual * PRODUCTOS_POR_PAGINA);

    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/productos/ObtenerProductos');
                const data = await response.json();
                if (data.codigo === 0) {
                    setProductos(data.productos);
                }
            } catch (error) {
                console.log(error);
            }
        };
        cargarProductos();
    }, []);

    const HandlerClickAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    const HandlerClickSiguiente = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productosPagina.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        title={product.titulo}
                        category={product.categoria || product.tipo}
                        price={product.precio ?? 0}
                        rating={0}
                        reviews={0}
                        image={product.imagen}
                    />
                ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
                <button
                    onClick={HandlerClickAnterior}
                    disabled={paginaActual === 1}
                    className="flex items-center gap-2 px-6 py-2.5 glass-card border-none font-bold text-sm hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <div className="flex items-center gap-2">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                        <button
                            key={num}
                            onClick={() => setPaginaActual(num)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                                paginaActual === num ? 'bg-primary text-darker' : 'glass-card border-none hover:bg-primary/20'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <button
                    onClick={HandlerClickSiguiente}
                    disabled={paginaActual === totalPaginas}
                    className="flex items-center gap-2 px-6 py-2.5 glass-card border-none font-bold text-sm hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Siguiente <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Home;
