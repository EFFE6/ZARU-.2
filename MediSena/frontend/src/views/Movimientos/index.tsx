import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import {
  ClipboardList, Receipt, CreditCard,
  CalendarPlus, CalendarCheck, XCircle, Search,
  Home, ChevronRight,
} from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import '../../styles/Movimientos/OrdenAtencion.css';
import CampanaSvg from '../../assets/img/icons/campana.svg';

const MOV_TABS = [
  { id: 'orden-atencion',    label: 'Orden de Atención',  path: '/movimientos/orden-atencion',   Icon: ClipboardList },
  { id: 'cuenta-cobro',      label: 'Cuenta de Cobro',    path: '/movimientos/cuenta-cobro',      Icon: Receipt       },
  { id: 'relacion-pagos',    label: 'Relación de Pagos',  path: '/movimientos/relacion-pagos',    Icon: CreditCard    },
  { id: 'programar-agenda',  label: 'Programar Agenda',   path: '/movimientos/programar-agenda',  Icon: CalendarPlus  },
  { id: 'agendas',           label: 'Agendas',            path: '/movimientos/agendas',           Icon: CalendarCheck },
  { id: 'cancelar-ordenes',  label: 'Cancelar Órdenes',   path: '/movimientos/cancelar-ordenes',  Icon: XCircle       },
  { id: 'consultar-ordenes', label: 'Consultar Órdenes',  path: '/movimientos/consultar-ordenes', Icon: Search        },
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
          <h1 className="gestion-title">{active.label}</h1>
            <SearchBar
              value={search}
              onChange={(val) => { setSearch(val); }}
              placeholder={`Buscar en ${active.label}...`}
            />
          </div>
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
