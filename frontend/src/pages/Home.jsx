import React, { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { products as localProducts } from '../data/products';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const tags = ['Todos', 'Scripts', 'Diseño', 'Plugins', 'Servicios', 'Backend'];

const normalizeProduct = (product) => ({
    id: product.id,
    title: product.titulo || product.title || '',
    category: product.categoria || product.tipo || product.category || '',
    price: Number(product.precio ?? product.price ?? 0),
    rating: Number(product.rating ?? 0),
    reviews: Number(product.reviews ?? 0),
    image: product.imagen || product.image,
    rawType: (product.tipo || '').toString().toLowerCase(),
});

const matchesTag = (product, selectedTag) => {
    if (selectedTag === 'Todos') return true;

    const title = product.title.toLowerCase();
    const category = product.category.toLowerCase();

    if (selectedTag === 'Diseño') return category.includes('dise') || title.includes('dise');
    if (selectedTag === 'Backend') return category.includes('backend') || title.includes('api') || title.includes('servidor');
    if (selectedTag === 'Plugins') return title.includes('plugin') || category.includes('plugin');
    if (selectedTag === 'Servicios') return product.rawType.includes('servicio') || title.includes('servicio') || category.includes('servicio');
    if (selectedTag === 'Scripts') {
        return !(
            title.includes('plugin') ||
            category.includes('plugin') ||
            product.rawType.includes('servicio') ||
            title.includes('servicio') ||
            category.includes('servicio')
        );
    }

    return true;
};

const Home = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    const titleX = useTransform(smoothX, [-400, 400], [-30, 30]);
    const titleY = useTransform(smoothY, [-400, 400], [-15, 15]);

    const [productos, setProductos] = useState([]);
    const [cargaFallback, setCargaFallback] = useState(false);
    const [tagSeleccionado, setTagSeleccionado] = useState('Todos');
    const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
    const [ordenSeleccionado, setOrdenSeleccionado] = useState('mas-recientes');
    const [paginaActual, setPaginaActual] = useState(1);
    const PRODUCTOS_POR_PAGINA = 40;

    const productosNormalizados = useMemo(() => productos.map(normalizeProduct), [productos]);

    const productosFiltrados = useMemo(() => {
        const filtrados = productosNormalizados.filter((product) => matchesTag(product, tagSeleccionado));

        if (ordenSeleccionado === 'precio-asc') {
            return [...filtrados].sort((a, b) => a.price - b.price);
        }

        if (ordenSeleccionado === 'precio-desc') {
            return [...filtrados].sort((a, b) => b.price - a.price);
        }

        if (ordenSeleccionado === 'rating-desc') {
            return [...filtrados].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        }

        // Default: se mantiene el orden recibido desde backend (más recientes primero).
        return filtrados;
    }, [productosNormalizados, tagSeleccionado, ordenSeleccionado]);

    const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
    const productosPagina = productosFiltrados.slice((paginaActual - 1) * PRODUCTOS_POR_PAGINA, paginaActual * PRODUCTOS_POR_PAGINA);

    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/productos/ObtenerProductos');
                const data = await response.json();
                if (data.codigo === 0) {
                    setProductos(data.productos);
                    setCargaFallback(false);
                    return;
                }

                // Si la API responde error de negocio, usamos catálogo local como respaldo.
                setProductos(localProducts);
                setCargaFallback(true);
            } catch (error) {
                console.log(error);
                setProductos(localProducts);
                setCargaFallback(true);
            }
        };
        cargarProductos();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [tagSeleccionado, ordenSeleccionado]);

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
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setTagSeleccionado(tag)}
                            className={`px-5 py-2 border-none transition-all text-sm whitespace-nowrap font-bold ${
                                tagSeleccionado === tag ? 'bg-primary text-darker' : 'glass-card hover:bg-primary/20'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setMostrarPanelFiltros((prev) => !prev)}
                    className="flex items-center gap-2 px-5 py-2 glass-card hover:bg-white/5 transition-all text-sm w-full md:w-auto justify-center font-bold"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtrar y Ordenar
                </button>
            </div>

            {mostrarPanelFiltros && (
                <div className="mb-8 glass-card p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                    <div className="w-full md:w-auto">
                        <label className="block text-xs text-white/60 mb-2 font-semibold">Ordenar por</label>
                        <select
                            value={ordenSeleccionado}
                            onChange={(e) => setOrdenSeleccionado(e.target.value)}
                            className="w-full md:w-64 rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none"
                        >
                            <option value="mas-recientes" className="bg-dark">Más recientes</option>
                            <option value="precio-asc" className="bg-dark">Precio: menor a mayor</option>
                            <option value="precio-desc" className="bg-dark">Precio: mayor a menor</option>
                            <option value="rating-desc" className="bg-dark">Mejor valorados</option>
                        </select>
                    </div>

                    <p className="text-xs md:text-sm text-white/60 font-semibold">
                        Mostrando {productosFiltrados.length} resultado(s) en {tagSeleccionado}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productosPagina.map((product) => (
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
            </div>

            {productosFiltrados.length === 0 && (
                <p className="mt-8 text-center text-white/60">No hay productos para ese filtro.</p>
            )}

            {cargaFallback && (
                <p className="mt-6 text-sm text-white/60">
                    Mostrando catálogo local temporalmente porque el backend no respondió correctamente.
                </p>
            )}

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
