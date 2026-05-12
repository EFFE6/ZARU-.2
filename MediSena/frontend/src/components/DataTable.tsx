import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/GestionResoluciones/GestionResoluciones.css';

export interface DataTableProps {
  /**
   * Etiquetas <th> que van dentro del <thead>
   */
  headers: React.ReactNode;
  
  /**
   * Contenido del <tbody> (filas <tr> y celdas <td>). 
   * Usar `children` si ya se mapearon los elementos, o usar `data` + `renderRow` para que DataTable mapée,
   * o usar `data` con un único componente hijo (ej. <MiTabla />) al cual se le inyectará la prop `items`.
   */
  children?: React.ReactNode;

  /**
   * Arreglo de datos a paginar. Si se provee, DataTable se encarga de paginar y renderizar usando `renderRow`.
   */
  data?: any[];
  
  /**
   * Función para renderizar cada fila si se provee `data`.
   */
  renderRow?: (item: any, index: number) => React.ReactNode;
  
  // Opciones de paginación (Opcionales, por si se maneja desde afuera)
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
  data,
  renderRow,
  itemsPerPage: externalItemsPerPage,
  setItemsPerPage: externalSetItemsPerPage,
  currentPage: externalCurrentPage,
  setCurrentPage: externalSetCurrentPage,
  totalPages: externalTotalPages,
  visiblePages: externalVisiblePages,
  hidePagination = false,
}) => {
  // Estado local para paginación si no se maneja desde afuera
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(5);

  const isControlled = externalCurrentPage !== undefined && externalTotalPages !== undefined;

  const childrenArray = children ? React.Children.toArray(children) : [];
  
  // Si los hijos solo contienen el mensaje de "No hay datos", no paginar
  const isEmptyState = childrenArray.length === 1 && React.isValidElement(childrenArray[0]) && childrenArray[0].props.children?.props?.className === 'table-empty';

  const totalItems = data ? data.length : (isEmptyState ? 0 : childrenArray.length);
  
  const currentItemsPerPage = isControlled ? (externalItemsPerPage || 5) : localItemsPerPage;
  const currentTotalPages = isControlled ? externalTotalPages : Math.max(1, Math.ceil(totalItems / currentItemsPerPage));
  const currentPageValue = isControlled ? externalCurrentPage : localCurrentPage;

  // Asegurar que la página local no se pase del total
  useEffect(() => {
    if (!isControlled && localCurrentPage > currentTotalPages) {
      setLocalCurrentPage(currentTotalPages);
    }
  }, [currentTotalPages, localCurrentPage, isControlled]);

  const currentVisiblePages = useMemo(() => {
    if (isControlled && externalVisiblePages) return externalVisiblePages;
    const delta = 2, start = Math.max(1, currentPageValue - delta), end = Math.min(currentTotalPages, currentPageValue + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [isControlled, externalVisiblePages, currentPageValue, currentTotalPages]);

  const handleSetCurrentPage = (val: number | ((p: number) => number)) => {
    if (isControlled && externalSetCurrentPage) {
      externalSetCurrentPage(val);
    } else {
      setLocalCurrentPage(val);
    }
  };

  const handleSetItemsPerPage = (val: number) => {
    if (isControlled && externalSetItemsPerPage) {
      externalSetItemsPerPage(val);
    } else {
      setLocalItemsPerPage(val);
    }
    handleSetCurrentPage(1);
  };

  // Filtrar los hijos a mostrar
  let visibleChildren;
  if (data) {
    const visibleData = isControlled ? data : data.slice((currentPageValue - 1) * currentItemsPerPage, currentPageValue * currentItemsPerPage);
    if (renderRow) {
      visibleChildren = visibleData.map(renderRow);
    } else if (childrenArray.length === 1 && React.isValidElement(childrenArray[0])) {
      // Si hay un solo hijo (ej. <MiTabla />), le inyectamos los datos paginados en la prop `items`
      visibleChildren = React.cloneElement(childrenArray[0] as React.ReactElement, { items: visibleData });
    } else {
      visibleChildren = isControlled ? children : childrenArray.slice((currentPageValue - 1) * currentItemsPerPage, currentPageValue * currentItemsPerPage);
    }
  } else {
    visibleChildren = isControlled ? children : childrenArray.slice((currentPageValue - 1) * currentItemsPerPage, currentPageValue * currentItemsPerPage);
  }

  return (
    <>
      <div className="table-wrapper oa-table-scroll">
        <table className="resoluciones-table">
          <thead>{headers}</thead>
          <tbody>{visibleChildren}</tbody>
        </table>
      </div>

      {!hidePagination && !isEmptyState && currentTotalPages > 0 && (
        <div className="pagination-footer">
          <div className="items-per-page">
            <span>Elementos por página</span>
            <div className="items-select-wrapper">
              <select 
                className="items-select" 
                value={currentItemsPerPage} 
                onChange={e => handleSetItemsPerPage(Number(e.target.value))}
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
              onClick={() => handleSetCurrentPage(Math.max(1, currentPageValue - 1))} 
              disabled={currentPageValue <= 1}
            >
              <ChevronLeft size={18} />
            </button>
            {currentVisiblePages.map(n => (
              <button 
                key={n} 
                className={`page-num-btn ${currentPageValue === n ? 'active' : ''}`} 
                onClick={() => handleSetCurrentPage(n)}
              >
                {n}
              </button>
            ))}
            <button 
              className="page-nav-btn" 
              onClick={() => handleSetCurrentPage(Math.min(currentTotalPages, currentPageValue + 1))} 
              disabled={currentPageValue >= currentTotalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="page-info-total">
            {currentPageValue} - de {currentTotalPages} páginas
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
