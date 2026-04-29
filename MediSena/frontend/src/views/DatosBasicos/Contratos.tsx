import React, { useState } from 'react';
import { Filter, RefreshCw, Plus, X, Search, Save } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { ImgModalEliminarIcon } from '../../components/Icons';

const MOCK_CONTRATOS = [
  {
    numero: '9526609',
    crp: '000341',
    contratista: 'N/A',
    vigencia: '2010',
    valorInicial: '$20000000',
    adiciones: '$20000000',
    valorTotal: '$20000000',
    estado: true,
  },
  {
    numero: '9526609',
    crp: '000341',
    contratista: 'N/A',
    vigencia: '2010',
    valorInicial: '$20000000',
    adiciones: '$20000000',
    valorTotal: '$20000000',
    estado: false,
  },
  {
    numero: '9526609',
    crp: '000341',
    contratista: 'N/A',
    vigencia: '2010',
    valorInicial: '$20000000',
    adiciones: '$20000000',
    valorTotal: '$20000000',
    estado: true,
  },
  {
    numero: '9526609',
    crp: '000341',
    contratista: 'N/A',
    vigencia: '2010',
    valorInicial: '$20000000',
    adiciones: '$20000000',
    valorTotal: '$20000000',
    estado: false,
  },
];

interface ContratosProps {
  searchQuery: string;
}

const Contratos: React.FC<ContratosProps> = ({ searchQuery }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [vigenciaFilter, setVigenciaFilter] = useState('');
  const [data, setData] = useState(MOCK_CONTRATOS);
  
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any>(null);

  const toggleEstado = (index: number) => {
    const newData = [...data];
    newData[index].estado = !newData[index].estado;
    setData(newData);
  };

  const filteredData = data.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchSearch = item.numero.includes(term) || item.crp.includes(term);
    const matchEstado = estadoFilter ? (estadoFilter === 'activo' ? item.estado : !item.estado) : true;
    const matchVigencia = vigenciaFilter ? item.vigencia === vigenciaFilter : true;
    return matchSearch && matchEstado && matchVigencia;
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
            style={{ minWidth: '150px' }}
            value={vigenciaFilter} 
            onChange={(e) => setVigenciaFilter(e.target.value)}
          >
            <option value="" disabled hidden>Vigencia</option>
            <option value="">Todas</option>
            <option value="2010">2010</option>
          </select>
        </div>

        <div className="db-toolbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="db-btn-refresh" style={{ border: '1px solid #0165B0', color: '#0165B0', fontWeight: '700' }}>
            Ver todo
          </button>
          <button className="db-btn-new" style={{ padding: '9px 16px', borderRadius: '8px' }}>
            Vigentes
          </button>
          <button className="db-btn-refresh">
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button className="db-btn-new">
            <Plus size={18} />
            Nuevo Funcionario
          </button>
        </div>
      </div>

      <DataTable 
        headers={
          <tr>
            <th>NÚMERO</th>
            <th>CRP</th>
            <th>CONTRATISTA</th>
            <th>VIGENCIA</th>
            <th>VALOR INICIAL</th>
            <th>ADICIONES</th>
            <th>VALOR TOTAL</th>
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
            <td className="db-col-id">{item.numero}</td>
            <td>{item.crp}</td>
            <td>
              <span className="db-cargo-pill" style={{ background: '#ecfdf5', color: '#059669', border: 'none', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                {item.contratista}
              </span>
            </td>
            <td>{item.vigencia}</td>
            <td>{item.valorInicial}</td>
            <td>{item.adiciones}</td>
            <td style={{ fontWeight: '800', color: '#1a3c5a' }}>{item.valorTotal}</td>
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
                <button className="db-icon-btn edit" style={{ borderRadius: '20px' }} onClick={() => { setSelectedContrato(item); setModalEditar(true); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button className="db-icon-btn delete" style={{ borderRadius: '20px' }} onClick={() => { setSelectedContrato(item); setModalEliminar(true); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* MODAL EDITAR CONTRATO */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} hideHeader className="db-modal-official-full">
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>Editar contrato</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalEditar(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Número de contrato*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue="617" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Tipo de contrato*</label>
              <select className="db-select" style={{ width: '100%', height: '42px' }}>
                <option>Ej: Prestación de servicios</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Valor total*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue="2252858" />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Fecha de fin</label>
              <div style={{ position: 'relative' }}>
                <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} placeholder="dd/mm/aa" />
                <svg style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1a3c5a', marginBottom: '8px' }}>Valor total*</label>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', height: '42px' }} defaultValue="$ 2252858" />
            </div>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#0165B0', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <input type="text" className="db-search-input-header" style={{ width: '100%', border: '1px solid #bae6fd', borderRadius: '12px', padding: '0 40px', height: '46px', background: '#f0f9ff', color: '#1e3a52', fontWeight: '600' }} placeholder="Contratista" />
              <div style={{ position: 'absolute', right: '12px', top: '12px', color: '#0165B0' }}>
                <Search size={20} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <button className="db-btn-refresh" style={{ border: '1px solid #64748b', color: '#1a3c5a', borderRadius: '8px', padding: '10px 24px' }} onClick={() => setModalEditar(false)}>Cancelar</button>
            <button className="db-btn-new" style={{ borderRadius: '8px', padding: '10px 24px' }} onClick={() => setModalEditar(false)}>
              <Save size={18} /> Guardar cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL ELIMINAR CONTRATO */}
      <Modal isOpen={modalEliminar} onClose={() => setModalEliminar(false)} hideHeader className="db-modal-official-full" style={{ width: '400px', maxWidth: '90%' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', color: '#1e3a52', fontWeight: '800', margin: 0 }}>Eliminar contrato</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalEliminar(false)}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 24px 32px', textAlign: 'center' }}>
          <div style={{ width: '120px', height: '120px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImgModalEliminarIcon />
          </div>
          <p style={{ fontSize: '16px', color: '#1a3c5a', fontWeight: '700', marginBottom: '24px' }}>
            ¿Está seguro que desea eliminar el contrato<br/>Nº {selectedContrato?.numero}?
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

export default Contratos;
