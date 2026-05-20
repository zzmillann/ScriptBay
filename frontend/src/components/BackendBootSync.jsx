import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { clearSession } from '../services/authClient';

const STARTUP_KEY = 'scriptbay_backend_startup_id';
const API_HEALTH = 'http://localhost:3000/api/health';

// Se monta una sola vez. Al arrancar el frontend pregunta al backend su STARTUP_ID.
// Si ha cambiado desde la ultima vez -> cierra sesion y desconecta wallet.
const BackendBootSync = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const yaSincronizado = useRef(false);

  useEffect(() => {
    if (yaSincronizado.current) return;
    yaSincronizado.current = true;

    const sync = async () => {
      try {
        const res = await fetch(API_HEALTH);
        const data = await res.json();
        if (data?.codigo !== 0 || !data.startupId) return;

        const previo = localStorage.getItem(STARTUP_KEY);
        if (previo && previo !== data.startupId) {
          console.log('[BootSync] Backend reiniciado, forzando logout + disconnect wallet');
          clearSession();
          if (isConnected) {
            try { disconnect(); } catch (e) { /* ignore */ }
          }
          localStorage.setItem(STARTUP_KEY, data.startupId);
          const publicas = ['/login', '/register'];
          if (!publicas.includes(location.pathname)) navigate('/login');
        } else if (!previo) {
          localStorage.setItem(STARTUP_KEY, data.startupId);
        }
      } catch (err) {
        // backend caido: no hacemos nada, ya gestionara cada peticion su error
        console.warn('[BootSync] no se pudo contactar /api/health', err.message);
      }
    };

    sync();
  }, [disconnect, isConnected, location.pathname, navigate]);

  return null;
};

export default BackendBootSync;
