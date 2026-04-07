import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';

const particlesOptions = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  fullScreen: { enable: false },
  particles: {
    number: { value: 35, density: { enable: true } },
    color: { value: '#ff0000' },
    opacity: {
      value: { min: 0.14, max: 0.3 },
    },
    size: { value: { min: 2, max: 3.4 } },
    move: {
      enable: true,
      speed: 0.35,
      direction: 'none',
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
      className="pointer-events-none absolute inset-0 z-0"
    >
      <Particles
        id="tsparticles"
        options={particlesOptions}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default ParticlesBackground;
