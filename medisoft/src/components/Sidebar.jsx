import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import './Sidebar.css';

// Using the logo from assets/img/Sidebar.png as per user instruction
// If Sidebar.png is not the logo, we might need to adjust
import logo from '../assets/img/Sidebar.png';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('Gestión');

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Gestión', icon: Settings, label: 'Gestión' },
    { id: 'Datos básicos', icon: FileText, label: 'Datos básicos' },
    { id: 'Movimientos', icon: RefreshCcw, label: 'Movimientos' },
    { id: 'Excedentes', icon: BadgeDollarSign, label: 'Excedentes' },
    { id: 'Consultas', icon: Search, label: 'Consultas' },
    { id: 'Reportes', icon: ClipboardList, label: 'Reportes' },
    { id: 'Reportes nacionales', icon: Globe, label: 'Reportes nacionales' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <img src={logo} alt="MediSENA Logo" />
      </div>

      <ul className="nav-list">
        {navItems.map((item) => (
          <li 
            key={item.id} 
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => setActiveItem(item.id)}
          >
            <item.icon className="nav-item-icon" />
            <span className="nav-item-text">{item.label}</span>
          </li>
        ))}
      </ul>

      <button className="toggle-btn" onClick={toggleSidebar}>
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="user-profile">
        <div className="avatar">
          <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=nurse" alt="Paula Chaparro" />
        </div>
        {!isCollapsed && (
          <>
            <div className="user-info">
              <div className="user-name">Paula Chaparro</div>
            </div>
            <LogOut size={18} className="logout-icon" />
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
