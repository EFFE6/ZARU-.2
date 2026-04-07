import React from 'react';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <h1>Dashboard</h1>
        <p>Bienvenido al sistema MediSENA. Selecciona una opción en el menú lateral.</p>
        
        {/* Placeholder for future dashboard content */}
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#1a365d' }}>Métrica {i}</h3>
              <p style={{ color: '#64748b' }}>Descripción corta de la estadística médica.</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
