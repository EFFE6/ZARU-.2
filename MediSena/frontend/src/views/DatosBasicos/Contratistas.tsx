import React, { useState } from 'react';
import { Filter, RefreshCw, Plus, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Filters from '../../components/Filters';
import '../../styles/DatosBasicos/Contratistas.css';

import { TipoCcContratistasIcon, PrestaServiciosContratistasIcon, ImgModalEliminarIcon, ViewIcon, EditIcon, DeleteIcon, EditarDetallesIcon } from '../../components/Icons';

const MOCK_CONTRATISTAS = [
  {
    id: '9526609',
    nombres: 'ATENCIÓN MEDICA INTEGRAL FAMI',
    apellidos: '',
    avatar: 'https://i.pravatar.cc/150?u=5',
    tipoDoc: 'C.C.',
    tipoVinculacion: 'Prestación de servicios',
    cargo: 'Prestador de servicios',
    ingreso: '20/04/2026',
    dependencia: 'ALARCON SALOMON',
    regional: '18',
    email: 'marthalucia21@misena.edu.co',
    estado: true,
  },
  {
    id: '9526609',
    nombres: 'CENTRO DE SERVICIOS DE SALUD REGIONAL DE ANTIOQUIA',
    apellidos: '',
    avatar: 'https://i.pravatar.cc/150?u=6',
    tipoDoc: 'C.C.',
    tipoVinculacion: 'Prestación de servicios',
    cargo: 'Prestador de servicios',
    ingreso: '20/04/2026',
    dependencia: 'ALARCON SALOMON',
    regional: '18',
    email: 'centro@misena.edu.co',
    estado: false,
  },
  {
    id: '9526609',
    nombres: 'CLINICA BLAS DE LEZO',
    apellidos: '',
    avatar: 'https://i.pravatar.cc/150?u=7',
    tipoDoc: 'C.C.',
    tipoVinculacion: 'Prestación de servicios',
    cargo: 'Prestador de servicios',
    ingreso: '20/04/2026',
    dependencia: 'ALARCON SALOMON',
    regional: '18',
    email: 'blas@misena.edu.co',
    estado: true,
  },
  {
    id: '9526609',
    nombres: 'CLINICA FARALLONES S.A',
    apellidos: '',
    avatar: 'https://i.pravatar.cc/150?u=8',
    tipoDoc: 'C.C.',
    tipoVinculacion: 'Prestación de servicios',
    cargo: 'Prestador de servicios',
    ingreso: '20/04/2026',
    dependencia: 'ALARCON SALOMON',
    regional: '18',
    email: 'farallones@misena.edu.co',
    estado: false,
  },
];

interface ContratistasProps {
  searchQuery: string;
}

const Contratistas: React.FC<ContratistasProps> = ({ searchQuery }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoDocFilter, setTipoDocFilter] = useState('');
  const [data, setData] = useState(MOCK_CONTRATISTAS);

  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const toggleEstado = (index: number) => {
    const newData = [...data];
    newData[index].estado = !newData[index].estado;
    setData(newData);
  };

  const filteredData = data.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchSearch = item.nombres.toLowerCase().includes(term) || item.id.includes(term);
    const matchEstado = estadoFilter ? (estadoFilter === 'activo' ? item.estado : !item.estado) : true;
    const matchTipoDoc = tipoDocFilter ? item.tipoDoc === tipoDocFilter : true;
    return matchSearch && matchEstado && matchTipoDoc;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="db-toolbar">
        <Filters>
          <select
            className="db-select db-min-w-150"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="" disabled hidden>Estado</option>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <select
            className="db-select db-min-w-170"
            value={tipoDocFilter}
            onChange={(e) => setTipoDocFilter(e.target.value)}
          >
            <option value="" disabled hidden>Tipo de documento</option>
            <option value="">Todas</option>
            <option value="C.C.">C.C.</option>
          </select>
        </Filters>

        <div className="db-toolbar-right db-toolbar-actions">
          <button className="db-btn-refresh">
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button className="db-btn-new" onClick={() => { setSelectedUser(null); setModalEditar(true); }}>
            <Plus size={18} />
            Nuevo Funcionario
          </button>
        </div>
      </div>

      <DataTable
        headers={
          <tr>
            <th>ID</th>
            <th>NOMBRE COMPLETO <span className="db-sort-icon">⇅</span></th>
            <th>TIPO DE DOC.</th>
            <th>ESTADO</th>
            <th>TIPO VINCULACIÓN</th>
            <th>CARGO</th>
            <th>INGRESO</th>
            <th></th>
          </tr>
        }
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        visiblePages={Array.from({ length: totalPages }, (_, i) => i + 1)}
      >
        {currentItems.map((item, idx) => (
          <tr key={idx}>
            <td className="db-col-id">{item.id}</td>
            <td>
              <div className="db-user-cell">
                <div className="db-user-avatar db-bg-transparent">
                  <img src={item.avatar} alt="avatar" />
                </div>
                <div className="db-user-info">
                  <div className="db-user-name db-uppercase">
                    {item.nombres}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span className="db-cargo-pill amarillo db-badge-amarillo-solid">
                <TipoCcContratistasIcon className="db-cargo-icon" />
                {item.tipoDoc}
              </span>
            </td>
            <td>
              <button
                className={`db-toggle-switch ${item.estado ? 'active' : ''}`}
                onClick={() => toggleEstado(idx)}
              >
                <span className="db-toggle-thumb">
                  {item.estado
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  }
                </span>
              </button>
            </td>
            <td>
              <span className="db-cargo-pill amarillo db-badge-amarillo-solid">
                <PrestaServiciosContratistasIcon className="db-cargo-icon" />
                {item.tipoVinculacion}
              </span>
            </td>
            <td className="db-lh-12">{item.cargo}</td>
            <td>{item.ingreso}</td>
            <td>
              <div className="db-row-actions">
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalVer(true); }}>
                  <ViewIcon className="db-action-icon" />
                </button>
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalEditar(true); }}>
                  <EditIcon className="db-action-icon" />
                </button>
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalEliminar(true); }}>
                  <DeleteIcon className="db-action-icon" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* MODAL VER DETALLES CONTRATISTA */}
      <Modal isOpen={modalVer} onClose={() => setModalVer(false)} hideHeader className="db-modal-detalles-contratista" >
        <div className="db-ver-header-bar">
          <h2 className="db-ver-title">Detalles del contratista</h2>
          <div className="db-modal-flex-group">
            <button className="db-icon-btn-svg" onClick={() => { setModalVer(false); setModalEditar(true); }}>
              <EditIcon size={18} className="db-action-icon" />
            </button>
            <button className="db-modal-form-close" onClick={() => setModalVer(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="db-ver-body">
          <div className="db-ver-identity-row">
            <div className="db-ver-identity-left">
              <img src={selectedUser?.avatar} alt="avatar" className="db-ver-avatar" />
              <strong className="db-ver-fullname">{selectedUser?.nombres}</strong>
            </div>
            <div className="db-ver-identity-right">
              <span className="db-ver-cc-badge">
                <span className="db-ver-cc-label">C.C.</span>
                <span className="db-ver-cc-number db-badge-cc">{selectedUser?.id}</span>
              </span>
              <span className={`db-status-badge ${selectedUser?.estado ? 'activo' : 'inactivo'}`}>
                {selectedUser?.estado ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <X size={12} strokeWidth={3} />
                )}
                {selectedUser?.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="db-mt-4">
            <div className="db-form-label-small">Tipo de vinculación</div>
            <span className="db-cargo-pill azul db-badge-azul-solid">
              <PrestaServiciosContratistasIcon className="db-cargo-icon db-icon-purple-filter" />
              {selectedUser?.tipoVinculacion}
            </span>
          </div>

          <div className="db-ver-data-block">
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Cargo</span>
              <span className="db-ver-data-value">{selectedUser?.cargo}</span>
            </div>
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Dependencia</span>
              <span className="db-ver-data-value">{selectedUser?.dependencia}</span>
            </div>
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Regional</span>
              <span className="db-ver-data-value">{selectedUser?.regional}</span>
            </div>
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Fecha de ingreso</span>
              <span className="db-ver-data-value">{selectedUser?.ingreso}</span>
            </div>
          </div>

          <h4 className="db-ver-section-title db-mt-8">INFORMACIÓN DE CONTACTO</h4>

          <div className="db-ver-contact-grid">
            <div className="db-ver-contact-card">
              <div className="db-contact-card-flex">
                <div className="db-ver-contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <div className="db-ver-contact-label">Teléfono #1</div>
                  <div className="db-ver-contact-value">3208700268</div>
                </div>
              </div>
              <div className="db-ver-contact-ghost">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
            </div>

            <div className="db-ver-contact-card">
              <div className="db-contact-card-flex">
                <div className="db-ver-contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <div className="db-ver-contact-label">Teléfono #2</div>
                  <div className="db-ver-contact-value">3208700268</div>
                </div>
              </div>
              <div className="db-ver-contact-ghost">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
            </div>
          </div>

          <div className="db-ver-footer">
            <button className="db-btn-refresh db-ver-btn-edit db-font-600" onClick={() => { setModalVer(false); setModalEditar(true); }}>
              <EditarDetallesIcon size={16} />
              Editar
            </button>
            <button className="db-btn-new" onClick={() => setModalVer(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL EDITAR / NUEVO CONTRATISTA */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} hideHeader className="db-modal-official-full">
        <div className="db-modal-form-header">
          <h2 className="db-modal-form-title">
            {selectedUser ? 'Editar contratista' : 'Nuevo contratista'}
          </h2>
          <button className="db-modal-form-close" onClick={() => setModalEditar(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="db-modal-form-body">
          <h4 className="db-modal-section-title">INFORMACIÓN PERSONAL</h4>

          <div className="db-modal-grid-2">
            <div>
              <label className="db-form-label">Tipo de documento*</label>
              <select className="db-select db-form-select">
                <option>CÉDULA DE CIUDADANÍA</option>
              </select>
            </div>
            <div>
              <label className="db-form-label">Nº de identificación*</label>
              <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.id || ''} placeholder="Ej: 900236063" />
            </div>
            <div>
              <label className="db-form-label">Nombres*</label>
              <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.nombres || ''} />
            </div>
            <div>
              <label className="db-form-label">Apellidos*</label>
              <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.apellidos || ''} placeholder="Ej: INTEGRAL FAMI" />
            </div>
            <div>
              <label className="db-form-label">Tipo de vinculación*</label>
              <select className="db-select db-form-select">
                <option>Prestación de servicios</option>
              </select>
            </div>
            <div>
              <label className="db-form-label">Fecha de ingreso*</label>
              <div style={{ position: 'relative' }}>
                <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.ingreso || ''} placeholder="01/01/2026" />
                <svg style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>
            <div>
              <label className="db-form-label">Cargo*</label>
              <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.cargo || ''} placeholder="Prestador de servicios" />
            </div>
            <div>
              <label className="db-form-label">Dependencia*</label>
              <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.dependencia || ''} placeholder="Ej: 6060 - Dirección de formación profesional" />
            </div>
            <div>
              <label className="db-form-label">Regional*</label>
              <input type="text" className="db-search-input-header db-form-input" defaultValue={selectedUser?.regional || ''} />
            </div>
            <div>
              <label className="db-form-label">Teléfono*</label>
              <input type="text" className="db-search-input-header db-form-input" placeholder="Ej: 435149" />
            </div>
            <div>
              <label className="db-form-label">Email corporativo*</label>
              <input type="email" className="db-search-input-header db-form-input" defaultValue={selectedUser?.email || ''} placeholder="Ej: correo@mail.com" />
            </div>
          </div>

          <div className="db-form-actions">
            <button className="db-btn-refresh db-btn-cancel" onClick={() => setModalEditar(false)}>Cancelar</button>
            <button className="db-btn-new" onClick={() => setModalEditar(false)}><RefreshCw size={16} /> Actualizar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL ELIMINAR CONTRATISTA */}
      <Modal isOpen={modalEliminar} onClose={() => setModalEliminar(false)} hideHeader className="db-modal-official-full" style={{ width: '400px', maxWidth: '90%' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>Eliminar contratista</h2>
          <button className="db-modal-form-close" onClick={() => setModalEliminar(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 32px', textAlign: 'center' }}>
          <div style={{ width: '120px', height: '120px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImgModalEliminarIcon />
          </div>
          <p style={{ fontSize: '16px', color: '#1a3c5a', fontWeight: '700', marginBottom: '24px' }}>
            ¿Está seguro que desea eliminar el contratista<br />
            <span style={{ color: '#0165B0' }}>{selectedUser?.nombres} {selectedUser?.apellidos}</span>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="db-btn-refresh" style={{ border: '1px solid #0165B0', color: '#0165B0', fontWeight: '700' }} onClick={() => setModalEliminar(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Sí, eliminar
            </button>
            <button className="db-btn-new" onClick={() => setModalEliminar(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Contratistas;
