import {
  ClipboardList, Receipt, CreditCard,
  CalendarPlus, CalendarCheck, XCircle, Search,
} from 'lucide-react';
import type { TabItem } from '../../components/TabGroup';

export const MOV_TABS: (TabItem & { path: string })[] = [
  { id: 'orden-atencion', label: 'Orden de Atención', path: '/movimientos/orden-atencion', icon: ClipboardList },
  { id: 'cuenta-cobro', label: 'Cuenta de Cobro', path: '/movimientos/cuenta-cobro', icon: Receipt },
  { id: 'relacion-pagos', label: 'Relación de Pagos', path: '/movimientos/relacion-pagos', icon: CreditCard },
  { id: 'programar-agenda', label: 'Programar Agenda', path: '/movimientos/programar-agenda', icon: CalendarPlus },
  { id: 'agendas', label: 'Agendas', path: '/movimientos/agendas', icon: CalendarCheck },
  { id: 'cancelar-ordenes', label: 'Cancelar Órdenes', path: '/movimientos/cancelar-ordenes', icon: XCircle },
  { id: 'consultar-ordenes', label: 'Consultar Órdenes', path: '/movimientos/consultar-ordenes', icon: Search },
];
