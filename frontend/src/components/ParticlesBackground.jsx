import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';

const particlesOptions = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  fullScreen: { enable: false },
  particles: {
        number: { value: 36, density: { enable: true } },
        color: { value: '#ff2a2a' },
    opacity: {
          value: { min: 0.20, max: 0.38 },
    },
        size: { value: { min: 2.5, max: 4.8 } },
    move: {
      enable: true,
          speed: 0.65,
      direction: 'top',
      random: true,
      straight: false,
      outModes: { default: 'out' },
    },
    links: { enable: false },
  },
  detectRetina: true,
};

const ParticlesBackground = () => {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setEngineReady(true));
  }, []);

  if (!engineReady) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Particles
        id="tsparticles"
        options={particlesOptions}
        style={{ width: '100%', height: '100%' }}
      />
      {/* Overlay superior: amortigua partículas detrás de la navbar */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
      {/* Overlay inferior: suaviza partículas detrás del contenido principal */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
    </div>
  );
};

export default ParticlesBackground;
