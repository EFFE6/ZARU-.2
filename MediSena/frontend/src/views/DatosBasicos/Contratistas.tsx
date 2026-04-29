import React, { useState } from 'react';
import { Filter, RefreshCw, Plus, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Filters from '../../components/Filters';

import BotoEditIcon from '../../assets/img/datosbasicos/icons/contratista/botonedit.svg';
import BotoVerIcon from '../../assets/img/datosbasicos/icons/contratista/botonver.svg';
import CedulaIcon from '../../assets/img/datosbasicos/icons/contratista/cedula.svg';
import PrestadorServiciosIcon from '../../assets/img/datosbasicos/icons/contratista/prestadorservicios.svg';

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
            style={{ minWidth: '170px' }}
            value={tipoDocFilter} 
            onChange={(e) => setTipoDocFilter(e.target.value)}
          >
            <option value="" disabled hidden>Tipo de documento</option>
            <option value="">Todas</option>
            <option value="C.C.">C.C.</option>
          </select>
        </Filters>

        <div className="db-toolbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                <div className="db-user-avatar" style={{ background: 'transparent' }}>
                  <img src={item.avatar} alt="avatar" />
                </div>
                <div className="db-user-info">
                  <div className="db-user-name" style={{ textTransform: 'uppercase' }}>
                    {item.nombres}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span className="db-cargo-pill amarillo" style={{ background: '#FFF8E6', color: '#D97706', border: 'none', fontWeight: '800' }}>
                <img src={CedulaIcon} alt="C.C." className="db-cargo-icon" />
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
              <span className="db-cargo-pill amarillo" style={{ background: '#FFF8E6', color: '#D97706', border: 'none', fontWeight: '800' }}>
                <img src={PrestadorServiciosIcon} alt="Prestación de servicios" className="db-cargo-icon" />
                {item.tipoVinculacion}
              </span>
            </td>
            <td style={{ lineHeight: '1.2' }}>{item.cargo}</td>
            <td>{item.ingreso}</td>
            <td>
              <div className="db-row-actions">
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalVer(true); }}>
                  <img src={BotoVerIcon} alt="Ver" className="db-action-icon" />
                </button>
                <button className="db-icon-btn-svg" onClick={() => { setSelectedUser(item); setModalEditar(true); }}>
                  <img src={BotoEditIcon} alt="Editar" className="db-action-icon" />
                </button>
                <button className="db-icon-btn delete" onClick={() => { setSelectedUser(item); setModalEliminar(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* MODAL VER DETALLES CONTRATISTA */}
      <Modal isOpen={modalVer} onClose={() => setModalVer(false)} hideHeader className="db-modal-official-full" >
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a52', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Detalles del contratista
            <button className="db-icon-btn-svg" style={{ marginLeft: '8px' }} onClick={() => { setModalVer(false); setModalEditar(true); }}>
              <img src={BotoEditIcon} alt="Editar" style={{ width: '24px', height: '24px' }} />
            </button>
          </h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalVer(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={selectedUser?.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <strong style={{ color: '#1a3c5a', fontSize: '15px', textTransform: 'uppercase' }}>{selectedUser?.nombres}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#EEF6FF', color: '#0165B0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>CC {selectedUser?.id}</span>
                <span className={`db-status-badge ${selectedUser?.estado ? 'activo' : 'inactivo'}`} style={{ gap: '4px', border: '1px solid #E5E7EB', background: selectedUser?.estado ? '#ecfdf5' : '#ffffff', color: selectedUser?.estado ? '#059669' : '#1e3a52' }}>
                  {selectedUser?.estado ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <X size={12} strokeWidth={3} />
                  )}
                  {selectedUser?.estado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Tipo de vinculación</div>
              <span className="db-cargo-pill azul" style={{ background: '#f3e8ff', color: '#9333ea', border: 'none', fontWeight: '800' }}>
                <img src={PrestadorServiciosIcon} alt="Prestación de servicios" className="db-cargo-icon" style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(85%) saturate(1636%) hue-rotate(250deg) brightness(97%) contrast(105%)' }}/>
                {selectedUser?.tipoVinculacion}
              </span>
            </div>

            <div style={{ background: '#E0F2FE', borderRadius: '8px', padding: '16px', border: '1px solid #bae6fd', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Cargo</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '800' }}>{selectedUser?.cargo}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Dependencia</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '800' }}>{selectedUser?.dependencia}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Regional</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '800' }}>{selectedUser?.regional}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Fecha de ingreso</div>
                <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '800' }}>{selectedUser?.ingreso}</div>
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>INFORMACIÓN DE CONTACTO</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Teléfono #1</div>
                <div style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '800' }}>3208700268</div>
              </div>
            </div>
            
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
              <div>
                <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Teléfono #2</div>
                <div style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '800' }}>3208700268</div>
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

      {/* MODAL EDITAR / NUEVO CONTRATISTA */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} hideHeader className="db-modal-official-full">
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>
            {selectedUser ? 'Editar contratista' : 'Nuevo contratista'}
          </h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalEditar(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <h4 style={{ fontSize: '13px', color: '#64748b', fontWeight: '800', marginBottom: '16px', textTransform: 'uppercase' }}>INFORMACIÓN PERSONAL</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Tipo de documento*</label>
              <select className="db-select" style={{ width: '100%', height: '42px' }}>
                <option>CÉDULA DE CIUDADANÍA</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Nº de identificación*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.id || ''} placeholder="Ej: 900236063" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Nombres*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.nombres || ''} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Apellidos*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.apellidos || ''} placeholder="Ej: INTEGRAL FAMI" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Tipo de vinculación*</label>
              <select className="db-select" style={{ width: '100%', height: '42px' }}>
                <option>Prestación de servicios</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Fecha de ingreso*</label>
              <div style={{ position: 'relative' }}>
                <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.ingreso || ''} placeholder="01/01/2026" />
                <svg style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Cargo*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.cargo || ''} placeholder="Prestador de servicios" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Dependencia*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.dependencia || ''} placeholder="Ej: 6060 - Dirección de formación profesional" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Regional*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.regional || ''} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Teléfono*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} placeholder="Ej: 435149" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Email corporativo*</label>
              <input type="email" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue={selectedUser?.email || ''} placeholder="Ej: correo@mail.com" />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <button className="db-btn-refresh" style={{ border: '1px solid #64748b', color: '#1a3c5a' }} onClick={() => setModalEditar(false)}>Cancelar</button>
            <button className="db-btn-new" onClick={() => setModalEditar(false)}><RefreshCw size={16}/> Actualizar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL ELIMINAR CONTRATISTA */}
      <Modal isOpen={modalEliminar} onClose={() => setModalEliminar(false)} hideHeader className="db-modal-official-full" style={{ width: '400px', maxWidth: '90%' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>Eliminar contratista</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalEliminar(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 32px', textAlign: 'center' }}>
          <div style={{ width: '120px', height: '120px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #0165B0, #013156)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <p style={{ fontSize: '16px', color: '#1a3c5a', fontWeight: '700', marginBottom: '24px' }}>
            ¿Está seguro que desea eliminar el contratista<br/>.fileName?
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
