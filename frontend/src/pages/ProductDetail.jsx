import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, ShoppingCart, Star, ShieldCheck, PackageCheck, ClipboardList } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProductById, getRelatedProducts } from '../data/products';

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
  'group rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-7 shadow-[0_10px_26px_rgba(0,0,0,0.26)] transition-all duration-300 hover:scale-[1.01]';

const ProductDetail = () => {
  const { id } = useParams();
  const product = getProductById(id);

  if (!product) {
    return (
      <section className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <p className="mt-3 text-white/60">No existe un producto con ese ID.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-semibold transition hover:bg-white/10"
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
      ? 'hover:border-blue-500/20 hover:bg-blue-500/5 hover:shadow-[0_12px_30px_-24px_rgba(59,130,246,0.35)]'
      : 'hover:border-violet-500/20 hover:bg-violet-500/5 hover:shadow-[0_12px_30px_-24px_rgba(168,85,247,0.35)]'
  }`;
  const accentBadgeClass = isService
    ? 'border-blue-400/35 bg-blue-500/10 text-blue-200'
    : 'border-violet-400/35 bg-violet-500/10 text-violet-200';
  const categoryBadgeClass = isService
    ? 'border-blue-400/35 bg-blue-500/10 text-blue-200'
    : 'border-primary/35 bg-primary/10 text-red-200';
  const imageShadowClass = isService
    ? 'shadow-[0_16px_40px_-18px_rgba(59,130,246,0.28)]'
    : 'shadow-[0_16px_40px_-18px_rgba(168,85,247,0.28)]';
  const panelHoverClass = isService
    ? 'hover:border-blue-500/25 hover:bg-blue-500/5 hover:shadow-[0_18px_46px_-26px_rgba(59,130,246,0.55)]'
    : 'hover:border-violet-500/25 hover:bg-violet-500/5 hover:shadow-[0_18px_46px_-26px_rgba(168,85,247,0.55)]';
  const auraStyle = {
    background: isService ? 'rgba(59,130,246,0.24)' : 'rgba(168,85,247,0.24)',
  };
  const ambientGlowStyle = {
    background: isService ? 'rgba(59,130,246,0.22)' : 'rgba(168,85,247,0.22)',
    left: isService ? '68%' : '-8%',
    top: isService ? '58%' : '-10%',
  };
  const trustBadges = ['🔥 Top ventas', '⚡ Entrega inmediata', '✔ Verificado'];
  const salesCount = product.reviews * 6 + product.id * 5;

  return (
    <section className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative space-y-10">
        <div className="pointer-events-none absolute h-[460px] w-[460px] rounded-full blur-3xl transition-all duration-500" style={ambientGlowStyle} />

        <div className="relative z-10 space-y-10">
        <motion.div variants={itemVariants}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:scale-[1.02] hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div layoutId={`product-image-${product.id}`} variants={itemVariants} className={`relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 ${imageShadowClass}`}>
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

              <motion.h1 layoutId={`product-title-${product.id}`} className="text-3xl font-bold leading-tight">{product.title}</motion.h1>
              <p className="mt-4 text-[15px] leading-7 text-white/65">{product.description}</p>

              <div className="mt-5 flex items-center gap-3 text-sm text-white/75">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{product.rating} · {product.reviews} reviews</span>
                <span className="text-white/35">•</span>
                <span className="font-medium text-white/85">+{salesCount} ventas</span>
              </div>

              <div className="mt-7 flex items-end justify-between gap-5">
                <div>
                  <span className="text-sm text-white/45">Precio</span>
                  <motion.p layoutId={`product-price-${product.id}`} className="text-5xl font-black tracking-tight text-white">{product.price}€</motion.p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="group relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-white/25 bg-linear-to-r from-white/18 via-violet-400/18 to-primary/28 px-6 py-3 font-bold text-white backdrop-blur-md shadow-[0_12px_28px_-14px_rgba(168,85,247,0.45)] transition-all duration-300 hover:scale-[1.04] hover:border-violet-300/45 hover:shadow-[0_20px_40px_-18px_rgba(168,85,247,0.62),0_0_16px_rgba(239,68,68,0.35)] active:scale-95">
                    <span className="pointer-events-none absolute -inset-1 rounded-2xl opacity-45 blur-md transition-opacity duration-500 group-hover:opacity-80" style={auraStyle}></span>
                    <span className="pointer-events-none absolute inset-y-0 -left-[28%] w-[38%] -skew-x-12 bg-linear-to-r from-transparent via-white/60 to-transparent transition-all duration-700 group-hover:left-[118%]"></span>
                    <span className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/12 to-transparent opacity-90"></span>
                    <span className="relative inline-flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" /> Comprar
                    </span>
                  </button>
                  <p className="text-[11px] font-medium tracking-wide text-white/55">Pago seguro • Acceso inmediato • Soporte incluido</p>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Vendedor</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`grid h-14 w-14 place-content-center rounded-2xl border bg-white/10 text-base font-black text-white shadow-[0_12px_26px_-16px_rgba(168,85,247,0.75)] ${
                    isService ? 'border-blue-400/35' : 'border-violet-400/35'
                  }`}>
                    {product.vendor.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{product.vendor.name}</p>
                    <p className="text-sm text-white/70">Vendedor verificado</p>
                  </div>
                </div>
                <button className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-semibold transition-all hover:scale-[1.03] ${
                  isService ? 'hover:border-blue-400/35 hover:bg-blue-500/10' : 'hover:border-violet-400/35 hover:bg-violet-500/10'
                }`}>
                  <MessageCircle className="h-4 w-4" /> Contactar
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
          <div className={sectionClass}>
            <h3 className="mb-4 inline-flex items-center gap-2 text-base font-semibold"><span className="text-lg">⚙️</span><ShieldCheck className="h-4 w-4 text-violet-300" /> Características</h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              {product.characteristics.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className={sectionClass}>
            <h3 className="mb-4 inline-flex items-center gap-2 text-base font-semibold"><span className="text-lg">📦</span><PackageCheck className="h-4 w-4 text-red-300" /> Incluye</h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              {product.includes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className={sectionClass}>
            <h3 className="mb-4 inline-flex items-center gap-2 text-base font-semibold"><span className="text-lg">📄</span><ClipboardList className="h-4 w-4 text-white/80" /> Requisitos</h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              {product.requirements.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {relatedProducts.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Productos relacionados</h2>
              <span className="text-sm text-white/50">Misma categoría: {product.category}</span>
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
    </section>
  );
};

export default ProductDetail;
