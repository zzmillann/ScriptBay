import React from 'react';
import { Box, BriefcaseBusiness, BarChart3, TrendingUp } from 'lucide-react';

const ProfileDashboard = ({
    isEditMode,
    isDetailView,
    activeSection,
    avatarUrl,
    avatarOffset,
    form,
    getInitials,
    publishedCount,
    activeServicesCount,
    purchases,
    sellerSales,
    onOpenView
}) => {
    if (activeSection === 'editar') {
        return null;
    }

    return (
        <>
            {!isEditMode && !isDetailView && (
                <p className="mb-5 text-sm text-subtle">
                    Panel de vendedor: abre cada metrica para ver su pantalla detallada.
                </p>
            )}

            <div className="mb-8 sm:mb-10 rounded-3xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_top_left,rgba(255,26,26,0.18),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(28,0,0,0.24))] backdrop-blur-sm shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] px-4 sm:px-6 py-5 sm:py-6">
                <div className="pointer-events-none absolute" />
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-start gap-5 lg:gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-primary/35 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center text-xl font-bold text-base-primary shadow-[0_10px_26px_-16px_rgba(255,26,26,0.55)]">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Foto de perfil"
                                    className="w-full h-full object-cover"
                                    style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
                                />
                            ) : (
                                <span>{getInitials(form.nombre || 'DEV RINK')}</span>
                            )}
                        </div>
                        <div>
                            <div className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1 mb-2">
                                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-primary">Panel de vendedor</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-base-primary leading-tight">{form.nombre || 'DEV-RINK'}</h2>
                            <p className="mt-1 text-sm font-medium text-zinc-200 dark:text-zinc-100">Automatizacion y sistemas que escalan tu negocio</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto lg:min-w-[560px] lg:ml-2 lg:mr-3">
                        <button
                            type="button"
                            onClick={() => onOpenView('productos')}
                            className="text-left rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-pointer"
                        >
                            <div className="flex items-center gap-2 text-faint text-xs">
                                <Box className="w-3.5 h-3.5 text-zinc-300" />
                                Productos
                            </div>
                            <p className="text-lg font-bold text-base-primary mt-1">{publishedCount}</p>
                            <p className="text-[11px] text-dimmed">Publicados</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenView('servicios')}
                            className="text-left rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-pointer"
                        >
                            <div className="flex items-center gap-2 text-faint text-xs">
                                <BriefcaseBusiness className="w-3.5 h-3.5 text-zinc-300" />
                                Servicios
                            </div>
                            <p className="text-lg font-bold text-base-primary mt-1">{activeServicesCount}</p>
                            <p className="text-[11px] text-dimmed">Activos</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenView('compras')}
                            className="text-left rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-pointer"
                        >
                            <div className="flex items-center gap-2 text-faint text-xs">
                                <BarChart3 className="w-3.5 h-3.5 text-zinc-300" />
                                Compras
                            </div>
                            <p className="text-lg font-bold text-base-primary mt-1">{purchases}</p>
                            <p className="text-[11px] text-dimmed">Realizadas</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenView('ventas')}
                            className="text-left rounded-xl border border-white/[0.12] bg-white/[0.04] dark:bg-black/25 backdrop-blur-sm px-3 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:bg-white/5 hover:shadow-[0_8px_20px_-8px_rgba(255,26,26,0.3)] cursor-pointer"
                        >
                            <div className="flex items-center gap-2 text-faint text-xs">
                                <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
                                Ventas
                            </div>
                            <p className="text-lg font-bold text-base-primary mt-1">{sellerSales}</p>
                            <p className="text-[11px] text-dimmed">Totales</p>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileDashboard;
