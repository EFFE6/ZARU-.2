import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from '../views/Dashboard';
import Gestion from '../views/GestionResoluciones';

import Resoluciones from "../views/gestion/Resoluciones";
import Usuarios from "../views/gestion/Usuarios";
import Niveles from "../views/gestion/Niveles";
import Topes from "../views/gestion/Topes";
import Parentescos from "../views/gestion/Parentescos";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* GESTIÓN (PADRE) */}
        <Route path="/gestion" element={<Gestion />}>

          {/* REDIRECCIÓN INTERNA */}
          <Route index element={<Navigate to="resoluciones" />} />

          {/* SUBRUTAS */}
          <Route path="resoluciones" element={<Resoluciones />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="niveles" element={<Niveles />} />
          <Route path="topes" element={<Topes />} />
          <Route path="parentescos" element={<Parentescos />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;