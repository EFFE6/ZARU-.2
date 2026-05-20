import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

// Icons
import { User, Lock, Eye, EyeOff } from 'lucide-react';

// Images
import logoMedisena from '../assets/img/login/logo-medisena-login.svg';
import senaLogo from '../assets/img/login/sena-logo.svg';
import linea1 from '../assets/img/login/linea1.svg';
import linea2 from '../assets/img/login/linea2.svg';
import linea3 from '../assets/img/login/linea3.svg';
import headerImg from '../assets/img/login/header-login.svg';
import marcaAgua from '../assets/img/login/medicina-marca-agua.svg';

// Doctor (slide 0) assets
import azulDoc from '../assets/img/login/azul-hombre-doc.svg';
import docImg from '../assets/img/login/doc.svg';
import estetoscopioDoc from '../assets/img/login/estetoscopio-hombre.doc.svg';
import termometroDoc from '../assets/img/login/termometro-hombre-doc.svg';
import adnDoc from '../assets/img/login/adn-hombre-doc.svg';

// Médico (slide 1) assets
import azulMed from '../assets/img/login/azul-mujer-med.svg';
import medImg from '../assets/img/login/med.svg';
import microscopioMed from '../assets/img/login/microscopio-mujer-med.svg';
import inyeccionMed from '../assets/img/login/inyeccion-mujer-med.svg';
import botiquinMed from '../assets/img/login/botiquin-mujer-med.svg';

import '../styles/Login/Login.css';

const SLIDE_INTERVAL_MS = 6000;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  // Slideshow: alterna entre doc y med con crossfade CSS
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Verificar token al montar
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
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

        {/* Background Lines */}
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
                    {showPassword
                      ? <EyeOff size={20} className="login-icon-toggle" />
                      : <Eye size={20} className="login-icon-toggle" />}
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

          {/* ── Slide 0: Doctor (hombre) ── */}
          <div className={`login-slide login-slide-doc ${activeSlide === 0 ? 'login-slide--active' : ''}`}>
            <img src={azulDoc} alt="" className="login-bg-shape" />
            <img src={marcaAgua} alt="" className="login-watermark" />
            <div className="login-character-container login-character-container-doc">
              <img src={docImg} alt="Doctor" className="login-doc-img" />
              <img src={estetoscopioDoc} alt="" className="login-float login-float-estetoscopio" />
              <img src={termometroDoc} alt="" className="login-float login-float-termometro" />
              <img src={adnDoc} alt="" className="login-float login-float-adn" />
            </div>
          </div>

          {/* ── Slide 1: Médico (mujer) ── */}
          <div className={`login-slide login-slide-med ${activeSlide === 1 ? 'login-slide--active' : ''}`}>
            <img src={azulMed} alt="" className="login-bg-shape" />
            <img src={marcaAgua} alt="" className="login-watermark" />
            <div className="login-character-container login-character-container-med">
              <img src={medImg} alt="Médico" className="login-doc-img" />
              <img src={microscopioMed} alt="" className="login-float login-float-microscopio" />
              <img src={inyeccionMed} alt="" className="login-float login-float-inyeccion" />
              <img src={botiquinMed} alt="" className="login-float login-float-botiquin" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
