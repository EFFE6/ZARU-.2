import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import GestionResoluciones from './views/GestionResoluciones';
import DatosBasicos from './views/DatosBasicos';
import MainLayout from './components/MainLayout';
import SeguridadAccesos from './views/SeguridadAccesos';
import OrdenAtencion from './views/Movimientos/OrdenAtencion';
import CuentaCobro from './views/Movimientos/CuentaCobro';
import RelacionPagos from './views/Movimientos/RelacionPagos';
import ProgramarAgendaView from './views/Movimientos/ProgramarAgenda';
import GestionAgendasView from './views/Movimientos/GestionAgendas';
import CancelarOrdenes from './views/Movimientos/CancelarOrdenes';
import ConsultarOrdenes from './views/Movimientos/ConsultarOrdenes';
import Excedentes from './views/Excedentes/Excedentes';
import Consultas from './views/Consultas/Consultas';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/gestion" element={<GestionResoluciones />} />
        <Route path="/datos-basicos/*" element={<DatosBasicos />} />
        <Route path="/reportes" element={<Dashboard />} />
        <Route path="/reportes-nacionales" element={<Dashboard />} />
        <Route path="/seguridad-accesos" element={<SeguridadAccesos />} />
      </Route>

      <Route
        path="/movimientos"
        element={
          <ProtectedRoute>
            <Navigate to="/movimientos/orden-atencion" replace />
          </ProtectedRoute>
        }
      />
      <Route path="/movimientos/orden-atencion" element={<ProtectedRoute><OrdenAtencion /></ProtectedRoute>} />
      <Route path="/movimientos/cuenta-cobro" element={<ProtectedRoute><CuentaCobro /></ProtectedRoute>} />
      <Route path="/movimientos/relacion-pagos" element={<ProtectedRoute><RelacionPagos /></ProtectedRoute>} />
      <Route path="/movimientos/programar-agenda" element={<ProtectedRoute><ProgramarAgendaView /></ProtectedRoute>} />
      <Route path="/movimientos/agendas" element={<ProtectedRoute><GestionAgendasView /></ProtectedRoute>} />
      <Route path="/movimientos/cancelar-ordenes" element={<ProtectedRoute><CancelarOrdenes /></ProtectedRoute>} />
      <Route path="/movimientos/consultar-ordenes" element={<ProtectedRoute><ConsultarOrdenes /></ProtectedRoute>} />
      <Route path="/excedentes" element={<ProtectedRoute><Excedentes /></ProtectedRoute>} />
      <Route path="/consultas" element={<ProtectedRoute><Consultas /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
