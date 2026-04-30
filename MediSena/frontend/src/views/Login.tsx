import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

// Icons
import { User, Lock, Eye, EyeOff } from 'lucide-react';

// Images
import logoMedisena from '../assets/img/login/logo-medisena-login.svg';
import senaLogo from '../assets/img/login/sena-logo.svg';
import azulBg from '../assets/img/login/azul.svg';
import marcaAgua from '../assets/img/login/medicina-marca-agua.svg';
import docImg from '../assets/img/login/doc.svg';
import linea1 from '../assets/img/login/linea1.svg';
import linea2 from '../assets/img/login/linea2.svg';
import linea3 from '../assets/img/login/linea3.svg';
import headerImg from '../assets/img/login/header-login.svg';

import '../styles/Login/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Verificar si el token sigue siendo válido en el backend
    api.get('/auth/verify')
      .then(() => navigate('/'))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        nombreUsuario: username,
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
      {/* ── Barra gov.co ── */}
      <div className="login-govco-bar">
        <div className="login-govco-inner">
          <img src={headerImg} alt="Gov.co Header" className="govco-header-img" />
        </div>
      </div>


      <div className="login-main-content">

        {/* Background Lines - PNG images from Figma */}
        <img src={linea1} alt="" className="login-bg-line login-line1" />
        <img src={linea2} alt="" className="login-bg-line login-line2" />
        <img src={linea3} alt="" className="login-bg-line login-line3" />

        {/* Left Side: Form */}
        <div className="login-left">
          <div className="login-form-container">
            <img src={logoMedisena} alt="MediSena" className="login-logo-img" />

            <h1 className="login-title-text">Iniciar sesión</h1>

            <form onSubmit={handleLogin} className="login-form">

              <div className={`login-input-wrapper ${error ? 'has-error' : ''}`}>
                <label>Número de documento</label>
                <div className="login-input-group">
                  <User size={20} className="login-icon" />
                  <input
                    type="text"
                    placeholder="admin@g.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className={`login-input-wrapper ${error ? 'has-error' : ''}`}>
                <label>Contraseña</label>
                <div className="login-input-group">
                  <Lock size={20} className="login-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="*****"
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

          <img src={docImg} alt="Doctor" className="login-doc" />
        </div>

      </div>
    </div>
  );
};

export default Login;
