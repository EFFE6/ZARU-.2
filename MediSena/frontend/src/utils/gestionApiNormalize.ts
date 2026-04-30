/**
 * Normaliza respuestas del backend (array plano, { data }, { success, data }).
 * Mapea filas API a las formas usadas por la vista de gestión.
 */

export function unwrapList(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== 'object') return [];
  const o = payload as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.rows)) return o.rows;
  if (o.success === true && Array.isArray(o.data)) return o.data;
  return [];
}

export function formatDateEs(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCop(value: unknown): string {
  const raw = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  if (Number.isNaN(raw) || raw === 0) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(raw);
}

export function nivelEtiqueta(api: string | number | null | undefined): string {
  const raw = String(api ?? '').trim();
  if (!raw) return '—';
  const low = raw.toLowerCase();
  if (low === 'libre' || low.includes('libre')) return 'Libre';
  if (/^nivel\s*\d/i.test(raw)) return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/\s+/g, ' ');
  if (/^\d+$/.test(raw)) return `Nivel ${raw}`;
  return raw;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts[0]) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export interface MaestraResolucion {
  id: string | number;
  numero: string;
  fecha: string;
  descripcion: string;
  estado: string;
  vigencia: string;
}

export function mapResolucion(row: Record<string, unknown>): MaestraResolucion {
  const id =
    row.id ??
    `${row.codigo_resolucion ?? row.CODIGO_RES ?? ''}_${row.vigencia_resolucion ?? row.VIGENCIA_RES ?? ''}`;
  const numero = String(row.numero_resolucion ?? row.codigo_resolucion ?? row.CODIGO_RES ?? '');
  const fi = String(row.fecha_inicio ?? row.fecha_resolucion ?? row.FECHA_INICIO_RES ?? '');
  const ft = String(row.fecha_terminacion ?? row.fecha_fin ?? row.FECHA_TERMINACION_RES ?? '');
  const vigenciaDisp =
    fi && ft ? `${fi} - ${ft}` : String(row.vigencia ?? row.vigencia_resolucion ?? row.VIGENCIA_RES ?? '');
  const estadoRaw = String(row.estado_resolucion ?? row.ESTADO_RES ?? '').toUpperCase();
  const vig =
    row.vigente === true ||
    estadoRaw === 'A' ||
    estadoRaw === 'S' ||
    estadoRaw === '1' ||
    String(row.estado_nombre ?? '').toLowerCase() === 'activa';
  const estado = vig ? 'Vigente' : 'Vencido';
  return {
    id: id as string | number,
    numero,
    fecha: fi || '—',
    descripcion: String(row.descripcion ?? ''),
    estado,
    vigencia: vigenciaDisp || '—',
  };
}

export interface MaestraUsuario {
  id: string | number;
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

export function mapUsuario(row: Record<string, unknown>): MaestraUsuario {
  const email = String(row.email ?? '');
  const id = row.id ?? email;
  const nombre = String(row.nombresCompletos ?? row.nombreCompleto ?? email);
  const rolRaw = String(row.rol ?? 'USER').toUpperCase();
  let rol = 'Usuario';
  if (['ADMIN', 'SUPER', 'SUPER_ADMIN', 'ROOT'].includes(rolRaw)) rol = 'Administrador';
  else if (rolRaw === 'AUDITOR') rol = 'Auditor';
  else if (rolRaw === 'SUPERVISOR') rol = 'Supervisor';
  const regional = String(row.regional ?? row.codRegional ?? '');
  const ua = formatDateEs(String(row.ultimoAcceso ?? ''));
  const activo = Boolean(row.activo);
  return {
    id: id as string | number,
    nombre,
    username: String(row.nombreUsuario ?? email.split('@')[0] ?? ''),
    rol,
    email,
    regional,
    ultimoAcceso: ua,
    activo,
    tipoUsuario: String(row.codTipoUsuario ?? ''),
    fechaCreacion: formatDateEs(String(row.fechaCreacion ?? '')),
    fechaModificacion: formatDateEs(String(row.fechaModificacion ?? '')),
    codigoDependencia: String(row.codDependencia ?? ''),
    telefono: String(row.telefono ?? row.extension ?? ''),
    avatarInitials: initialsFromName(nombre),
  };
}

export interface MaestraNivel {
  id: string | number;
  tipoBeneficiario: string;
  nivel: string;
  topeMaximo: string;
  descripcion: string;
  periodo: string;
  estado: string;
}

export function mapNivel(row: Record<string, unknown>, index: number): MaestraNivel {
  const id = row.id ?? row.codigo ?? index;
  const nombreNivel = nivelEtiqueta(String(row.nombre ?? ''));
  const vt = row.valor_tope;
  const cop = formatCop(vt);
  const topeMaximo = cop === '—' ? 'Sin tope' : cop;
  const vigente = row.vigente !== false;
  const desc = String(row.descripcion ?? '').trim();
  return {
    id: id as string | number,
    tipoBeneficiario: 'Todos los beneficiarios',
    nivel: nombreNivel,
    topeMaximo,
    descripcion: desc || `${String(row.nombre ?? '')} — nivel de atención`,
    periodo: row.vigencia != null && row.vigencia !== '' ? String(row.vigencia) : '—',
    estado: vigente ? 'Vigente' : 'Vencido',
  };
}

export interface MaestraTope {
  id: string | number;
  codigo: string | number;
  grupo: string;
  nivel: string;
  vigencia: string;
  valorPromedio: string;
  resolucion: string;
  estado: string;
}

export function mapTope(row: Record<string, unknown>): MaestraTope {
  const codigo = row.codigo ?? 0;
  const a = Number(row.valorNormalCatA) || 0;
  const b = Number(row.valorNormalCatB) || 0;
  const c = Number(row.valorNormalCatC) || 0;
  const d = Number(row.valorNormalCatD) || 0;
  const vals = [a, b, c, d].filter((v) => v > 0);
  const valorPromedio =
    vals.length === 0 ? 'Sin tope' : formatCop(vals.reduce((s, v) => s + v, 0) / vals.length);
  return {
    id: String(row.id ?? `${codigo}_${row.vigencia ?? ''}`),
    codigo: typeof codigo === 'number' ? codigo : String(codigo),
    grupo: String(row.nombre ?? ''),
    nivel: nivelEtiqueta(String(row.nivel ?? '')),
    vigencia: String(row.vigencia ?? ''),
    valorPromedio,
    resolucion: String(row.codigo_resolucion ?? row.resolucion ?? ''),
    estado: 'Vigente',
  };
}

export interface MaestraParentesco {
  id: string | number;
  orden: number;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export function mapParentesco(row: Record<string, unknown>, index: number): MaestraParentesco {
  return {
    id: (row.id ?? row.codigo ?? index) as string | number,
    orden: index + 1,
    nombre: String(row.nombre ?? row.descripcion ?? ''),
    tipo: row.nacional === false ? 'Regional' : 'Nacional',
    activo: row.activo !== false,
  };
}

export interface VigenciaGestionRow {
  id: string;
  vigencia: string;
  regionalLabel: string;
  resolucion: string;
  estadoNombre: string;
  smlvLabel: string;
}

export function mapVigencia(row: Record<string, unknown>): VigenciaGestionRow {
  return {
    id: String(row.id ?? ''),
    vigencia: String(row.vigencia ?? row.anio ?? row.año ?? ''),
    regionalLabel: String(row.regionalNombre ?? row.regional ?? ''),
    resolucion: String(row.resolucion ?? ''),
    estadoNombre: String(row.estado_nombre ?? ''),
    smlvLabel: formatCop(row.smlv),
  };
}

export interface ParametroGestionRow {
  id: string;
  vigencia: string;
  regional: string;
  razonSocial: string;
  resolucion: string;
  smlv: string;
}

export function mapParametro(row: Record<string, unknown>): ParametroGestionRow {
  return {
    id: String(row.id ?? ''),
    vigencia: String(row.vigencia ?? ''),
    regional: String(row.regionalNombre ?? row.regional ?? ''),
    razonSocial: String(row.razonSocial ?? ''),
    resolucion: String(row.resolucion ?? ''),
    smlv: formatCop(row.smlv),
  };
}

export interface SubEspGestionRow {
  id: string;
  nombre: string;
  regional: string;
  nit: string;
  medicamentos: string;
}

export function mapSubEspecialidad(row: Record<string, unknown>): SubEspGestionRow {
  return {
    id: String(row.id ?? ''),
    nombre: String(row.nombre ?? ''),
    regional: String(row.regional ?? row.regionalCodigo ?? ''),
    nit: String(row.nitAdscrito ?? ''),
    medicamentos: String(row.medicamentosTexto ?? (row.medicamentos ? 'Sí' : 'No')),
  };
}
