import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import './App.css';

const ProtectedRoute = ({ children }) => {
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
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/gestion" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/datos-basicos" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/movimientos" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/excedentes" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/consultas" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/reportes" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/reportes-nacionales" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
