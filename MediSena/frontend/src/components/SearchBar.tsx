import React from 'react';
import { Search } from 'lucide-react';
import '../styles/SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Busca el registro",
  className = ""
}) => {
  return (
    <div className={`search-wrapper ${className}`}>
      <div className="search-container">
        <input
          type="text"
          placeholder={placeholder}
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button className="search-btn" type="button">
        <Search size={18} className="search-btn-icon" />
      </button>
    </div>
  );
};

export default SearchBar;
