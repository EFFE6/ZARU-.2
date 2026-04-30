import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  /** Estado de visibilidad del modal */
  isOpen: boolean;
  
  /** Función que se ejecuta al intentar cerrar el modal (clic afuera, X o ESC) */
  onClose: () => void;
  
  /** Título del modal (si no se oculta el header) */
  title?: string;
  
  /** Clase CSS adicional para el contenedor interno del modal (ej: "modal-content-delete", "resolucion-modal") */
  className?: string;
  
  /** Ocultar por completo la cabecera estándar (título y X), útil para modales de confirmación/eliminación */
  hideHeader?: boolean;
  
  /** Estilos inline adicionales para el contenedor del modal */
  style?: React.CSSProperties;

  /** Contenido interno del modal */
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  className = 'resolucion-modal',
  hideHeader = false,
  style,
  children
}) => {
  // Cierre con la tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        // Cerrar si se hizo clic directamente en el overlay oscuro, y no dentro del contenido del modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={className} style={style}>
        {!hideHeader && (
          <div className="resolucion-modal-header">
            {title && <h2 className="resolucion-modal-title">{title}</h2>}
            <button className="resolucion-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        )}
        
        {children}
        
      </div>
    </div>,
    document.body
  );
};

export default Modal;
