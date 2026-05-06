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
import ProgramarAgenda from './views/Movimientos/ProgramarAgenda';
import Agendas from './views/Movimientos/Agendas';
import CancelarOrdenes from './views/Movimientos/CancelarOrdenes';
import ConsultarOrdenes from './views/Movimientos/ConsultarOrdenes';
import Consultas from './views/Consultas/Consultas';
import Excedentes from './views/Excedentes/Excedentes';
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
        <Route path="/movimientos" element={<Navigate to="/movimientos/orden-atencion" replace />} />
        <Route path="/movimientos/orden-atencion" element={<OrdenAtencion />} />
        <Route path="/movimientos/cuenta-cobro" element={<CuentaCobro />} />
        <Route path="/movimientos/relacion-pagos" element={<RelacionPagos />} />
        <Route path="/movimientos/programar-agenda" element={<ProgramarAgenda />} />
        <Route path="/movimientos/agendas" element={<Agendas />} />
        <Route path="/movimientos/cancelar-ordenes" element={<CancelarOrdenes />} />
        <Route path="/movimientos/consultar-ordenes" element={<ConsultarOrdenes />} />
        <Route path="/excedentes" element={<Excedentes />} />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/reportes" element={<Dashboard />} />
        <Route path="/reportes-nacionales" element={<Dashboard />} />
        <Route path="/seguridad-accesos" element={<SeguridadAccesos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
