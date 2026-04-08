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
import './Dashboard.css';

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
          <div style={styles.citasHeader}>
            <Calendar size={20} color="#1C3E57" />
            <h2 style={styles.citasTitle}>Citas programadas</h2>
          </div>

          <div style={styles.citasList}>
            {citas.map(cita => (
              <CitaCard key={cita.id} cita={cita} />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div style={styles.paginationLeft}>
              <span>Elementos por página</span>
              <select style={styles.pageSelect}>
                <option>5</option>
              </select>
            </div>
            <div className="pagination-center" style={styles.paginationCenter}>
              <button style={styles.pageBtn}><ChevronsLeft size={16} /></button>
              <button style={styles.pageBtn}><ChevronLeft size={16} /></button>
              <button style={{...styles.pageBtn, ...styles.activePageBtn}}>1</button>
              <button style={styles.pageBtn}>2</button>
              <button style={styles.pageBtn}>3</button>
              <button style={styles.pageBtn}>4</button>
              <button style={styles.pageBtn}>5</button>
              <button style={styles.pageBtn}><ChevronRight size={16} /></button>
              <button style={styles.pageBtn}><ChevronsRight size={16} /></button>
            </div>
            <div style={styles.paginationRight}>
              <span>1 - 5 de 13 Páginas</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div style={styles.statCard}>
    <div style={styles.statCardContent}>
      <div style={styles.statHeader}>
        <div style={{...styles.statIcon, color: color}}>
          {icon}
        </div>
        <span style={styles.statTitle}>{title}</span>
      </div>
      <div style={styles.statBody}>
        <span style={styles.statValue}>{value}</span>
        <span style={styles.statSubtitle}>{subtitle}</span>
      </div>
    </div>
    <div style={{...styles.statDecoration, backgroundColor: '#1C3E57'}}></div>
  </div>
);

const CitaCard = ({ cita }) => (
  <div style={styles.citaCard}>
    <div style={styles.citaContent}>
      <div className="cita-top" style={styles.citaTop}>
        <h3 style={styles.citaType}>Consulta médica</h3>
        <span style={styles.activeBadge}>
          <div style={styles.badgeDot}></div>
          Activo
        </span>
      </div>
      <div className="cita-details">
        <div className="detail-item">
          <Stethoscope size={18} color="#1C3E57" />
          <span style={styles.detailLabel}>Médico:</span>
          <span style={styles.detailValue}>{cita.medico}</span>
        </div>
        <div className="detail-item">
          <User size={18} color="#1C3E57" />
          <span style={styles.detailLabel}>Beneficiario:</span>
          <span style={styles.detailValue}>{cita.beneficiario}</span>
        </div>
        <div className="detail-item">
          <Clock size={18} color="#1C3E57" />
          <span style={styles.detailLabel}>Hora de la consulta:</span>
          <span style={styles.detailValue}>{cita.hora}</span>
        </div>
      </div>
    </div>
    <div style={styles.citaDecoration}></div>
  </div>
);

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  headerTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  sunIconContainer: {
    backgroundColor: 'rgba(28, 62, 87, 0.1)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1C3E57',
    margin: 0,
  },
  headerDate: {
    fontSize: '0.85rem',
    color: '#5C768D',
    margin: 0,
  },
  notificationBell: {
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(28, 62, 87, 0.05)',
  },
  statCardContent: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: '0.9rem',
    color: '#5C768D',
    fontWeight: '500',
  },
  statBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#1C3E57',
  },
  statSubtitle: {
    fontSize: '0.8rem',
    color: '#5C768D',
    marginTop: '5px',
  },
  statDecoration: {
    width: '12px',
    height: '60px',
    marginTop: 'auto',
    marginBottom: 'auto',
    borderTopLeftRadius: '10px',
    borderBottomLeftRadius: '10px',
  },
  citasSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '24px',
    padding: '25px',
    border: '2px solid #5EABDB', /* Border requested in screenshot */
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  citasHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(28, 62, 87, 0.1)',
    paddingBottom: '15px',
  },
  citasTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1C3E57',
    margin: 0,
  },
  citasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  citaCard: {
    backgroundColor: '#D6E4F0',
    borderRadius: '20px',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  citaContent: {
    flex: 1,
    padding: '20px',
  },
  citaTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
  },
  citaType: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1C3E57',
    margin: 0,
  },
  activeBadge: {
    backgroundColor: '#1EAD28',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'white',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  citaDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1C3E57',
  },
  detailValue: {
    fontSize: '0.85rem',
    color: '#5C768D',
  },
  citaDecoration: {
    width: '15px',
    backgroundColor: '#1EAD28',
    borderTopLeftRadius: '10px',
    borderBottomLeftRadius: '10px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    fontSize: '0.8rem',
    color: '#1C3E57',
    fontWeight: '600',
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pageSelect: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(28, 62, 87, 0.2)',
    borderRadius: '8px',
    padding: '2px 8px',
    color: '#1C3E57',
  },
  paginationCenter: {
    display: 'flex',
    gap: '5px',
  },
  pageBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(28, 62, 87, 0.1)',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#1C3E57',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activePageBtn: {
    backgroundColor: '#1C3E57',
    color: 'white',
  },
  paginationRight: {
    textAlign: 'right',
  }
};

export default Dashboard;
