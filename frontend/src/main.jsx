import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
import Navbar from './components/Navbar'
import ModernDashboard from './pages/ModernDashboard'
import Analytics from './pages/Analytics'
import Recommendations from './pages/Recommendations'
import Help from './pages/Help'
import Sensors from './pages/Sensors'
import ImageAnalysis from './pages/ImageAnalysis'
import './index.css'

const AppContent = () => {
  const { sidebarOpen } = useSidebar();
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className={`transition-all duration-300 pt-16 lg:pt-0 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        <Routes>
          <Route path="/" element={<ModernDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/image-analysis" element={<ImageAnalysis />} />
          <Route path="/help" element={<Help />} />
          <Route path="/sensors" element={<Sensors />} />
        </Routes>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <SidebarProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SidebarProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
