import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Busca el nombre de usuario o radicado",
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
        <svg
          width="17"
          height="17"
          viewBox="0 0 17 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="7"
            cy="7"
            r="4.2"
            stroke="#002c4d"
            strokeWidth="2"
          />
          <line
            x1="10.2"
            y1="10.5"
            x2="15.5"
            y2="15.8"
            stroke="#002c4d"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default SearchBar;
