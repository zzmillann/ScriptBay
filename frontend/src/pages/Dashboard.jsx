import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, Euro, Package, BarChart3 } from 'lucide-react';
import { getValidSession } from '../services/authClient';

const API = 'http://localhost:3000/api/productos';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

// ── Tooltip personalizado ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-sm">
            <p className="font-semibold text-base-primary mb-1">{label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }}>
                    {entry.name === 'ingresos' ? `${entry.value.toFixed(2)} €` : `${entry.value} ventas`}
                </p>
            ))}
        </div>
    );
};

// ── Tarjeta de stat ────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay }}
        className="surface-card p-5 flex items-start gap-4"
    >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-xs text-base-secondary mb-0.5">{label}</p>
            <p className="text-2xl font-bold text-base-primary leading-tight">{value}</p>
            {sub && <p className="text-xs text-faint mt-0.5">{sub}</p>}
        </div>
    </motion.div>
);

// ── Página principal ───────────────────────────────────────────────────────
const Dashboard = () => {
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                const session = await getValidSession();
                if (!session?.accessToken) {
                    setError('Inicia sesión para ver tu dashboard.');
                    setLoading(false);
                    return;
                }
                const res = await fetch(`${API}/MisVentas`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                const data = await res.json();
                if (data.codigo !== 0) throw new Error(data.mensaje || 'Error al cargar ventas');
                setResumen(data.resumen);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12 mt-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="surface-card p-5 h-24 animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="surface-card p-5 h-64 animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12 mt-16 flex items-center justify-center">
                <p className="text-base-secondary">{error}</p>
            </div>
        );
    }

    const { totalVentas, ingresoTotal, productosMasVendidos, ventasPorMes } = resumen;
    const ticketMedio = totalVentas > 0 ? (ingresoTotal / totalVentas).toFixed(2) : '0.00';

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 mt-16">

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-1">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold text-base-primary">Dashboard</h1>
                </div>
                <p className="text-base-secondary text-sm">Resumen de tus ventas y rendimiento como vendedor</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={ShoppingBag}  label="Ventas totales"   value={totalVentas}      sub="Todas las épocas"             color="bg-primary"           delay={0}    />
                <StatCard icon={Euro}          label="Ingresos totales" value={`${ingresoTotal} €`} sub="Bruto acumulado"           color="bg-emerald-500"       delay={0.05} />
                <StatCard icon={TrendingUp}    label="Ticket medio"     value={`${ticketMedio} €`} sub="Por venta"                  color="bg-blue-500"          delay={0.1}  />
                <StatCard icon={Package}       label="Productos únicos" value={productosMasVendidos.length} sub="Con al menos 1 venta" color="bg-violet-500"   delay={0.15} />
            </div>

            {/* Gráficas fila 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Línea: ingresos por mes */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="surface-card p-6"
                >
                    <h2 className="text-base font-semibold text-base-primary mb-4">Ingresos por mes</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={ventasPorMes} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.12)" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="ingresos"
                                name="ingresos"
                                stroke="#ef4444"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#ef4444' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Barras: ventas por mes */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="surface-card p-6"
                >
                    <h2 className="text-base font-semibold text-base-primary mb-4">Ventas por mes</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ventasPorMes} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.12)" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="ventas" name="ventas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Gráficas fila 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pie: distribución por producto */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="surface-card p-6"
                >
                    <h2 className="text-base font-semibold text-base-primary mb-4">Distribución por producto</h2>
                    {productosMasVendidos.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-base-secondary text-sm">
                            Sin datos todavía
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={productosMasVendidos}
                                    dataKey="ventas"
                                    nameKey="titulo"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ titulo, percent }) =>
                                        `${titulo.length > 14 ? titulo.slice(0, 14) + '…' : titulo} (${(percent * 100).toFixed(0)}%)`
                                    }
                                    labelLine={false}
                                >
                                    {productosMasVendidos.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [`${v} ventas`, n]} />
                                <Legend formatter={(v) => v.length > 20 ? v.slice(0, 20) + '…' : v} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                {/* Tabla: top productos */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="surface-card p-6"
                >
                    <h2 className="text-base font-semibold text-base-primary mb-4">Productos más vendidos</h2>
                    {productosMasVendidos.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-base-secondary text-sm">
                            Aún no tienes ventas
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {productosMasVendidos.map((prod, i) => (
                                <div key={prod.titulo} className="flex items-center gap-3">
                                    <span
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                        style={{ background: COLORS[i % COLORS.length] }}
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-base-primary truncate">{prod.titulo}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <div
                                                className="h-1.5 rounded-full"
                                                style={{
                                                    width: `${Math.round((prod.ventas / productosMasVendidos[0].ventas) * 100)}%`,
                                                    background: COLORS[i % COLORS.length],
                                                    minWidth: '8px',
                                                    maxWidth: '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-base-primary">{prod.ventas} <span className="text-faint font-normal">uds</span></p>
                                        <p className="text-xs text-emerald-500 font-medium">{prod.ingresos.toFixed(2)} €</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
