import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-glass-border bg-darker/50 backdrop-blur-sm mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xl font-bold tracking-tight">
              Script<span className="gradient-text">Bay</span>
              <p className="text-sm font-normal text-white/30 mt-2">El futuro del comercio tecnológico.</p>
            </div>
            <div className="flex gap-8 text-sm text-white/40 font-bold">
              <a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Contacto</a>
            </div>
            <p className="text-xs text-white/20">© 2026 ScriptBay Inc. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
