import React, { useState } from 'react';
import { Filter, RefreshCw, Plus, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Filters from '../../components/Filters';

import BotoEditIcon from '../../assets/img/datosbasicos/icons/funcionarios/botonedit.svg';
import BotoVerIcon from '../../assets/img/datosbasicos/icons/funcionarios/botonver.svg';
import CargoAmarilloIcon from '../../assets/img/datosbasicos/icons/funcionarios/cargoamarillo.svg';
import CargoAzulIcon from '../../assets/img/datosbasicos/icons/funcionarios/cargoazul.svg';
import RegionalIcon from '../../assets/img/datosbasicos/icons/funcionarios/regional.svg';
import { EditarBeneficiariosIcon, EliminarBeneficiariosIcon } from '../../components/Icons';

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
            className="db-select" 
            style={{ minWidth: '150px' }}
            value={estadoFilter} 
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="" disabled hidden>Estado</option>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <select 
            className="db-select" 
            style={{ minWidth: '150px' }}
            value={regionalFilter} 
            onChange={(e) => setRegionalFilter(e.target.value)}
          >
            <option value="" disabled hidden>Regional</option>
            <option value="">Todas</option>
            <option value="63">63</option>
          </select>
        </Filters>

        <div className="db-toolbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              <span className="db-cargo-pill azul" style={{ background: '#f3e8ff', color: '#9333ea', border: 'none' }}>
                <img src={CargoAzulIcon} alt="cargo" className="db-cargo-icon" style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(85%) saturate(1636%) hue-rotate(250deg) brightness(97%) contrast(105%)' }}/>
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
                <div className="db-beneficiarios-grid" style={{flexDirection: 'row', gap: '12px', cursor: 'pointer'}} onClick={() => { setSelectedUser(item); setModalBeneficiarios(true); }}>
                  <div className="db-beneficiario-stat bene-check" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span style={{ color: '#0165B0', fontWeight: '800' }}>{item.beneficiariosActivos}</span>
                  </div>
                  <div className="db-beneficiario-stat bene-x" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <span style={{ color: '#0165B0', fontWeight: '800' }}>{item.beneficiariosInactivos}</span>
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
                  <img src={BotoVerIcon} alt="Ver" className="db-action-icon" />
                </button>
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalEditar(true); }}>
                  <img src={BotoEditIcon} alt="Editar" className="db-action-icon" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* MODAL VER DETALLES */}
      <Modal isOpen={modalVer} onClose={() => setModalVer(false)} hideHeader className="db-modal-official-full">
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>Detalles del funcionario</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalVer(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={selectedUser?.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <strong style={{ color: '#1a3c5a', fontSize: '15px' }}>{selectedUser?.apellidos} {selectedUser?.nombres}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#EEF6FF', color: '#0165B0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>CC {selectedUser?.id}</span>
                <span className={`db-status-badge ${selectedUser?.estado ? 'activo' : 'inactivo'}`} style={{ gap: '4px' }}>
                  {selectedUser?.estado ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <div className="db-status-dot inactivo"></div>
                  )}
                  {selectedUser?.estado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '16px', border: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Cargo</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '700' }}>{selectedUser?.nombres} {selectedUser?.apellidos}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Dependencia</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '700' }}>{selectedUser?.nombres} {selectedUser?.apellidos}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Regional</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '700' }}>{selectedUser?.nombres} {selectedUser?.apellidos}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Tipo de vinculación</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '700' }}>No especificado</div>
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>INFORMACIÓN DE CONTACTO</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Teléfono</div>
                <div style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '700' }}>3208700268</div>
              </div>
            </div>
            
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Correo</div>
                <div style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '700' }}>CALLE 6 No. 4-45 BARRIO EL SOL SOGAMOSO</div>
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Dirección</div>
                <div style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '700' }}>CALLE 6 No. 4-45 BARRIO EL SOL SOGAMOSO</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="db-btn-refresh" style={{ fontWeight: '600' }} onClick={() => { setModalVer(false); setModalEditar(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar
            </button>
            <button className="db-btn-new" onClick={() => setModalVer(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL BENEFICIARIOS */}
      <Modal isOpen={modalBeneficiarios} onClose={() => setModalBeneficiarios(false)} hideHeader className="db-modal-official-full">
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>FUNCIONARIO</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalBeneficiarios(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={selectedUser?.avatar} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <strong style={{ color: '#1a3c5a', fontSize: '14px' }}>{selectedUser?.apellidos} {selectedUser?.nombres}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#EEF6FF', color: '#0165B0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>CC {selectedUser?.id}</span>
              <span className={`db-status-badge ${selectedUser?.estado ? 'activo' : 'inactivo'}`} style={{ gap: '4px' }}>
                {selectedUser?.estado ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <div className="db-status-dot inactivo"></div>
                )}
                {selectedUser?.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          
          <h4 style={{ fontSize: '14px', color: '#1a3c5a', fontWeight: '800', marginBottom: '12px' }}>BENEFICIARIOS</h4>
          
          <div className="db-table-wrapper" style={{ marginBottom: '16px' }}>
            <table className="db-table" style={{ minWidth: '100%' }}>
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
                  <td style={{ fontWeight: '700', color: '#1a3c5a', fontSize: '12px' }}>AGUIRRE CAMACHO<br/>LUIS ALEJANDRO</td>
                  <td style={{ fontSize: '13px' }}>9526609</td>
                  <td><span style={{ color: '#3b82f6', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline', marginRight:'4px'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>#123</span></td>
                  <td>Hijo</td>
                  <td>72</td>
                  <td>M</td>
                  <td>
                    <button className="db-toggle-switch active"><span className="db-toggle-thumb"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span></button>
                  </td>
                  <td>
                    <div className="db-row-actions">
                      <button className="db-icon-btn edit" style={{ padding: 0, border: 'none', background: 'transparent' }}><EditarBeneficiariosIcon className="db-action-icon" /></button>
                      <button className="db-icon-btn delete" style={{ padding: 0, border: 'none', background: 'transparent' }}><EliminarBeneficiariosIcon className="db-action-icon" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <button className="db-btn-refresh" style={{ border: '1px solid #64748b', color: '#1a3c5a' }} onClick={() => setModalBeneficiarios(false)}>Cancelar</button>
            <button className="db-btn-new"><Plus size={16}/> Nuevo beneficiario</button>
          </div>
        </div>
      </Modal>

      {/* MODAL EDITAR / NUEVO (TABS) */}
      <Modal isOpen={modalEditar || modalNuevo} onClose={() => { setModalEditar(false); setModalNuevo(false); }} hideHeader className="db-modal-official-full">
        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 16px', paddingTop: '16px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '2px solid #0165B0', color: '#1a3c5a', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              INFORMACIÓN PERSONAL
            </div>
            <div style={{ padding: '12px 16px', color: '#64748b', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              INFORMACIÓN DE CONTACTO
            </div>
            <div style={{ padding: '12px 16px', color: '#64748b', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              INFORMACIÓN LABORAL
            </div>
            <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => { setModalEditar(false); setModalNuevo(false); }}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1a3c5a', marginBottom: '8px' }}>Tipo de documento*</label>
                <select className="db-select" style={{ width: '100%', height: '42px' }}>
                  <option>CÉDULA DE CIUDADANÍA</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1a3c5a', marginBottom: '8px' }}>Nº de identificación*</label>
                <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.id || ''} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1a3c5a', marginBottom: '8px' }}>Nombre*</label>
                <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.nombres || ''} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1a3c5a', marginBottom: '8px' }}>Apellido*</label>
                <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.apellidos || ''} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1a3c5a', marginBottom: '8px' }}>E-mail institucional</label>
                <input type="email" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} placeholder="Ej: correo@mail.com" />
              </div>
            </div>
            
            {modalEditar && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ color: '#D97706', marginTop: '2px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400E', marginBottom: '4px' }}>Estas en modo edición</div>
                  <div style={{ fontSize: '12px', color: '#92400E' }}>Verifica la información antes de guardar para asegurar su precisión y consistencia.</div>
                </div>
              </div>
            )}

            {!modalEditar && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ color: '#D97706', marginTop: '2px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400E', marginBottom: '4px' }}>¡Para tener en cuenta!</div>
                  <div style={{ fontSize: '12px', color: '#92400E' }}>Todos los campos marcados con un * son obligatorios.</div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {modalEditar ? (
                <button className="db-btn-new" style={{ background: '#DC2626', gap: '6px' }} onClick={() => setModalEditar(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  Desactivar
                </button>
              ) : (
                <button className="db-btn-refresh" style={{ border: 'none', background: '#e2e8f0', color: '#64748b' }} disabled>
                  &lt; Anterior
                </button>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="db-btn-refresh" style={{ border: '1px solid #64748b', color: '#1a3c5a' }} onClick={() => { setModalEditar(false); setModalNuevo(false); }}>Cancelar</button>
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
