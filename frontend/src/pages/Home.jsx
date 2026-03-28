import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const products = [
    { id: 1, title: 'Plantilla React E-commerce', category: 'Frontend', price: 49, rating: 4.8, reviews: 124 },
    { id: 2, title: 'Optimizador SEO Automático', category: 'Python', price: 29, rating: 4.9, reviews: 89 },
    { id: 3, title: 'Dashboard UI Kit Pro', category: 'Diseño', price: 79, rating: 4.7, reviews: 215 },
    { id: 4, title: 'Motor de Chat Real-time', category: 'Backend', price: 99, rating: 5.0, reviews: 45 },
    { id: 5, title: 'Plugin de Seguridad Auth', category: 'Seguridad', price: 39, rating: 4.6, reviews: 156 },
    { id: 6, title: 'Framework de Bot Discord', category: 'Herramientas', price: 19, rating: 4.8, reviews: 312 },
    { id: 7, title: 'API de Procesamiento Imagen', category: 'Cloud', price: 59, rating: 4.5, reviews: 67 },
    { id: 8, title: 'Adaptador Crypto Wallet', category: 'Web3', price: 89, rating: 4.7, reviews: 92 },
    { id: 9, title: 'Template Next.js Blog', category: 'Frontend', price: 35, rating: 4.6, reviews: 88 },
    { id: 10, title: 'API REST Node.js Boilerplate', category: 'Backend', price: 45, rating: 4.8, reviews: 203 },
    { id: 11, title: 'Script de Web Scraping', category: 'Python', price: 22, rating: 4.5, reviews: 141 },
    { id: 12, title: 'Pack Iconos SVG 3D', category: 'Diseño', price: 15, rating: 4.9, reviews: 430 },
    { id: 13, title: 'Contrato NFT ERC-721', category: 'Web3', price: 120, rating: 4.9, reviews: 58 },
    { id: 14, title: 'CLI Dev Tools Avanzado', category: 'Herramientas', price: 25, rating: 4.7, reviews: 176 },
    { id: 15, title: 'Orquestador Docker Compose', category: 'Cloud', price: 65, rating: 4.6, reviews: 112 },
    { id: 16, title: 'Scanner de Vulnerabilidades', category: 'Seguridad', price: 75, rating: 4.8, reviews: 94 },
    { id: 17, title: 'UI Kit Vue 3 Material', category: 'Frontend', price: 55, rating: 4.5, reviews: 77 },
    { id: 18, title: 'Microservicio GraphQL', category: 'Backend', price: 110, rating: 4.7, reviews: 63 },
    { id: 19, title: 'Analizador de Logs Python', category: 'Python', price: 18, rating: 4.4, reviews: 259 },
    { id: 20, title: 'Sistema de Diseño Figma', category: 'Diseño', price: 89, rating: 4.8, reviews: 348 },
    { id: 21, title: 'Token ERC-20 Personalizado', category: 'Web3', price: 95, rating: 4.6, reviews: 71 },
    { id: 22, title: 'Automatizador de Tareas NPM', category: 'Herramientas', price: 12, rating: 4.9, reviews: 522 },
    { id: 23, title: 'Pipeline CI/CD GitHub Actions', category: 'Cloud', price: 40, rating: 4.7, reviews: 184 },
    { id: 24, title: 'Firewall de Aplicación Web', category: 'Seguridad', price: 88, rating: 4.5, reviews: 47 },
    { id: 25, title: 'Componentes Tailwind Premium', category: 'Frontend', price: 67, rating: 4.9, reviews: 561 },
    { id: 26, title: 'ORM Personalizado TypeScript', category: 'Backend', price: 55, rating: 4.6, reviews: 139 },
    { id: 27, title: 'Bot de Trading Automático', category: 'Python', price: 149, rating: 4.3, reviews: 38 },
    { id: 28, title: 'Plantillas Email Responsive', category: 'Diseño', price: 29, rating: 4.7, reviews: 267 },
    { id: 29, title: 'Bridge Cross-chain', category: 'Web3', price: 200, rating: 4.8, reviews: 29 },
    { id: 30, title: 'Monitor de Performance', category: 'Herramientas', price: 33, rating: 4.6, reviews: 195 },
    { id: 31, title: 'Kubernetes Config Avanzado', category: 'Cloud', price: 85, rating: 4.7, reviews: 76 },
    { id: 32, title: 'Encriptador de Archivos', category: 'Seguridad', price: 44, rating: 4.8, reviews: 118 },
    { id: 33, title: 'Animaciones CSS Avanzadas', category: 'Frontend', price: 22, rating: 4.5, reviews: 342 },
    { id: 34, title: 'Servidor WebSocket Escalable', category: 'Backend', price: 78, rating: 4.9, reviews: 87 },
    { id: 35, title: 'Procesador de PDFs Python', category: 'Python', price: 36, rating: 4.6, reviews: 164 },
    { id: 36, title: 'Pack Animaciones Lottie', category: 'Diseño', price: 19, rating: 4.8, reviews: 409 },
    { id: 37, title: 'DeFi Liquidity Pool', category: 'Web3', price: 175, rating: 4.7, reviews: 41 },
    { id: 38, title: 'Generador de Código AI', category: 'Herramientas', price: 59, rating: 4.5, reviews: 231 },
    { id: 39, title: 'Terraform AWS Modules', category: 'Cloud', price: 70, rating: 4.6, reviews: 93 },
    { id: 40, title: 'Auditor de Smart Contracts', category: 'Seguridad', price: 130, rating: 4.9, reviews: 33 },
    { id: 41, title: 'Framework Testing E2E', category: 'Frontend', price: 31, rating: 4.7, reviews: 198 },
    { id: 42, title: 'API Gateway Personalizada', category: 'Backend', price: 92, rating: 4.8, reviews: 55 },
    { id: 43, title: 'Detector de Fraude ML', category: 'Python', price: 189, rating: 4.4, reviews: 22 },
    { id: 44, title: 'Wireframes Kit Premium', category: 'Diseño', price: 45, rating: 4.6, reviews: 178 },
    { id: 45, title: 'DAO Governance Template', category: 'Web3', price: 155, rating: 4.5, reviews: 36 },
    { id: 46, title: 'Plugin ESLint Personalizado', category: 'Herramientas', price: 8, rating: 4.7, reviews: 643 },
    { id: 47, title: 'Serverless Functions Pack', category: 'Cloud', price: 48, rating: 4.8, reviews: 142 },
    { id: 48, title: 'Sistema de Login 2FA', category: 'Seguridad', price: 62, rating: 4.9, reviews: 201 },
    { id: 49, title: 'Slider 3D React', category: 'Frontend', price: 27, rating: 4.5, reviews: 287 },
    { id: 50, title: 'Motor de Búsqueda Elastic', category: 'Backend', price: 115, rating: 4.7, reviews: 48 },
    { id: 51, title: 'Automatizador Redes Sociales', category: 'Python', price: 42, rating: 4.6, reviews: 305 },
    { id: 52, title: 'Staking Contract Ethereum', category: 'Web3', price: 220, rating: 4.8, reviews: 17 },
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

    const [paginaActual, setPaginaActual] = useState(1);
    const PRODUCTOS_POR_PAGINA = 40;
    const totalPaginas = Math.ceil(products.length / PRODUCTOS_POR_PAGINA);
    const productosPagina = products.slice((paginaActual - 1) * PRODUCTOS_POR_PAGINA, paginaActual * PRODUCTOS_POR_PAGINA);

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
                {productosPagina.map((product) => (
                    <ProductCard key={product.id} {...product} />
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
