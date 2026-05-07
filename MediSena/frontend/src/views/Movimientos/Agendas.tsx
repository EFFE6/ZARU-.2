import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Home, ChevronRight } from 'lucide-react';
import TabGroup from '../../components/TabGroup';
import SearchBar from '../../components/SearchBar';
import ProgramarAgenda from './tabs/ProgramarAgenda';
import GestionAgendas from './tabs/GestionAgendas';
import '../../styles/Movimientos/Agendas.css';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import CampanaSvg from '../../assets/img/icons/campana.svg';

const Agendas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Programar Agenda');
  const [searchQuery, setSearchQuery] = useState('');
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
              <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} className="notification-bell" />
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title">{activeTab}</h1>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Busca por médico o fecha"
              />
            </div>
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

