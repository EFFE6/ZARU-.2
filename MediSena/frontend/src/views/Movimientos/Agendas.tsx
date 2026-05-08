import React, { useState } from 'react';
import TabGroup from '../../components/TabGroup';
import SearchBar from '../../components/SearchBar';
import ProgramarAgenda from './tabs/ProgramarAgenda';
import GestionAgendas from './tabs/GestionAgendas';
import '../../styles/Movimientos/Agendas.css';

const Agendas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Programar Agenda');
  const [searchQuery, setSearchQuery] = useState('');
  const tabs = ['Programar Agenda', 'Gestión de Agendas'];

  return (
    <div className="tabs-card-group">
      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'Programar Agenda' && <ProgramarAgenda />}
      {activeTab === 'Gestión de Agendas' && <GestionAgendas />}
    </div>
  );
};

export default Agendas;

