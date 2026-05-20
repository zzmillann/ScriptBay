import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const letras = 'ScriptBay'.split('');

const Preloader = ({ duracion = 1800 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duracion);
    return () => clearTimeout(timer);
  }, [duracion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(255, 26, 26, 0.18) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(255, 77, 77, 0.10) 0%, transparent 45%)',
            }}
          />

          <motion.div
            className="pointer-events-none absolute h-[460px] w-[460px] rounded-full"
            style={{ background: 'rgba(255, 26, 26, 0.18)', filter: 'blur(110px)' }}
            initial={{ scale: 0.6, opacity: 0.4 }}
            animate={{ scale: [0.6, 1.05, 0.85], opacity: [0.35, 0.7, 0.5] }}
            transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
          />

          <div className="relative flex flex-col items-center gap-6">
            <div
              className="flex select-none"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.04em' }}
            >
              {letras.map((letra, i) => {
                const esBay = i >= 6;
                return (
                  <motion.span
                    key={`${letra}-${i}`}
                    initial={{ y: 40, opacity: 0, filter: 'blur(12px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.08 * i,
                    }}
                    className="text-6xl sm:text-7xl md:text-8xl font-black"
                    style={
                      esBay
                        ? {
                            backgroundImage: 'linear-gradient(135deg, #ff1a1a 0%, #ff4d4d 60%, #ff8a8a 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }
                        : { color: '#ffffff' }
                    }
                  >
                    {letra}
                  </motion.span>
                );
              })}
            </div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.55, ease: 'easeOut' }}
              className="h-[2px] w-44 origin-left rounded-full bg-gradient-to-r from-transparent via-[#ff1a1a] to-transparent"
            />

            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85, ease: 'easeOut' }}
              className="text-[11px] uppercase tracking-[0.42em] text-white/45"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Mercado tecnologico
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
