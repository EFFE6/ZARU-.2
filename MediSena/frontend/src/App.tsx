import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import GestionResoluciones from './views/GestionResoluciones';
import DatosBasicos from './views/DatosBasicos';
import MainLayout from './components/MainLayout';
import SeguridadAccesos from './views/SeguridadAccesos';
import MovimientosLayout from './views/Movimientos';
import OrdenAtencion from './views/Movimientos/OrdenAtencion';
import CuentaCobro from './views/Movimientos/CuentaCobro';
import RelacionPagos from './views/Movimientos/RelacionPagos';
import ProgramarAgenda from './views/Movimientos/ProgramarAgenda';
import Agendas from './views/Movimientos/Agendas';
import CancelarOrdenes from './views/Movimientos/CancelarOrdenes';
import ConsultarOrdenes from './views/Movimientos/ConsultarOrdenes';
import Consultas from './views/Consultas/Consultas';
import Excedentes from './views/Excedentes/Excedentes';
import Reportes from './views/Reportes/Reportes';
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
        <Route path="/movimientos" element={<MovimientosLayout />}>
          <Route index element={<Navigate to="orden-atencion" replace />} />
          <Route path="orden-atencion" element={<OrdenAtencion />} />
          <Route path="cuenta-cobro" element={<CuentaCobro />} />
          <Route path="relacion-pagos" element={<RelacionPagos />} />
          <Route path="programar-agenda" element={<ProgramarAgenda />} />
          <Route path="agendas" element={<Agendas />} />
          <Route path="cancelar-ordenes" element={<CancelarOrdenes />} />
          <Route path="consultar-ordenes" element={<ConsultarOrdenes />} />
        </Route>
        <Route path="/excedentes" element={<Excedentes />} />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/reportes-nacionales" element={<Dashboard />} />
        <Route path="/seguridad-accesos" element={<SeguridadAccesos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
