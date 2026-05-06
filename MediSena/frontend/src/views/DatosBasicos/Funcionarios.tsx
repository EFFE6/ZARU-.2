import React, { useState } from 'react';
import { Filter, RefreshCw, Plus, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Filters from '../../components/Filters';
import '../../styles/DatosBasicos/Funcionarios.css';
import '../../styles/DatosBasicos/Beneficiarios.css';

import RegionalIcon from '../../assets/img/datosbasicos/icons/funcionarios/regional.svg';
import { CargosIcon, ViewIcon, EditIcon, DeleteIcon, EditarDetallesIcon } from '../../components/Icons';

const MOCK_FUNCIONARIOS = [
  {
    id: '9526609',
    nombres: 'LUIS ALEJANDRO',
    apellidos: 'AGUIRRE CAMACHO',
    avatar: 'https://i.pravatar.cc/150?u=1',
    cargo: 'Cargo',
    dependencia: '9101',
    regional: '63',
    beneficiariosActivos: 0,
    beneficiariosInactivos: 2,
    estado: true,
  },
  {
    id: '9526609',
    nombres: 'LAURA',
    apellidos: 'MARTINEZ',
    avatar: 'https://i.pravatar.cc/150?u=2',
    cargo: 'Cargo',
    dependencia: '9101',
    regional: '63',
    beneficiariosActivos: 0,
    beneficiariosInactivos: 2,
    estado: false,
  },
  {
    id: '9526609',
    nombres: 'LUISA',
    apellidos: 'ROJAS RODRIGUEZ',
    avatar: 'https://i.pravatar.cc/150?u=3',
    cargo: 'Cargo',
    dependencia: '9101',
    regional: '63',
    beneficiariosActivos: 0,
    beneficiariosInactivos: 2,
    estado: true,
  },
  {
    id: '9526609',
    nombres: 'SALOMON',
    apellidos: 'ALARCON',
    avatar: 'https://i.pravatar.cc/150?u=4',
    cargo: 'Cargo',
    dependencia: '9101',
    regional: '63',
    beneficiariosActivos: 0,
    beneficiariosInactivos: 2,
    estado: false,
  },
];

interface FuncionariosProps {
  searchQuery: string;
}

const Funcionarios: React.FC<FuncionariosProps> = ({ searchQuery }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [regionalFilter, setRegionalFilter] = useState('');
  const [data, setData] = useState(MOCK_FUNCIONARIOS);
  
  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalBeneficiarios, setModalBeneficiarios] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const toggleEstado = (index: number) => {
    const newData = [...data];
    newData[index].estado = !newData[index].estado;
    setData(newData);
  };

  const filteredData = data.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchSearch = item.nombres.toLowerCase().includes(term) || item.apellidos.toLowerCase().includes(term) || item.id.includes(term);
    const matchEstado = estadoFilter ? (estadoFilter === 'activo' ? item.estado : !item.estado) : true;
    const matchRegional = regionalFilter ? item.regional === regionalFilter : true;
    return matchSearch && matchEstado && matchRegional;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="db-toolbar">
        <Filters>
          <select 
            className="db-select db-toolbar-select"
            value={estadoFilter} 
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="" disabled hidden>Estado</option>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <select 
            className="db-select db-toolbar-select"
            value={regionalFilter} 
            onChange={(e) => setRegionalFilter(e.target.value)}
          >
            <option value="" disabled hidden>Regional</option>
            <option value="">Todas</option>
            <option value="63">63</option>
          </select>
        </Filters>

        <div className="db-toolbar-right db-modal-flex-group">
          <button className="db-btn-refresh">
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button className="db-btn-new" onClick={() => setModalNuevo(true)}>
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
            <th>CARGO</th>
            <th>DEPENDENCIA</th>
            <th>REGIONAL</th>
            <th>BENEFICIARIOS</th>
            <th>ESTADO</th>
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
                <div className="db-user-avatar">
                  <img src={item.avatar} alt="avatar" />
                </div>
                <div className="db-user-info">
                  <div className="db-user-name">
                    {item.apellidos}
                    <span>{item.nombres}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span className="db-cargo-pill azul">
                <CargosIcon size={16} color="currentColor" />
                {item.cargo}
              </span>
            </td>
            <td>{item.dependencia}</td>
            <td>
              <span className="db-regional-pill">
                <img src={RegionalIcon} alt="regional" className="db-cargo-icon" />
                {item.regional}
              </span>
            </td>
            <td>
              <div className="db-beneficiarios-td">
                <div className="db-beneficiarios-grid" onClick={() => { setSelectedUser(item); setModalBeneficiarios(true); }}>
                  <div className="db-beneficiario-stat bene-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="db-bene-count">{item.beneficiariosActivos}</span>
                  </div>
                  <div className="db-beneficiario-stat bene-x">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <span className="db-bene-count">{item.beneficiariosInactivos}</span>
                  </div>
                </div>
              </div>
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
              <div className="db-row-actions">
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalVer(true); }}>
                  <ViewIcon className="db-action-icon" />
                </button>
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalEditar(true); }}>
                  <EditIcon className="db-action-icon" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* MODAL VER DETALLES */}
      <Modal isOpen={modalVer} onClose={() => setModalVer(false)} hideHeader className="db-modal-detalles-contratista">
        <div className="db-ver-header-bar">
          <h2 className="db-ver-title">Detalles del funcionario</h2>
          <div className="db-modal-flex-group">
            
            <button className="db-modal-form-close" onClick={() => setModalVer(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="db-ver-body">
          <div className="db-ver-identity-row">
            <div className="db-ver-identity-left">
              <img src={selectedUser?.avatar} alt="avatar" className="db-ver-avatar" />
              <strong className="db-ver-fullname">{selectedUser?.apellidos} {selectedUser?.nombres}</strong>
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

          <div className="db-ver-data-block">
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Cargo</span>
              <span className="db-ver-data-value">{selectedUser?.nombres} {selectedUser?.apellidos}</span>
            </div>
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Dependencia</span>
              <span className="db-ver-data-value">{selectedUser?.nombres} {selectedUser?.apellidos}</span>
            </div>
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Regional</span>
              <span className="db-ver-data-value">{selectedUser?.nombres} {selectedUser?.apellidos}</span>
            </div>
            <div className="db-ver-data-field">
              <span className="db-ver-data-label">Tipo de vinculación</span>
              <span className="db-ver-data-value">No especificado</span>
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
                  <div className="db-ver-contact-label">Teléfono</div>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div>
                  <div className="db-ver-contact-label">Correo</div>
                  <div className="db-ver-contact-value">CALLE 6 No. 4-45 BARRIO EL SOL SOGAMOSO</div>
                </div>
              </div>
              <div className="db-ver-contact-ghost">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
            </div>

            <div className="db-ver-contact-card db-col-span-full">
              <div className="db-contact-card-flex">
                <div className="db-ver-contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                  <div className="db-ver-contact-label">Dirección</div>
                  <div className="db-ver-contact-value">CALLE 6 No. 4-45 BARRIO EL SOL SOGAMOSO</div>
                </div>
              </div>
              <div className="db-ver-contact-ghost">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            </div>
          </div>

          <div className="db-ver-footer">
            <button className="db-btn-refresh db-ver-btn-edit" onClick={() => { setModalVer(false); setModalEditar(true); }}>
              <EditarDetallesIcon size={16} />
              Editar
            </button>
            <button className="db-btn-new" onClick={() => setModalVer(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL BENEFICIARIOS */}
      <Modal isOpen={modalBeneficiarios} onClose={() => setModalBeneficiarios(false)} hideHeader className="db-modal-official-full">
        <div className="db-modal-form-header">
          <h2 className="db-modal-form-title">FUNCIONARIO</h2>
          <button className="db-modal-form-close" onClick={() => setModalBeneficiarios(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="db-modal-form-body">
          <div className="db-modal-profile-card">
            <div className="db-modal-flex-group">
              <img src={selectedUser?.avatar} alt="avatar" className="db-modal-profile-avatar" />
              <strong className="db-modal-profile-name">{selectedUser?.apellidos} {selectedUser?.nombres}</strong>
            </div>
            <div className="db-modal-flex-group-small">
              <span className="db-badge-cc">CC {selectedUser?.id}</span>
              <span className={`db-status-badge ${selectedUser?.estado ? 'activo' : 'inactivo'}`} className="db-gap-4">
                {selectedUser?.estado ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <div className="db-status-dot inactivo"></div>
                )}
                {selectedUser?.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          
          <h4 className="db-modal-section-title">BENEFICIARIOS</h4>
          
          <div className="db-table-wrapper db-mb-16">
            <table className="db-table db-table-full">
              <thead>
                <tr>
                  <th>NOMBRE COMPLETO</th>
                  <th>DOCUMENTO</th>
                  <th>CLASIFICACIÓN</th>
                  <th>PARENTESCO</th>
                  <th>EDAD</th>
                  <th>GÉNERO</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="db-cell-bold">AGUIRRE CAMACHO<br/>LUIS ALEJANDRO</td>
                  <td className="db-text-13">9526609</td>
                  <td><span className="db-badge-clasificacion"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="db-inline-mr-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>#123</span></td>
                  <td>Hijo</td>
                  <td>72</td>
                  <td>M</td>
                  <td>
                    <button className="db-toggle-switch active"><span className="db-toggle-thumb"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span></button>
                  </td>
                  <td>
                    <div className="db-row-actions">
                      <button className="db-icon-btn edit" className="db-icon-btn-naked"><EditIcon className="db-action-icon" /></button>
                      <button className="db-icon-btn delete" className="db-icon-btn-naked"><DeleteIcon className="db-action-icon" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="db-form-actions">
            <button className="db-btn-refresh" className="db-btn-cancel" onClick={() => setModalBeneficiarios(false)}>Cancelar</button>
            <button className="db-btn-new"><Plus size={16}/> Nuevo beneficiario</button>
          </div>
        </div>
      </Modal>

      {/* MODAL EDITAR / NUEVO (TABS) */}
      <Modal isOpen={modalEditar || modalNuevo} onClose={() => { setModalEditar(false); setModalNuevo(false); }} hideHeader className="db-modal-official-full">
        <div>
          <div className="db-modal-tabs-header">
            <div className="db-modal-tab active">
              INFORMACIÓN PERSONAL
            </div>
            <div className="db-modal-tab">
              INFORMACIÓN DE CONTACTO
            </div>
            <div className="db-modal-tab">
              INFORMACIÓN LABORAL
            </div>
            <button className="db-modal-form-close db-ml-auto" onClick={() => { setModalEditar(false); setModalNuevo(false); }}>
              <X size={20} />
            </button>
          </div>
          
          <div className="db-modal-form-body">
            <div className="db-modal-grid-2">
              <div>
                <label className="db-form-label">Tipo de documento*</label>
                <select className="db-select" className="db-form-select">
                  <option>CÉDULA DE CIUDADANÍA</option>
                </select>
              </div>
              <div>
                <label className="db-form-label">Nº de identificación*</label>
                <input type="text" className="db-search-input-header" className="db-form-input" defaultValue={selectedUser?.id || ''} />
              </div>
              <div>
                <label className="db-form-label">Nombre*</label>
                <input type="text" className="db-search-input-header" className="db-form-input" defaultValue={selectedUser?.nombres || ''} />
              </div>
              <div>
                <label className="db-form-label">Apellido*</label>
                <input type="text" className="db-search-input-header" className="db-form-input" defaultValue={selectedUser?.apellidos || ''} />
              </div>
              <div className="db-col-span-full">
                <label className="db-form-label">E-mail institucional</label>
                <input type="email" className="db-search-input-header" className="db-form-input" placeholder="Ej: correo@mail.com" />
              </div>
            </div>
            
            {modalEditar && (
              <div className="db-warning-banner">
                <div className="db-warning-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <div>
                  <div className="db-warning-title">Estas en modo edición</div>
                  <div className="db-warning-text">Verifica la información antes de guardar para asegurar su precisión y consistencia.</div>
                </div>
              </div>
            )}

            {!modalEditar && (
              <div className="db-warning-banner">
                <div className="db-warning-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <div>
                  <div className="db-warning-title">¡Para tener en cuenta!</div>
                  <div className="db-warning-text">Todos los campos marcados con un * son obligatorios.</div>
                </div>
              </div>
            )}
            
            <div className="db-form-actions-between">
              {modalEditar ? (
                <button className="db-btn-new db-btn-danger" onClick={() => setModalEditar(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  Desactivar
                </button>
              ) : (
                <button className="db-btn-refresh db-btn-disabled" disabled>
                  &lt; Anterior
                </button>
              )}
              
              <div className="db-modal-flex-group">
                <button className="db-btn-refresh db-btn-cancel" onClick={() => { setModalEditar(false); setModalNuevo(false); }}>Cancelar</button>
                {modalEditar ? (
                  <button className="db-btn-new" onClick={() => setModalEditar(false)}><RefreshCw size={16}/> Actualizar</button>
                ) : (
                  <button className="db-btn-new" onClick={() => setModalNuevo(false)}>Siguiente &gt;</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Funcionarios;
