import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Eye, Printer, Pencil, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import '../../styles/Movimientos/OrdenAtencion.css';
import logoPrint from '../../assets/img/Sidebar/Sidebar.svg';

/* ─── Tipos ─────────────────────────────────────────────── */
interface OrdenAtencion {
  id: number;
  numero: number;
  vigencia: number;
  beneficiario: string;
  contratista: string;
  especialidad: string | number;
  fecha: string;
  estado: 'A' | 'I' | 'P';
  tipoAtencion?: string;
  observaciones?: string;
  funcionarioSolicitante?: string;
  medicoTratante?: string;
  diagnostico?: string;
  valorEstimado?: string;
}

const TIPOS_ATENCION = ['Consulta General', 'Control', 'Urgencia', 'Especializada'];
const VIGENCIAS = ['Todas las vigencias', '2026', '2025', '2024'];
const ESTADOS_FILTER = ['Todos', 'A', 'I', 'P'];

const MOCK_ORDENES: OrdenAtencion[] = [
  { id: 1, numero: 668, vigencia: 2026, beneficiario: 'ROSALINA PALMA SANDOVAL', contratista: 'CLAUDIA BASSIL AMIN', especialidad: 'Consulta General', fecha: '21/02/2026', estado: 'A' },
  { id: 2, numero: 667, vigencia: 2026, beneficiario: 'CARLOS MENDEZ RUIZ', contratista: 'Piedad Viana Marzola', especialidad: 'Especializada', fecha: '21/02/2026', estado: 'A' },
  { id: 3, numero: 666, vigencia: 2026, beneficiario: 'MARIA GARCIA LOPEZ', contratista: 'ABRIL GALEANO GIOVANNI', especialidad: 'Urgencia', fecha: '20/02/2026', estado: 'I' },
  { id: 4, numero: 665, vigencia: 2025, beneficiario: 'JUAN PEREZ MONTOYA', contratista: 'CLAUDIA BASSIL AMIN', especialidad: 'Control', fecha: '15/02/2026', estado: 'P' },
  { id: 5, numero: 664, vigencia: 2025, beneficiario: 'ANA RODRIGUEZ SILVA', contratista: 'Piedad Viana Marzola', especialidad: 'Consulta General', fecha: '14/02/2026', estado: 'A' },
  { id: 6, numero: 663, vigencia: 2026, beneficiario: 'PEDRO HERRERA ZULUAGA', contratista: 'ABRIL GALEANO GIOVANNI', especialidad: 'Especializada', fecha: '13/02/2026', estado: 'A' },
  { id: 7, numero: 662, vigencia: 2026, beneficiario: 'LUCIA MARTINEZ VEGA', contratista: 'CLAUDIA BASSIL AMIN', especialidad: 'Urgencia', fecha: '12/02/2026', estado: 'I' },
];

/* ─── Badge estado ───────────────────────────────────────── */
const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => (
  <span className={`oa-estado-badge oa-estado-${estado.toLowerCase()}`}>{estado}</span>
);

/* ─── Custom Select (dropdown estilo Figma) ─────────────── */
interface CustomSelectProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  label?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, placeholder = 'Seleccionar', onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <fieldset className={`oa-fieldset oa-custom-select ${open ? 'open' : ''}`} ref={ref}>
      {label && <legend className="oa-legend">{label}</legend>}
      <div
        className="oa-custom-select-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? '' : 'placeholder'}>{value || placeholder}</span>
        <ChevronDown size={13} className={`oa-custom-select-arrow ${open ? 'open' : ''}`} />
      </div>
      {open && (
        <ul className="oa-custom-select-dropdown">
          {options.map(opt => (
            <li
              key={opt}
              className={`oa-custom-select-option ${value === opt ? 'selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL: Detalles de la Orden
   ═══════════════════════════════════════════════════════════ */
const DetallesModal: React.FC<{ orden: OrdenAtencion; onClose: () => void }> = ({ orden, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title="Detalles de la Orden" className="oa-modal-detalles">
    <div className="oa-modal-detalles-body">
      <div className="oa-det-field">
        <span className="oa-det-label">Número de Orden</span>
        <span className="oa-det-value bold">{orden.numero}</span>
      </div>
      <div className="oa-det-divider" />
      <div className="oa-det-row">
        <div className="oa-det-field">
          <span className="oa-det-label">Estado</span>
          <EstadoBadge estado={orden.estado} />
        </div>
        <div className="oa-det-field">
          <span className="oa-det-label">Tipo de Atención</span>
          <span className="oa-det-value">{orden.tipoAtencion || '—'}</span>
        </div>
      </div>
      <div className="oa-det-divider" />
      <div className="oa-det-field">
        <span className="oa-det-label">Beneficiario</span>
        <span className="oa-det-value bold">{orden.beneficiario}</span>
      </div>
      <div className="oa-det-field">
        <span className="oa-det-label">Funcionario Solicitante</span>
        <span className="oa-det-value">{orden.funcionarioSolicitante || '—'}</span>
      </div>
      <div className="oa-det-row">
        <div className="oa-det-field">
          <span className="oa-det-label">Médico Tratante</span>
          <span className="oa-det-value">{orden.medicoTratante || '—'}</span>
        </div>
        <div className="oa-det-field">
          <span className="oa-det-label">Especialidad</span>
          <span className="oa-det-value">{orden.especialidad}</span>
        </div>
      </div>
      <div className="oa-det-divider" />
      <div className="oa-det-field">
        <span className="oa-det-label">Fecha</span>
        <span className="oa-det-value">{orden.fecha}</span>
      </div>
      {orden.observaciones && (
        <>
          <div className="oa-det-divider" />
          <div className="oa-det-field">
            <span className="oa-det-label">Observaciones</span>
            <span className="oa-det-value">{orden.observaciones}</span>
          </div>
        </>
      )}
    </div>
    <div className="oa-modal-detalles-footer">
      <button className="oa-btn-print" onClick={() => window.print()}>
        <Printer size={14} /> Imprimir
      </button>
      <button className="oa-btn-cerrar" onClick={onClose}>Cerrar</button>
    </div>
  </Modal>
);

/* ═══════════════════════════════════════════════════════════
   MODAL: Editar Orden (multi-paso, estilo Figma)
   ═══════════════════════════════════════════════════════════ */
type EditStep = 0 | 1 | 2;
const STEPS = ['Datos Generales', 'Beneficiario y Funcionario', 'Atención Médica'];

const EditarOrdenModal: React.FC<{
  orden: OrdenAtencion;
  onClose: () => void;
  onSave: (o: OrdenAtencion) => void;
}> = ({ orden, onClose, onSave }) => {
  const [step, setStep] = useState<EditStep>(0);
  const [form, setForm] = useState({
    tipoAtencion: orden.tipoAtencion || '',
    fecha: orden.fecha,
    observaciones: orden.observaciones || '',
    beneficiario: orden.beneficiario,
    funcionarioSolicitante: orden.funcionarioSolicitante || '',
    medicoTratante: orden.medicoTratante || '',
    especialidad: String(orden.especialidad),
    diagnostico: orden.diagnostico || '',
    valorEstimado: orden.valorEstimado || '',
  });

  const change = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const updated = { ...orden, ...form, especialidad: form.especialidad };
    try {
      await api.put(`/ordenes-atencion/${orden.id}`, updated);
    } catch { /* continuar aunque falle */ }
    onSave(updated as OrdenAtencion);
    onClose();
  };

  /* Helpers para fecha */
  const toInputDate = (dd_mm_yyyy: string) => {
    const parts = dd_mm_yyyy.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  };
  const fromInputDate = (yyyy_mm_dd: string) => {
    const parts = yyyy_mm_dd.split('-');
    if (parts.length !== 3) return yyyy_mm_dd;
    return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
  };

  return (
    <Modal isOpen={true} onClose={onClose} hideHeader className="oa-modal-edit">
      {/* ── Header con steps ── */}
      <div className="oa-modal-edit-header">
        <div className="oa-steps-row">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`oa-step ${step === i ? 'active' : step > i ? 'done' : ''}`}>
                <div className="oa-step-circle">
                  {step > i ? '✓' : i + 1}
                </div>
                <span className="oa-step-label">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`oa-step-line ${step > i ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="oa-modal-edit-body">

        {/* Paso 0 */}
        {step === 0 && (
          <div className="oa-form-grid">
            <div className="oa-field-full">
              <CustomSelect
                label="Tipo de Atención *"
                value={form.tipoAtencion}
                options={TIPOS_ATENCION}
                placeholder="Seleccionar tipo"
                onChange={v => change('tipoAtencion', v)}
              />
            </div>
            <fieldset className="oa-fieldset">
              <legend className="oa-legend">Fecha de la Orden *</legend>
              <input
                type="date"
                className="oa-input"
                value={toInputDate(form.fecha)}
                onChange={e => change('fecha', fromInputDate(e.target.value))}
              />
            </fieldset>
            <fieldset className="oa-fieldset oa-field-full">
              <legend className="oa-legend">Observaciones</legend>
              <textarea
                className="oa-textarea"
                rows={3}
                value={form.observaciones}
                onChange={e => change('observaciones', e.target.value)}
              />
            </fieldset>
          </div>
        )}

        {/* Paso 1 */}
        {step === 1 && (
          <div className="oa-form-grid">
            <fieldset className="oa-fieldset oa-field-full">
              <legend className="oa-legend">Beneficiario *</legend>
              <input
                className="oa-input"
                value={form.beneficiario}
                onChange={e => change('beneficiario', e.target.value)}
              />
            </fieldset>
            <fieldset className="oa-fieldset oa-field-full">
              <legend className="oa-legend">Funcionario Solicitante</legend>
              <input
                className="oa-input"
                value={form.funcionarioSolicitante}
                onChange={e => change('funcionarioSolicitante', e.target.value)}
              />
            </fieldset>
          </div>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <div className="oa-form-grid">
            <fieldset className="oa-fieldset oa-field-full">
              <legend className="oa-legend">Médico Tratante *</legend>
              <input className="oa-input" placeholder="Médico Tratante" value={form.medicoTratante} onChange={e => change('medicoTratante', e.target.value)} />
            </fieldset>
            <fieldset className="oa-fieldset oa-field-full">
              <legend className="oa-legend">Especialidad *</legend>
              <input className="oa-input" value={form.especialidad} onChange={e => change('especialidad', e.target.value)} />
            </fieldset>
            <fieldset className="oa-fieldset oa-field-full">
              <legend className="oa-legend">Diagnóstico (Opcional)</legend>
              <input className="oa-input" value={form.diagnostico} onChange={e => change('diagnostico', e.target.value)} />
            </fieldset>
            <fieldset className="oa-fieldset">
              <legend className="oa-legend">Valor Total Estimado</legend>
              <input className="oa-input" placeholder="$" value={form.valorEstimado} onChange={e => change('valorEstimado', e.target.value)} />
            </fieldset>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="oa-modal-edit-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="oa-btn-cancel-edit" onClick={onClose}>
          <X size={16} color="#0165B0" /> <span style={{ color: '#0165B0', fontWeight: 600 }}>Cancelar</span>
        </button>
        <div className="oa-footer-nav" style={{ display: 'flex', gap: '8px' }}>
          {step > 0 && (
            <button className="oa-btn-prev" onClick={() => setStep(s => (s - 1) as EditStep)}>
              <ChevronLeft size={14} /> Anterior
            </button>
          )}
          {step < 2 ? (
            <button className="oa-btn-next" onClick={() => setStep(s => (s + 1) as EditStep)}>
              Siguiente <ChevronRight size={14} />
            </button>
          ) : (
            <button className="oa-btn-next" onClick={handleSave}>
              Actualizar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const OrdenAtencionView: React.FC = () => {
  const [ordenes] = useState<OrdenAtencion[]>(MOCK_ORDENES);
  const { search, setSearch } = useOutletContext<{ search: string; setSearch: (v: string) => void }>();
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [vigenciaFilter, setVigenciaFilter] = useState('Todas las vigencias');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detallesOrden, setDetallesOrden] = useState<OrdenAtencion | null>(null);
  const [editOrden, setEditOrden] = useState<OrdenAtencion | null>(null);

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    return ordenes.filter(o => {
      const matchSearch =
        String(o.numero).includes(search) ||
        o.beneficiario.toLowerCase().includes(search.toLowerCase()) ||
        o.contratista.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'Todos' || o.estado === estadoFilter;
      const matchVigencia = vigenciaFilter === 'Todas las vigencias' || String(o.vigencia) === vigenciaFilter;
      return matchSearch && matchEstado && matchVigencia;
    });
  }, [ordenes, search, estadoFilter, vigenciaFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handleSaveEdit = (updated: OrdenAtencion) => {
    setOrdenes(p => p.map(o => o.id === updated.id ? updated : o));
  };

  const handleImprimir = (o: OrdenAtencion) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Orden de Atención #${o.numero}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0165B0; padding-bottom: 20px; margin-bottom: 30px; }
            .header-text h1 { margin: 0; color: #0165B0; font-size: 26px; }
            .header-text p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
            .logo { height: 48px; object-fit: contain; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; margin-bottom: 30px; }
            .field { display: flex; flex-direction: column; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #0165B0; }
            .label { font-weight: bold; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .value { font-size: 16px; color: #0f172a; font-weight: 500; }
            .full-width { grid-column: 1 / -1; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-text">
              <h1>Orden de Atención</h1>
              <p>Comprobante de registro - ZARU / MediSENA</p>
            </div>
            <img src="${window.location.origin}${logoPrint}" class="logo" alt="Logo" />
          </div>
          <div class="grid">
            <div class="field"><div class="label">Número de Orden</div><div class="value">#${o.numero}</div></div>
            <div class="field"><div class="label">Vigencia</div><div class="value">${o.vigencia}</div></div>
            <div class="field"><div class="label">Fecha</div><div class="value">${o.fecha}</div></div>
            <div class="field"><div class="label">Estado</div><div class="value">${o.estado === 'A' ? 'Activo' : o.estado === 'I' ? 'Inactivo' : o.estado}</div></div>
            <div class="field full-width"><div class="label">Beneficiario</div><div class="value">${o.beneficiario}</div></div>
            <div class="field full-width"><div class="label">Contratista / Médico</div><div class="value">${o.contratista || o.medicoTratante || 'N/A'}</div></div>
            <div class="field full-width"><div class="label">Especialidad / Tipo de Atención</div><div class="value">${o.especialidad} ${o.tipoAtencion ? '(' + o.tipoAtencion + ')' : ''}</div></div>
            ${o.diagnostico ? `<div class="field full-width"><div class="label">Diagnóstico</div><div class="value">${o.diagnostico}</div></div>` : ''}
            ${o.observaciones ? `<div class="field full-width"><div class="label">Observaciones</div><div class="value">${o.observaciones}</div></div>` : ''}
          </div>
          <div class="footer">
            Documento generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  /* ── Headers de la tabla ── */
  const tableHeaders = (
    <tr>
      <th>Número</th>
      <th>Vigencia</th>
      <th>Beneficiario</th>
      <th>Contratista</th>
      <th>Especialidad</th>
      <th>Fecha</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  );

  return (
    <>

              {/* Barra de advertencia — siempre visible */}
              <div className="oa-warning-bar">
                ⚠️ <strong>Base de datos con 3.1 millones de órdenes.</strong> Por rendimiento, mostrando máximo 1,000 órdenes. Use filtros para refinar la búsqueda.
              </div>

              {/* Toolbar */}
              <div className="oa-toolbar">

                <div className="oa-filter-group">
                  <span className="oa-filter-label">Estado</span>
                  <div className="oa-select-wrap oa-filter-select-wrap">
                    <select className="oa-filter-select" value={estadoFilter}
                      onChange={e => { setEstadoFilter(e.target.value); setCurrentPage(1); }}>
                      {ESTADOS_FILTER.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={12} className="oa-select-icon" />
                  </div>
                </div>

                <div className="oa-filter-group">
                  <span className="oa-filter-label">Vigencia</span>
                  <div className="oa-select-wrap oa-filter-select-wrap">
                    <select className="oa-filter-select" value={vigenciaFilter}
                      onChange={e => { setVigenciaFilter(e.target.value); setCurrentPage(1); }}>
                      {VIGENCIAS.map(v => <option key={v}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="oa-select-icon" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button className="oa-btn-ver-todas" onClick={() => { setEstadoFilter('Todos'); setVigenciaFilter('Todas las vigencias'); setSearch(''); }}>
                    Ver Todas
                  </button>
                  <button className="oa-btn-filtradas">Filtradas</button>
                </div>
              </div>

              {/* Tabla con DataTable */}
              <DataTable
                headers={tableHeaders}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                visiblePages={visiblePages}
              >
                {current.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">No se encontraron resultados.</td></tr>
                ) : current.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.numero}</strong></td>
                    <td>{o.vigencia}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{o.beneficiario}</span>
                        <span className="oa-ben-badge">C</span>
                      </div>
                    </td>
                    <td>{o.contratista}</td>
                    <td>{o.especialidad}</td>
                    <td>{o.fecha}</td>
                    <td><EstadoBadge estado={o.estado} /></td>
                    <td>
                      <div className="oa-actions-cell">
                        <button className="oa-action-btn oa-action-eye" title="Ver" onClick={() => setDetallesOrden(o)}>
                          <Eye size={15} />
                        </button>
                        <button className="oa-action-btn oa-action-print" title="Imprimir" onClick={() => handleImprimir(o)}>
                          <Printer size={15} />
                        </button>
                        <button className="oa-action-btn oa-action-edit" title="Editar" onClick={() => setEditOrden(o)}>
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>

      {detallesOrden && <DetallesModal orden={detallesOrden} onClose={() => setDetallesOrden(null)} />}
      {editOrden && <EditarOrdenModal orden={editOrden} onClose={() => setEditOrden(null)} onSave={handleSaveEdit} />}
    </>
  );
};

export default OrdenAtencionView;
