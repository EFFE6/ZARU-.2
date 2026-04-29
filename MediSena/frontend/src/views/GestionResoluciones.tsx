import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import api from '../api/api';
import {
  unwrapList,
  mapResolucion,
  mapUsuario,
  mapNivel,
  mapTope,
  mapParentesco,
  mapVigencia,
  mapParametro,
  mapSubEspecialidad,
  type MaestraResolucion,
  type MaestraUsuario,
  type MaestraNivel,
  type MaestraTope,
  type MaestraParentesco,
  type VigenciaGestionRow,
  type ParametroGestionRow,
  type SubEspGestionRow,
} from '../utils/gestionApiNormalize';
import {
  ChevronRight,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronLeft,
  ArrowUpDown,
  Home,
  Copy,
  X,
  HelpCircle,
  Search,
  SlidersHorizontal,
  Paperclip,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Info,
  Building2,
} from 'lucide-react';
import '../styles/GestionResoluciones/GestionResoluciones.css';
import { GestionIcon } from '../components/Icons';
import CampanaSvg from '../assets/img/icons/campana.svg';

/* ─── Types (mapeados desde API) ─────────────────────────── */
export type Resolucion = MaestraResolucion;
export type UsuarioExtended = MaestraUsuario;
export type Nivel = MaestraNivel;
export type Tope = MaestraTope;
export type Parentesco = MaestraParentesco;
export type SubEspecialidad = SubEspGestionRow;
export type Parametro = ParametroGestionRow;
export type { VigenciaGestionRow, ParametroGestionRow, SubEspGestionRow };

/* ─── Regionales & Roles mock ───────────────────────────── */
const REGIONALES = [
  '63 - Dirección Regional Centro de Comercio y Servicios',
  'Regional 001',
  'Regional 002',
  'Regional 003',
  'Regional 004',
];

const ROLES = ['Administrador', 'Usuario', 'Supervisor', 'Auditor'];

/* ─── Módulos de cada Tab ────────────────────────────── */
import {
  EMPTY_USER_FORM, UsuariosToolbar, UsuariosHead, UsuariosTabla, EditUserModal,
} from './gestion/Usuarios';
import { ResolucionesToolbar, ResolucionesHead, ResolucionesTabla, EditResModal, NewResModal } from './gestion/Resoluciones';

import {
  EMPTY_NIVEL_FORM, NivelesToolbar, NivelesHead, NivelesTabla, EditNivelModal, NewNivelModal
} from './gestion/Niveles';
import {
  TopesToolbar, TopesHead, TopesTabla, ViewTopeModal,
} from './gestion/Topes';
import {
  EMPTY_PARENTESCO_FORM, ParentescosToolbar, ParentescosLista, EditParentescoModal,
} from './gestion/Parentescos';
import { ParametrosToolbar, ParametrosHead, ParametrosTabla } from './gestion/Parametros';
import { SubEspecialidadesToolbar, SubEspecialidadesHead, SubEspecialidadesTabla, ViewSubModal, EditSubModal, EMPTY_SUB_FORM } from './gestion/SubEspecialidades';
/* ─── Forma vacía resolución ────────────────────────────── */
const EMPTY_RES_FORM = {
  tipo: 'VIGENTE',
  numero: '',
  fechaResolucion: '',
  inicioVigencia: '',
  finVigencia: '',
  regionales: [] as string[],
  descripcion: '',
};


/* ─── Forma vacía usuario ───────────────────────────────── */
const EMPTY_USER_FORM = {
  nombre: '',
  username: '',
  rol: '',
  regional: '',
  email: '',
  telefono: '',
};

/* ─── Avatar color helpers ──────────────────────────────── */
const AVATAR_COLORS = [
  '#4f86c6', '#6c6ea0', '#5a9e7a', '#c07850', '#9b5c8f',
  '#4a8fa8', '#7a7a9d', '#c06070',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts[0]) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/* ─── Helpers nivel color ────────────────────────────────── */
const NIVEL_COLORS: Record<string, string> = {
  'Nivel 1': '#39A900',
  'Nivel 2': '#3b82f6',
  'Nivel 3': '#ec4899',
  'Nivel 4': '#f97316',
  'Libre': '#06b6d4',
};
function nivelColor(n: string) { return NIVEL_COLORS[n] ?? '#94a3b8'; }

/* ─── Forms vacíos nivel ─────────────────────────────────── */
const EMPTY_NIVEL_FORM = {
  tipoBeneficiario: 'Todos los beneficiarios',
  nivel: 'Nivel 1',
  topeMaximo: '',
  periodo: '',
  descripcion: '',
};

const TIPOS_BENEFICIARIO = ['Todos los beneficiarios', 'Beneficiario titular', 'Beneficiario dependiente'];
const NIVELES_OPTS = ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Libre'];

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL – Gestión
   ════════════════════════════════════════════════════════════ */
const GestionResoluciones: React.FC = () => {

  /* ── Data ── */
  const [usuarios, setUsuarios] = useState<UsuarioExtended[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [topes, setTopes] = useState<Tope[]>([]);
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);
  const [vigencias, setVigencias] = useState<VigenciaGestionRow[]>([]);
  const [parametros, setParametros] = useState<ParametroGestionRow[]>([]);
  const [subEspecialidades, setSubEspecialidades] = useState<SubEspGestionRow[]>([]);
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Resoluciones');

  /* ── Filtros & búsqueda ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState('');

  /* ── Paginación ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── Modales de Eliminación ── */
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  /* ── Modales usuario ── */
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioExtended | null>(null);
  const [userForm, setUserForm] = useState({ ...EMPTY_USER_FORM });
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  /* ── Modales nivel ── */
  const [isEditNivelOpen, setIsEditNivelOpen] = useState(false);
  const [isNewNivelOpen, setIsNewNivelOpen] = useState(false);
  const [editNivelTarget, setEditNivelTarget] = useState<Nivel | null>(null);
  const [nivelForm, setNivelForm] = useState({ ...EMPTY_NIVEL_FORM });

  /* ── Modal Ver Tope ── */
  const [isViewTopeOpen, setIsViewTopeOpen] = useState(false);
  const [selectedTope, setSelectedTope] = useState<Tope | null>(null);

  /* ── Modal Parentesco ── */
  const [isEditParentescoOpen, setIsEditParentescoOpen] = useState(false);
  const [isNewParentescoOpen, setIsNewParentescoOpen] = useState(false);
  const [editParentescoTarget, setEditParentescoTarget] = useState<Parentesco | null>(null);
  const [parentescoForm, setParentescoForm] = useState({ ...EMPTY_PARENTESCO_FORM });

  /* ── Modal SubEspecialidad ── */
  const [isViewSubOpen, setIsViewSubOpen] = useState(false);
  const [isEditSubOpen, setIsEditSubOpen] = useState(false);
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [selectedSubTarget, setSelectedSubTarget] = useState<SubEspecialidad | null>(null);
  const [subForm, setSubForm] = useState({ ...EMPTY_SUB_FORM });

  /* ── Modal Parametro ── */
  const [isEditParametroOpen, setIsEditParametroOpen] = useState(false);
  const [editParametroTarget, setEditParametroTarget] = useState<Parametro | null>(null);
  const [parametroForm, setParametroForm] = useState({ vigencia: '', regional: '', resolucion: '', razonSocial: '', porcentajeNormal: '', vobos: '' });

  /* ── Tooltip regional ── */
  const [tooltip, setTooltip] = useState<{ id: string | number; text: string } | null>(null);

  /* ── Modal Resoluciones ── */
  const [isCreateResOpen, setIsCreateResOpen] = useState(false);
  const [isEditResOpen, setIsEditResOpen] = useState(false);
  const [editResTarget, setEditResTarget] = useState<Resolucion | null>(null);
  const [resForm, setResForm] = useState({
    tipo: 'VIGENTE' as 'VIGENTE' | 'VENCIDO',
    numero: '',
    fechaResolucion: '',
    inicioVigencia: '',
    finVigencia: '',
    regionales: [] as string[],
    descripcion: '',
  });
  const [resRegSearch, setResRegSearch] = useState('');
  const [resFormErrors, setResFormErrors] = useState<Record<string, string>>({});

  const tabs = [
    'Resoluciones', 'Usuarios', 'Niveles', 'Topes',
    'Parentescos', 'Abrir vigencia', 'Parámetros', 'Sub-especialidades',
  ];

  /* ── Fetch ── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorStatus(null);

      // Limpiar datos previos para evitar confusión al cambiar de tab
      //setResoluciones([]);
      setUsuarios([]);
      setNiveles([]);
      setTopes([]);
      setParentescos([]);
      setParametros([]);
      setSubEspecialidades([]);

      try {
        if (activeTab === 'Resoluciones') {
          const res = await api.get('/resoluciones', { params: { page: 1, pageSize: 1000 } });
          setResoluciones(
            unwrapList(res.data).map((r) => mapResolucion(r as Record<string, unknown>))
          );
        } else if (activeTab === 'Usuarios') {
          const res = await api.get('/usuarios', { params: { page: 1, pageSize: 2000 } });
          setUsuarios(
            unwrapList(res.data).map((r) => mapUsuario(r as Record<string, unknown>))
          );
        } else if (activeTab === 'Niveles') {
          const res = await api.get('/niveles', { params: { all: 'true' } });
          setNiveles(
            unwrapList(res.data).map((r, i) => mapNivel(r as Record<string, unknown>, i))
          );
        } else if (activeTab === 'Topes') {
          const res = await api.get('/topes', { params: { all: 'true' } });
          setTopes(unwrapList(res.data).map((r) => mapTope(r as Record<string, unknown>)));
        } else if (activeTab === 'Parentescos') {
          const res = await api.get('/parentescos', { params: { page: 1, pageSize: 500 } });
          setParentescos(
            unwrapList(res.data).map((r, i) => mapParentesco(r as Record<string, unknown>, i))
          );
        } else if (activeTab === 'Abrir vigencia') {
          const res = await api.get('/vigencias');
          setVigencias(
            unwrapList(res.data).map((r) => mapVigencia(r as Record<string, unknown>))
          );
        } else if (activeTab === 'Parámetros') {
          const res = await api.get('/parametros', { params: { page: 1, pageSize: 500 } });
          setParametros(
            unwrapList(res.data).map((r) => mapParametro(r as Record<string, unknown>))
          );
        } else if (activeTab === 'Sub-especialidades') {
          const res = await api.get('/sub-especialidades', { params: { page: 1, pageSize: 500 } });
          setSubEspecialidades(
            unwrapList(res.data).map((r) => mapSubEspecialidad(r as Record<string, unknown>))
          );
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setErrorStatus(err.response?.data?.message || err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false); setCurrentPage(1);
      }
    };
    fetchData();
  }, [activeTab]);

  /* ── Filtrado ── */
  const filteredData = useMemo(() => {
    if (activeTab === 'Resoluciones') {
      return resoluciones.filter(item => {
        const ms = item.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
        const mst = statusFilter === '' || statusFilter === 'Seleccionar estado'
          ? true : item.estado === statusFilter;
        return ms && mst;
      });
    }
    if (activeTab === 'Usuarios') {
      return usuarios.filter(u => {
        const ms = u.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const mst = !statusFilter || statusFilter === 'Seleccionar estado' ? true : (statusFilter === 'Activo' ? u.activo : !u.activo);
        const mft = activeFilterTag === '' ? true : (activeFilterTag === 'Activo' ? u.activo : !u.activo);
        return ms && mst && mft;
      });
    }
    if (activeTab === 'Niveles') {
      return niveles.filter(n =>
        n.tipoBeneficiario.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.nivel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'Topes') {
      return topes.filter(t =>
        t.grupo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nivel.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'Parentescos') {
      return parentescos.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'Parámetros') {
      return parametros.filter(p => p.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'Sub-especialidades') {
      const q = searchQuery.toLowerCase();
      return subEspecialidades.filter((s) =>
        s.nombre.toLowerCase().includes(q) ||
        s.regional.toLowerCase().includes(q) ||
        s.nit.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'Abrir vigencia') {
      const q = searchQuery.toLowerCase();
      return vigencias.filter((v) =>
        v.vigencia.toLowerCase().includes(q) ||
        v.regionalLabel.toLowerCase().includes(q) ||
        v.resolucion.toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeTab, resoluciones, usuarios, niveles, topes, parentescos, vigencias, parametros, subEspecialidades, parametros, searchQuery, statusFilter, activeFilterTag]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const visiblePages = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  /* ─── Handlers eliminar ──────────────────────────── */
  const handleDeleteClick = (item: any) => { setItemToDelete(item); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      let endpoint = '';
      if (activeTab === 'Resoluciones') endpoint = 'resoluciones';
      else if (activeTab === 'Usuarios') endpoint = 'usuarios';
      else if (activeTab === 'Niveles') endpoint = 'niveles';
      else if (activeTab === 'Topes') endpoint = 'topes';
      else if (activeTab === 'Parentescos') endpoint = 'parentescos';
      else if (activeTab === 'Sub-especialidades') endpoint = 'subespecialidades';
      else if (activeTab === 'Parámetros') endpoint = 'parametros';

      if (endpoint) {
        await api.delete(`/${endpoint}/${itemToDelete.id}`);
        if (activeTab === 'Resoluciones') setResoluciones(r => r.filter(x => x.id !== itemToDelete.id));
        else if (activeTab === 'Usuarios') setUsuarios(u => u.filter(x => x.id !== itemToDelete.id));
        else if (activeTab === 'Niveles') setNiveles(n => n.filter(x => x.id !== itemToDelete.id));
        else if (activeTab === 'Topes') setTopes(t => t.filter(x => x.id !== itemToDelete.id));
        else if (activeTab === 'Parentescos') setParentescos(p => p.filter(x => x.id !== itemToDelete.id));
        else if (activeTab === 'Sub-especialidades') setSubEspecialidades(s => s.filter(x => x.id !== itemToDelete.id));
        else if (activeTab === 'Parámetros') setParametros(p => p.filter(x => x.id !== itemToDelete.id));
      }
      else if (activeTab === 'Abrir vigencia') setVigencias((p) => p.filter((x) => x.id !== itemToDelete.id));
      else if (activeTab === 'Parámetros') setParametros((p) => p.filter((x) => x.id !== itemToDelete.id));
      else if (activeTab === 'Sub-especialidades') setSubEspecialidades((p) => p.filter((x) => x.id !== itemToDelete.id));
      setIsDeleteModalOpen(false); setItemToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };
  const deleteModalLabel = () => {
    if (activeTab === 'Niveles') return 'Nivel';
    if (activeTab === 'Topes') return 'Tope';
    if (activeTab === 'Parentescos') return 'Parentesco';
    if (activeTab === 'Abrir vigencia') return 'vigencia';
    if (activeTab === 'Parámetros') return 'parámetro';
    if (activeTab === 'Sub-especialidades') return 'sub-especialidad';
    if (activeTab === 'Usuarios') return 'usuario';
    if (activeTab === 'Sub-especialidades') return 'Sub-especialidad';
    return 'elemento';
  };

  /* ─── Handlers resolución ────────────────────────────── */
  const openCreateRes = () => { setResForm({ ...EMPTY_RES_FORM }); setResRegSearch(''); setResFormErrors({}); setIsCreateResOpen(true); };
  const openEditRes = (res: Resolucion) => {
    setEditResTarget(res);
    const parts = res.vigencia?.split(' - ') ?? [];
    const esVigente = (res.estado || '').toLowerCase() === 'vigente' || (res.estado || '').toLowerCase() === 'activa';
    setResForm({ tipo: esVigente ? 'VIGENTE' : 'VENCIDO', numero: res.numero, fechaResolucion: res.fecha, inicioVigencia: parts[0] ?? '', finVigencia: parts[1] ?? '', regionales: ['Regional 001', 'Regional 002', 'Regional 005'], descripcion: res.descripcion });
    setResRegSearch(''); setResFormErrors({}); setIsEditResOpen(true);
  };
  const closeResModals = () => { setIsCreateResOpen(false); setIsEditResOpen(false); setEditResTarget(null); };

  const toggleResRegional = (name: string) => {
    setResForm(p => ({ ...p, regionales: p.regionales.includes(name) ? p.regionales.filter(r => r !== name) : [...p.regionales, name] }));
  };

  const validateResForm = () => {
    const e: Record<string, string> = {};
    if (!resForm.numero.trim()) e.numero = 'Requerido';
    if (!resForm.fechaResolucion.trim()) e.fechaResolucion = 'Requerido';
    if (!resForm.inicioVigencia.trim()) e.inicioVigencia = 'Requerido';
    if (!resForm.finVigencia.trim()) e.finVigencia = 'Requerido';
    setResFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateRes = async () => {
    if (!validateResForm()) return;
    try {
      const payload = { numero: resForm.numero, fecha: resForm.fechaResolucion, descripcion: resForm.descripcion, estado: resForm.tipo === 'VIGENTE' ? 'Vigente' : 'Vencido', vigencia: `${resForm.inicioVigencia} - ${resForm.finVigencia}` };
      const created = await api.post('/resoluciones', payload);
      setResoluciones(p => [created.data, ...p]);
      closeResModals();
    } catch (e) { console.error(e); }
  };
  const handleUpdateRes = async () => {
    if (!validateResForm() || !editResTarget) return;
    try {
      const payload = { ...editResTarget, numero: resForm.numero, fecha: resForm.fechaResolucion, descripcion: resForm.descripcion, estado: resForm.tipo === 'VIGENTE' ? 'Vigente' : 'Vencido', vigencia: `${resForm.inicioVigencia} - ${resForm.finVigencia}` };
      await api.put(`/resoluciones/${editResTarget.id}`, payload);
      setResoluciones(p => p.map(r => r.id === editResTarget.id ? payload : r));
      closeResModals();
    } catch (e) { console.error(e); }
  };

  const filteredResRegionales = REGIONALES.filter(r => r.toLowerCase().includes(resRegSearch.toLowerCase()));

  /* ─── Handlers Nivel ─────────────────────────────────── */
  const openEditNivel = (n: Nivel) => {
    setEditNivelTarget(n);
    setNivelForm({ tipoBeneficiario: n.tipoBeneficiario, nivel: n.nivel, topeMaximo: n.topeMaximo, periodo: n.periodo, descripcion: n.descripcion });
    setIsEditNivelOpen(true);
  };
  const closeNivelModal = () => { setIsEditNivelOpen(false); setEditNivelTarget(null); };
  const handleSaveNivel = async () => {
    if (!editNivelTarget) return;
    try {
      const payload = { ...editNivelTarget, ...nivelForm };
      await api.put(`/niveles/${editNivelTarget.id}`, payload);
      setNiveles(p => p.map(n => n.id === editNivelTarget.id ? payload : n));
      closeNivelModal();
    } catch (e) { console.error(e); }
  };

  const openNewNivel = () => {
    setNivelForm({ ...EMPTY_NIVEL_FORM });
    setIsNewNivelOpen(true);
  };
  const closeNewNivel = () => setIsNewNivelOpen(false);
  const handleCreateNivel = () => {
    const newId = niveles.length ? Math.max(...niveles.map(n => n.id)) + 1 : 1;
    const nuevo: Nivel = {
      id: newId,
      tipoBeneficiario: nivelForm.tipoBeneficiario,
      nivel: nivelForm.nivel,
      topeMaximo: nivelForm.topeMaximo,
      periodo: nivelForm.periodo,
      descripcion: nivelForm.descripcion,
      estado: 'Vigente'
    };
    setNiveles([nuevo, ...niveles]);
    closeNewNivel();
  };

  /* ─── Handlers usuario ───────────────────────────── */
  const openEditUser = (u: UsuarioExtended) => {
    setSelectedUser(u);
    setUserForm({ nombre: u.nombre, username: u.username, rol: u.rol, regional: u.regional, email: u.email, telefono: u.telefono });
    setIsEditUserOpen(true);
  };
  const openNewUser = () => {
    setUserForm({ ...EMPTY_USER_FORM });
    setIsNewUserOpen(true);
  };
  const openViewUser = (u: UsuarioExtended) => { setSelectedUser(u); setIsViewUserOpen(true); };
  const openResetPwd = (u: UsuarioExtended) => { setSelectedUser(u); setNewPwd(''); setConfirmPwd(''); setPwdError(''); setIsResetPwdOpen(true); };

  const closeUserModals = () => { setIsEditUserOpen(false); setIsNewUserOpen(false); setIsViewUserOpen(false); setIsResetPwdOpen(false); setSelectedUser(null); };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setUsuarios(p => p.map(u => u.id === selectedUser.id ? { ...u, ...userForm } : u));
    closeUserModals();
  };
  const handleCreateUser = () => {
    const newId = usuarios.length ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const nuevo: UsuarioExtended = {
      id: newId,
      nombre: userForm.nombre,
      username: userForm.username,
      rol: userForm.rol,
      regional: userForm.regional,
      email: userForm.email,
      telefono: userForm.telefono,
      activo: true,
      tipoUsuario: 'Interno',
      fechaCreacion: new Date().toLocaleDateString('es-CO'),
      fechaModificacion: new Date().toLocaleDateString('es-CO'),
      ultimoAcceso: 'Nunca',
      codigoDependencia: 'N/A'
    };
    setUsuarios([nuevo, ...usuarios]);
    closeUserModals();
  };
  const handleSavePwd = () => {
    if (!newPwd) { setPwdError('Ingresa la nueva contraseña'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Las contraseñas no coinciden'); return; }
    closeUserModals();
  };

  const toggleUserActive = (id: string | number) => {
    setUsuarios(p => p.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  };

  /* ─── Handlers Parametros ────────────────────────────── */
  const openEditParametro = (p: Parametro) => {
    setEditParametroTarget(p);
    setParametroForm({ vigencia: p.vigencia, regional: p.regional, resolucion: p.resolucion, razonSocial: p.razonSocial, porcentajeNormal: p.porcentajeNormal, vobos: p.vobos.toString() });
    setIsEditParametroOpen(true);
  };
  const closeParametroModal = () => { setIsEditParametroOpen(false); setEditParametroTarget(null); };
  const handleSaveParametro = async () => {
    if (!editParametroTarget) return;
    try {
      const payload = { ...editParametroTarget, vigencia: parametroForm.vigencia, regional: parametroForm.regional, resolucion: parametroForm.resolucion, razonSocial: parametroForm.razonSocial, porcentajeNormal: parametroForm.porcentajeNormal, vobos: parseInt(parametroForm.vobos) || 0 };
      await api.put(`/parametros/${editParametroTarget.id}`, payload);
      setParametros(p => p.map(x => x.id === editParametroTarget.id ? payload : x));
      closeParametroModal();
    } catch (e) {
      console.error(e);
    }
  };

  /* ─── Handlers Sub-especialidades ─────────────────────── */
  const openEditSub = (s: SubEspecialidad) => {
    setSelectedSubTarget(s);
    setSubForm({
      nombre: s.nombre,
      contratista: s.contratista,
      nit: s.nit,
      regional: s.regional,
      consecutivo: String(s.consecutivo),
      medicamentos: String(s.medicamentos)
    });
    setIsEditSubOpen(true);
  };
  const handleSaveSub = () => {
    if (!selectedSubTarget) return;
    setSubEspecialidades(p => p.map(x => x.id === selectedSubTarget.id ? {
      ...x,
      ...subForm,
      consecutivo: Number(subForm.consecutivo),
      medicamentos: Number(subForm.medicamentos)
    } : x));
    closeSubModal();
  };

  /* ─── Handlers parentesco ────────────────────────── */
  const openEditParentesco = (p: Parentesco) => {
    setEditParentescoTarget(p);
    setParentescoForm({ nombre: p.nombre, descripcion: p.nombre, ambito: p.tipo });
    setIsEditParentescoOpen(true);
  };
  const openNewParentesco = () => {
    setParentescoForm({ ...EMPTY_PARENTESCO_FORM });
    setIsNewParentescoOpen(true);
  };
  const closeParentescoModal = () => { setIsEditParentescoOpen(false); setIsNewParentescoOpen(false); setEditParentescoTarget(null); };
  const handleSaveParentesco = () => {
    if (!editParentescoTarget) return;
    setParentescos(p => p.map(x => x.id === editParentescoTarget.id ? { ...x, nombre: parentescoForm.nombre, tipo: parentescoForm.ambito } : x));
    closeParentescoModal();
  };
  const handleCreateParentesco = () => {
    const newId = parentescos.length ? Math.max(...parentescos.map(p => p.id)) + 1 : 1;
    const nuevo: Parentesco = {
      id: newId,
      nombre: parentescoForm.nombre,
      tipo: parentescoForm.ambito,
      orden: newId,
      activo: true
    };
    setParentescos([nuevo, ...parentescos]);
    closeParentescoModal();
  };

  /* ─── Handlers subespecialidad ───────────────────── */
  const openNewSub = () => {
    setSubForm({ ...EMPTY_SUB_FORM });
    setIsNewSubOpen(true);
  };
  const closeSubModal = () => {
    setIsEditSubOpen(false);
    setIsNewSubOpen(false);
    setSelectedSubTarget(null);
  };
  const handleCreateSub = () => {
    const newId = subEspecialidades.length ? Math.max(...subEspecialidades.map(s => s.id)) + 1 : 1;
    const nuevo: SubEspecialidad = {
      id: newId,
      consecutivo: Number(subForm.consecutivo),
      nombre: subForm.nombre,
      contratista: subForm.contratista,
      nit: subForm.nit,
      regional: subForm.regional,
      medicamentos: Number(subForm.medicamentos)
    };
    setSubEspecialidades([nuevo, ...subEspecialidades]);
    closeSubModal();
  };

  /* ─── Render toolbar ─────────────────────────────── */
  const renderToolbar = () => {
    if (activeTab === 'Resoluciones') return (
      <ResolucionesToolbar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onNew={openCreateRes}
      />
    );
    if (activeTab === 'Usuarios') return (
      <UsuariosToolbar
        statusFilter={statusFilter}
        activeFilterTag={activeFilterTag}
        onStatusChange={setStatusFilter}
        onTagChange={setActiveFilterTag}
        onNew={openNewUser}
      />
    );
    if (activeTab === 'Niveles') return <NivelesToolbar onNew={openNewNivel} />;
    if (activeTab === 'Topes') return <TopesToolbar onNew={() => { }} />;
    if (activeTab === 'Parentescos') return <ParentescosToolbar onNew={openNewParentesco} />;
    if (activeTab === 'Parámetros') return <ParametrosToolbar />;
    if (activeTab === 'Sub-especialidades') return <SubEspecialidadesToolbar onNew={openNewSub} />;
    return null;
  };

  /* ─── Render thead ───────────────────────────────── */
  const renderTableHead = () => {
    if (activeTab === 'Resoluciones') return <ResolucionesHead />;
    if (activeTab === 'Usuarios') return <UsuariosHead />;
    if (activeTab === 'Niveles') return <NivelesHead />;
    if (activeTab === 'Topes') return <TopesHead />;
    if (activeTab === 'Parámetros') return <ParametrosHead />;
    if (activeTab === 'Sub-especialidades') return <SubEspecialidadesHead />;
    return <tr><th colSpan={8}>Mantenimiento de {activeTab}</th></tr>;
  };

  /* ─── Render tbody ───────────────────────────────── */
  const renderTableBody = () => {
    if (loading) return <tr><td colSpan={8} className="table-empty">Cargando datos...</td></tr>;
    if (errorStatus) return (
      <tr><td colSpan={8} className="table-empty">
        <p style={{ color: '#e11d48', fontWeight: 700 }}>⚠️ {errorStatus}</p>
      </td></tr>
    );

    if (currentItems.length === 0) return <tr><td colSpan={8} className="table-empty">No se encontraron resultados.</td></tr>;

    if (activeTab === 'Resoluciones') {
      return (currentItems as Resolucion[]).map(res => (
        <tr key={res.id}>
          <td className="col-numero">{res.numero}</td>
          <td className="col-fecha">{res.fecha}</td>
          <td><div className="desc-with-icon">{res.descripcion}<Copy size={15} className="copy-icon" /></div></td>
          <td>
            <span className={`status-badge ${res.estado.toLowerCase()}`}>
              <div className={`status-dot ${res.estado.toLowerCase()}`}></div>
              {res.estado}
            </span>
          </td>
          <td className="col-vigencia">{res.vigencia}</td>
          <td>
            <div className="row-actions">
              <button className="icon-btn edit" onClick={() => openEditRes(res)}><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => handleDeleteClick(res)}><Trash2 size={16} /></button>
            </div>
          </td>
        </tr>
      ));
    }
    if (activeTab === 'Usuarios') return (
      <UsuariosTabla
        items={currentItems as UsuarioExtended[]}
        loading={loading}
        tooltip={tooltip}
        onTooltip={setTooltip}
        onToggleActive={toggleUserActive}
        onEdit={openEditUser}
        onResetPwd={openResetPwd}
        onView={openViewUser}
      />
    );
    if (activeTab === 'Niveles') return (
      <NivelesTabla
        items={currentItems as Nivel[]}
        loading={loading}
        onEdit={openEditNivel}
        onDelete={handleDeleteClick}
      />
    );
    if (activeTab === 'Topes') return (
      <TopesTabla
        items={currentItems as Tope[]}
        loading={loading}
        onView={t => { setSelectedTope(t); setIsViewTopeOpen(true); }}
        onDelete={handleDeleteClick}
      />
    );
    if (activeTab === 'Parámetros') return (
      <ParametrosTabla
        items={currentItems as ParametroGestionRow[]}
        loading={loading}
        tooltip={tooltip}
        onTooltip={setTooltip}
      />
    );
    if (activeTab === 'Sub-especialidades') return (
      <SubEspecialidadesTabla
        items={currentItems as SubEspecialidad[]}
        loading={loading}
        onView={s => { setSelectedSubTarget(s); setIsViewSubOpen(true); }}
        onEdit={openEditSub}
        onDelete={handleDeleteClick}
      />
    );
    return <tr><td colSpan={8} className="table-empty">Sin datos.</td></tr>;
  };

  return (
    <>
      <div className="gestion-container">

        {/* ── Header ── */}
        <header className="gestion-header">
          <div className="gestion-header-top">
            <nav className="breadcrumb">
              <div className="breadcrumb-item"><Home size={14} /></div>
              <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
              <div className="breadcrumb-item">Maestras</div>
              <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
              <div className="breadcrumb-item active">{activeTab}</div>
            </nav>
            <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} className="notification-bell" />
          </div>
          <div className="gestion-header-bottom">
            <h1 className="gestion-title">Gestión de {activeTab}</h1>
            <div className="search-wrapper">
              <div className="search-container">
                <input
                  type="text"
                  placeholder={
                    activeTab === 'Usuarios' ? 'Busca el nombre de usuario o email' :
                      activeTab === 'Niveles' ? 'Busca el tipo de beneficiario o nivel' :
                        'Busca el registro'
                  }
                  className="search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="search-btn" type="button">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="7" r="4.2" stroke="#002c4d" strokeWidth="2" />
                  <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#002c4d" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ── Tabs + Card ── */}
        <div className="tabs-card-group">
          <div className="tabs-scroll-area">
            {tabs.map(tab => (
              <div
                key={tab}
                className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); setStatusFilter(''); setCurrentPage(1); }}
              >
                {activeTab === tab && (
                  <div className="active-tab-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GestionIcon size={14} />
                  </div>
                )}
                {tab}
              </div>
            ))}
          </div>

          {/* Contenido principal */}

          <div className={`gestion-content-card ${activeTab === 'Resoluciones' ? 'first-tab-active' : activeTab === 'Usuarios' ? 'second-tab-active' : ''}`}>
            {/* Toolbar */}
            {renderToolbar()}

            {/* Contenido principal */}
            {activeTab === 'Abrir vigencia' ? (
              <div className="abr-vigencia-container">
                <div className="vigencia-card-content">
                  {/* Alerta de atención */}
                  <div className="um-alert warning" style={{ marginBottom: 0 }}>
                    <AlertTriangle size={16} className="um-alert-icon" color="#d97706" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ color: '#002c4d', fontSize: '13px' }}>Atención</strong>
                      <span style={{ fontSize: '12px', color: '#5c7a90' }}>
                        Este proceso solo puede ser ejecutado en la nueva vigencia 2027.
                      </span>
                    </div>
                  </div>

                  <div className="vigencia-sections">
                    {/* Sección: ¿Qué pasará? */}
                    <div className="vigencia-section">
                      <h2 style={{ color: '#1e3a52', fontSize: '20px', marginBottom: '16px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        ¿Qué pasará al abrir la nueva vigencia?
                      </h2>
                      <p style={{ color: '#5c7a90', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
                        Se copiarán automáticamente los siguientes datos de la vigencia anterior:
                      </p>
                      <ul className="vigencia-list">
                        <li>Parámetros</li>
                        <li>Resoluciones</li>
                        <li>Topes</li>
                        <li>Cargos</li>
                        <li>Cargos por funcionario</li>
                        <li>Categorías por regional</li>
                        <li>Beneficiarios (se actualizarán los suspendidos)</li>
                      </ul>
                    </div>

                    {/* Sección: Procesos que se activarán */}
                    <div className="vigencia-section">
                      <h2 style={{ color: '#1e3a52', fontSize: '20px', marginBottom: '16px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        Procesos que se activarán
                      </h2>
                      <p style={{ color: '#5c7a90', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
                        Después de crear la vigencia, podrás usar:
                      </p>
                      <ul className="vigencia-list">
                        <li>Órdenes de atención</li>
                        <li>Cuentas de cobro</li>
                        <li>Recibos de pago</li>
                      </ul>
                    </div>
                  </div>

                  {/* Acciones finales */}
                  <div className="vigencia-actions">
                    <button className="btn-new-resolution" style={{ background: '#002c4d', padding: '12px 24px', borderRadius: '10px' }}>
                      <Plus size={18} />
                      Abrir vigencia 2027
                    </button>
                    <p className="vigencia-footer-info">
                      Este proceso puede tardar unos minutos.
                    </p>
                  </div>
                  </div>
                </div>
              ) : activeTab === 'Parentescos' ? (
                <ParentescosLista
            items={currentItems as Parentesco[]}
            loading={loading}
            onEdit={openEditParentesco}
            onDelete={handleDeleteClick}
          />
          ) : (
          <DataTable
            headers={renderTableHead()}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            visiblePages={visiblePages}
          >
            {renderTableBody()}
          </DataTable>
              )}
        </div>
      </div>

      {/* ══ MODAL: Eliminar ══ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="modal-content-delete"
        hideHeader
      >
        <div className="modal-icon-container-delete" style={activeTab === 'Sub-especialidades' ? { background: '#dc2626', color: '#ffffff' } : {}}>
          <Trash2 size={26} color={activeTab === 'Sub-especialidades' ? '#ffffff' : undefined} />
        </div>
        <h2 className="modal-title">¿Quieres eliminar est{activeTab === 'Sub-especialidades' ? 'a' : 'e'} {deleteModalLabel()}?</h2>
        <p className="modal-description">
          Esta acción eliminará l{activeTab === 'Sub-especialidades' ? 'a' : 'e'} {deleteModalLabel()} de <strong>forma permanente</strong> y no podrás recuperarl{activeTab === 'Sub-especialidades' ? 'a' : 'o'} después.
        </p>
        <div className="modal-actions">
          <button className="btn-modal btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
          <button className="btn-modal btn-delete" onClick={confirmDelete} style={activeTab === 'Sub-especialidades' ? { background: '#dc2626', color: 'white' } : {}}>
            <Trash2 size={16} />
            Eliminar {deleteModalLabel()}
          </button>
        </div>
      </Modal>

      {/* ══ MODAL: Editar Nivel ══ */}
      {isEditNivelOpen && editNivelTarget && (
        <EditNivelModal
          form={nivelForm}
          onFormChange={(field, value) => setNivelForm(p => ({ ...p, [field]: value }))}
          onClose={closeNivelModal}
          onSave={handleSaveNivel}
        />
      )}

      {/* ══ MODAL: Nuevo Nivel ══ */}
      {isNewNivelOpen && (
        <NewNivelModal
          form={nivelForm}
          onFormChange={(field, value) => setNivelForm(p => ({ ...p, [field]: value }))}
          onClose={closeNewNivel}
          onSave={handleCreateNivel}
        />
      )}

      {/* ══ MODAL: Ver Tope ══ */}
      {isViewTopeOpen && selectedTope && (
        <ViewTopeModal tope={selectedTope} onClose={() => setIsViewTopeOpen(false)} />
      )}

      {/* ══ MODAL: Editar Usuario ══ */}
      {isEditUserOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          form={userForm}
          onFormChange={(field, value) => setUserForm(p => ({ ...p, [field]: value }))}
          onClose={closeUserModals}
          onSave={handleSaveUser}
          onGoResetPwd={() => { closeUserModals(); openResetPwd(selectedUser); }}
        />
      )}

      {/* ══ MODAL: Nuevo Usuario ══ */}
      {isNewUserOpen && (
        <EditUserModal
          user={null}
          form={userForm}
          onFormChange={(field, value) => setUserForm(p => ({ ...p, [field]: value }))}
          onClose={closeUserModals}
          onSave={handleCreateUser}
          onGoResetPwd={() => { }}
        />
      )}

      {/* ══ MODAL: Resetear Contraseña ══ */}
      <Modal
        isOpen={isResetPwdOpen && !!selectedUser}
        onClose={closeUserModals}
        title="Resetear contraseña"
        className="resolucion-modal user-modal pwd-modal"
      >
        <div className="resolucion-modal-body">
          <div className="um-alert warning">
            <AlertTriangle size={15} className="um-alert-icon" />
            <div>
              <strong>Alerta</strong>
              <span> Vas a cambiar la contraseña del usuario <strong className="um-link-text">{selectedUser?.username}</strong></span>
            </div>
          </div>
          <div className="rm-field rm-field-full">
            <div className="rm-select-wrapper" style={{ marginTop: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input className="rm-input-plain" type={showNewPwd ? 'text' : 'password'} placeholder="Nueva contraseña" value={newPwd} onChange={e => { setNewPwd(e.target.value); setPwdError(''); }} style={{ marginLeft: 8 }} />
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }} onClick={() => setShowNewPwd(p => !p)}>
                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="rm-field rm-field-full">
            <div className="rm-select-wrapper">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input className="rm-input-plain" type={showConfirmPwd ? 'text' : 'password'} placeholder="Confirma la contraseña" value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setPwdError(''); }} style={{ marginLeft: 8 }} />
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }} onClick={() => setShowConfirmPwd(p => !p)}>
                {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {pwdError && <p className="um-error-msg">{pwdError}</p>}
        </div>
        <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <div className="rm-footer-actions">
            <button className="rm-btn-cancel" onClick={closeUserModals}>Cancelar</button>
            <button className="rm-btn-primary" onClick={handleSavePwd}>
              <Save size={15} style={{ marginRight: 6 }} />
              Guardar contraseña
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: Ver Usuario ══ */}
      {isViewUserOpen && selectedUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeUserModals()}>
          <div className="resolucion-modal user-view-modal">
            <div className="resolucion-modal-header">
              <h2 className="resolucion-modal-title">{selectedUser.nombre}</h2>
              <button className="resolucion-modal-close" onClick={closeUserModals}><X size={18} /></button>
            </div>
            <div className="resolucion-modal-body vm-body">
              <div className="vm-user-header">
                <div className="vm-avatar" style={{ background: '#4f86c6' }}>
                  {(selectedUser.nombre.trim().split(' ')[0][0] + (selectedUser.nombre.trim().split(' ')[1]?.[0] ?? '')).toUpperCase()}
                </div>
                <div className="vm-user-basic">
                  <span className="vm-username">{selectedUser.username}</span>
                  <div className="vm-email-row">
                    <span className="vm-email">{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              <div className="vm-section">
                <div className="vm-field">
                  <span className="vm-label">Rol</span>
                  <span className={`rol-badge ${selectedUser.rol === 'Administrador' ? 'admin' : 'usuario'}`}>{selectedUser.rol}</span>
                </div>
                <div className="vm-field">
                  <span className="vm-label">Estado</span>
                  <span className={`status-badge ${selectedUser.activo ? 'vigente' : 'vencido'}`} style={{ width: 'fit-content' }}>
                    <div className={`status-dot ${selectedUser.activo ? 'vigente' : 'vencido'}`}></div>
                    {selectedUser.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="vm-field">
                  <span className="vm-label">Tipo de usuario</span>
                  <span className="vm-tipo-badge">{selectedUser.tipoUsuario}</span>
                </div>
              </div>
              <div className="vm-divider" />
              <div className="vm-section">
                <div className="vm-field">
                  <span className="vm-label">Fecha de creación</span>
                  <span className="vm-value">{selectedUser.fechaCreacion}</span>
                </div>
                <div className="vm-field">
                  <span className="vm-label">Fecha de modificación</span>
                  <span className="vm-value">{selectedUser.fechaModificacion}</span>
                </div>
                <div className="vm-field">
                  <span className="vm-label">Último acceso</span>
                  <span className="vm-value">{selectedUser.ultimoAcceso}</span>
                </div>
              </div>
              <div className="vm-divider" />
              <div className="vm-section">
                <div className="vm-field">
                  <span className="vm-label">Regional</span>
                  <span className="ue-regional-tag" style={{ marginTop: 6 }}>
                    <span className="ue-regional-text" style={{ maxWidth: 160 }}>{selectedUser.regional}</span>
                  </span>
                </div>
                <div className="vm-field">
                  <span className="vm-label">Código dependencia</span>
                  <span className="vm-value">{selectedUser.codigoDependencia}</span>
                </div>
                <div className="vm-field">
                  <span className="vm-label">Teléfono/Extensión</span>
                  <span className="vm-value">{selectedUser.telefono}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Editar Parentesco ══ */}
      {isEditParentescoOpen && editParentescoTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeParentescoModal()}>
          <div className="resolucion-modal user-edit-modal">
            <div className="resolucion-modal-header">
              <h2 className="resolucion-modal-title">Editar Parentesco</h2>
              <button className="resolucion-modal-close" onClick={closeParentescoModal}><X size={18} /></button>
            </div>
            <div className="resolucion-modal-body user-edit-body">
              <div className="ue-field">
                <label className="ue-label">Nombre <HelpCircle size={13} className="rm-help" /></label>
                <input className="ue-input" placeholder="Madre-Padre" value={parentescoForm.nombre} onChange={e => setParentescoForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="ue-field">
                <label className="ue-label">Descripción <HelpCircle size={13} className="rm-help" /></label>
                <input className="ue-input" placeholder="Madre-Padre" value={parentescoForm.descripcion} onChange={e => setParentescoForm(p => ({ ...p, descripcion: e.target.value }))} />
              </div>
              <div className="ue-field">
                <label className="ue-label">Ámbito <HelpCircle size={13} className="rm-help" /></label>
                <input className="ue-input" placeholder="Nacional" value={parentescoForm.ambito} onChange={e => setParentescoForm(p => ({ ...p, ambito: e.target.value }))} />
              </div>
            </div>
            <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end', borderTop: 'none' }}>
              <div className="rm-footer-actions">
                <button className="rm-btn-cancel" onClick={closeParentescoModal} style={{ minWidth: '100px' }}>Cancelar</button>
                <button className="rm-btn-primary" onClick={handleSaveParentesco} style={{ minWidth: '160px' }}>
                  <Save size={15} />
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Editar SubEspecialidad ══ */}
      {isEditSubOpen && selectedSubTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeSubModal()}>
          <div className="resolucion-modal user-edit-modal">
            <div className="resolucion-modal-header">
              <h2 className="resolucion-modal-title">Editar Sub-Especialidad</h2>
              <button className="resolucion-modal-close" onClick={closeSubModal}><X size={18} /></button>
            </div>
            <div className="resolucion-modal-body user-edit-body">
              <div className="ue-row">
                <div className="ue-field">
                  <label className="ue-label">Nombre <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={subForm.nombre} onChange={e => setSubForm(p => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div className="ue-field">
                  <label className="ue-label">Contratista <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={subForm.contratista} onChange={e => setSubForm(p => ({ ...p, contratista: e.target.value }))} />
                </div>
              </div>
              <div className="ue-row">
                <div className="ue-field">
                  <label className="ue-label">NIT <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={subForm.nit} onChange={e => setSubForm(p => ({ ...p, nit: e.target.value }))} />
                </div>
                <div className="ue-field">
                  <label className="ue-label">Regional <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={subForm.regional} onChange={e => setSubForm(p => ({ ...p, regional: e.target.value }))} />
                </div>
              </div>
              <div className="ue-row">
                <div className="ue-field" style={{ flex: 1 }}>
                  <label className="ue-label">Consecutivo <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" type="number" value={subForm.consecutivo} onChange={e => setSubForm(p => ({ ...p, consecutivo: e.target.value }))} />
                </div>
                <div className="ue-field" style={{ flex: 1 }}>
                  <label className="ue-label">Medicamentos <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" type="number" value={subForm.medicamentos} onChange={e => setSubForm(p => ({ ...p, medicamentos: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end', borderTop: 'none' }}>
              <div className="rm-footer-actions">
                <button className="rm-btn-cancel" onClick={closeSubModal} style={{ minWidth: '100px' }}>Cancelar</button>
                <button className="rm-btn-primary" onClick={handleSaveSub} style={{ minWidth: '160px' }}>
                  <Save size={15} />
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Editar Parametro ══ */}
      {isEditParametroOpen && editParametroTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeParametroModal()}>
          <div className="resolucion-modal user-edit-modal">
            <div className="resolucion-modal-header">
              <h2 className="resolucion-modal-title">Editar Parámetro</h2>
              <button className="resolucion-modal-close" onClick={closeParametroModal}><X size={18} /></button>
            </div>
            <div className="resolucion-modal-body user-edit-body">
              <div className="ue-row">
                <div className="ue-field">
                  <label className="ue-label">Vigencia <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={parametroForm.vigencia} onChange={e => setParametroForm(p => ({ ...p, vigencia: e.target.value }))} />
                </div>
                <div className="ue-field">
                  <label className="ue-label">Regional <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={parametroForm.regional} onChange={e => setParametroForm(p => ({ ...p, regional: e.target.value }))} />
                </div>
              </div>
              <div className="ue-row">
                <div className="ue-field">
                  <label className="ue-label">Resolución <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={parametroForm.resolucion} onChange={e => setParametroForm(p => ({ ...p, resolucion: e.target.value }))} />
                </div>
                <div className="ue-field">
                  <label className="ue-label">Razón Social <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={parametroForm.razonSocial} onChange={e => setParametroForm(p => ({ ...p, razonSocial: e.target.value }))} />
                </div>
              </div>
              <div className="ue-row">
                <div className="ue-field">
                  <label className="ue-label">% SMLV <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" value={parametroForm.porcentajeNormal} onChange={e => setParametroForm(p => ({ ...p, porcentajeNormal: e.target.value }))} />
                </div>
                <div className="ue-field">
                  <label className="ue-label">VoBos <HelpCircle size={13} className="rm-help" /></label>
                  <input className="ue-input" type="number" value={parametroForm.vobos} onChange={e => setParametroForm(p => ({ ...p, vobos: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end', borderTop: 'none' }}>
              <div className="rm-footer-actions">
                <button className="rm-btn-cancel" onClick={closeParametroModal} style={{ minWidth: '100px' }}>Cancelar</button>
                <button className="rm-btn-primary" onClick={handleSaveParametro} style={{ minWidth: '160px' }}>
                  <Save size={15} />
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══ MODAL: Editar Parentesco ══ */}
      {isEditParentescoOpen && editParentescoTarget && (
        <EditParentescoModal
          isEdit={true}
          form={parentescoForm}
          onFormChange={(field, value) => setParentescoForm(p => ({ ...p, [field]: value }))}
          onClose={closeParentescoModal}
          onSave={handleSaveParentesco}
        />
      )}

      {/* ══ MODAL: Nuevo Parentesco ══ */}
      {isNewParentescoOpen && (
        <EditParentescoModal
          isEdit={false}
          form={parentescoForm}
          onFormChange={(field, value) => setParentescoForm(p => ({ ...p, [field]: value }))}
          onClose={closeParentescoModal}
          onSave={handleCreateParentesco}
        />
      )}

      {/* ══ MODAL: Ver Sub-especialidad ══ */}
      {isViewSubOpen && selectedSubTarget && (
        <ViewSubModal sub={selectedSubTarget} onClose={() => setIsViewSubOpen(false)} />
      )}

      {/* ══ MODAL: Editar Sub-especialidad ══ */}
      {isEditSubOpen && selectedSubTarget && (
        <EditSubModal
          isEdit={true}
          form={subForm}
          onFormChange={(field, value) => setSubForm(p => ({ ...p, [field]: value }))}
          onClose={closeSubModal}
          onSave={handleSaveSub}
        />
      )}

      {/* ══ MODAL: Nueva Sub-especialidad ══ */}
      {isNewSubOpen && (
        <EditSubModal
          isEdit={false}
          form={subForm}
          onFormChange={(field, value) => setSubForm(p => ({ ...p, [field]: value }))}
          onClose={closeSubModal}
          onSave={handleCreateSub}
        />
      )}

      {/* ══ MODAL: Crear Resolucion ══ */}
      {isCreateResOpen && (
        <NewResModal
          isEdit={false}
          form={resForm}
          formErrors={resFormErrors}
          regSearch={resRegSearch}
          onRegSearch={setResRegSearch}
          onToggleRegional={toggleResRegional}
          onFormChange={(field, value) => setResForm(p => ({ ...p, [field]: value }))}
          onClose={closeResModals}
          onCreate={handleCreateRes}
          onUpdate={() => { }}
        />
      )}

      {/* ══ MODAL: Editar Resolucion ══ */}
      {isEditResOpen && editResTarget && (
        <EditResModal
          isEdit={true}
          form={resForm}
          formErrors={resFormErrors}
          regSearch={resRegSearch}
          onRegSearch={setResRegSearch}
          onToggleRegional={toggleResRegional}
          onFormChange={(field, value) => setResForm(p => ({ ...p, [field]: value }))}
          onClose={closeResModals}
          onCreate={() => { }}
          onUpdate={handleUpdateRes}
        />
      )}

    </div >
    </>
  );
};

export default GestionResoluciones;