import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList, Receipt, CreditCard, CalendarPlus, CalendarCheck, XCircle, Search,
} from 'lucide-react';

/* Orden exacto del Sidebar */
const TABS = [
  { label: 'Orden de Atención',  path: '/movimientos/orden-atencion',   icon: ClipboardList },
  { label: 'Cuenta de Cobro',    path: '/movimientos/cuenta-cobro',      icon: Receipt       },
  { label: 'Relación de Pagos',  path: '/movimientos/relacion-pagos',    icon: CreditCard    },
  { label: 'Programar Agenda',   path: '/movimientos/programar-agenda',  icon: CalendarPlus  },
  { label: 'Agendas',            path: '/movimientos/agendas',           icon: CalendarCheck },
  { label: 'Cancelar Órdenes',   path: '/movimientos/cancelar-ordenes',  icon: XCircle       },
  { label: 'Consultar Órdenes',  path: '/movimientos/consultar-ordenes', icon: Search        },
];

interface MovTabsProps {
  /** Callback que recibe true si el tab activo es el primero */
  onFirstActive?: (isFirst: boolean) => void;
}

const MovTabs: React.FC<MovTabsProps> = ({ onFirstActive }) => {
  const navigate      = useNavigate();
  const { pathname }  = useLocation();

  const activeIdx = TABS.findIndex(t => t.path === pathname);

  /* Notificar al padre si el primero está activo */
  React.useEffect(() => {
    onFirstActive?.(activeIdx === 0);
  }, [activeIdx]);

  return (
    <div className="tabs-scroll-area">
      {TABS.map(({ label, path, icon: Icon }, idx) => {
        const active = idx === activeIdx;
        return (
          <div
            key={path}
            className={`tab-pill${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            {active && (
              <div className="active-tab-icon">
                <Icon size={13} />
              </div>
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
};

export { TABS };
export default MovTabs;
