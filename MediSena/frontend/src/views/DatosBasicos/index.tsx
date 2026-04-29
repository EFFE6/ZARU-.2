import React, { useState } from 'react';
import { ChevronRight, Home, Search, RefreshCw, Plus, Filter } from 'lucide-react';
import '../../styles/DatosBasicos/DatosBasicos.css';
import SearchBar from '../../components/SearchBar';

import CampanaSvg from '../../assets/img/icons/campana.svg';
import { FuncionariosIcon, ContratistasIcon, MedicosIcon, ContratosIcon } from '../../components/Icons';

import Funcionarios from './Funcionarios';
import Contratistas from './Contratistas';
import Medicos from './Medicos';
import Contratos from './Contratos';

const TABS = [
  { id: 'Funcionarios', label: 'Funcionarios', icon: FuncionariosIcon },
  { id: 'Contratistas', label: 'Contratistas', icon: ContratistasIcon },
  { id: 'Médicos', label: 'Médicos', icon: MedicosIcon },
  { id: 'Contratos', label: 'Contratos', icon: ContratosIcon },
];

const DatosBasicos: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Funcionarios');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="db-container">
      {/* ── Header ── */}
      <header className="db-header">
        <div className="db-header-top">
          <nav className="db-breadcrumb">
            <div className="db-breadcrumb-item"><Home size={14} /></div>
            <div className="db-breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="db-breadcrumb-item">Datos básicos</div>
            <div className="db-breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="db-breadcrumb-item active">{activeTab}</div>
          </nav>
          <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} />
        </div>
        
        <div className="db-header-bottom">
          <h1 className="db-title">Datos básicos</h1>
          <div className="db-search-container-header" style={{ background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>
      </header>

      {/* ── Tabs & Content ── */}
      <div className="db-tabs-card-group">
        <div className="db-tabs-scroll-area">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              className={`db-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {activeTab === tab.id && (
                <div className="db-active-tab-icon">
                  <tab.icon size={22} />
                </div>
              )}
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`db-content-card ${activeTab === TABS[0].id ? 'first-tab-active' : ''}`}>
          {activeTab === 'Funcionarios' && <Funcionarios searchQuery={searchQuery} />}
          {activeTab === 'Contratistas' && <Contratistas searchQuery={searchQuery} />}
          {activeTab === 'Médicos' && <Medicos searchQuery={searchQuery} />}
          {activeTab === 'Contratos' && <Contratos searchQuery={searchQuery} />}
        </div>
      </div>
    </div>
  );
};

export default DatosBasicos;
