import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Upload, Brain, CheckCircle2, AlertTriangle, Loader2, X, Sparkles } from 'lucide-react';

// Modal que se abre durante el submit de CreateProduct.
// estado: 'idle' | 'enviando' | 'ok' | 'rechazado' | 'error'
// veredicto: { motivo, detalle, score } cuando hay respuesta IA
const PASOS = [
  { key: 'upload', label: 'Subiendo archivo al servidor', icon: Upload },
  { key: 'webhook', label: 'Enviando al motor de seguridad (n8n)', icon: Sparkles },
  { key: 'ia', label: 'Gemini analiza el contenido', icon: Brain },
  { key: 'veredicto', label: 'Veredicto recibido', icon: ShieldCheck },
];

const ScanProgressModal = ({ abierto, estado, veredicto, mensajeError, onCerrar, onReintentar }) => {
  const [pasoActual, setPasoActual] = useState(0);

  useEffect(() => {
    if (!abierto || estado !== 'enviando') return;
    // Avanza visualmente paso a paso mientras el backend trabaja.
    setPasoActual(0);
    const intervalos = [400, 1200, 2200, 4500];
    const timers = intervalos.map((ms, i) =>
      setTimeout(() => setPasoActual((p) => Math.max(p, i + 1)), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [abierto, estado]);

  useEffect(() => {
    if (estado === 'ok' || estado === 'rechazado') setPasoActual(PASOS.length);
  }, [estado]);

  if (!abierto) return null;

  const aprobado = estado === 'ok';
  const rechazado = estado === 'rechazado';
  const error = estado === 'error';
  const procesando = estado === 'enviando';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-black/95 p-7 shadow-[0_32px_72px_-16px_rgba(0,0,0,0.7)]"
        >
          {(aprobado || rechazado || error) && (
            <button
              onClick={onCerrar}
              className="absolute right-5 top-5 rounded-lg p-1 text-zinc-400 hover:text-zinc-100"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="mb-6 flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                aprobado
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                  : rechazado
                    ? 'border-red-400/40 bg-red-500/15 text-red-300'
                    : error
                      ? 'border-yellow-400/40 bg-yellow-500/15 text-yellow-300'
                      : 'border-violet-400/40 bg-violet-500/15 text-violet-300'
              }`}
            >
              {aprobado ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : rechazado || error ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Comprobación de seguridad</p>
              <h2 className="text-lg font-bold text-zinc-100">
                {aprobado && 'Producto aprobado'}
                {rechazado && 'Producto rechazado'}
                {error && 'Hubo un problema'}
                {procesando && 'Verificando archivo...'}
              </h2>
            </div>
          </div>

          {/* Pasos */}
          <ol className="space-y-2.5 mb-5">
            {PASOS.map((paso, idx) => {
              const completado = idx < pasoActual || (idx === pasoActual && (aprobado || rechazado));
              const activo = idx === pasoActual && procesando;
              const Icon = paso.icon;
              const esUltimo = idx === PASOS.length - 1;
              const ultimoFallido = esUltimo && rechazado;
              const ultimoOk = esUltimo && aprobado;
              return (
                <li
                  key={paso.key}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                    ultimoFallido
                      ? 'border-red-400/30 bg-red-500/10'
                      : ultimoOk
                        ? 'border-emerald-400/30 bg-emerald-500/10'
                        : completado
                          ? 'border-emerald-400/20 bg-emerald-500/5'
                          : activo
                            ? 'border-violet-400/30 bg-violet-500/10'
                            : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg ${
                      ultimoFallido
                        ? 'bg-red-500/20 text-red-300'
                        : completado
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : activo
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'bg-white/5 text-zinc-500'
                    }`}
                  >
                    {activo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : completado ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`text-sm ${completado || activo ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {paso.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Veredicto detallado */}
          {(aprobado || rechazado) && veredicto && (
            <div
              className={`rounded-2xl border p-4 ${
                aprobado
                  ? 'border-emerald-400/30 bg-emerald-500/10'
                  : 'border-red-400/30 bg-red-500/10'
              }`}
            >
              <p className={`text-sm font-semibold mb-1 ${aprobado ? 'text-emerald-200' : 'text-red-200'}`}>
                {aprobado ? '✓ Limpio según la IA' : '✗ Rechazado por la IA'}
                {veredicto.score != null && (
                  <span className="ml-2 text-xs font-normal opacity-75">(score {veredicto.score}/100)</span>
                )}
              </p>
              <p className="text-xs text-zinc-300/85 leading-relaxed">
                <span className="font-semibold">Motivo:</span> {veredicto.motivo || (aprobado ? 'ok' : 'sin motivo')}
              </p>
              {veredicto.detalle && (
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{veredicto.detalle}</p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              {mensajeError || 'No se pudo conectar con el servidor.'}
            </div>
          )}

          {/* Footer botones */}
          <div className="mt-6 flex justify-end gap-2">
            {(rechazado || error) && (
              <button
                onClick={onReintentar}
                className="btn-secondary text-sm"
              >
                Reintentar
              </button>
            )}
            {(aprobado || rechazado || error) && (
              <button
                onClick={onCerrar}
                className={`px-5 py-2 rounded-2xl text-sm font-semibold ${
                  aprobado
                    ? 'bg-emerald-500/20 border border-emerald-400/35 text-emerald-100 hover:bg-emerald-500/30'
                    : 'bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10'
                }`}
              >
                {aprobado ? 'Listo' : 'Cerrar'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScanProgressModal;
