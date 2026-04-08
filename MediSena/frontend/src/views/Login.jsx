import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { LogIn, Lock, User, Activity } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        user: username,
        password: password,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      }
    } catch (err) {
      setError('Credenciales inválidas. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <Activity size={40} color="#3b82f6" />
          </div>
          <h1 className="login-title">MediSENA</h1>
          <p className="login-subtitle">Gestión Médica Inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-input-group">
            <User size={20} className="login-icon" />
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="login-input-group">
            <Lock size={20} className="login-icon" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
            {!loading && <LogIn size={20} className="login-button-icon" />}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 MediSENA. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
