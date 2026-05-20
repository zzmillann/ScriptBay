import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Star, Trash2, ShoppingBag, TrendingUp } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrl';
import PurchasesGrid, { mockPurchases } from './PurchasesGrid';

const ProfileDetailView = ({
    activeSection,
    isCatalogView,
    activeView,
    avatarUrl,
    avatarOffset,
    form,
    getInitials,
    sellerRating,
    sellerReviews,
    catalogItems,
    misProductos,
    catalogFilter,
    isServiceProduct,
    handleEliminarProducto,
    misCompras,
    sellerSales,
    publishedCount,
    activeServicesCount
}) => {
    const normalizedPurchases = (misCompras || []).map((compra, index) => ({
        id: compra.id || `compra-${index}`,
        productId: compra.producto_id || compra.productId || compra.product_id || compra.idProducto || compra.id_producto || compra.id_producto_comprado,
        title: compra.titulo || 'Compra sin titulo',
        price: compra.precio ? `${compra.precio} EUR` : (compra.metodo_pago || 'Sin precio'),
        date: compra.created_at || new Date().toISOString().slice(0, 10),
        status: String(compra.estado || '').toLowerCase().includes('pend') ? 'Pendiente' : 'Completado',
        type: compra.productos?.tipo || compra.productos?.categoria || compra.tipo || compra.type || 'producto',
        image: compra.productos?.imagen ? normalizeImageUrl(compra.productos.imagen) : `https://via.placeholder.com/300x180/171717/ffffff?text=Compra+${index + 1}`
    }));
    const purchasesToRender = normalizedPurchases.length ? normalizedPurchases : mockPurchases;

    return (
        <>
            {activeSection === 'productos' && isCatalogView && (
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,26,26,0.13),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] py-6 px-6 sm:py-7 sm:px-8 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-base sm:text-lg font-semibold text-base-primary">
                            {activeView === 'servicios' ? 'Vista detallada: Servicios' : 'Vista detallada: Productos'}
                        </h2>
                        <Link to="/profile" className="btn-secondary text-sm">Volver al panel</Link>
                    </div>
                    <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-[3px] border-primary/50 bg-linear-to-br from-primary to-accent text-white flex items-center justify-center text-4xl font-bold shadow-[0_20px_50px_-18px_rgba(255,26,26,0.75)]">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Foto de perfil"
                                    className="w-full h-full object-contain"
                                    style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
                                />
                            ) : (
                                <span>{getInitials(form.nombre || 'Usuario')}</span>
                            )}
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-base-primary">{form.nombre || 'Tu nombre'}</p>
                        <p className="text-sm sm:text-base text-amber-300">⭐ {sellerRating} ({sellerReviews} valoraciones)</p>
                        {sellerReviews > 10 && <p className="text-xs text-emerald-400">✔ Vendedor verificado</p>}
                        <p className="text-xs text-faint mt-1">
                            {activeView === 'servicios' ? 'Servicios activos del vendedor' : 'Productos publicados por el vendedor'}
                        </p>
                    </div>

                    <div className="relative mt-5 sm:mt-6 rounded-2xl border border-white/[0.05] bg-white/85 dark:bg-black/30 backdrop-blur-md p-4 sm:p-6 shadow-[0_0_30px_rgba(255,0,80,0.15),0_0_60px_rgba(255,0,80,0.08)] transition-all duration-300 ease-out hover:shadow-[0_0_40px_rgba(255,0,80,0.25),0_0_80px_rgba(255,0,80,0.12)]">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(255,0,80,0.05),transparent_70%)]" />
                        {catalogItems.length === 0 ? (
                            <p className="text-faint text-sm text-center">
                                {misProductos.length === 0
                                    ? 'Todavia no has publicado productos.'
                                    : `No hay ${catalogFilter} en tu catalogo todavia.`}
                            </p>
                        ) : (
                            <div className={catalogItems.length === 1 ? 'max-w-md mx-auto' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                                {catalogItems.map((product) => {
                                    const imageUrl = normalizeImageUrl(product.imagen) || `https://picsum.photos/seed/profile-${product.id}/500/320`;
                                    const productType = String(product?.type ?? product?.tipo ?? '').toLowerCase();
                                    const isService = productType === 'service' || productType === 'servicio' || isServiceProduct(product);
                                    const toneHoverClass = isService
                                        ? 'hover:border-blue-500/45 hover:shadow-blue-500/30'
                                        : 'hover:border-purple-500/45 hover:shadow-purple-500/30';
                                    const productRating = Number(product?.rating_promedio ?? product?.rating ?? 4.8);
                                    const productReviews = Number(product?.total_resenas ?? product?.resenas ?? 12);
                                    const productBadge = product.id % 3 === 0 ? 'Top' : 'Nuevo';

                                    return (
                                        <article
                                            key={product.id}
                                            className={`group rounded-2xl overflow-hidden border border-zinc-300/70 dark:border-white/10 bg-white dark:bg-zinc-900/95 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg ${toneHoverClass}`}
                                        >
                                            <Link
                                                to={`/producto/${product.id}`}
                                                state={{ from: `/profile?view=${activeView === 'servicios' ? 'servicios' : 'productos'}`, fromLabel: 'Volver a mis productos' }}
                                                className="block"
                                            >
                                                <div className="relative w-full h-44 bg-zinc-100 dark:bg-black overflow-hidden rounded-t-xl">
                                                    <img
                                                        src={imageUrl}
                                                        alt={product.titulo || 'Producto'}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                                                    <span className="absolute top-2.5 right-2.5 rounded-full bg-red-500/20 text-red-200 text-[10px] px-2 py-1 border border-red-400/35 backdrop-blur-sm">
                                                        {productBadge}
                                                    </span>
                                                </div>
                                            </Link>

                                            <div className="px-3 py-2 flex flex-col gap-1.5">
                                                <Link
                                                    to={`/producto/${product.id}`}
                                                    state={{ from: `/profile?view=${activeView === 'servicios' ? 'servicios' : 'productos'}`, fromLabel: 'Volver a mis productos' }}
                                                    className="block"
                                                >
                                                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 min-h-10">
                                                        {product.titulo || 'Producto sin titulo'}
                                                    </h3>
                                                </Link>

                                                {product.descripcion && (
                                                    <p className="text-xs text-zinc-500/85 dark:text-zinc-400/80 line-clamp-2">{product.descripcion}</p>
                                                )}

                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                    <span>{productRating.toFixed(1)} ({productReviews})</span>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xl font-semibold text-red-500 drop-shadow-[0_0_8px_rgba(255,59,59,0.35)]">{Number(product.precio ?? 0)}€</span>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/edit-product/${product.id}`}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-400/35 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:border-zinc-300/60 hover:text-zinc-100 transition-all duration-200"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                            Editar
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEliminarProducto(product.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/45 bg-red-500/75 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-red-500 hover:border-red-400/75 transition-all duration-200"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'compras' && (
                <div>
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" /> Mis compras
                        </h2>
                        <Link to="/profile" className="btn-secondary text-sm">Volver al panel</Link>
                    </div>

                    <PurchasesGrid purchases={purchasesToRender} />
                </div>
            )}

            {activeView === 'ventas' && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" /> Ventas totales
                        </h2>
                        <Link to="/profile" className="btn-secondary text-sm">Volver al panel</Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs text-faint">Ventas totales</p>
                            <p className="mt-2 text-3xl font-bold text-base-primary">{sellerSales}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs text-faint">Productos publicados</p>
                            <p className="mt-2 text-3xl font-bold text-base-primary">{publishedCount}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs text-faint">Servicios activos</p>
                            <p className="mt-2 text-3xl font-bold text-base-primary">{activeServicesCount}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileDetailView;
