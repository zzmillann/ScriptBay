import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateProduct from './pages/CreateProduct';
import ProductDetail from './pages/ProductDetail';
import EditProduct from './pages/EditProduct';
import PurchasedAssetWorkspace from './pages/PurchasedAssetWorkspace';
import Wishlist from './pages/Wishlist';
import Dashboard from './pages/Dashboard';
import Subastas from './pages/Subastas';
import SubastaDetalle from './pages/SubastaDetalle';
import CrearSubasta from './pages/CrearSubasta';
import Notificaciones from './pages/Notificaciones';
import MisCompras from './pages/MisCompras';
import ParticlesBackground from './components/ParticlesBackground';
import { WishlistProvider } from './context/WishlistContext';
import ChatAssistant from './components/ChatAssistant';
import OnboardingTour from './components/OnboardingTour';
import { getSession } from './services/authClient';
import { MyWagmiProvider } from './components/BlockchainFront/WagmiProvider';

import './index.css';

const PageShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mostrarTour, setMostrarTour] = React.useState(false);

  useEffect(() => {
    const session = getSession();
    const publicPaths = ['/login', '/register'];
    
    if (!session && !publicPaths.includes(location.pathname)) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const mostrar = () => setMostrarTour(true);
    window.addEventListener('scriptbay-show-tour', mostrar);
    return () => window.removeEventListener('scriptbay-show-tour', mostrar);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(255, 26, 26, 0.05) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(255, 26, 26, 0.02) 0%, transparent 40%)',
        }}
      />
      <ParticlesBackground />
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />
        <main className="flex-grow">
          <LayoutGroup id="product-navigation">
            <AnimatePresence mode="sync">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/edit-profile" element={<Profile />} />
                  <Route path="/create-product" element={<CreateProduct />} />
                  <Route path="/edit-product/:id" element={<EditProduct />} />
                  <Route path="/mis-compras/:id/acceso" element={<PurchasedAssetWorkspace />} />
                  <Route path="/producto/:id" element={<ProductDetail />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/subastas" element={<Subastas />} />
                  <Route path="/subastas/crear" element={<CrearSubasta />} />
                  <Route path="/subastas/:id" element={<SubastaDetalle />} />
                  <Route path="/notificaciones" element={<Notificaciones />} />
                  <Route path="/mis-compras" element={<MisCompras />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </main>

        <footer className="py-12 px-6 border-t border-zinc-200 dark:border-glass-border bg-zinc-50 dark:bg-darker/50 backdrop-blur-sm mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xl font-bold tracking-tight">
              Script<span className="gradient-text">Bay</span>
              <p className="text-sm font-normal text-faint mt-2">El futuro del comercio tecnológico.</p>
            </div>
            <div className="flex gap-8 text-sm text-dimmed font-bold">
              <a href="#" className="link-primary">Términos de Servicio</a>
              <a href="#" className="link-primary">Privacidad</a>
              <a href="#" className="link-primary">Contacto</a>
            </div>
            <p className="text-xs text-faint">© 2026 ScriptBay Inc. Todos los derechos reservados.</p>
          </div>
        </footer>

        {/* Chat Assistant Flotante */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          <ThemeToggle />
          <ChatAssistant />
        </div>

        {mostrarTour && (
          <OnboardingTour onFin={() => setMostrarTour(false)} />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <MyWagmiProvider>
        <WishlistProvider>
          <PageShell />
        </WishlistProvider>
      </MyWagmiProvider>
    </Router>
  )
}

export default App
