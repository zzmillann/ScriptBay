import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, ShoppingCart, Star, ShieldCheck, PackageCheck, ClipboardList, X, CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProductById, getRelatedProducts } from '../data/products';
import { postPagarProducto } from '../services/stripeClient';
import { postIniciarPagoPayPal } from '../services/paypalClient';
import { getSession } from '../services/authClient';
import { normalizeImageUrl } from '../utils/imageUrl';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const sectionBaseClass =
  'group surface-section transition-all duration-300 hover:scale-[1.01]';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session] = useState(getSession());

  const [modalAbierto, setModalAbierto] = useState(false);
  const [estadoPago, setEstadoPago] = useState('idle');
  const [mensajePago, setMensajePago] = useState('');
  const [hashBlockchain, setHashBlockchain] = useState('');
  const [metodoPago, setMetodoPago] = useState('visa');
  const [tipoPago, setTipoPago] = useState('stripe'); // 'stripe' | 'paypal'

  const tarjetasPrueba = {
    visa: { numero: '4242 4242 4242 4242', exp: '12/34', cvc: '123', label: 'Visa' },
    mastercard: { numero: '5555 5555 5555 4444', exp: '12/34', cvc: '123', label: 'Mastercard' },
    amex: { numero: '3782 8224 6310 005', exp: '12/34', cvc: '1234', label: 'American Express' }
  };

  useEffect(() => {
    const cargarDetalle = async () => {
      setLoading(true);
      try {
        // 1. Intentar buscar en locales (por si es un ID numérico de demo)
        const local = getProductById(id);
        
        if (local) {
          setProduct(local);
          setLoading(false);
          return;
        }

        // 2. Si no es local, buscar en el backend (UUID)
        const response = await fetch(`http://localhost:3000/api/productos/ObtenerProductoPorId/${id}`);
        const data = await response.json();

        if (data.codigo === 0 && data.producto) {
          const p = data.producto;
          const v = p.perfiles;
          
          setProduct({
            id: p.id,
            user_id: p.user_id,
            title: p.titulo,
            description: p.descripcion,
            price: p.precio,
            image: normalizeImageUrl(p.imagen) || `https://picsum.photos/seed/${p.id}/1200/900`,
            category: p.categoria || p.tipo || 'General',
            rating: 5.0,
            reviews: 0,
            badges: ['Verificado'],
            characteristics: ['Verificado por ScriptBay', 'Código original', 'Soporte del autor'],
            includes: ['Código fuente', 'Documentación básica'],
            requirements: ['Entorno Node.js', 'Conexión a internet'],
            vendor: { 
              name: v?.nombre || 'Usuario Market', 
              avatar: v?.nombre ? v.nombre.substring(0,2).toUpperCase() : 'UM' 
            }
          });
        }
      } catch (err) {
        console.error('Error cargando producto:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [id]);

  const handleAbrirModal = () => {
    if (!session) {
      setEstadoPago('error');
      setMensajePago('Debes iniciar sesión para comprar');
      setModalAbierto(true);
      return;
    }
    setEstadoPago('idle');
    setMensajePago('');
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setEstadoPago('idle');
    setMensajePago('');
    setHashBlockchain('');
    setMetodoPago('visa');
    setTipoPago('stripe');
  };

  // Flujo PayPal: crea la orden en el backend, abre popup y espera postMessage (tecnica del proyecto de clase)
  const handleConfirmarPagoPayPal = async () => {
    setEstadoPago('cargando');
    console.log('[ScriptBay] Iniciando pago PayPal - Producto:', product.title, '| Precio:', product.price, 'EUR');

    const resultado = await postIniciarPagoPayPal(product.id, product.title, product.price);
    if (resultado.codigo !== 0) {
      setEstadoPago('error');
      setMensajePago(resultado.mensaje);
      return;
    }

    const popup = window.open(resultado.urlAprobacion, 'paypal_popup', 'width=600,height=700,scrollbars=yes');
    if (!popup) {
      setEstadoPago('error');
      setMensajePago('El navegador bloqueó el popup de PayPal. Permite los popups para este sitio e inténtalo de nuevo.');
      return;
    }

    // Escuchamos el postMessage que manda el popup al cerrarse (misma tecnica que en el proyecto de clase)
    const onMessage = (event) => {
      if (event.data?.tipo === 'PAYPAL_OK') {
        window.removeEventListener('message', onMessage);
        setEstadoPago('ok');
        setMensajePago('¡Pago con PayPal realizado correctamente!');
        console.log('[ScriptBay] PayPal pago OK - Order ID:', event.data.orderId);
      } else if (event.data?.tipo === 'PAYPAL_ERROR') {
        window.removeEventListener('message', onMessage);
        setEstadoPago('error');
        setMensajePago(event.data.error || 'Error al procesar el pago con PayPal');
        console.log('[ScriptBay] PayPal pago ERROR:', event.data.error);
      }
    };
    window.addEventListener('message', onMessage);
  };

  const handleConfirmarPago = async () => {
    setEstadoPago('cargando');
    console.log("[ScriptBay] Iniciando pago - Producto:", product.title, "| Precio:", product.price, "EUR");
    const resultado = await postPagarProducto(product.title, product.price, metodoPago);
    if (resultado.codigo === 0) {
      setEstadoPago('ok');
      setMensajePago(resultado.mensaje);
      setHashBlockchain(resultado.blockchainHash);
      console.log("[ScriptBay] Pago realizado con exito - PaymentIntent:", resultado.paymentIntentId);
      console.log("[ScriptBay] Hash de Blockchain:", resultado.blockchainHash);
    } else {
      setEstadoPago('error');
      setMensajePago(resultado.mensaje);
      console.log("[ScriptBay] Error en el pago:", resultado.mensaje);
    }
  };

  const esPropietario = session && product && session.datosCliente?.id === product.user_id;

  if (loading) {
    return (
      <div className="pt-28 flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!product) {
    return (
      <section className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/30 shadow-sm dark:shadow-none p-8 text-center">
          <h1 className="text-base-primary text-2xl font-bold">Producto no encontrado</h1>
          <p className="mt-3 text-dimmed">No existe un producto con ese ID.</p>
          <Link
            to="/"
            className="btn-secondary mt-6 px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al marketplace
          </Link>
        </div>
      </section>
    );
  }

  const relatedProducts = getRelatedProducts(product.id, product.category, 4);
  const isService = /servicio/i.test(product.category) || /servicio/i.test(product.title);
  const sectionClass = `${sectionBaseClass} ${
    isService
      ? 'hover:border-blue-400/30 hover:bg-blue-50 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/5 hover:shadow-[0_12px_30px_-24px_rgba(59,130,246,0.20)] dark:hover:shadow-[0_12px_30px_-24px_rgba(59,130,246,0.35)]'
      : 'hover:border-violet-400/30 hover:bg-violet-50 dark:hover:border-violet-500/20 dark:hover:bg-violet-500/5 hover:shadow-[0_12px_30px_-24px_rgba(168,85,247,0.15)] dark:hover:shadow-[0_12px_30px_-24px_rgba(168,85,247,0.35)]'
  }`;
  const accentBadgeClass = isService
    ? 'border-blue-400/50 bg-blue-100 text-blue-700 dark:border-blue-400/35 dark:bg-blue-500/10 dark:text-blue-200'
    : 'border-violet-400/50 bg-violet-100 text-violet-700 dark:border-violet-400/35 dark:bg-violet-500/10 dark:text-violet-200';
  const categoryBadgeClass = isService
    ? 'border-blue-400/50 bg-blue-100 text-blue-700 dark:border-blue-400/35 dark:bg-blue-500/10 dark:text-blue-200'
    : 'border-primary/50 bg-red-100 text-red-600 dark:border-primary/35 dark:bg-primary/10 dark:text-red-200';
  const imageShadowClass = isService
    ? 'shadow-[0_16px_40px_-18px_rgba(59,130,246,0.28)]'
    : 'shadow-[0_16px_40px_-18px_rgba(168,85,247,0.28)]';
  const panelHoverClass = isService
    ? 'hover:border-blue-400/30 hover:bg-blue-50 dark:hover:border-blue-500/25 dark:hover:bg-blue-500/5 dark:hover:shadow-[0_18px_46px_-26px_rgba(59,130,246,0.55)]'
    : 'hover:border-violet-400/30 hover:bg-violet-50 dark:hover:border-violet-500/25 dark:hover:bg-violet-500/5 dark:hover:shadow-[0_18px_46px_-26px_rgba(168,85,247,0.55)]';
  const auraStyle = {
    background: isService ? 'rgba(59,130,246,0.24)' : 'rgba(168,85,247,0.24)',
  };
  const ambientGlowStyle = {
    background: isService ? 'rgba(59,130,246,0.22)' : 'rgba(168,85,247,0.22)',
    left: isService ? '68%' : '-8%',
    top: isService ? '58%' : '-10%',
  };
  const trustBadges = ['🔥 Top ventas', '⚡ Entrega inmediata', '✔ Verificado'];
  const idForCalculation = Number(product.id) || 0;
  const salesCount = (product.reviews || 0) * 6 + idForCalculation * 5;

  return (
    <section className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative space-y-10">
        <div className="pointer-events-none absolute h-[460px] w-[460px] rounded-full blur-3xl transition-all duration-500" style={ambientGlowStyle} />

        <div className="relative z-10 space-y-10">
        <motion.div variants={itemVariants}>
          <Link
            to="/"
            className="btn-secondary text-sm hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div layoutId={`product-image-${product.id}`} variants={itemVariants} className={`relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/30 ${imageShadowClass}`}>
            <img
              src={product.image}
              alt={product.title}
              className="h-full min-h-[360px] w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <div className={`${sectionClass} ${panelHoverClass}`}>
              <div className="mb-4 flex flex-wrap gap-2">
                {trustBadges.map((badge) => (
                  <span key={badge} className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBadgeClass}`}>
                    {badge}
                  </span>
                ))}
                {product.badges.map((badge) => (
                  <span key={badge} className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBadgeClass}`}>
                    {badge}
                  </span>
                ))}
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryBadgeClass}`}>
                  {product.category}
                </span>
              </div>

              <motion.h1 layoutId={`product-title-${product.id}`} className="text-base-primary text-3xl font-bold leading-tight">{product.title}</motion.h1>
              <p className="mt-4 text-[15px] leading-7 text-dimmed">{product.description}</p>

              <div className="mt-5 flex items-center gap-3 text-sm text-faint">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{product.rating} · {product.reviews} reviews</span>
                <span className="text-zinc-300 dark:text-white/35">•</span>
                <span className="font-medium text-subtle">+{salesCount} ventas</span>
              </div>

              <div className="mt-7 flex items-end justify-between gap-5">
                <div>
                  <span className="text-sm text-dimmed">Precio</span>
                  <motion.p layoutId={`product-price-${product.id}`} className="text-base-primary text-5xl font-black tracking-tight">{product.price}€</motion.p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!esPropietario ? (
                    <button onClick={handleAbrirModal} className="group relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-violet-300 dark:border-white/25 bg-linear-to-r from-violet-500 via-violet-600 to-primary dark:from-white/18 dark:via-violet-400/18 dark:to-primary/28 px-6 py-3 font-bold text-white backdrop-blur-md shadow-[0_8px_20px_-8px_rgba(168,85,247,0.5)] dark:shadow-[0_12px_28px_-14px_rgba(168,85,247,0.45)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_12px_28px_-10px_rgba(168,85,247,0.55)] dark:hover:border-violet-300/45 dark:hover:shadow-[0_20px_40px_-18px_rgba(168,85,247,0.62),0_0_16px_rgba(239,68,68,0.35)] active:scale-95">
                      <span className="pointer-events-none absolute -inset-1 rounded-2xl opacity-45 blur-md transition-opacity duration-500 group-hover:opacity-80" style={auraStyle}></span>
                      <span className="pointer-events-none absolute inset-y-0 -left-[28%] w-[38%] -skew-x-12 bg-linear-to-r from-transparent via-white/60 to-transparent transition-all duration-700 group-hover:left-[118%]"></span>
                      <span className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/12 to-transparent opacity-90"></span>
                      <span className="relative inline-flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" /> Comprar
                      </span>
                    </button>
                  ) : (
                    <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-dimmed">
                      Este es tu producto
                    </div>
                  )}
                  <p className="text-[11px] font-medium tracking-wide text-faint">Pago seguro • Acceso inmediato • Soporte incluido</p>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-subtle">Vendedor</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`grid h-14 w-14 place-content-center rounded-2xl border bg-zinc-100 dark:bg-white/10 text-base font-black text-zinc-800 dark:text-white shadow-[0_12px_26px_-16px_rgba(168,85,247,0.75)] ${
                    isService ? 'border-blue-400/35' : 'border-violet-400/35'
                  }`}>
                    {product.vendor.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-base-primary">{product.vendor.name}</p>
                    <p className="text-sm text-dimmed">Vendedor verificado</p>
                  </div>
                </div>
                {!esPropietario && (
                  <button className={`btn-secondary hover:scale-[1.03] ${
                    isService ? 'hover:border-blue-400/35 hover:bg-blue-500/10' : 'hover:border-violet-400/35 hover:bg-violet-500/10'
                  }`}>
                    <MessageCircle className="h-4 w-4" /> Contactar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
          <div className={sectionClass}>
            <h3 className="mb-4 inline-flex items-center gap-2 text-base font-semibold text-base-primary"><span className="text-lg">⚙️</span><ShieldCheck className="h-4 w-4 text-violet-500 dark:text-violet-300" /> Características</h3>
            <ul className="space-y-2.5 text-sm text-dimmed">
              {product.characteristics.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className={sectionClass}>
            <h3 className="mb-4 inline-flex items-center gap-2 text-base font-semibold text-base-primary"><span className="text-lg">📦</span><PackageCheck className="h-4 w-4 text-red-500 dark:text-red-300" /> Incluye</h3>
            <ul className="space-y-2.5 text-sm text-dimmed">
              {product.includes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className={sectionClass}>
            <h3 className="mb-4 inline-flex items-center gap-2 text-base font-semibold text-base-primary"><span className="text-lg">📄</span><ClipboardList className="h-4 w-4 text-zinc-500 dark:text-white/80" /> Requisitos</h3>
            <ul className="space-y-2.5 text-sm text-dimmed">
              {product.requirements.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {relatedProducts.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-base-primary">Productos relacionados</h2>
              <span className="text-sm text-dimmed">Misma categoría: {product.category}</span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} {...related} />
              ))}
            </div>
          </motion.div>
        )}
        </div>
      </motion.div>
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0e0e12] p-7 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)]"
          >
            <button onClick={handleCerrarModal} className="absolute right-5 top-5 rounded-lg p-1 text-zinc-400 dark:text-white/40 transition hover:text-zinc-700 dark:hover:text-white/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50">
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-full border border-yellow-300 dark:border-yellow-400/40 bg-yellow-100 dark:bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                🧪 Modo Desarrollador — Pago de Prueba
              </span>
            </div>

            <h2 className="mb-1 text-base-primary text-xl font-bold">{product.title}</h2>
            <p className="mb-6 text-base-primary text-3xl font-black">{product.price}€</p>

            {/* Selector de pasarela de pago */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-dimmed">Forma de pago</p>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTipoPago('stripe')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition hover:scale-[1.03] active:scale-95 ${
                    tipoPago === 'stripe'
                      ? 'border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-400/70 dark:bg-violet-500/20 dark:text-violet-200'
                      : 'border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-dimmed hover:border-violet-300 dark:hover:border-violet-400/40'
                  }`}
                >
                  💳 Tarjeta
                </button>
                <button
                  onClick={() => setTipoPago('paypal')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition hover:scale-[1.03] active:scale-95 ${
                    tipoPago === 'paypal'
                      ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-400/70 dark:bg-blue-500/20 dark:text-blue-200'
                      : 'border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-dimmed hover:border-blue-300 dark:hover:border-blue-400/40'
                  }`}
                >
                  🅿️ PayPal
                </button>
              </div>

              {/* Subtabs de tarjeta solo cuando tipoPago es stripe */}
              {tipoPago === 'stripe' && (
                <div className="flex gap-2">
                  {Object.entries(tarjetasPrueba).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setMetodoPago(key)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-bold transition hover:scale-[1.03] active:scale-95 ${
                        metodoPago === key
                          ? 'border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-400/70 dark:bg-violet-500/20 dark:text-violet-200'
                          : 'border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-dimmed hover:border-violet-300 dark:hover:border-violet-400/40'
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detalle de tarjeta Stripe */}
            {tipoPago === 'stripe' && (
              <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-dimmed">
                  <CreditCard className="h-4 w-4" /> Tarjeta de prueba Stripe — {tarjetasPrueba[metodoPago].label}
                </div>
                <p className="font-mono text-base-primary text-lg tracking-widest">{tarjetasPrueba[metodoPago].numero}</p>
                <div className="mt-1 flex gap-4 text-sm text-faint">
                  <span>EXP {tarjetasPrueba[metodoPago].exp}</span>
                  <span>CVC {tarjetasPrueba[metodoPago].cvc}</span>
                </div>
              </div>
            )}

            {/* Info PayPal sandbox */}
            {tipoPago === 'paypal' && (
              <div className="mb-6 rounded-2xl border border-blue-400/30 bg-blue-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                  🅿️ PayPal Sandbox
                </div>
                <p className="text-sm text-dimmed leading-relaxed">
                  Se abrirá una ventana de PayPal para completar el pago de forma segura.
                  Usa una cuenta de <span className="font-semibold text-blue-500">PayPal sandbox</span> para probar.
                </p>
                <p className="mt-2 text-xs text-faint">
                  Crea cuentas de prueba en <span className="font-mono">developer.paypal.com → Sandbox → Accounts</span>
                </p>
              </div>
            )}

            {estadoPago === 'idle' && (
              <button
                onClick={tipoPago === 'paypal' ? handleConfirmarPagoPayPal : handleConfirmarPago}
                className={`w-full rounded-2xl border py-3 font-bold transition hover:scale-[1.02] active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 ${
                  tipoPago === 'paypal'
                    ? 'border-blue-400/35 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-600/35 focus-visible:ring-blue-400/50'
                    : 'border-violet-400/35 bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-white hover:bg-violet-200 dark:hover:bg-violet-600/35 focus-visible:ring-primary/50'
                }`}
              >
                {tipoPago === 'paypal' ? '🅿️ Pagar con PayPal' : 'Confirmar Pago'}
              </button>
            )}

            {estadoPago === 'cargando' && (
              <div className="flex items-center justify-center gap-3 py-3 text-subtle">
                <Loader className="h-5 w-5 animate-spin" /> Procesando pago...
              </div>
            )}

            {estadoPago === 'ok' && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CheckCircle className="h-10 w-10 text-green-400" />
                <p className="font-semibold text-green-700 dark:text-green-300">¡Pago realizado correctamente!</p>
                <p className="text-sm text-dimmed">{mensajePago}</p>
                
                {hashBlockchain && (
                  <div className="mt-4 w-full rounded-2xl border border-blue-400/30 bg-blue-500/5 p-4 text-left">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                      <ShieldCheck className="h-3.5 w-3.5" /> Certificado Blockchain
                    </p>
                    <p className="font-mono text-[10px] break-all text-blue-400/80">
                      {hashBlockchain}
                    </p>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${hashBlockchain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-[11px] font-bold text-blue-500 hover:underline"
                    >
                      Ver en Etherscan →
                    </a>
                  </div>
                )}

                <button onClick={handleCerrarModal} className="btn-secondary mt-4 w-full px-5 py-2 text-sm">
                  Cerrar
                </button>
              </div>
            )}

            {estadoPago === 'error' && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="font-semibold text-red-700 dark:text-red-300">Error al procesar el pago</p>
                <p className="text-sm text-dimmed">{mensajePago}</p>
                <button onClick={handleCerrarModal} className="btn-secondary mt-2 px-5 py-2 text-sm">
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default ProductDetail;
