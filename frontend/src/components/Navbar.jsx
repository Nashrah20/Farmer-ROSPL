import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { t, cycleLanguage, getNextLanguageName, language } = useLanguage();
  
  const navItems = [
    { path: '/', name: t.nav.dashboard, icon: '📊' },
    { path: '/analytics', name: t.nav.analytics, icon: '📈' },
    { path: '/recommendations', name: t.nav.recommendations, icon: '🤖' },
    { path: '/image-analysis', name: t.nav.imageAnalysis, icon: '📸' },
    { path: '/help', name: t.nav.help, icon: '❓' },
    { path: '/sensors', name: t.nav.sensors, icon: '📡' }
  ];

  return (
    <nav className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-bold">FarmAI</span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  location.pathname === item.path
                    ? 'bg-white text-green-600 shadow-md'
                    : 'hover:bg-green-500'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-semibold">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Language Selector & User Info */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Button */}
            <button
              onClick={cycleLanguage}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              title="Change Language"
            >
              <span className="text-lg">🌐</span>
              <span className="font-semibold text-sm">{getNextLanguageName()}</span>
            </button>
            
            <div className="text-right">
              <p className="text-sm font-semibold">{t.nav.farmerDashboard}</p>
              <p className="text-xs opacity-90">{t.nav.welcomeBack}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center font-bold">
              F
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-green-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-fade-in">
            {/* Mobile Language Button */}
            <button
              onClick={cycleLanguage}
              className="w-full mb-3 flex items-center justify-center space-x-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <span className="text-lg">🌐</span>
              <span className="font-semibold">{getNextLanguageName()}</span>
              <span className="text-xs opacity-75">({language.toUpperCase()})</span>
            </button>
            
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    location.pathname === item.path
                      ? 'bg-white text-green-600'
                      : 'bg-green-500 hover:bg-green-400'
                  }`}
                >
                  {item.icon} {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
