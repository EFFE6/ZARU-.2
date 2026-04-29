import React, { useState, useMemo } from 'react';
import {
  Home,
  ChevronRight,
  ChevronLeft,
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Shield,
  X,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  PowerOff,
  Eye
} from 'lucide-react';
import { Roles as RolesIcon, Permisos as PermisosIcon, Usuarios as UsuariosIcon } from '../components/Icons';
import CampanaSvg from '../assets/img/icons/campana.svg';
import EditarRolSvg from '../assets/img/icons/editar-rol.svg';
import ArchivarRolSvg from '../assets/img/icons/archivar-rol.svg';
import AbrirRolSvg from '../assets/img/icons/abrir-rol.svg';
import '../styles/SeguridadAccesos/SeguridadAccesos.css';

// ── Mock data ──────────────────────────────────────────────────────────────
const INITIAL_ROLES = [
  { id: 1,  name: 'Super-Administrador', description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: true },
  { id: 2,  name: 'Administrador',       description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: true },
  { id: 3,  name: 'Supervisor',          description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: true },
  { id: 4,  name: 'Funcionario',         description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: true },
  { id: 5,  name: 'Empleado',            description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: true },
  { id: 6,  name: 'Contratista',         description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: true },
  { id: 9,  name: 'Auditor',             description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 15, createdAt: '24 de nov, 2025', active: true },
  { id: 10, name: 'Consultor',           description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 10, createdAt: '24 de nov, 2025', active: true },
  { id: 11, name: 'Analista',            description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 20, createdAt: '24 de nov, 2025', active: true },
  { id: 12, name: 'Gestor',              description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 25, createdAt: '24 de nov, 2025', active: true },
];

const INACTIVE_ROLES = [
  { id: 7, name: 'Super-Administrador', description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: false },
  { id: 8, name: 'Administrador',       description: 'Coordinador de las Dependencias de Risaralda', assignedPermissions: 30, createdAt: '24 de nov, 2025', active: false },
];

const MODULES = [
  {
    id: 'dashboard', name: 'DASHBOARD', items: [
      { id: 'archivar_pub',   name: 'Archivar publicaciones',   checked: true  },
      { id: 'agregar_man',    name: 'Agregar nuevos manuales',  checked: true  },
      { id: 'responder_tick', name: 'Responder tickets activos', checked: true },
    ],
  },
  {
    id: 'gestion', name: 'GESTIÓN', submodules: [
      {
        id: 'funcionarios', name: 'FUNCIONARIOS', items: [
          { id: 'edit_func',     name: 'Editar funcionarios',   checked: false },
          { id: 'eliminar_func', name: 'Eliminar funcionarios', checked: false },
          { id: 'mover_func',    name: 'Mover funcionarios',    checked: true  },
        ],
      },
      {
        id: 'contratista', name: 'CONTRATISTA', items: [
          { id: 'edit_cont',     name: 'Editar Contratista',    checked: false },
          { id: 'eliminar_cont', name: 'Eliminar funcionarios', checked: false },
          { id: 'mover_cont',    name: 'Mover funcionarios',    checked: true  },
        ],
      },
    ],
  },
  { id: 'datos_basicos', name: 'DATOS BÁSICOS',      items: [] },
  { id: 'movimientos',   name: 'MOVIMIENTOS',         items: [] },
  { id: 'excedentes',    name: 'EXCEDENTES',          items: [] },
  { id: 'consultas',     name: 'CONSULTAS',           items: [] },
  { id: 'reportes',      name: 'REPORTES',            items: [] },
  { id: 'reportes_nac',  name: 'REPORTES NACIONALES', items: [] },
  { id: 'seguridad_acc', name: 'SEGURIDAD Y ACCESOS', items: [] },
];

const TABS = ['Roles', 'Permisos'] as const;
type TabType = typeof TABS[number];

// ── Component ─────────────────────────────────────────────────────────────
const SeguridadAccesos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Roles');
  const [viewInactive, setViewInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [inactiveRoles, setInactiveRoles] = useState(INACTIVE_ROLES);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isEditMode, setIsEditMode]         = useState(false);
  const [selectedRole, setSelectedRole]     = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>(['dashboard', 'gestion', 'funcionarios', 'contratista']);

  const allRoles = viewInactive ? inactiveRoles : roles;

  // Filter by search
  const filteredRoles = useMemo(() =>
    allRoles.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [allRoles, searchQuery]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / itemsPerPage));
  const pagedRoles = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // Generate page numbers to show (max 7 visible)
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const toggleModule = (id: string) =>
    setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const openModal = (role: any = null, isEdit = false) => {
    setSelectedRole(role);
    setIsEditMode(isEdit);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const closeModal = () => { setIsModalOpen(false); setSelectedRole(null); setIsEditMode(false); };

  const toggleDropdown = (id: number) =>
    setActiveDropdown(prev => (prev === id ? null : id));

  const handleArchive = (role: any) => {
    setRoles(prev => prev.filter(r => r.id !== role.id));
    setInactiveRoles(prev => [{ ...role, active: false }, ...prev]);
    setActiveDropdown(null);
    closeModal();
  };

  const handleRestore = (role: any) => {
    setInactiveRoles(prev => prev.filter(r => r.id !== role.id));
    setRoles(prev => [{ ...role, active: true }, ...prev]);
    setActiveDropdown(null);
    closeModal();
  };

  const handleSave = () => closeModal();

  // ── Accordion for Permisos tab (read-only, no checkboxes) ─────────────
  const renderPermisosAccordion = () => (
    <div className="sa-accordion">
      {MODULES.map(module => (
        <div className="sa-accordion-item" key={module.id}>
          <div
            className={`sa-accordion-header ${expandedModules.includes(module.id) ? 'expanded' : ''}`}
            onClick={() => toggleModule(module.id)}
          >
            <div className="sa-accordion-title">
              <Shield size={16} />
              {module.name}
            </div>
            {expandedModules.includes(module.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedModules.includes(module.id) && (
            <div className="sa-accordion-body">
              {module.submodules?.map(sub => (
                <div className="sa-sub-accordion-item" key={sub.id}>
                  <div
                    className={`sa-sub-accordion-header ${expandedModules.includes(sub.id) ? 'expanded' : ''}`}
                    onClick={() => toggleModule(sub.id)}
                  >
                    <div className="sa-sub-accordion-title">
                      <Shield size={13} />
                      {sub.name}
                    </div>
                    {expandedModules.includes(sub.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {expandedModules.includes(sub.id) && (
                    <div className="sa-perm-list">
                      {sub.items?.map(item => (
                        <div className="sa-perm-row" key={item.id}>
                          {item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {module.items?.map(item => (
                <div className="sa-perm-row" key={item.id}>
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── Accordion for Modal (with checkboxes) ─────────────────────────────
  const renderModalAccordion = () => (
    <div className="sa-accordion">
      {MODULES.map(module => (
        <div className="sa-accordion-item" key={module.id}>
          <div
            className={`sa-accordion-header ${expandedModules.includes(module.id) ? 'expanded' : ''}`}
            onClick={() => toggleModule(module.id)}
          >
            <div className="sa-accordion-title">
              <Shield size={16} />
              {module.name}
            </div>
            {expandedModules.includes(module.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedModules.includes(module.id) && (
            <div className="sa-accordion-body">
              {module.submodules?.map(sub => (
                <div className="sa-sub-accordion-item" key={sub.id}>
                  <div
                    className={`sa-sub-accordion-header ${expandedModules.includes(sub.id) ? 'expanded' : ''}`}
                    onClick={() => toggleModule(sub.id)}
                  >
                    <div className="sa-sub-accordion-title">
                      <Shield size={13} />
                      {sub.name}
                    </div>
                    {expandedModules.includes(sub.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {expandedModules.includes(sub.id) && (
                    <div className="sa-sub-accordion-body">
                      {sub.items?.map(item => (
                        <div className={`sa-permission-item ${item.checked ? 'checked' : ''}`} key={item.id}>
                          <label className="sa-checkbox-label">
                            <input type="checkbox" defaultChecked={item.checked} disabled={!isEditMode} />
                            <span className="sa-checkmark">{item.checked && <Check size={11} />}</span>
                            {item.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="sa-permission-list">
                {module.items?.map(item => (
                  <div className={`sa-permission-item ${item.checked ? 'checked' : ''}`} key={item.id}>
                    <label className="sa-checkbox-label">
                      <input type="checkbox" defaultChecked={item.checked} disabled={!isEditMode} />
                      <span className="sa-checkmark">{item.checked && <Check size={11} />}</span>
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="sa-container">

        {/* ── Header ── */}
        <header className="sa-header">
          <div className="sa-header-top">
            <nav className="sa-breadcrumb">
              <div className="sa-breadcrumb-item"><Home size={14} /></div>
              <div className="sa-breadcrumb-sep"><ChevronRight size={13} /></div>
              <div className="sa-breadcrumb-item active">Seguridad y accesos</div>
            </nav>
            <img src={CampanaSvg} alt="Notificaciones" className="sa-bell" />
          </div>

          <div className="sa-header-bottom">
            <h1 className="sa-title">Seguridad y accesos</h1>
            <div className="sa-search-wrapper">
              <div className="sa-search-container">
                <input
                  type="text"
                  placeholder="Busca"
                  className="sa-search-input"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <button className="sa-search-btn" type="button">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="7" r="4.2" stroke="#002c4d" strokeWidth="2" />
                  <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#002c4d" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ── Tabs + Card (Igual a la de gestion)── */}
        <div className="sa-tabs-card-group">
          <div className="sa-tabs-scroll-area">
            {TABS.map(tab => (
              <div
                key={tab}
                className={`sa-tab-pill ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); setCurrentPage(1); }}
              >
                {tab === 'Roles' && activeTab === 'Roles' && (
                  <RolesIcon className="sa-tab-icon" />
                )}
                {tab === 'Permisos' && activeTab === 'Permisos' && (
                  <PermisosIcon className="sa-tab-icon" />
                )}
                {tab}
              </div>
            ))}
          </div>

          {/* Content Card */}
          <div className={`sa-content-card ${activeTab === 'Roles' ? 'roles-active' : 'permisos-active'}`}>

            {/* ══ ROLES TAB ══ */}
            {activeTab === 'Roles' && (
              <>
                <div className="sa-toolbar">
                  <span className="sa-subtitle">
                    {viewInactive
                      ? `Roles archivados: ${inactiveRoles.length}`
                      : 'Selecciona un rol y asigna permisos según las capacidades del usuario'}
                  </span>
                  <div className="sa-toolbar-actions">
                    <button className="sa-btn-outline" onClick={() => { setViewInactive(v => !v); setCurrentPage(1); }}>
                      {viewInactive
                        ? <><Eye size={14} /> Ver roles activos</>
                        : <><RefreshCw size={14} /> Ver roles inactivos</>}
                    </button>
                    {!viewInactive && (
                      <button className="sa-btn-primary" onClick={() => openModal(null, true)}>
                        <Plus size={15} /> Nuevo Rol
                      </button>
                    )}
                  </div>
                </div>

                {/* Roles list — paginated */}
                <div className="sa-roles-list-container">
                  <div className="sa-roles-list">
                    {pagedRoles.map(role => (
                      <div className={`sa-role-card ${!role.active ? 'inactive' : ''}`} key={role.id}>
                        <div className="sa-role-icon-wrapper">
                          <UsuariosIcon size={44} style={{ borderRadius: 10 }} />
                        </div>
                        <div className="sa-role-info">
                          <h3 className="sa-role-name">{role.name}</h3>
                          <p className="sa-role-desc">{role.description}</p>
                        </div>
                        <div className="sa-role-meta">
                          <span className="sa-permissions-badge">
                            <span className="sa-badge-dot" />
                            {role.assignedPermissions} permisos asignados
                          </span>
                          <span className="sa-created-date">Creado el {role.createdAt}</span>
                          <div className="sa-more-options">
                            <button className="sa-icon-btn" onClick={() => toggleDropdown(role.id)}>
                              <MoreVertical size={18} />
                            </button>
                            {activeDropdown === role.id && (
                              <div className="sa-dropdown-menu">
                                {role.active ? (
                                  <>
                                    <button onClick={() => openModal(role, false)}>
                                      <img src={AbrirRolSvg} alt="" style={{ width: 14 }} /> Abrir rol
                                    </button>
                                    <button onClick={() => openModal(role, true)}>
                                      <img src={EditarRolSvg} alt="" style={{ width: 14 }} /> Editar rol
                                    </button>
                                    <button onClick={() => handleArchive(role)}>
                                      <img src={ArchivarRolSvg} alt="" style={{ width: 14 }} /> Archivar rol
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => handleRestore(role)}>
                                      <img src={AbrirRolSvg} alt="" style={{ width: 14 }} /> Restaurar rol
                                    </button>
                                    <button onClick={() => openModal(role, true)}>
                                      <img src={EditarRolSvg} alt="" style={{ width: 14 }} /> Editar rol
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Pagination ── */}
                <div className="sa-pagination-container">
                  <div className="sa-items-per-page">
                    Elementos por página
                    <select
                      className="sa-select-page"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value={6}>06</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>

                  <div className="sa-pagination-controls">
                    <button
                      className="sa-page-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {pageNumbers.map((p, i) =>
                      p === '...'
                        ? <span key={`dots-${i}`} className="sa-dots">...</span>
                        : (
                          <button
                            key={p}
                            className={`sa-page-btn ${currentPage === p ? 'active' : ''}`}
                            onClick={() => goToPage(p as number)}
                          >
                            {p}
                          </button>
                        )
                    )}

                    <button
                      className="sa-page-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="sa-page-info">
                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRoles.length)} de {filteredRoles.length}
                  </div>
                </div>
              </>
            )}

            {/* ══ PERMISOS TAB ══ */}
            {activeTab === 'Permisos' && (
              <div className="sa-permisos-view">
                <p className="sa-subtitle" style={{ marginBottom: 16 }}>
                  De click en alguno de los módulos para conocer sus permisos.
                </p>
                <div className="sa-permisos-scroll">
                  {renderPermisosAccordion()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODAL ══ */}
      {isModalOpen && (
        <div className="sa-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h2>Información del rol</h2>
              <button className="sa-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="sa-modal-body">
              <div className="sa-form-group">
                <input
                  type="text"
                  className="sa-form-control"
                  placeholder="Coordinador _DAF_GII"
                  defaultValue={selectedRole?.name}
                  readOnly={!isEditMode && !!selectedRole}
                />
              </div>
              <div className="sa-form-group">
                <textarea
                  className="sa-form-control"
                  placeholder="Coordinador de las Dependencias de Risaralda"
                  defaultValue={selectedRole?.description}
                  readOnly={!isEditMode && !!selectedRole}
                  rows={3}
                />
              </div>

              {selectedRole && !isEditMode && (
                <p className="sa-permissions-summary">
                  Este rol cuenta con{' '}
                  <span className="sa-badge-green">30 permisos asignados</span>{' '}
                  de un total de{' '}
                  <span className="sa-badge-purple">100 permisos disponibles</span>
                </p>
              )}

              <h3 className="sa-section-title">
                {isEditMode ? 'Administrador de permisos del rol' : 'Permisos del rol'}
              </h3>

              <div className="sa-permissions-toolbar">
                <button className="sa-btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
                  <Filter size={13} /> Filtrar
                </button>
                <div className="sa-modal-search">
                  <input type="text" placeholder="Busca" />
                  <button className="sa-modal-search-btn"><Search size={13} /></button>
                </div>
              </div>

              {isEditMode && (
                <div className="sa-selection-info">
                  <span className="sa-selected-count">
                    3 elemento(s) seleccionado(s) <X size={12} style={{ cursor: 'pointer' }} />
                  </span>
                  <button className="sa-btn-view-selected">
                    <Check size={12} /> Ver seleccionados
                  </button>
                </div>
              )}

              {renderModalAccordion()}
            </div>

            <div className="sa-modal-footer">
              {selectedRole?.active && (
                <button className="sa-btn-danger" onClick={() => handleArchive(selectedRole)}>
                  <PowerOff size={15} /> Desactivar Rol
                </button>
              )}
              {selectedRole && !selectedRole.active && (
                <button className="sa-btn-outline" onClick={() => handleRestore(selectedRole)}>
                  <img src={AbrirRolSvg} alt="" style={{ width: 15 }} /> Restaurar Rol
                </button>
              )}
              {!selectedRole && <div />}

              <div className="sa-footer-actions">
                {isEditMode ? (
                  <>
                    <button className="sa-btn-cancel" onClick={closeModal}>Cancelar</button>
                    <button className="sa-btn-primary" onClick={handleSave}>Aceptar</button>
                  </>
                ) : (
                  <button className="sa-btn-primary" onClick={() => setIsEditMode(true)}>
                    <img src={EditarRolSvg} alt="" style={{ width: 15 }} className="sa-btn-icon-white" /> Editar Rol
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SeguridadAccesos;
