import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/GestionResoluciones/GestionResoluciones.css';

export interface DataTableProps {
  /**
   * Etiquetas <th> que van dentro del <thead>
   */
  headers: React.ReactNode;
  
  /**
   * Contenido del <tbody> (filas <tr> y celdas <td>)
   */
  children: React.ReactNode;
  
  // Opciones de paginación
  itemsPerPage?: number;
  setItemsPerPage?: (val: number) => void;
  currentPage?: number;
  setCurrentPage?: (val: number | ((p: number) => number)) => void;
  totalPages?: number;
  visiblePages?: number[];
  
  // Control de visualización
  hidePagination?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  headers,
  children,
  itemsPerPage = 10,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  visiblePages = [],
  hidePagination = false,
}) => {
  return (
    <>
      <div className="table-wrapper oa-table-scroll">
        <table className="resoluciones-table">
          <thead>{headers}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>

      {!hidePagination && setCurrentPage && totalPages !== undefined && (
        <div className="pagination-footer">
          <div className="items-per-page">
            <span>Elementos por página</span>
            <div className="items-select-wrapper">
              <select 
                className="items-select" 
                value={itemsPerPage} 
                onChange={e => {
                  if (setItemsPerPage) setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
          <div className="page-controls">
            <button 
              className="page-nav-btn" 
              onClick={() => setCurrentPage(p => Math.max(1, (typeof p === 'number' ? p : 1) - 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </button>
            {visiblePages.map(n => (
              <button 
                key={n} 
                className={`page-num-btn ${currentPage === n ? 'active' : ''}`} 
                onClick={() => setCurrentPage(n)}
              >
                {n}
              </button>
            ))}
            <button 
              className="page-nav-btn" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, (typeof p === 'number' ? p : 1) + 1))} 
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {currentPage !== undefined && totalPages !== undefined && (
            <div className="page-info-total">
              {currentPage} - de {totalPages} páginas
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DataTable;
