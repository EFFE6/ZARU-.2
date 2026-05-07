import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList, Receipt, CreditCard, CalendarPlus, CalendarCheck, XCircle, Search,
} from 'lucide-react';
import TabGroup, { TabItem } from '../../components/TabGroup';

/* Orden exacto del Sidebar */
const TABS: (TabItem & { path: string })[] = [
  { id: 'orden-atencion',    label: 'Orden de Atención',  path: '/movimientos/orden-atencion',   icon: ClipboardList },
  { id: 'cuenta-cobro',      label: 'Cuenta de Cobro',    path: '/movimientos/cuenta-cobro',      icon: Receipt       },
  { id: 'relacion-pagos',    label: 'Relación de Pagos',  path: '/movimientos/relacion-pagos',    icon: CreditCard    },
  { id: 'programar-agenda',  label: 'Programar Agenda',   path: '/movimientos/programar-agenda',  icon: CalendarPlus  },
  { id: 'agendas',           label: 'Agendas',            path: '/movimientos/agendas',           icon: CalendarCheck },
  { id: 'cancelar-ordenes',  label: 'Cancelar Órdenes',   path: '/movimientos/cancelar-ordenes',  icon: XCircle       },
  { id: 'consultar-ordenes', label: 'Consultar Órdenes',  path: '/movimientos/consultar-ordenes', icon: Search        },
];

interface MovTabsProps {
  /** Callback que recibe true si el tab activo es el primero */
  onFirstActive?: (isFirst: boolean) => void;
}

const MovTabs: React.FC<MovTabsProps> = ({ onFirstActive }) => {
  const navigate      = useNavigate();
  const { pathname }  = useLocation();

  const activeId = TABS.find(t => t.path === pathname)?.id ?? TABS[0].id;

  /* Notificar al padre si el primero está activo */
  React.useEffect(() => {
    onFirstActive?.(activeId === TABS[0].id);
  }, [activeId]);

  const handleTabChange = (id: string) => {
    const tab = TABS.find(t => t.id === id);
    if (tab) navigate(tab.path);
  };

  return (
    <TabGroup
      tabs={TABS}
      activeTab={activeId}
      onTabChange={handleTabChange}
      iconSize={13}
    />
  );
};

export { TABS };
export default MovTabs;
