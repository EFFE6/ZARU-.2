import React from 'react';
import { Filter as FilterIcon } from 'lucide-react';

interface FiltersProps {
  children: React.ReactNode;
  className?: string;
}

export const Filters: React.FC<FiltersProps> = ({ children, className = "" }) => {
  return (
    <div className={className} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button 
        type="button"
        style={{ 
          background: '#002c4d', 
          color: 'white', 
          width: '38px', 
          height: '38px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <FilterIcon size={20} />
      </button>
      {children}
    </div>
  );
};

export default Filters;
