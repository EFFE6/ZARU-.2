import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/Footer/Footer.css';
import senaLogo from '../assets/img/login/sena-logo.svg';
import logoMedisena from '../assets/img/footer/logo-footer.svg';
import { ExternalLink, X } from 'lucide-react';

import isoGroup from '../assets/img/footer/grupo de isos.svg';
import iconFb from '../assets/img/footer/redes/facebook.svg';
import iconIg from '../assets/img/footer/redes/instagram.svg';
import iconYt from '../assets/img/footer/redes/youtube.svg';
import iconX from '../assets/img/footer/redes/x.svg';
import trabajoLogo from '../assets/img/footer/escudodecolombia-trabajo .svg';

const Footer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="medisena-footer-collapsed">
        <span className="footer-copyright">
          MediSENA © Copyright. Servicio Nacional de Aprendizaje SENA. República de Colombia.
        </span>
        <button
          className="footer-expand-btn"
          onClick={() => setIsExpanded(true)}
          title="Ver Información Institucional"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {isExpanded && createPortal(
        <div className="medisena-footer-expanded-overlay" onClick={(e) => e.target === e.currentTarget && setIsExpanded(false)}>
          <div className="medisena-footer-expanded-card">
            <button className="footer-close-btn" onClick={() => setIsExpanded(false)}>
              <X size={24} />
            </button>

            <div className="footer-grid">
              {/* Columna Izquierda */}
              <div className="footer-col-left">
                <div className="footer-logos">
                  <img src={senaLogo} alt="SENA" className="footer-logo-sena" />
                  <img src={logoMedisena} alt="MediSENA" className="footer-logo-medisena" />
                </div>

                <div className="footer-section">
                  <h2 className="footer-title">Información Institucional</h2>
                  <h3 className="footer-subtitle">Información oficial sobre MediSENA y el Servicio Nacional de Aprendizaje (SENA)</h3>
                  <p className="footer-text">
                    MediSENA es un servicio digital del SENA que presta servicios de atención médica a todos los funcionarios del SENA;
                    asegurando un servicio público de calidad, acceso gratuito independientemente de su ubicación y cobertura en todo el territorio nacional.
                  </p>
                </div>

                <div className="footer-section">
                  <h3 className="footer-subtitle-sm">Atención presencial</h3>
                  <p className="footer-text">
                    Dirección: Calle 57 No. 8 - 69 Bogotá D.C. (Cundinamarca)<br />
                    Código postal: 110111<br />
                    Horario de atención: Lunes a viernes 8:00 a.m. - 5:30 p.m.
                  </p>
                </div>

                <div className="footer-section">
                  <h3 className="footer-subtitle-sm">Canales de contacto</h3>
                  <p className="footer-text">
                    Teléfono conmutador: +57(601) 546 15 00<br />
                    Línea gratuita: +57(018000) 910 270<br />
                    Línea anticorrupción: +57(018000) 910 270<br />
                    Correo institucional: ministerio@ministerio.gov.co<br />
                    Correo de notificaciones judiciales: judiciales@gov.co
                  </p>
                </div>

                <div className="footer-section">
                  <h3 className="footer-subtitle-sm">Canales digitales</h3>
                  <div className="footer-socials">
                    <a href="#" className="footer-social-link">
                      <img src={iconFb} alt="Facebook" className="footer-social-icon" /> @SENA
                    </a>
                    <a href="#" className="footer-social-link">
                      <img src={iconIg} alt="Instagram" className="footer-social-icon" /> @SENACOMUNICA
                    </a>
                    <a href="#" className="footer-social-link">
                      <img src={iconYt} alt="YouTube" className="footer-social-icon" /> @SENATV
                    </a>
                    <a href="#" className="footer-social-link">
                      <img src={iconX} alt="X" className="footer-social-icon" /> @SENACOMUNICA
                    </a>
                  </div>
                </div>

                <div className="footer-section footer-legal-section">
                  <h3 className="footer-subtitle-sm">Información legal</h3>
                  <div className="footer-legal-links">
                    <a href="#">Políticas</a>
                    <a href="#">Mapa del sitio</a>
                    <a href="#">Términos y Condiciones</a>
                    <a href="#">Accesibilidad</a>
                  </div>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="footer-col-right">
                <div className="footer-colombia-logo-container">
                  <img src={trabajoLogo} alt="Escudo de Colombia - Ministerio de Trabajo" className="footer-escudo-img" />
                </div>

                <div className="footer-certifications-wrapper">
                  <img src={isoGroup} alt="Certificaciones ISO" className="footer-iso-img" />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Footer;
