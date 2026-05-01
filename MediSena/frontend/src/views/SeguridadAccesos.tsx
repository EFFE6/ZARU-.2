import React, { useState, useMemo } from 'react';
import {
  Home,
  ChevronRight,
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import {
  Roles as RolesIcon,
  Permisos as PermisosIcon,
  Usuarios as UsuariosIcon,
  AbrirRol,
  EditarRol,
  ArchivarRol,
  DashboardPermisos,
  FuncionariosPermisos,
  ContratistaPermisos,
  DesactivarRol,
  OjoIcon,
  EquisIcon,
  Filtrar,
} from '../components/Icons';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import CampanaSvg from '../assets/img/icons/campana.svg';
import '../styles/SeguridadAccesos/SeguridadAccesos.css';

import { navItems } from '../components/Sidebar';

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

const DefaultIconWrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 26, height: 26, background: '#F4F6F8', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002C4D' }}>
    {children}
  </div>
);

// Dynamic MODULES array generated from navItems in Sidebar
const MODULES = navItems.map(nav => {
  if (nav.id === 'Dashboard') {
    return {
      id: nav.id.toLowerCase(),
      name: nav.label.toUpperCase(),
      Icon: DashboardPermisos,
      submodules: [
        {
          id: 'funcionarios', name: 'FUNCIONARIOS', Icon: FuncionariosPermisos, items: [
            { id: 'edit_func',     name: 'Editar funcionarios',   checked: false },
            { id: 'eliminar_func', name: 'Eliminar funcionarios', checked: false },
            { id: 'mover_func',    name: 'Mover funcionarios',    checked: true  },
          ],
        },
        {
          id: 'contratista', name: 'CONTRATISTA', Icon: ContratistaPermisos, items: [
            { id: 'edit_cont',     name: 'Editar contratista',    checked: false },
            { id: 'eliminar_cont', name: 'Eliminar contratista',  checked: false },
            { id: 'mover_cont',    name: 'Mover contratista',     checked: true  },
          ],
        },
      ],
      items: [
        { id: 'archivar_pub',   name: 'Archivar publicaciones',   checked: true  },
        { id: 'agregar_man',    name: 'Agregar nuevos manuales',  checked: true  },
        { id: 'responder_tick', name: 'Responder tickets activos', checked: true },
      ]
    };
  }

  return {
    id: nav.id.toLowerCase(),
    name: nav.label.toUpperCase(),
    Icon: () => <DefaultIconWrap><nav.icon className="sidebar-icon-inherited" /></DefaultIconWrap>,
    items: []
  };
});

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

  // Visible page numbers for DataTable
  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }, [totalPages]);

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

  // ── Unified Accordion (Works for both Permisos tab and Modal) ───────────
  const renderAccordion = (isModalMode = false) => (
    <div className="sa-accordion">
      {MODULES.map(module => {
        const isExpanded = expandedModules.includes(module.id);
        return (
          <div className="sa-accordion-item" key={module.id}>
            <div
              className={`sa-accordion-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleModule(module.id)}
            >
              <div className="sa-accordion-title">
                {module.Icon && <module.Icon />}
                {module.name}
              </div>
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {isExpanded && (
              <div className="sa-accordion-body">
                {module.submodules?.map(sub => {
                  const isSubExpanded = expandedModules.includes(sub.id);
                  return (
                    <div className="sa-sub-accordion-item" key={sub.id}>
                      <div
                        className={`sa-sub-accordion-header ${isSubExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleModule(sub.id)}
                      >
                        <div className="sa-sub-accordion-title">
                          {sub.Icon && <sub.Icon />}
                          {sub.name}
                        </div>
                        {isSubExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>

                      {isSubExpanded && (
                        <div className={isModalMode ? "sa-sub-accordion-body" : "sa-perm-list"}>
                          {sub.items?.map(item => (
                            isModalMode ? (
                              <div className={`sa-permission-item ${item.checked ? 'checked' : ''}`} key={item.id}>
                                <label className="sa-checkbox-label">
                                  <input type="checkbox" defaultChecked={item.checked} disabled={!isEditMode} />
                                  <span className="sa-checkmark">{item.checked && <Check size={11} />}</span>
                                  {item.name}
                                </label>
                              </div>
                            ) : (
                              <div className="sa-perm-row" key={item.id}>{item.name}</div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className={isModalMode ? "sa-permission-list" : "sa-perm-list"}>
                  {module.items?.map(item => (
                    isModalMode ? (
                      <div className={`sa-permission-item ${item.checked ? 'checked' : ''}`} key={item.id}>
                        <label className="sa-checkbox-label">
                          <input type="checkbox" defaultChecked={item.checked} disabled={!isEditMode} />
                          <span className="sa-checkmark">{item.checked && <Check size={11} />}</span>
                          {item.name}
                        </label>
                      </div>
                    ) : (
                      <div className="sa-perm-row" key={item.id}>{item.name}</div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
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

        {/* ── Tabs + Card ── */}
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
          <div className={`sa-content-card ${activeTab === 'Roles' ? 'roles-active' : 'permisos-active'} ${viewInactive ? 'sa-mode-inactive' : ''}`}>

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

                {/* ── Lista de roles (Figma: filas separadas, sin tabla HTML) ── */}
                <div className="sa-roles-scroll">
                  {pagedRoles.length === 0 ? (
                    <div className="sa-roles-empty">No se encontraron roles.</div>
                  ) : (
                    pagedRoles.map(role => (
                      <div key={role.id} className={`sa-role-row ${!role.active ? 'sa-role-row--inactive' : ''} ${activeDropdown === role.id ? 'sa-role-row--active-menu' : ''}`}>
                        {/* Ícono + Nombre + Descripción */}
                        <div className="sa-role-cell">
                          <UsuariosIcon size={36} style={{ borderRadius: 10, flexShrink: 0 }} />
                          <div className="sa-role-cell-info">
                            <span className="sa-role-name">{role.name}</span>
                            <span className="sa-role-desc-inline">{role.description}</span>
                          </div>
                        </div>

                        {/* Permisos + Fecha */}
                        <div className="sa-role-meta-col">
                          <span className="sa-permissions-badge">
                            <span className="sa-badge-dot" />
                            {role.assignedPermissions} permisos asignados
                          </span>
                          <span className="sa-created-date-inline">Creado el {role.createdAt}</span>
                        </div>

                        {/* Menú tres puntos */}
                        <div className="sa-more-options">
                          <button className="sa-icon-btn" onClick={() => toggleDropdown(role.id)}>
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdown === role.id && (
                            <div className="sa-dropdown-menu">
                              {role.active ? (
                                <>
                                  <button onClick={() => openModal(role, false)}>
                                    <AbrirRol /> Abrir rol
                                  </button>
                                  <button onClick={() => openModal(role, true)}>
                                    <EditarRol /> Editar rol
                                  </button>
                                  <button onClick={() => handleArchive(role)}>
                                    <ArchivarRol /> Archivar rol
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleRestore(role)}>
                                    <AbrirRol /> Restaurar rol
                                  </button>
                                  <button onClick={() => openModal(role, true)}>
                                    <EditarRol /> Editar rol
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Paginación ── */}
                <div className="sa-pagination">
                  <div className="sa-pagination-left">
                    <span>Elementos por página</span>
                    <div className="sa-items-select-wrap">
                      <select
                        className="sa-items-select"
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      >
                        <option value={5}>05</option>
                        <option value={6}>06</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                  <div className="sa-pagination-center">
                    <button className="sa-pg-nav" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                    {visiblePages.map(n => (
                      <button key={n} className={`sa-pg-btn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
                    ))}
                    <button className="sa-pg-nav" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                  </div>
                  <div className="sa-pagination-right">
                    {currentPage} - de {totalPages} páginas
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
                  {renderAccordion(false)}
                </div>
                
                {/* Pagination for consistency as requested */}
                <div className="sa-pagination">
                  <div className="sa-pagination-left">
                    <span>Elementos por página</span>
                    <div className="sa-items-select-wrap">
                      <select className="sa-items-select" disabled>
                        <option>10</option>
                      </select>
                    </div>
                  </div>
                  <div className="sa-pagination-center">
                    <button className="sa-pg-nav" disabled>‹</button>
                    <button className="sa-pg-btn active">1</button>
                    <button className="sa-pg-nav" disabled>›</button>
                  </div>
                  <div className="sa-pagination-right">
                    1 - de 1 páginas
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODAL (usando componente compartido) ══ */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Información del rol"
        className="sa-modal"
      >
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
              <Filtrar style={{ marginRight: 6 }} /> Filtrar
            </button>
            <div className="sa-modal-search">
              <input type="text" placeholder="Busca" />
              <button className="sa-modal-search-btn"><Search size={13} /></button>
            </div>
          </div>

          <div className="sa-permissions-zone">
            {isEditMode && (
              <div className="sa-selection-info">
                <span className="sa-selected-count">
                  3 elemento(s) seleccionado(s) <EquisIcon style={{ cursor: 'pointer', marginLeft: 8 }} />
                </span>
                <button className="sa-btn-view-selected">
                  <OjoIcon style={{ marginRight: 6 }} /> Ver seleccionados
                </button>
              </div>
            )}

            <div className="sa-permissions-scroll-area">
              {renderAccordion(true)}
            </div>
          </div>
        </div>

        <div className="sa-modal-footer">
          {selectedRole?.active && (
            <button className="sa-btn-danger" onClick={() => handleArchive(selectedRole)}>
              <DesactivarRol style={{ marginRight: 6 }} /> Desactivar Rol
            </button>
          )}
          {selectedRole && !selectedRole.active && (
            <button className="sa-btn-outline" onClick={() => handleRestore(selectedRole)}>
              <AbrirRol /> Restaurar Rol
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
                <EditarRol className="sa-btn-icon-white" /> Editar Rol
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SeguridadAccesos;
