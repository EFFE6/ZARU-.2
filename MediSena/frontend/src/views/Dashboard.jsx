import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';
import {
  Users,
  Calendar,
  FileText,
  UserPlus,
  Loader2,
  Sun,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Stethoscope,
  User,
  Clock
} from 'lucide-react';
import '../App.css';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, citasRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/citas')
        ]);
        setStats(statsRes.data);
        setCitas(citasRes.data);
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="main-layout" style={{ justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={48} color="#1C3E57" />
      </div>
    );
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header Section */}
        <header className="dashboard-header">
          <div className="header-title-container">
            <div className="sun-icon-container">
              <Sun size={20} color="#1C3E57" />
            </div>
            <div>
              <h1 className="header-title">Buenos días, Paula Andrea</h1>
              <p className="header-date">12 de Noviembre de 2024</p>
            </div>
          </div>
          <div className="notification-bell">
            <Bell size={24} color="#F59E0B" fill="#F59E0B" />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Beneficiarios activos"
            value="14.623"
            subtitle="Beneficiarios activos"
            icon={<Users size={20} />}
            color="#5EABDB"
          />
          <StatCard
            title="Citas programadas"
            value="1'144.146"
            subtitle="0 hoy"
            icon={<Calendar size={20} />}
            color="#5EABDB"
          />
          <StatCard
            title="Órdenes médicas"
            value="3'155.732"
            subtitle="687.646 cuentas de cobro"
            icon={<FileText size={20} />}
            color="#5EABDB"
          />
          <StatCard
            title="Profesionales"
            value="232"
            subtitle="6493 contratistas"
            icon={<UserPlus size={20} />}
            color="#5EABDB"
          />
        </div>

        {/* Citas Section */}
        <section className="citas-section">
          <div className="citas-header">
            <Calendar size={20} color="#1C3E57" />
            <h2 className="citas-title">Citas programadas</h2>
          </div>

          <div className="citas-list">
            {citas.map(cita => (
              <CitaCard key={cita.id} cita={cita} />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-left">
              <span>Elementos por página</span>
              <select className="page-select">
                <option>5</option>
              </select>
            </div>
            <div className="pagination-center">
              <button className="page-btn"><ChevronsLeft size={16} /></button>
              <button className="page-btn"><ChevronLeft size={16} /></button>
              <button className="page-btn active-page-btn">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">4</button>
              <button className="page-btn">5</button>
              <button className="page-btn"><ChevronRight size={16} /></button>
              <button className="page-btn"><ChevronsRight size={16} /></button>
            </div>
            <div className="pagination-right">
              <span>1 - 5 de 13 Páginas</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="stat-card">
    <div className="stat-card-content">
      <div className="stat-header">
        <div className="stat-icon" style={{ color: color }}>
          {icon}
        </div>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-subtitle">{subtitle}</span>
      </div>
    </div>
    <div className="stat-decoration" style={{ backgroundColor: '#1C3E57' }}></div>
  </div>
);

const CitaCard = ({ cita }) => (
  <div className="cita-card">
    <div className="cita-content">
      <div className="cita-top">
        <h3 className="cita-type">Consulta médica</h3>
        <span className="active-badge">
          <div className="badge-dot"></div>
          Activo
        </span>
      </div>
      <div className="cita-details">
        <div className="detail-item">
          <Stethoscope size={18} color="#1C3E57" />
          <span className="detail-label">Médico:</span>
          <span className="detail-value">{cita.medico}</span>
        </div>
        <div className="detail-item">
          <User size={18} color="#1C3E57" />
          <span className="detail-label">Beneficiario:</span>
          <span className="detail-value">{cita.beneficiario}</span>
        </div>
        <div className="detail-item">
          <Clock size={18} color="#1C3E57" />
          <span className="detail-label">Hora de la consulta:</span>
          <span className="detail-value">{cita.hora}</span>
        </div>
      </div>
    </div>
    <div className="cita-decoration"></div>
  </div>
);

export default Dashboard;
