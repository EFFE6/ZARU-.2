import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import {
  ClipboardList, Receipt, CreditCard,
  CalendarPlus, CalendarCheck, XCircle, Search,
  Home, ChevronRight, Download, Printer, RefreshCw, Plus, Clock
} from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import '../../styles/Movimientos/OrdenAtencion.css';
import CampanaSvg from '../../assets/img/icons/campana.svg';

const MOV_TABS = [
  { id: 'orden-atencion',    label: 'Órdenes de Atención',  path: '/movimientos/orden-atencion',   Icon: ClipboardList },
  { id: 'cuenta-cobro',      label: 'Cuenta de cobro',      path: '/movimientos/cuenta-cobro',      Icon: Receipt       },
  { id: 'relacion-pagos',    label: 'Relación de pagos',    path: '/movimientos/relacion-pagos',    Icon: CreditCard    },
  { id: 'programar-agenda',  label: 'Programar agenda',     path: '/movimientos/programar-agenda',  Icon: CalendarPlus  },
  { id: 'agendas',           label: 'Agenda',               path: '/movimientos/agendas',           Icon: CalendarCheck },
  { id: 'cancelar-ordenes',  label: 'Cancelar órdenes',     path: '/movimientos/cancelar-ordenes',  Icon: XCircle       },
];

const MovimientosLayout: React.FC = () => {
  const { pathname } = useLocation();
  const active = MOV_TABS.find(t => t.path === pathname) ?? MOV_TABS[0];
  const isFirst = active.id === MOV_TABS[0].id;
  const [search, setSearch] = useState('');

  return (
    <div className="gestion-container">

      <header className="gestion-header">
        <div className="gestion-header-top">
          <nav className="breadcrumb">
            <div className="breadcrumb-item"><Home size={14} /></div>
            <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="breadcrumb-item">Movimientos</div>
            <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="breadcrumb-item active">{active.label}</div>
          </nav>
          <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} className="notification-bell" />
        </div>
        <div className="gestion-header-bottom">
          {active.id === 'cuenta-cobro' ? (
            <>
              <div>
                <h1 className="gestion-title" style={{ margin: 0 }}>Cuentas de Cobro</h1>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="oa-btn-refresh">
                  <RefreshCw size={14} /> Actualizar
                </button>
                <button className="cc-btn-nueva" style={{ background: '#0165B0', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={14} /> Nueva Cuenta
                </button>
              </div>
            </>
          ) : active.id === 'relacion-pagos' ? (
            <>
              <h1 className="gestion-title" style={{ margin: 0 }}>Relación de Pagos</h1>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="oa-btn-refresh">
                  <Download size={14} style={{ opacity: 0.6 }} /> Exportar
                </button>
                <button className="oa-btn-refresh" onClick={() => window.print()}>
                  <Printer size={14} style={{ opacity: 0.6 }} /> Imprimir
                </button>
                <button className="oa-btn-refresh">
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>
            </>
          ) : active.id === 'consultar-ordenes' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={24} color="#1e3a52" />
                <h1 className="gestion-title" style={{ margin: 0 }}>Consultar Órdenes de Atención</h1>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="oa-btn-refresh">
                  <Download size={14} style={{ opacity: 0.6 }} /> Exportar
                </button>
                <button className="oa-btn-refresh">
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>
            </>
          ) : active.id === 'cancelar-ordenes' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClipboardList size={24} color="#1e3a52" />
                <h1 className="gestion-title" style={{ margin: 0 }}>Cancelar Órdenes</h1>
              </div>
            </>
          ) : active.id === 'programar-agenda' ? (
            <>
              <h1 className="gestion-title" style={{ margin: 0 }}>Programar Agenda</h1>
              <button className="oa-btn-refresh">
                <RefreshCw size={14} /> Actualizar
              </button>
            </>
          ) : active.id === 'agendas' ? (
            <>
              <h1 className="gestion-title" style={{ margin: 0 }}>{active.label}</h1>
            </>
          ) : (
            <>
              <h1 className="gestion-title">{active.label}</h1>
              <SearchBar
                value={search}
                onChange={(val) => { setSearch(val); }}
                placeholder={`Buscar en ${active.label}...`}
              />
            </>
          )}
        </div>
        
        {/* Subtitles for specific views */}
        {active.id === 'cuenta-cobro' && (
          <p className="oa-subtitle" style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Gestione las cuentas de cobro de contratistas</p>
        )}
        {active.id === 'agendas' && (
          <p className="oa-subtitle" style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Visualice y administre las agendas médicas programadas</p>
        )}
      </header>

      <div className="tabs-card-group">
        <div className="tg-tabs-scroll-area">
          {MOV_TABS.map(({ id, label, path, Icon }, index) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `tg-tab-pill${isActive ? ' active' : ''}${index === 0 ? ' first' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="tg-active-tab-icon">
                      <Icon size={13} />
                    </div>
                  )}
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className={`gestion-content-card${isFirst ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>
          <Outlet context={{ search, setSearch }} />
        </div>
      </div>

    </div>
  );
};

export default MovimientosLayout;
