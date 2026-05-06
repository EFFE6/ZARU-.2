import { NavLink, Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const tabs = [
  { name: "Resoluciones", path: "resoluciones" },
  { name: "Usuarios", path: "usuarios" },
  { name: "Niveles", path: "niveles" },
  { name: "Topes", path: "topes" },
  { name: "Parentescos", path: "parentescos" },
];

const GestionLayout = () => {
  return (
    <>
      <div className="gestion-container">
        {/* Tabs reales con rutas */}
        <div className="tabs">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                isActive ? "tab active" : "tab"
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>

        {/* Aquí se renderiza cada página */}
        <Outlet />
      </div>
    </>
  );
};

export default GestionLayout;