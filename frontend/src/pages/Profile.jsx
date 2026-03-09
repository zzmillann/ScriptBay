import React from 'react';
import { motion } from 'framer-motion';
import { User, Package, Heart, History, Settings, Edit3, ExternalLink } from 'lucide-react';

const Profile = () => {
    return (
        <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-80 space-y-4">
                    <div className="glass-card p-8 text-center border-none">
                        <div className="w-24 h-24 bg-linear-to-br from-primary/20 to-accent/20 rounded-full mx-auto mb-6 flex items-center justify-center border border-primary/20 p-2">
                            <div className="w-full h-full bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                <span className="text-3xl font-bold">JP</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Juan Pérez</h2>
                        <p className="text-white/40 text-sm mb-6">Desarrollador Full Stack</p>
                        <button className="flex items-center justify-center gap-2 w-full px-4 py-2 glass-card hover:bg-white/5 transition-all text-sm font-bold">
                            <Edit3 className="w-4 h-4" /> Editar Perfil
                        </button>
                    </div>

                    <div className="glass-card p-4 space-y-1 border-none">
                        {[
                            { icon: User, label: 'Cuenta', active: true },
                            { icon: Package, label: 'Mis Compras', active: false },
                            { icon: Heart, label: 'Lista de Deseos', active: false },
                            { icon: History, label: 'Historial de Ventas', active: false },
                            { icon: Settings, label: 'Configuración', active: false },
                        ].map((item) => (
                            <button
                                key={item.label}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-bold ${item.active ? 'bg-primary/20 text-primary border border-primary/20' : 'hover:bg-white/5 text-white/60'}`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <h1 className="text-4xl font-bold mb-8 tracking-tight">Panel de Control</h1>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        {[
                            { label: 'Total Gastado', value: '1.240€', color: 'primary' },
                            { label: 'Licencias Activas', value: '12', color: 'accent' },
                            { label: 'Deseados', value: '24', color: 'white' },
                        ].map((stat) => (
                            <div key={stat.label} className="glass-card p-6 border-none">
                                <p className="text-white/40 text-sm mb-2">{stat.label}</p>
                                <p className="text-3xl font-bold">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-xl font-bold mb-4">Compras Recientes</h3>
                    <div className="space-y-4">
                        {[
                            { title: 'Plantilla React E-commerce', date: '02 de Marzo, 2026', price: '49€', status: 'Completado' },
                            { title: 'Optimizador SEO Automático', date: '24 de Febrero, 2026', price: '29€', status: 'Completado' },
                        ].map((item) => (
                            <div key={item.title} className="glass-card p-6 flex items-center justify-between group border-none">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <Package className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold group-hover:text-primary transition-colors">{item.title}</h4>
                                        <p className="text-sm text-white/30">{item.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{item.price}</p>
                                    <button className="text-primary text-xs flex items-center gap-1 mt-1 font-bold hover:underline">
                                        Descargar <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
