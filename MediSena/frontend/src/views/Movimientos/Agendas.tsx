import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Home, ChevronRight } from 'lucide-react';
import TabGroup from '../../components/TabGroup';
import ProgramarAgenda from './tabs/ProgramarAgenda';
import GestionAgendas from './tabs/GestionAgendas';
import '../../styles/Movimientos/Agendas.css';
import '../../styles/GestionResoluciones/GestionResoluciones.css';

const Agendas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Programar Agenda');
  const tabs = ['Programar Agenda', 'Gestión de Agendas'];

  return (
    <>
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
            <TabGroup
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {activeTab === 'Programar Agenda' && <ProgramarAgenda />}
            {activeTab === 'Gestión de Agendas' && <GestionAgendas />}
          </div>

        </div>
    </>
  );
};

export default Agendas;
