import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Home, ChevronRight } from 'lucide-react';
import ProgramarAgenda from './tabs/ProgramarAgenda';
import GestionAgendas from './tabs/GestionAgendas';
import './tabs/Agendas.css';
import '../../styles/GestionResoluciones/GestionResoluciones.css';

const Agendas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Programar Agenda');
  const tabs = ['Programar Agenda', 'Gestión de Agendas'];

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <div className="gestion-container">

          {/* Header */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">{activeTab}</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title" style={{ margin: 0 }}>{activeTab}</h1>
            </div>
            <p className="oa-subtitle">
              {activeTab === 'Programar Agenda'
                ? 'Complete los datos para programar una nueva cita médica'
                : 'Visualice y administre las agendas médicas programadas'}
            </p>
          </header>

          {/* Tabs + Content */}
          <div className="tabs-card-group">

            {/* Pills de pestañas */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    background: activeTab === tab
                      ? 'linear-gradient(135deg, #0165B0, #013156)'
                      : '#f1f5f9',
                    color: activeTab === tab ? '#fff' : '#334155',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Programar Agenda' && <ProgramarAgenda />}
            {activeTab === 'Gestión de Agendas' && <GestionAgendas />}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Agendas;
