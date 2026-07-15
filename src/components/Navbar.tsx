import React, { useState } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoDisfracesMadi from '../assets/images/logo_disfraces_madi.png';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, costumeId?: string) => void;
  favoritesCount: number;
}

export default function Navbar({ currentView, onNavigate, favoritesCount }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'historia', label: 'Nuestra Historia' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#a8001a]/10 shadow-sm" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => handleNavClick('inicio')}
            id="navbar-logo-container"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a8001a] text-white shadow-md group-hover:scale-105 transition-transform duration-300">
              <img
                src={logoDisfracesMadi}
                alt="Logo de Disfraces Madi"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#1e1b18] group-hover:text-[#a8001a] transition-colors">
                Disfraces <span className="text-[#a8001a]">Madi</span>
              </span>
              <p className="text-[9px] font-mono tracking-widest text-[#846524] uppercase -mt-1 font-bold">
                Carnaval de Barranquilla
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8" id="desktop-nav-menu">
            {navItems.map((item) => {
              const isActive = currentView === item.id || (item.id === 'catalogo' && currentView === 'catalogo-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`nav-link-${item.id}`}
                  className={`relative py-2 text-sm font-medium tracking-wide transition-colors duration-200 cursor-pointer ${
                    isActive ? 'text-[#a8001a]' : 'text-[#1e1b18]/80 hover:text-[#a8001a]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavLine"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#a8001a] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4" id="desktop-nav-actions">
            <button
              onClick={() => handleNavClick('catalogo')}
              className="p-2 text-[#1e1b18]/80 hover:text-[#a8001a] transition-colors relative cursor-pointer"
              title="Ver Catálogo"
              id="navbar-favorites-btn"
            >
              <Heart className={`h-5 w-5 ${favoritesCount > 0 ? 'fill-[#a8001a] text-[#a8001a]' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#a8001a] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center space-x-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[#1e1b18] hover:bg-[#a8001a]/5 focus:outline-none"
              id="mobile-menu-toggle"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#fff8f5] border-t border-[#a8001a]/10 overflow-hidden"
            id="mobile-nav-drawer"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navItems.map((item) => {
                const isActive = currentView === item.id || (item.id === 'catalogo' && currentView === 'catalogo-detail');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#a8001a]/10 text-[#a8001a] font-semibold'
                        : 'text-[#1e1b18]/80 hover:bg-[#a8001a]/5 hover:text-[#a8001a]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
