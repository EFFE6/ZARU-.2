import React, { useState } from 'react';
import TabGroup from '../../components/TabGroup';
import ProgramarAgenda from './tabs/ProgramarAgenda';
import GestionAgendas from './tabs/GestionAgendas';
import '../../styles/Movimientos/Agendas.css';

const Agendas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Programar Agenda');
  const tabs = ['Programar Agenda', 'Gestión de Agendas'];

  return (
    <div className="tabs-card-group" style={{ marginTop: 0 }}>
      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'Programar Agenda' && <ProgramarAgenda />}
      {activeTab === 'Gestión de Agendas' && <GestionAgendas />}
    </div>
  );
};

export default Agendas;
