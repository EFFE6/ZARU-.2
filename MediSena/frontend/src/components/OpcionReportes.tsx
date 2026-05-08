import { Calendar, FileText } from 'lucide-react';

/* ── Tipos ── */
export interface ReporteOpcion {
  id: string;
  nombre: string;
  nombreDisplay?: string;
  fecha: string;
  descripcion?: string;
  filtros?: ('regional' | 'fechas' | 'beneficiario' | 'identificacion')[];
}

interface Props {
  reporte: ReporteOpcion;
  isActive: boolean;
  onClick: () => void;
}

/* ── Componente ── */
const OpcionReportes = ({ reporte, isActive, onClick }: Props) => (
  <div
    className={`opcion-reporte${isActive ? ' active' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    id={`opcion-reporte-${reporte.id}`}
  >
    <div className="opcion-reporte-icon">
      <FileText size={16} strokeWidth={2.4} />
    </div>
    <div className="opcion-reporte-info">
      <span className="opcion-reporte-nombre" title={reporte.nombre}>{reporte.nombre}</span>
      <span className="opcion-reporte-fecha">
        <Calendar size={11} strokeWidth={2} />
        {reporte.fecha}
      </span>
    </div>
  </div>
);

export default OpcionReportes;
