import React, { useState } from 'react';
import {
  Search, Filter, Info, ChevronDown, User,
  Calendar, Users, Briefcase, Phone, MapPin,
  Heart, Activity, FileText, CalendarDays,
} from 'lucide-react';
import { BeneficiarioConsulta, BUSCAR_POR_OPTS } from './types';

/* ─── Formulario de búsqueda vacío ──────────────────── */
export const EMPTY_BENEFICIARIO_FILTER = {
  buscarPor: 'Identificación',
  valor: '',
};

/* ══════════════════════════════════════════════════════
   PANEL DE BÚSQUEDA – Buscar Beneficiario
   ══════════════════════════════════════════════════════ */
interface BuscarProps {
  filters: typeof EMPTY_BENEFICIARIO_FILTER;
  onChange: (field: string, value: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  loading: boolean;
}

export const BeneficiarioBuscar: React.FC<BuscarProps> = ({
  filters, onChange, onBuscar, onLimpiar, loading,
}) => (
  <div className="cons-filters-card">
    <div className="cons-filters-grid cons-filters-grid-2">
      <div className="cons-input-group" style={{ maxWidth: 180 }}>
        <label className="cons-floating-label">Buscar por</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={filters.buscarPor} onChange={e => onChange('buscarPor', e.target.value)}>
            {BUSCAR_POR_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">
          {filters.buscarPor === 'Identificación' ? 'Número de Identificación' : 'Nombre Completo'}
        </label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            placeholder={filters.buscarPor === 'Identificación' ? 'Ej: 12345678' : 'Ej: Juan Pérez Rodríguez'}
            value={filters.valor}
            onChange={e => onChange('valor', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onBuscar()}
          />
        </div>
      </div>
    </div>

    <div className="cons-actions-row">
      <button className="cons-btn-consultar" onClick={onBuscar} disabled={loading || !filters.valor.trim()}>
        <Search size={15} />
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
      <button className="cons-btn-limpiar" onClick={onLimpiar}>
        <Filter size={14} />
        Limpiar
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   ESTADO VACÍO
   ══════════════════════════════════════════════════════ */
export const BeneficiarioEmpty: React.FC = () => (
  <div className="cons-empty-state">
    <div className="cons-empty-icon">
      <Info size={22} color="#94a3b8" />
    </div>
    <h3 className="cons-empty-title">Ingrese un criterio de búsqueda</h3>
    <p className="cons-empty-desc">Puede buscar por número de identificación o por nombre completo</p>
  </div>
);

/* ══════════════════════════════════════════════════════
   SECCIÓN COLAPSABLE (reutilizable)
   ══════════════════════════════════════════════════════ */
interface CollapsibleProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, icon, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cons-collapsible">
      <button className="cons-collapsible-head" onClick={() => setOpen(o => !o)}>
        <span className="cons-collapsible-title">
          {icon}
          {title}
        </span>
        <ChevronDown size={16} className={`cons-collapsible-chev ${open ? 'open' : ''}`} />
      </button>
      {open && <div className="cons-collapsible-body">{children}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   TARJETA DEL BENEFICIARIO (Ficha completa)
   ══════════════════════════════════════════════════════ */
interface FichaProps {
  b: BeneficiarioConsulta;
}

export const BeneficiarioFicha: React.FC<FichaProps> = ({ b }) => {
  const iniciales = b.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="cons-benef-card">
      {/* Header con avatar */}
      <div className="cons-benef-header">
        <div className="cons-benef-avatar">{iniciales}</div>
        <div className="cons-benef-head-info">
          <h3 className="cons-benef-name">{b.nombreCompleto}</h3>
          <div className="cons-benef-sub">
            <span>{b.tipoId} - {b.identificacion}</span>
          </div>
          <div className="cons-benef-tags">
            <span className={`cons-benef-tag ${b.estado === 'Activo' ? 'active' : 'inactive'}`}>
              {b.estado === 'Activo' ? '●' : '○'} {b.estado}
            </span>
            <span className="cons-benef-tag gray">{b.edad} años</span>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <Collapsible title="Información Personal" icon={<User size={14} />} defaultOpen>
        <div className="cons-benef-grid">
          <div className="cons-benef-field">
            <div className="cons-benef-label">
              <Calendar size={12} />
              Fecha de Nacimiento
            </div>
            <div className="cons-benef-value">{b.fechaNacimiento}</div>
          </div>
          <div className="cons-benef-field">
            <div className="cons-benef-label">
              <Users size={12} />
              Parentesco
            </div>
            <div className="cons-benef-value">{b.parentesco}</div>
          </div>
          <div className="cons-benef-field">
            <div className="cons-benef-label">
              <User size={12} />
              Sexo
            </div>
            <div className="cons-benef-value">{b.sexo}</div>
          </div>
          <div className="cons-benef-field">
            <div className="cons-benef-label">
              <Briefcase size={12} />
              Funcionario Titular
            </div>
            <div className="cons-benef-value">{b.funcionarioTitular}</div>
          </div>
        </div>
      </Collapsible>

      {/* Información de Contacto */}
      <Collapsible title="Información de Contacto" icon={<Phone size={14} />} defaultOpen>
        <div className="cons-benef-list">
          <div className="cons-benef-list-item">
            <Phone size={13} className="cons-benef-list-icon" />
            <div>
              <div className="cons-benef-label">Teléfono</div>
              <div className="cons-benef-value">{b.telefono}</div>
            </div>
          </div>
          <div className="cons-benef-list-item">
            <MapPin size={13} className="cons-benef-list-icon" />
            <div>
              <div className="cons-benef-label">Dirección</div>
              <div className="cons-benef-value">{b.direccion}</div>
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Información de Salud */}
      <Collapsible title="Información de Salud" icon={<Heart size={14} />} defaultOpen>
        <div className="cons-benef-kpis">
          <div className="cons-benef-kpi cons-kpi-blue">
            <span className="cons-kpi-label">EPS</span>
            <span className="cons-kpi-value">{b.eps || 'No especificada'}</span>
          </div>
          <div className="cons-benef-kpi cons-kpi-green">
            <span className="cons-kpi-label">Estado</span>
            <span className="cons-kpi-value">{b.estado}</span>
          </div>
        </div>
      </Collapsible>

      {/* Historial de Servicios */}
      <Collapsible title="Historial de Servicios" icon={<Activity size={14} />} defaultOpen>
        <div className="cons-benef-kpis">
          <div className="cons-benef-kpi cons-kpi-dark">
            <FileText size={18} />
            <span className="cons-kpi-big">{b.ordenesTotales}</span>
            <span className="cons-kpi-caption">Órdenes Totales</span>
          </div>
          <div className="cons-benef-kpi cons-kpi-teal">
            <CalendarDays size={18} />
            <span className="cons-kpi-big">{b.citasTotales}</span>
            <span className="cons-kpi-caption">Citas Totales</span>
          </div>
        </div>
        <div className="cons-benef-hint">
          <Info size={13} />
          Para ver el historial detallado, diríjase a los módulos de Órdenes o Citas.
        </div>
      </Collapsible>
    </div>
  );
};
