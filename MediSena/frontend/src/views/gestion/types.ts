/* ═══════════════════════════════════════════════════════════
   TIPOS COMPARTIDOS – Gestión
   ═══════════════════════════════════════════════════════════ */

export interface Resolucion {
  id: number;
  numero: string;
  fecha: string;
  descripcion: string;
  estado: string;
  vigencia: string;
}

export interface UsuarioExtended {
  id: number;
  nombre: string;
  username: string;
  rol: string;
  email: string;
  regional: string;
  ultimoAcceso: string;
  activo: boolean;
  tipoUsuario: string;
  fechaCreacion: string;
  fechaModificacion: string;
  codigoDependencia: string;
  telefono: string;
  avatarInitials: string;
}

export interface Nivel {
  id: number;
  tipoBeneficiario: string;
  nivel: string;
  topeMaximo: string;
  descripcion: string;
  periodo: string;
  estado: string;
}

export interface Tope {
  id: number;
  codigo: number;
  grupo: string;
  nivel: string;
  vigencia: string;
  valorPromedio: string;
  resolucion: string;
  estado: string;
}

export interface Parentesco {
  id: number;
  orden: number;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export interface Parametro {
  id: number;
  vigencia: string;
  regional: string;
  resolucion: string;
  razonSocial: string;
  porcentajeNormal: string;
  vobos: number;
}

export interface SubEspecialidad {
  id: number;
  consecutivo: number;
  nombre: string;
  contratista: string;
  nit: string;
  regional: string;
  medicamentos: number;
}

/* ─── Constantes compartidas ───────────────────────────── */
export const REGIONALES = [
  '63 - Dirección Regional Centro de Comercio y Servicios',
  'Regional 001',
  'Regional 002',
  'Regional 003',
  'Regional 004',
];

export const ROLES = ['Administrador', 'Usuario', 'Supervisor', 'Auditor'];

export const TIPOS_BENEFICIARIO = [
  'Todos los beneficiarios',
  'Beneficiario titular',
  'Beneficiario dependiente',
];

export const NIVELES_OPTS = ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Libre'];

export const NIVEL_COLORS: Record<string, string> = {
  'Nivel 1': '#39A900',
  'Nivel 2': '#3b82f6',
  'Nivel 3': '#ec4899',
  'Nivel 4': '#f97316',
  'Libre': '#06b6d4',
};

export function nivelColor(n: string) {
  return NIVEL_COLORS[n] ?? '#94a3b8';
}

/* ─── Avatar helpers ───────────────────────────────────── */
const AVATAR_COLORS = [
  '#4f86c6', '#6c6ea0', '#5a9e7a', '#c07850', '#9b5c8f',
  '#4a8fa8', '#7a7a9d', '#c06070',
];

export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
