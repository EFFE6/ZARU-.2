import React, { useState } from 'react';
import { Filter, RefreshCw, Plus, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import '../../styles/DatosBasicos/Medicos.css';

import EspecialidadIcon from '../../assets/img/datosbasicos/icons/medicos/espacialidad.svg';
import { ViewIcon, EditIcon } from '../../components/Icons';

const MOCK_MEDICOS = [
  {
    registro: '9526609',
    nombres: 'Dra. LUCIA AYALA BURGOS',
    avatar: 'https://i.pravatar.cc/150?u=11',
    especialidad: '63',
    telefono: '3012564789',
    ciudad: 'MANIZALES',
    tarifa: 'N/A',
    estado: true,
  },
  {
    registro: '9526609',
    nombres: 'Dra. YENNY CAROLINA RODRIGUEZ LÓPEZ',
    avatar: 'https://i.pravatar.cc/150?u=12',
    especialidad: '63',
    telefono: '3012564789',
    ciudad: 'DOSQUEBRADAS',
    tarifa: 'N/A',
    estado: false,
  },
  {
    registro: '9526609',
    nombres: 'Dra. ADA BARANDALLA RODRIGUEZ',
    avatar: 'https://i.pravatar.cc/150?u=13',
    especialidad: '63',
    telefono: '3012564789',
    ciudad: 'PEREIRA',
    tarifa: 'N/A',
    estado: true,
  },
  {
    registro: '9526609',
    nombres: 'Dra. ADRIANA LISSETT MENDOZA PINEDO',
    avatar: 'https://i.pravatar.cc/150?u=14',
    especialidad: '63',
    telefono: '3012564789',
    ciudad: 'BOGOTÁ',
    tarifa: 'N/A',
    estado: false,
  },
];

interface MedicosProps {
  searchQuery: string;
}

const Medicos: React.FC<MedicosProps> = ({ searchQuery }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [especialidadFilter, setEspecialidadFilter] = useState('');
  const [data, setData] = useState(MOCK_MEDICOS);

  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const toggleEstado = (index: number) => {
    const newData = [...data];
    newData[index].estado = !newData[index].estado;
    setData(newData);
  };

  const filteredData = data.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchSearch = item.nombres.toLowerCase().includes(term) || item.registro.includes(term);
    const matchEstado = estadoFilter ? (estadoFilter === 'activo' ? item.estado : !item.estado) : true;
    const matchEspecialidad = especialidadFilter ? item.especialidad === especialidadFilter : true;
    return matchSearch && matchEstado && matchEspecialidad;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="db-toolbar">
        <div className="db-toolbar-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="db-icon-btn-svg" style={{ background: '#002c4d', color: 'white', width: '38px', height: '38px', borderRadius: '8px' }}>
            <Filter size={20} />
          </button>
          
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
            value={especialidadFilter} 
            onChange={(e) => setEspecialidadFilter(e.target.value)}
          >
            <option value="" disabled hidden>Especialidad</option>
            <option value="">Todas</option>
            <option value="Cardiologo">Cardiologo</option>
            <option value="63">63</option>
          </select>
        </div>

        <div className="db-toolbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="db-btn-refresh">
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button className="db-btn-new" onClick={() => { setSelectedUser(null); setModalEditar(true); }}>
            <Plus size={18} />
            Nuevo Médico
          </button>
        </div>
      </div>

      <DataTable 
        headers={
          <tr>
            <th>REGISTRO</th>
            <th>NOMBRE COMPLETO <span className="db-sort-icon">⇅</span></th>
            <th>ESPECIALIDAD</th>
            <th>TELÉFONO</th>
            <th>CIUDAD</th>
            <th>TARIFA</th>
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
            <td className="db-col-id">{item.registro}</td>
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
              <span className="db-cargo-pill" style={{ background: '#EEF6FF', color: '#3b82f6', border: 'none', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <img src={EspecialidadIcon} alt="Especialidad" className="db-cargo-icon" />
                {item.especialidad}
              </span>
            </td>
            <td>{item.telefono}</td>
            <td>{item.ciudad}</td>
            <td>{item.tarifa}</td>
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

      {/* MODAL VER DETALLES MÉDICO */}
      <Modal isOpen={modalVer} onClose={() => setModalVer(false)} hideHeader className="db-modal-official-full" >
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a52', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Detalles del médico
            <button className="db-icon-btn-svg" style={{ marginLeft: '8px' }} onClick={() => { setModalVer(false); setModalEditar(true); }}>
              <EditIcon size={24} />
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
                <span style={{ background: '#EEF6FF', color: '#0165B0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>CC {selectedUser?.registro}</span>
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

            <div style={{ background: '#E0F2FE', borderRadius: '8px', padding: '16px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '12px', color: '#0165B0', fontWeight: '700', marginBottom: '4px' }}>Registro Médico</div>
              <div style={{ fontSize: '14px', color: '#0165B0', fontWeight: '800' }}>52334054</div>
            </div>
          </div>

          <h4 style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>INFORMACIÓN DEL CONSULTORIO</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0165B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '13px', color: '#1a3c5a', fontWeight: '800' }}>marthalucia21@misena.edu.co</div>
                </div>
              </div>
              <div style={{ color: '#E2E8F0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className="db-btn-new" onClick={() => setModalVer(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL EDITAR / NUEVO MÉDICO */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} hideHeader className="db-modal-official-full">
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
          <button style={{ flex: 1, padding: '16px', background: '#EEF6FF', border: 'none', borderBottom: '2px solid transparent', color: '#1a3c5a', fontWeight: '700', fontSize: '12px', borderTopLeftRadius: '20px' }}>INFORMACIÓN PERSONAL</button>
          <button style={{ flex: 1, padding: '16px', background: 'white', border: 'none', borderBottom: '2px solid transparent', color: '#1a3c5a', fontWeight: '800', fontSize: '12px' }}>INFORMACIÓN MÉDICA</button>
          <button style={{ flex: 1, padding: '16px', background: '#EEF6FF', border: 'none', borderBottom: '2px solid transparent', color: '#1a3c5a', fontWeight: '700', fontSize: '12px', position: 'relative' }}>
            INFORMACIÓN DEL CONSULTORIO
            <button style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalEditar(false)}>
              <X size={16} />
            </button>
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Registro médico*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue="52344054" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Regional*</label>
              <select className="db-select" style={{ width: '100%', height: '42px' }}>
                <option>Ej: Regional Dosquebradas, Risaralda</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Especialidad*</label>
              <select className="db-select" style={{ width: '100%', height: '42px' }}>
                <option>Seleccione una especialidad</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Subespecialidad (opcional)</label>
              <select className="db-select" style={{ width: '100%', height: '42px' }}>
                <option>Seleccione una subespecialidad</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <button className="db-btn-refresh" style={{ border: '1px solid #64748b', color: '#1a3c5a', borderRadius: '8px', padding: '10px 24px' }} onClick={() => setModalEditar(false)}>Cancelar</button>
            <button className="db-btn-new" style={{ borderRadius: '8px', padding: '10px 24px' }} onClick={() => setModalEditar(false)}>
              <RefreshCw size={16}/> Actualizar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Medicos;
