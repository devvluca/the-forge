import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ABigorna } from './pages/A-Bigorna';
import { OCofre } from './pages/O-Cofre';
import { Logos } from './pages/Logos';
import { Arsenal } from './pages/Arsenal';
import { Configuracoes, loadSavedColor } from './pages/Configuracoes';
import { JarvisSidebar } from './components/JarvisSidebar';
import { TitleBar } from './components/TitleBar';
import { FloatingDock } from './components/FloatingDock';
import { AnimatePresence } from 'framer-motion';

function AppContent() {
  const [jarvisOpen, setJarvisOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { loadSavedColor(); }, []);

  const pageLabel = (() => {
    switch (location.pathname) {
      case '/a-bigorna': return 'A Bigorna';
      case '/o-cofre': return 'O Cofre';
      case '/logos': return 'Logos';
      case '/arsenal': return 'Arsenal';
      case '/configuracoes': return 'Configurações';
      default: return 'Home';
    }
  })();

  return (
    <div className="flex h-screen bg-black font-mono text-white overflow-hidden relative">
      <TitleBar />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/a-bigorna" element={<ABigorna />} />
            <Route path="/o-cofre" element={<OCofre />} />
            <Route path="/logos" element={<Logos />} />
            <Route path="/arsenal" element={<Arsenal />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/a-bigorna" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      <FloatingDock onJarvisClick={() => setJarvisOpen(true)} />

      <JarvisSidebar
        isOpen={jarvisOpen}
        onClose={() => setJarvisOpen(false)}
        currentPage={pageLabel}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
