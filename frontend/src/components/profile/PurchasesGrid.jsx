import React, { useEffect, useState } from 'react';
import { Box, CalendarDays, CheckCircle2, Clock3, Info, PackageOpen, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export const mockPurchases = [
  {
    id: 1,
    productId: 27,
    title: 'Bot de trading automatico',
    price: '0.25 ETH',
    date: '2026-05-01',
    status: 'completed',
    type: 'producto',
    purchaseType: 'single',
    image: 'https://picsum.photos/seed/trading-bot/800/500'
  },
  {
    id: 2,
    productId: 6,
    title: 'Script automatizacion Discord',
    price: '0.08 ETH',
    date: '2026-04-28',
    status: 'pending',
    type: 'servicio',
    purchaseType: 'repeatable',
    image: 'https://picsum.photos/seed/discord-script/800/500'
  },
  {
    id: 3,
    productId: 38,
    title: 'Pack prompts IA para ventas',
    price: '0.04 ETH',
    date: '2026-04-22',
    status: 'completed',
    type: 'producto',
    purchaseType: 'single',
    image: 'https://picsum.photos/seed/prompt-pack/800/500'
  },
  {
    id: 4,
    productId: 3,
    title: 'Plantilla SaaS dashboard React',
    price: '0.11 ETH',
    date: '2026-04-18',
    status: 'completed',
    type: 'producto',
    purchaseType: 'single',
    image: 'https://picsum.photos/seed/saas-template/800/500'
  },
  {
    id: 5,
    productId: 11,
    title: 'Automatizacion scraping de leads',
    price: '0.14 ETH',
    date: '2026-04-15',
    status: 'pending',
    type: 'servicio',
    purchaseType: 'repeatable',
    image: 'https://picsum.photos/seed/leads-scraper/800/500'
  },
  {
    id: 6,
    productId: 10,
    title: 'Plugin Notion API workflows',
    price: '0.06 ETH',
    date: '2026-04-10',
    status: 'completed',
    type: 'servicio',
    purchaseType: 'repeatable',
    image: 'https://picsum.photos/seed/notion-plugin/800/500'
  },
  {
    id: 7,
    productId: 25,
    title: 'Pack UI neon components',
    price: '0.09 ETH',
    date: '2026-04-06',
    status: 'pending',
    type: 'producto',
    purchaseType: 'single',
    image: 'https://picsum.photos/seed/neon-ui-kit/800/500'
  },
  {
    id: 8,
    productId: 23,
    title: 'Sistema de facturacion Stripe',
    price: '0.21 ETH',
    date: '2026-03-30',
    status: 'completed',
    type: 'servicio',
    purchaseType: 'repeatable',
    image: 'https://picsum.photos/seed/stripe-billing/800/500'
  }
];

const statusStyles = {
  completed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35',
  pending: 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
};

const typeStyles = {
  producto: 'bg-purple-500/20 text-purple-400 border border-purple-400/35',
  servicio: 'bg-blue-500/20 text-blue-400 border border-blue-400/35'
};

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'completed' || value === 'completado') return 'completed';
  return 'pending';
};

const normalizeType = (type) => {
  const value = String(type || '').toLowerCase();
  return value === 'servicio' ? 'servicio' : 'producto';
};

const normalizePurchaseType = (purchaseType, type) => {
  const value = String(purchaseType || '').toLowerCase();
  if (value === 'single' || value === 'repeatable') return value;
  return normalizeType(type) === 'servicio' ? 'repeatable' : 'single';
};

const getCtaConfig = ({ purchaseType, status, targetProductId, type }) => {
  if (status === 'pending') {
    return {
      label: 'Pago en confirmacion',
      disabled: true,
      to: null
    };
  }

  if (purchaseType === 'single' && status === 'completed') {
    return {
      label: 'Acceder',
      disabled: !targetProductId,
      to: targetProductId ? `/producto/${targetProductId}` : null
    };
  }

  if (purchaseType === 'repeatable' && type === 'servicio') {
    return {
      label: 'Ver servicio',
      disabled: !targetProductId,
      to: targetProductId ? `/producto/${targetProductId}` : null
    };
  }

  return {
    label: 'Ver producto',
    disabled: !targetProductId,
    to: targetProductId ? `/producto/${targetProductId}` : null
  };
};

const getPurchaseHint = ({ purchaseType, status, type }) => {
  if (purchaseType === 'single' && status === 'completed') {
    return type === 'producto' ? 'Compra unica' : 'Ya adquirido';
  }

  if (purchaseType === 'repeatable' && status === 'completed') {
    return type === 'servicio' ? 'Recontratable' : 'Puedes comprarlo de nuevo';
  }

  if (status === 'pending') {
    return 'Compra en validacion';
  }

  return 'Disponible';
};

const formatDate = (isoDate) => {
  try {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
};

const getDaysSince = (isoDate) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return days;
};

const PurchasesGrid = ({ purchases = mockPurchases }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!purchases.length) {
    return (
      <section
        className={`rounded-2xl border border-red-500/20 bg-gradient-to-br from-zinc-950/85 via-zinc-900/80 to-black/85 backdrop-blur-lg p-8 text-center transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <PackageOpen className="h-6 w-6 text-red-300" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">Aun no tienes compras</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Cuando compres productos o servicios, apareceran aqui.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {purchases.map((purchase, index) => {
          const status = normalizeStatus(purchase.status);
          const type = normalizeType(purchase.type);
          const purchaseType = normalizePurchaseType(purchase.purchaseType, type);
          const statusLabel = status === 'completed' ? 'Completado' : 'Pendiente';
          const typeLabel = type === 'producto' ? 'Producto' : 'Servicio';
          const badgeClass = statusStyles[status] || statusStyles.pending;
          const typeBadgeClass = typeStyles[type] || typeStyles.producto;
          const typeIcon = type === 'servicio'
            ? <Zap className="h-3.5 w-3.5" />
            : <Box className="h-3.5 w-3.5" />;
          const targetProductId = purchase.productId || purchase.idProducto || purchase.product_id;
          const cta = getCtaConfig({ purchaseType, status, targetProductId, type });
          const hintText = getPurchaseHint({ purchaseType, status, type });
          const isService = type === 'servicio';
          const formattedDate = formatDate(purchase.date);
          const daysSince = getDaysSince(purchase.date);
          const cardToneClass = isService
            ? 'hover:border-blue-500/40 hover:shadow-[0_20px_45px_-25px_rgba(59,130,246,0.45),0_10px_30px_rgba(255,0,0,0.25)]'
            : 'hover:border-purple-500/40 hover:shadow-[0_20px_45px_-25px_rgba(168,85,247,0.45),0_10px_30px_rgba(255,0,0,0.25)]';
          const titleToneClass = isService ? 'group-hover:text-blue-300' : 'group-hover:text-purple-300';
          const ctaToneClass = isService
            ? 'border-blue-400/70 bg-blue-500/30 text-white hover:border-blue-300 hover:bg-blue-500/45 hover:shadow-[0_0_16px_rgba(59,130,246,0.45)]'
            : 'border-purple-400/70 bg-purple-500/30 text-white hover:border-purple-300 hover:bg-purple-500/45 hover:shadow-[0_0_16px_rgba(168,85,247,0.45)]';
          const statusIcon = status === 'completed'
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <Clock3 className="h-3.5 w-3.5" />;
          const statusSubLabel = status === 'completed' ? 'Acceso disponible' : 'Pendiente de validacion';
          const isLoading = loadingId === purchase.id;

          return (
            <motion.article
              key={purchase.id}
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.99 }}
              className={`surface-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950/90 via-zinc-900/75 to-black/85 backdrop-blur-lg transition-all duration-300 ease-out hover:bg-gradient-to-br hover:from-zinc-900/95 hover:via-zinc-900/85 hover:to-black/90 ${cardToneClass}`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-black">
                <img
                  src={purchase.image}
                  alt={purchase.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900/70 dark:from-darker to-transparent opacity-60" />
                <div className="absolute left-3 top-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur ${typeBadgeClass}`}>
                    {typeIcon}
                    {typeLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h4 className={`line-clamp-2 text-lg font-semibold text-base-primary transition-colors ${titleToneClass}`}>
                    {purchase.title}
                  </h4>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                      {statusIcon}
                      {statusLabel}
                    </span>
                    <p className="mt-1 text-[11px] text-zinc-400">{statusSubLabel}</p>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400">{hintText}</span>
                  {daysSince !== null && status === 'completed' && (
                    <span className="text-[11px] text-zinc-500">Ultimo acceso hace {daysSince} dias</span>
                  )}
                </div>

                <div className="mb-5">
                  <p className={`text-2xl font-bold ${isService ? 'text-blue-300' : 'text-purple-300'}`}>{purchase.price}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Comprado el {formattedDate}
                  </p>
                </div>

                {!cta.disabled && cta.to ? (
                  <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoadingId(purchase.id);
                        window.setTimeout(() => {
                          navigate(cta.to, { state: { from: '/profile?view=compras', fromLabel: 'Volver a mis compras' } });
                          setLoadingId(null);
                        }, 260);
                      }}
                      className={`w-full rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${ctaToneClass}`}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Abriendo...' : cta.label}
                    </button>
                    <Link
                      to={cta.to}
                      state={{ from: '/profile?view=compras', fromLabel: 'Volver a mis compras' }}
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-all duration-300 hover:scale-105 hover:border-white/25 hover:bg-white/10"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span className="ml-1">Ver detalles</span>
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-auto w-full cursor-not-allowed rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-2.5 text-sm font-semibold text-zinc-500"
                  >
                    {cta.label}
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default PurchasesGrid;
