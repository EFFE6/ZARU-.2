import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import GestionResoluciones from './views/GestionResoluciones';
import DatosBasicos from './views/DatosBasicos';
import MainLayout from './components/MainLayout';

import OrdenAtencion from './views/Movimientos/OrdenAtencion';
import CuentaCobro from './views/Movimientos/CuentaCobro';
import RelacionPagos from './views/Movimientos/RelacionPagos';
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
        <Route path="/movimientos" element={<Dashboard />} />
        <Route path="/excedentes" element={<Dashboard />} />
        <Route path="/consultas" element={<Dashboard />} />
        <Route path="/reportes" element={<Dashboard />} />
        <Route path="/reportes-nacionales" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
