import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

// Icons
import { User, Lock, Eye, EyeOff } from 'lucide-react';

// Images
import logoMedisena from '../assets/img/login/logo-medisena-login.png';
import senaLogo from '../assets/img/login/sena-logo.png';
import azulBg from '../assets/img/login/azul.png';
import marcaAgua from '../assets/img/login/medicina-marca-agua.png';
import hombreDr from '../assets/img/login/hombre.png';
import estetoscopio from '../assets/img/login/estetocopio.png';
import termometro from '../assets/img/login/termometro.png';
import adn from '../assets/img/login/adn.png';

import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="login-wrapper">
      <div className="login-main-content">
        
        {/* Background SVG Lines */}
        <svg className="login-bg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Línea izquierda */}
          <path d="M 18 0 Q 5 40 0 70" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.25" />
          
          {/* Línea central curvada cruzando el estetoscopio y adn */}
          <path d="M 80 0 C 40 10, 35 65, 75 100" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.25" />
          
          {/* Línea inferior sobre el SENA */}
          <path d="M 0 85 Q 22 70 45 100" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.25" />
        </svg>

        {/* Left Side: Form */}
        <div className="login-left">
          <div className="login-form-container">
            <img src={logoMedisena} alt="MediSena" className="login-logo-img" />
            
            <h1 className="login-title-text">Iniciar sesión</h1>

            <form onSubmit={handleLogin} className="login-form">
              
              <div className="login-input-wrapper">
                <label>Número de documento</label>
                <div className="login-input-group">
                  <User size={20} className="login-icon" />
                  <input
                    type="text"
                    placeholder="0000000000"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="login-input-wrapper">
                <label>Contraseña</label>
                <div className="login-input-group">
                  <Lock size={20} className="login-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="**********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} className="login-icon-toggle" /> : <Eye size={20} className="login-icon-toggle" />}
                  </button>
                </div>
              </div>

              {error && <p className="login-error">{error}</p>}

              <div className="login-links">
                <span>¿Olvidaste tu contraseña o tu cuenta esta inactiva? </span>
                <br />
                <a href="#" className="login-link-reset">Restablecer</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-button-green"
              >
                {loading ? 'Cargando...' : 'Ingresar'}
              </button>
            </form>

            <div className="login-sena-logo-container">
              <img src={senaLogo} alt="Sena Logo" className="sena-logo-img" />
            </div>
          </div>
        </div>

        {/* Right Side: Images */}
        <div className="login-right">
          <img src={azulBg} alt="Background Shape" className="login-bg-shape" />
          <img src={marcaAgua} alt="Watermark" className="login-watermark" />
          
          <img src={hombreDr} alt="Doctor" className="login-doctor" />
          
          <img src={estetoscopio} alt="Estetoscopio" className="login-floating login-estetoscopio" />
          <img src={termometro} alt="Termometro" className="login-floating login-termometro" />
          <img src={adn} alt="ADN" className="login-floating login-adn" />
        </div>

      </div>
    </div>
  );
};

export default Login;
