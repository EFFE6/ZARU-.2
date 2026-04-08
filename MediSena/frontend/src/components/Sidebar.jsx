import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  FileText,
  RefreshCcw,
  BadgeDollarSign,
  Search,
  ClipboardList,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import '../styles/Sidebar.css';

// Using the logo from assets/img/Sidebar.png as per user instruction
import logo from '../assets/img/Sidebar.png';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'Maestras', icon: Settings, label: 'Gestión', path: '/gestion' },
    { id: 'Datos básicos', icon: FileText, label: 'Datos básicos', path: '/datos-basicos' },
    { id: 'Movimientos', icon: RefreshCcw, label: 'Movimientos', path: '/movimientos' },
    { id: 'Excedentes', icon: BadgeDollarSign, label: 'Excedentes', path: '/excedentes' },
    { id: 'Consultas', icon: Search, label: 'Consultas', path: '/consultas' },
    { id: 'Reportes', icon: ClipboardList, label: 'Reportes', path: '/reportes' },
    { id: 'Reportes nacionales', icon: Globe, label: 'Reportes nacionales', path: '/reportes-nacionales' },
  ];

  // Actualizar item activo basado en la ruta actual
  useEffect(() => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    if (currentItem) setActiveItem(currentItem.id);
    setIsMobileMenuOpen(false); // Cerrar menú al navegar
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <Menu size={24} />
      </button>

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button className="mobile-menu-close" onClick={toggleMobileMenu}>
          <X size={24} />
        </button>
        <div className="sidebar-logo">
          <img src={logo} alt="MediSENA Logo" />
        </div>

        <nav className="nav-container">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li
                key={item.id}
                className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveItem(item.id);
                  navigate(item.path);
                }}
              >
                <item.icon className="nav-item-icon" />
                <span className="nav-item-text">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="user-profile-section">
          <div className="profile-card">
            <div className="profile-info">
              <div className="profile-avatar">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Paula" alt="Paula" />
              </div>
              <div className="profile-text">
                <span className="profile-name">Paula Chaparro</span>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
