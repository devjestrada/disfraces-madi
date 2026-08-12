import React, { useState } from 'react';
import { Menu, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import logoDisfracesMadi from '../assets/images/logo_disfraces_madi.png';

const navItems = [
  { path: '/', label: 'Inicio' },
  { path: '/catalogo', label: 'Catálogo' },
  { path: '/servicios', label: 'Servicios' },
  { path: '/nuestra-historia', label: 'Nuestra Historia' },
  { path: '/contacto', label: 'Contacto' },
];

function isNavItemActive(pathname: string, itemPath: string) {
  if (itemPath === '/catalogo') {
    return pathname === '/catalogo' || pathname.startsWith('/catalogo/');
  }
  return pathname === itemPath;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const isAdminActive = pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#a8001a]/10 shadow-sm" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            to="/"
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => setIsOpen(false)}
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
          </Link>

          <div className="hidden md:flex items-center space-x-8" id="desktop-nav-menu">
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={`nav-link-${item.path === '/' ? 'inicio' : item.path.slice(1)}`}
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
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center pl-6 ml-2 border-l border-[#1e1b18]/10">
            <Link
              to="/admin"
              id="nav-link-admin"
              title="Acceso administrativo"
              className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                isAdminActive
                  ? 'bg-[#1e1b18]/5 border-[#1e1b18]/30 text-[#1e1b18]/90'
                  : 'border-[#1e1b18]/15 text-[#1e1b18]/60 hover:text-[#1e1b18]/90 hover:border-[#1e1b18]/30'
              }`}
            >
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full transition-colors duration-150 group-hover:bg-[#f0e6e0]">
                <User className="h-[22px] w-[22px]" strokeWidth={1.75} />
              </span>
              <span>Admin</span>
            </Link>
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
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 w-full text-left px-4 py-3 mb-2 rounded-xl text-sm font-medium border-b border-[#1e1b18]/10 pb-4 cursor-pointer transition-colors ${
                  isAdminActive ? 'bg-[#1e1b18]/5 text-[#1e1b18]/90' : 'text-[#1e1b18]/60'
                }`}
              >
                <User className="h-[22px] w-[22px]" strokeWidth={1.75} />
                <span>Acceso administrativo</span>
              </Link>
              {navItems.map((item) => {
                const isActive = isNavItemActive(pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#a8001a]/10 text-[#a8001a] font-semibold'
                        : 'text-[#1e1b18]/80 hover:bg-[#a8001a]/5 hover:text-[#a8001a]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
