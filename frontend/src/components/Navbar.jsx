import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import config from '../config';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { t, cycleLanguage, getNextLanguageName, language } = useLanguage();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navItems = [
    { path: '/', name: t.nav.dashboard, icon: '■' },
    { path: '/recommendations', name: t.nav.recommendations, icon: '◆' },
    { path: '/image-analysis', name: t.nav.imageAnalysis, icon: '●' },
    { path: '/sensors', name: t.nav.sensors, icon: '◉' },
    { path: '/help', name: t.nav.help, icon: '◐' }
  ];

  return (
    <>
      {/* Top Bar - Only for mobile and sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-amber-700 via-yellow-700 to-amber-800 text-white shadow-lg z-50 flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 flex-shrink-0"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 shadow-lg flex-shrink-0">
            <img src="/pwa-192x192.png" alt="FarmAI" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold">FarmAI</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={cycleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all border border-white/20"
            title="Change Language"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-xs font-semibold uppercase">
              {language === 'hi' ? 'हिं' : language === 'mr' ? 'मर' : 'EN'}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen bg-gradient-to-b from-amber-800 via-yellow-800 to-amber-900 text-white shadow-2xl transition-all duration-300 z-40 flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo & Toggle */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center space-x-3 ${sidebarOpen ? '' : 'justify-center w-full'}`}>
              <div className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all">
                <img src="/pwa-192x192.png" alt="FarmAI" className="w-10 h-10 object-contain" />
              </div>
              {sidebarOpen && (
                <div>
                  <span className="text-xl font-bold block">FarmAI</span>
                  <p className="text-xs text-amber-100 opacity-80">Smart Agriculture</p>
                </div>
              )}
            </Link>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mt-4 p-1.5 hover:bg-white/10 rounded-lg transition-all w-full flex justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  location.pathname === item.path
                    ? 'bg-white text-amber-800 shadow-md font-semibold'
                    : 'hover:bg-white/10 hover:translate-x-1'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
                title={!sidebarOpen ? item.name : ''}
              >
                <span className="text-lg font-bold">{item.icon}</span>
                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Section - User */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* User Profile */}
          <div className={`flex items-center space-x-3 p-3 bg-white/5 rounded-lg ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-amber-50 text-amber-800 flex items-center justify-center font-bold shadow-lg ring-2 ring-white/20 flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.username || t.nav.farmerDashboard}</p>
                <p className="text-xs text-amber-100 opacity-80 truncate">{t.nav.welcomeBack}</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-red-500/20 text-red-200 hover:text-red-100 ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title={!sidebarOpen ? (language === 'hi' ? 'लॉगआउट' : language === 'mr' ? 'लॉगआउट' : 'Logout') : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && (
              <span className="font-medium text-sm">
                {language === 'hi' ? 'लॉगआउट' : language === 'mr' ? 'लॉगआउट' : 'Logout'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-80 bg-gradient-to-b from-amber-800 via-yellow-800 to-amber-900 text-white shadow-2xl z-50 flex flex-col animate-slide-in">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <Link to="/" className="flex items-center space-x-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-white/20 p-2 rounded-lg">
                  <img src="/pwa-192x192.png" alt="FarmAI" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <span className="text-xl font-bold block">FarmAI</span>
                  <p className="text-xs text-amber-100 opacity-80">Smart Agriculture</p>
                </div>
              </Link>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-6 px-4 overflow-y-auto">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-300 ${
                      location.pathname === item.path
                        ? 'bg-white text-amber-800 shadow-md font-semibold'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg font-bold">{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-white/10 space-y-3">
              {/* User Profile */}
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-amber-50 text-amber-800 flex items-center justify-center font-bold shadow-lg ring-2 ring-white/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{user?.username || t.nav.farmerDashboard}</p>
                  <p className="text-xs text-amber-100 opacity-80">{t.nav.welcomeBack}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium text-sm">
                  {language === 'hi' ? 'लॉगआउट' : language === 'mr' ? 'लॉगआउट' : 'Logout'}
                </span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Language Switcher - Top Right (Scrolls with page) */}
      <div className="fixed top-4 right-4 z-30 lg:top-6 lg:right-6">
        <button
          onClick={cycleLanguage}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-semibold"
          title="Change Language"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="hidden sm:inline">{getNextLanguageName()}</span>
          <span className="text-xs opacity-90">{language.toUpperCase()}</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
