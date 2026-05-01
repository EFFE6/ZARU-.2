import React from 'react';
import Sidebar from '../../components/Sidebar';
import { Home, ChevronRight } from 'lucide-react';
import './Movimientos.css';

interface MovimientosLayoutProps {
  /** Migas de pan: ej. ['Movimientos', 'Orden de atención'] */
  breadcrumb: string[];
  children: React.ReactNode;
}

/**
 * Layout base para todas las vistas de Movimientos.
 * Muestra el Sidebar, el breadcrumb fuera de la card, y un contenedor
 * principal con fondo claro donde cada vista monta su propia card blanca.
 */
const MovimientosLayout: React.FC<MovimientosLayoutProps> = ({ breadcrumb, children }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content main-content--fill">
        <div className="mov-page">

          {/* Breadcrumb */}
          <nav className="breadcrumb mov-breadcrumb">
            <div className="breadcrumb-item"><Home size={13} /></div>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                <div className="breadcrumb-sep"><ChevronRight size={12} /></div>
                <div className={`breadcrumb-item ${i === breadcrumb.length - 1 ? 'active' : ''}`}>
                  {crumb}
                </div>
              </React.Fragment>
            ))}
          </nav>

          {/* Contenido (card blanca con title adentro) */}
          {children}

        </div>
      </main>
    </div>
  );
};

export default MovimientosLayout;
