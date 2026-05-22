import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './advisor.css';
import logoMenu from '../../assets/logo menu.png';
import monograma from '../../assets/monograma.png';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../hooks/useTheme';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { CountUp } from '../../components/ui/CountUp';
import  DiagnosticoForm  from './DiagnosticoForm';


const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';
const IS_LOCAL_API = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(API_BASE_URL);
const IS_PRODUCTION_HOST = typeof window !== 'undefined'
  && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
const API_NOT_CONFIGURED = IS_LOCAL_API && IS_PRODUCTION_HOST;
const ADMIN_TOKEN_KEY = 'diazlara_advisor_token';

type View = 'leads' | 'clientes_consultor' | 'agregar_cliente' | 'historico_clientes' | 'consultores' | 'registrar' | 'cuenta';

const formatSessionDate = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' });
  } catch { return iso; }
};
type LeadEstado = 'pendiente' | 'aprobado' | 'sesion_agendada' | 'rechazado';
type EstatusComercial = 'interesado' | 'prospecto' | 'cliente';

const ESTADO_LABELS: Record<LeadEstado, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  sesion_agendada: 'Sesión agendada',
  rechazado: 'Rechazado',
};

const ESTATUS_COLORS: Record<EstatusComercial, string> = {
  interesado: 'badge-interesado',
  prospecto: 'badge-prospecto',
  cliente: 'badge-cliente',
};

type ConsultorProfile = {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  especialidad?: string;
  rol?: 'consultant' | 'super_admin';
  activo?: boolean;
};

type LeadRecord = {
  id: string;
  nombre: string;
  email: string;
  telefono_whatsapp?: string;
  empresa?: string;
  puesto?: string;
  servicios?: string[] | string;
  estado: LeadEstado;
  estatus_comercial: EstatusComercial;
  consultor_id?: string | null;
  created_at: string;
  meet_link?: string;
  // Cita info (when sesion_agendada)
  cita_id?: string | null;
  cita_fecha_hora_inicio?: string | null;
  cita_fecha_hora_fin?: string | null;
  cita_meet_link?: string | null;
  cita_estado?: string | null;
  cita_notas_cliente?: string | null;
  consultor_nombre?: string | null;
  consultor_apellido?: string | null;
  consultor_email?: string | null;
};

type ManualClientRecord = {
  id: string;
  consultor_id: string;
  no_cliente?: string | null;
  nombre: string;
  apellido?: string | null;
  email: string;
  telefono_whatsapp?: string | null;
  empresa?: string | null;
  asesor_comercial?: string | null;
  evento_previo?: string | null;
  puesto?: string | null;
  servicios?: string[] | string | null;
  fuente_registro?: string | null;
  fecha_registro?: string | null;
  importe_total?: string | number | null;
  ene?: string | number | null;
  feb?: string | number | null;
  mar?: string | number | null;
  abr?: string | number | null;
  may?: string | number | null;
  jun?: string | number | null;
  jul?: string | number | null;
  ago?: string | number | null;
  sep?: string | number | null;
  oct?: string | number | null;
  nov?: string | number | null;
  dic?: string | number | null;
  saldo?: string | number | null;
  expediente?: string | null;
  fecha_sesion_1?: string | null;
  fecha_sesion_2?: string | null;
  observaciones?: string | null;
  comentarios?: string | null;
  benchmark?: string | null;
  revision_financiera?: string | null;
  minuta?: string | null;
  candidato?: string | null;
  ct?: string | null;
  comentarios_ct?: string | null;
  status?: string | null;
  factura_1?: string | null;
  factura_2?: string | null;
  estatus_comercial?: EstatusComercial | string | null;
  notas?: string | null;
  created_at?: string | null;
  consultor_nombre?: string | null;
  consultor_apellido?: string | null;
  consultor_email?: string | null;
};

type ClientFileRecord = {
  id: string;
  cliente_manual_id: string;
  campo?: string | null;
  nombre_original: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
};

type ClientEditDraft = {
  no_cliente: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono_whatsapp: string;
  empresa: string;
  asesor_comercial: string;
  evento_previo: string;
  puesto: string;
  servicios: string;
  fuente_registro: string;
  fecha_registro: string;
  importe_total: string;
  ene: string;
  feb: string;
  mar: string;
  abr: string;
  may: string;
  jun: string;
  jul: string;
  ago: string;
  sep: string;
  oct: string;
  nov: string;
  dic: string;
  saldo: string;
  expediente: string;
  fecha_sesion_1: string;
  fecha_sesion_2: string;
  observaciones: string;
  comentarios: string;
  benchmark: string;
  revision_financiera: string;
  minuta: string;
  candidato: string;
  ct: string;
  comentarios_ct: string;
  status: string;
  factura_1: string;
  factura_2: string;
  estatus_comercial: string;
  notas: string;
  consultor_id: string;
};

type HistoryRecord = {
  id: string;
  no_cliente?: string | null;
  lead_id?: string | null;
  cliente_id?: string | null;
  cliente_manual_id?: string | null;
  consultor_id?: string | null;
  tipo_origen?: string | null;
  fuente_registro?: string | null;
  fecha_registro?: string | null;
  nombre: string;
  apellido?: string | null;
  email: string;
  telefono_whatsapp?: string | null;
  empresa?: string | null;
  asesor_comercial?: string | null;
  evento_previo?: string | null;
  puesto?: string | null;
  servicios?: string[] | string | null;
  importe_total?: string | number | null;
  ene?: string | number | null;
  feb?: string | number | null;
  mar?: string | number | null;
  abr?: string | number | null;
  may?: string | number | null;
  jun?: string | number | null;
  jul?: string | number | null;
  ago?: string | number | null;
  sep?: string | number | null;
  oct?: string | number | null;
  nov?: string | number | null;
  dic?: string | number | null;
  saldo?: string | number | null;
  expediente?: string | null;
  fecha_sesion_1?: string | null;
  fecha_sesion_2?: string | null;
  observaciones?: string | null;
  comentarios?: string | null;
  benchmark?: string | null;
  revision_financiera?: string | null;
  minuta?: string | null;
  candidato?: string | null;
  ct?: string | null;
  comentarios_ct?: string | null;
  status?: string | null;
  factura_1?: string | null;
  factura_2?: string | null;
  etiqueta?: string | null;
  motivo?: string | null;
  estado_lead?: string | null;
  estado_cita?: string | null;
  estatus_comercial?: string | null;
  meet_link?: string | null;
  fecha_hora_inicio?: string | null;
  fecha_hora_fin?: string | null;
  archived_at?: string | null;
};

type ScheduleDraft = {
  fecha_hora_inicio: string;
  duracion: number;
  estatus_comercial: EstatusComercial;
  notas_cliente: string;
};

const defaultScheduleDraft = (): ScheduleDraft => ({
  fecha_hora_inicio: '',
  duracion: 30,
  estatus_comercial: 'prospecto',
  notas_cliente: '',
});

const getAdminUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${path}`;

const toSafeText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const parseServicios = (servicios: string[] | string | null | undefined) => {
  if (Array.isArray(servicios)) {
    return servicios.map(toSafeText).filter(Boolean);
  }

  if (typeof servicios === 'string') {
    try {
      const parsed = JSON.parse(servicios);
      return Array.isArray(parsed) ? parsed.map(String) : [servicios];
    } catch {
      return [servicios];
    }
  }

  return [];
};

const toFormValue = (value: unknown) => toSafeText(value);

const toDateInputValue = (value: unknown) => {
  const raw = toFormValue(value);
  if (!raw) return '';
  return raw.slice(0, 10);
};

const createEmptyClientDraft = (): ClientEditDraft => ({
  no_cliente: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono_whatsapp: '',
  empresa: '',
  asesor_comercial: '',
  evento_previo: '',
  puesto: '',
  servicios: '',
  fuente_registro: 'manual_consultor',
  fecha_registro: new Date().toISOString().slice(0, 10),
  importe_total: '',
  ene: '',
  feb: '',
  mar: '',
  abr: '',
  may: '',
  jun: '',
  jul: '',
  ago: '',
  sep: '',
  oct: '',
  nov: '',
  dic: '',
  saldo: '',
  expediente: '',
  fecha_sesion_1: '',
  fecha_sesion_2: '',
  observaciones: '',
  comentarios: '',
  benchmark: '',
  revision_financiera: '',
  minuta: '',
  candidato: '',
  ct: '',
  comentarios_ct: '',
  status: '',
  factura_1: '',
  factura_2: '',
  estatus_comercial: 'cliente',
  notas: '',
  consultor_id: '',
});

const createClientEditDraft = (client: ManualClientRecord): ClientEditDraft => ({
  no_cliente: toFormValue(client.no_cliente),
  nombre: toFormValue(client.nombre),
  apellido: toFormValue(client.apellido),
  email: toFormValue(client.email),
  telefono_whatsapp: toFormValue(client.telefono_whatsapp),
  empresa: toFormValue(client.empresa),
  asesor_comercial: toFormValue(client.asesor_comercial),
  evento_previo: toFormValue(client.evento_previo),
  puesto: toFormValue(client.puesto),
  servicios: parseServicios(client.servicios).join(', '),
  fuente_registro: toFormValue(client.fuente_registro) || 'manual_consultor',
  fecha_registro: toDateInputValue(client.fecha_registro || client.created_at),
  importe_total: toFormValue(client.importe_total),
  ene: toFormValue(client.ene),
  feb: toFormValue(client.feb),
  mar: toFormValue(client.mar),
  abr: toFormValue(client.abr),
  may: toFormValue(client.may),
  jun: toFormValue(client.jun),
  jul: toFormValue(client.jul),
  ago: toFormValue(client.ago),
  sep: toFormValue(client.sep),
  oct: toFormValue(client.oct),
  nov: toFormValue(client.nov),
  dic: toFormValue(client.dic),
  saldo: toFormValue(client.saldo),
  expediente: toFormValue(client.expediente),
  fecha_sesion_1: toDateInputValue(client.fecha_sesion_1),
  fecha_sesion_2: toDateInputValue(client.fecha_sesion_2),
  observaciones: toFormValue(client.observaciones),
  comentarios: toFormValue(client.comentarios),
  benchmark: toFormValue(client.benchmark),
  revision_financiera: toFormValue(client.revision_financiera),
  minuta: toFormValue(client.minuta),
  candidato: toFormValue(client.candidato),
  ct: toFormValue(client.ct),
  comentarios_ct: toFormValue(client.comentarios_ct),
  status: toFormValue(client.status),
  factura_1: toFormValue(client.factura_1),
  factura_2: toFormValue(client.factura_2),
  estatus_comercial: toFormValue(client.estatus_comercial) || 'cliente',
  notas: toFormValue(client.notas),
  consultor_id: toFormValue(client.consultor_id),
});

const createHistoryClientDraft = (item: HistoryRecord): ClientEditDraft => ({
  no_cliente: toFormValue(item.no_cliente),
  nombre: toFormValue(item.nombre),
  apellido: toFormValue(item.apellido),
  email: toFormValue(item.email),
  telefono_whatsapp: toFormValue(item.telefono_whatsapp),
  empresa: toFormValue(item.empresa),
  asesor_comercial: toFormValue(item.asesor_comercial),
  evento_previo: toFormValue(item.evento_previo),
  puesto: toFormValue(item.puesto),
  servicios: parseServicios(item.servicios).join(', '),
  fuente_registro: toFormValue(item.fuente_registro || item.tipo_origen),
  fecha_registro: toDateInputValue(item.fecha_registro || item.archived_at),
  importe_total: toFormValue(item.importe_total),
  ene: toFormValue(item.ene),
  feb: toFormValue(item.feb),
  mar: toFormValue(item.mar),
  abr: toFormValue(item.abr),
  may: toFormValue(item.may),
  jun: toFormValue(item.jun),
  jul: toFormValue(item.jul),
  ago: toFormValue(item.ago),
  sep: toFormValue(item.sep),
  oct: toFormValue(item.oct),
  nov: toFormValue(item.nov),
  dic: toFormValue(item.dic),
  saldo: toFormValue(item.saldo),
  expediente: toFormValue(item.expediente),
  fecha_sesion_1: toDateInputValue(item.fecha_sesion_1),
  fecha_sesion_2: toDateInputValue(item.fecha_sesion_2),
  observaciones: toFormValue(item.observaciones),
  comentarios: toFormValue(item.comentarios || item.motivo),
  benchmark: toFormValue(item.benchmark),
  revision_financiera: toFormValue(item.revision_financiera),
  minuta: toFormValue(item.minuta),
  candidato: toFormValue(item.candidato),
  ct: toFormValue(item.ct),
  comentarios_ct: toFormValue(item.comentarios_ct),
  status: toFormValue(item.status || item.etiqueta || item.estado_lead),
  factura_1: toFormValue(item.factura_1),
  factura_2: toFormValue(item.factura_2),
  estatus_comercial: toFormValue(item.estatus_comercial || item.estado_lead),
  notas: toFormValue(item.motivo),
  consultor_id: toFormValue(item.consultor_id),
});

const getInitials = (name?: string | null, lastName?: string | null) => {
  const safeName = toSafeText(name);
  const safeLastName = toSafeText(lastName);
  const a = (safeName.trim()?.[0] || '').toUpperCase();
  const b = (safeLastName.trim()?.[0] || safeName.trim()?.split(/\s+/)[1]?.[0] || '').toUpperCase();
  return (a + b) || '?';
};

const formatHistoryTag = (tag?: unknown) => {
  const safeTag = toSafeText(tag);
  if (!safeTag) return '';
  return safeTag.replace(/_/g, ' ').replace(/^cliente\s+/i, '').trim();
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getHistoryRestoreId = (history: HistoryRecord) => history.cliente_manual_id || history.cliente_id || '';

const AdvisorPortal = () => {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();

  // Auth
  const [email, setEmail] = useState('contacto@diazlara.mx');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => window.localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [profile, setProfile] = useState<ConsultorProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Leads UX v2
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsInitiallyLoaded, setLeadsInitiallyLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LeadRecord | null>(null);
  const [confirmConvertLead, setConfirmConvertLead] = useState<LeadRecord | null>(null);
  const [confirmDeleteConsultor, setConfirmDeleteConsultor] = useState<ConsultorProfile | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeadRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [consultoresSearch, setConsultoresSearch] = useState('');
  const [consultoresInitiallyLoaded, setConsultoresInitiallyLoaded] = useState(false);
  const [clientsSearch, setClientsSearch] = useState('');
  const [clientsInitiallyLoaded, setClientsInitiallyLoaded] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyInitiallyLoaded, setHistoryInitiallyLoaded] = useState(false);
  const [clientStatusFilter, setClientStatusFilter] = useState('');
  const [clientServiceFilter, setClientServiceFilter] = useState('');
  const [historyTagFilter, setHistoryTagFilter] = useState('');
  const [historyOriginFilter, setHistoryOriginFilter] = useState('');
  const [historyServiceFilter, setHistoryServiceFilter] = useState('');
  const [clientsFilterOpen, setClientsFilterOpen] = useState(false);
  const [historyFilterOpen, setHistoryFilterOpen] = useState(false);
  const [confirmArchiveClient, setConfirmArchiveClient] = useState<ManualClientRecord | null>(null);
  const [confirmRestoreHistory, setConfirmRestoreHistory] = useState<HistoryRecord | null>(null);
  const [selectedClient, setSelectedClient] = useState<ManualClientRecord | null>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [editClientDraft, setEditClientDraft] = useState<ClientEditDraft | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Navigation
  const [view, setView] = useState<View>('leads');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const clientsFilterRef = useRef<HTMLDivElement | null>(null);
  const historyFilterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!clientsFilterOpen && !historyFilterOpen) return;
    const handler = (e: MouseEvent) => {
      if (clientsFilterOpen && clientsFilterRef.current && !clientsFilterRef.current.contains(e.target as Node)) {
        setClientsFilterOpen(false);
      }
      if (historyFilterOpen && historyFilterRef.current && !historyFilterRef.current.contains(e.target as Node)) {
        setHistoryFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [clientsFilterOpen, historyFilterOpen]);

  // Leads
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [activeEstado, setActiveEstado] = useState<LeadEstado>('pendiente');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, ScheduleDraft>>({});
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({});

  // Consultores
  const [consultores, setConsultores] = useState<ConsultorProfile[]>([]);
  const [consultoresError, setConsultoresError] = useState<string | null>(null);

  // Manual clients
  const [manualClients, setManualClients] = useState<ManualClientRecord[]>([]);
  const [manualClientsError, setManualClientsError] = useState<string | null>(null);

  // Client history
  const [clientHistory, setClientHistory] = useState<HistoryRecord[]>([]);
  const [clientHistoryError, setClientHistoryError] = useState<string | null>(null);

  // Stats
  const [leadStats, setLeadStats] = useState<Record<LeadEstado, number>>({
    pendiente: 0,
    aprobado: 0,
    sesion_agendada: 0,
    rechazado: 0,
  });

  // Register new consultor
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRol, setRegRol] = useState<'consultant' | 'super_admin'>('consultant');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Register manual client
  const [clientError, setClientError] = useState<string | null>(null);
  const [clientSuccess, setClientSuccess] = useState<string | null>(null);
  const [newClientDraft, setNewClientDraft] = useState<ClientEditDraft>(() => createEmptyClientDraft());
  const [newClientFiles, setNewClientFiles] = useState<FileList | null>(null);
  const [newClientFileCampo, setNewClientFileCampo] = useState('archivos_extras');
  const [clientFiles, setClientFiles] = useState<ClientFileRecord[]>([]);
  const [clientFilesError, setClientFilesError] = useState<string | null>(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<FileList | null>(null);
  const [uploadCampo, setUploadCampo] = useState('archivos_extras');

  // Change password
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : undefined;
  const authOnlyHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  const isSuperAdmin = profile?.rol === 'super_admin';

  // ── Loaders ────────────────────────────────────────────────
  const loadProfile = async (nextToken: string) => {
    const res = await fetch(getAdminUrl('/api/admin/profile'), {
      headers: { Authorization: `Bearer ${nextToken}` },
    });
    if (!res.ok) throw new Error('No fue posible cargar el perfil.');
    const payload = await res.json();
    setProfile(payload.data);
  };

  const loadLeads = async (nextToken = token, estado = activeEstado) => {
    if (!nextToken) return;
    setLeadError(null);
    const res = await fetch(
      getAdminUrl(`/api/admin/leads-espera?estado=${estado}&limit=50`),
      { headers: { Authorization: `Bearer ${nextToken}` } }
    );
    if (!res.ok) throw new Error('No fue posible cargar los leads.');
    const payload = await res.json();
    setLeads(Array.isArray(payload.data) ? payload.data : []);
    setLeadsInitiallyLoaded(true);
  };

  const loadStats = async (nextToken = token) => {
    if (!nextToken) return;
    const estados: LeadEstado[] = ['pendiente', 'aprobado', 'sesion_agendada', 'rechazado'];
    try {
      const results = await Promise.all(
        estados.map((e) =>
          fetch(getAdminUrl(`/api/admin/leads-espera?estado=${e}&limit=200`), {
            headers: { Authorization: `Bearer ${nextToken}` },
          })
            .then((r) => (r.ok ? r.json() : { data: [] }))
            .then((p) => (Array.isArray(p?.data) ? p.data.length : 0))
            .catch(() => 0)
        )
      );
      setLeadStats({
        pendiente: results[0],
        aprobado: results[1],
        sesion_agendada: results[2],
        rechazado: results[3],
      });
    } catch {
      /* ignore */
    }
  };

  const loadConsultores = async () => {
    if (!authHeaders) return;
    setConsultoresError(null);
    try {
      const res = await fetch(getAdminUrl('/api/admin/consultores'), { headers: authHeaders });
      if (!res.ok) { setConsultoresError('No fue posible cargar los consultores.'); return; }
      const payload = await res.json();
      setConsultores(Array.isArray(payload.data) ? payload.data : []);
      setConsultoresInitiallyLoaded(true);
    } catch {
      setConsultoresError('Error de conexión al cargar los consultores.');
    }
  };

  const loadManualClients = async () => {
    if (!authHeaders) return;
    setManualClientsError(null);
    try {
      const res = await fetch(getAdminUrl('/api/admin/clientes-consultor?limit=100'), { headers: authHeaders });
      if (!res.ok) { setManualClientsError('No fue posible cargar los clientes.'); return; }
      const payload = await res.json();
      setManualClients(Array.isArray(payload.data) ? payload.data : []);
      setClientsInitiallyLoaded(true);
    } catch {
      setManualClientsError('Error de conexión al cargar los clientes.');
    }
  };

  const loadClientHistory = async () => {
    if (!authHeaders) return;
    setClientHistoryError(null);
    try {
      const res = await fetch(getAdminUrl('/api/admin/historico-clientes?limit=100'), { headers: authHeaders });
      if (!res.ok) { setClientHistoryError('No fue posible cargar el historico.'); return; }
      const payload = await res.json();
      setClientHistory(Array.isArray(payload.data) ? payload.data : []);
      setHistoryInitiallyLoaded(true);
    } catch {
      setClientHistoryError('Error de conexión al cargar el historico.');
    }
  };


  const loadClientFiles = async (clientId: string) => {
    if (!authHeaders) return;
    setFilesLoading(true);
    setClientFilesError(null);
    try {
      const res = await fetch(getAdminUrl(`/api/admin/clientes-consultor/${clientId}/archivos`), { headers: authHeaders });
      if (!res.ok) throw new Error('No fue posible cargar los archivos.');
      const payload = await res.json();
      setClientFiles(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No fue posible cargar los archivos.';
      setClientFilesError(msg);
    } finally {
      setFilesLoading(false);
    }
  };

  const uploadClientFiles = async (clientId: string, files: FileList | null, campo: string) => {
    if (!authOnlyHeaders || !files?.length) return [];
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('archivo', file));
    formData.append('campo', campo.trim() || 'archivos_extras');
    const res = await fetch(getAdminUrl(`/api/admin/clientes-consultor/${clientId}/archivos`), {
      method: 'POST',
      headers: authOnlyHeaders,
      body: formData,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible subir los archivos.');
    return Array.isArray(payload?.data) ? payload.data : [];
  };

  // ── Bootstrap ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const bootstrap = async () => {
      try {
        setLoading(true);
        await loadProfile(token);
        if (!cancelled) await loadLeads(token, activeEstado);
        if (!cancelled) loadStats(token);
      } catch {
        if (!cancelled) {
          setToken('');
          setProfile(null);
          window.localStorage.removeItem(ADMIN_TOKEN_KEY);
          setLoginError('Tu sesión expiró. Vuelve a iniciar sesión.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token || !profile) return;
    loadLeads(token, activeEstado).catch(() => setLeadError('No fue posible actualizar los leads.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEstado]);

  useEffect(() => {
    if (view === 'consultores' && token && isSuperAdmin) loadConsultores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isSuperAdmin]);

  useEffect(() => {
    if (view === 'clientes_consultor' && token) loadManualClients();
    if (view === 'historico_clientes' && token) loadClientHistory();
    if (view === 'agregar_cliente' && token && isSuperAdmin && !consultoresInitiallyLoaded) loadConsultores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isSuperAdmin]);

  useEffect(() => {
    if (profile && !isSuperAdmin && (view === 'consultores' || view === 'registrar')) {
      setView('leads');
    }
  }, [profile, isSuperAdmin, view]);

  // ── Auth handlers ──────────────────────────────────────────
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    try {
      setLoading(true);
      const res = await fetch(getAdminUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.token) throw new Error(payload?.error || 'Credenciales inválidas.');
      window.localStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
      setToken(payload.token);
      setPassword('');
      setProfile(payload.consultor ?? null);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setProfile(null);
    setLeads([]);
    setConsultores([]);
    setManualClients([]);
    setClientHistory([]);
    setSelectedClient(null);
    setExpandedClientId(null);
    setSelectedHistory(null);
    setExpandedHistoryId(null);
    setExpandedLeadId(null);
    setLeadError(null);
    setManualClientsError(null);
    setClientHistoryError(null);
  };

  // ── Lead actions ───────────────────────────────────────────
  const runLeadAction = async (action: () => Promise<void>) => {
    try {
      setLeadError(null);
      setLoadingAction(true);
      await action();
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'No fue posible completar la acción.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprove = async (leadId: string) => {
    if (!profile || !authHeaders) return;
    const res = await fetch(getAdminUrl(`/api/admin/leads-espera/${leadId}/aprobar`), {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ consultorId: profile.id }),
    });
    if (!res.ok) throw new Error('No fue posible aprobar el lead.');
    await loadLeads();
  };

  const handleReject = async (leadId: string, motivo: string) => {
    if (!authHeaders) return;
    const res = await fetch(getAdminUrl(`/api/admin/leads-espera/${leadId}/rechazar`), {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ motivo, guardar_historico: true, etiqueta: 'lead_rechazado' }),
    });
    if (!res.ok) throw new Error('No fue posible rechazar el lead.');
    toast.success('Lead rechazado.');
    await loadLeads();
    await loadStats();
  };

  const confirmRejectLead = () => {
    if (!rejectTarget) return;
    const target = rejectTarget;
    const motivo = rejectReason.trim();
    setRejectTarget(null);
    setRejectReason('');
    runLeadAction(() => handleReject(target.id, motivo));
  };

  const buildClientPayloadFromLead = (lead: LeadRecord) => ({
    nombre: toSafeText(lead.nombre).trim(),
    email: toSafeText(lead.email).trim(),
    telefono_whatsapp: toSafeText(lead.telefono_whatsapp).trim() || undefined,
    empresa: toSafeText(lead.empresa).trim() || undefined,
    puesto: toSafeText(lead.puesto).trim() || undefined,
    servicios: parseServicios(lead.servicios),
    fuente_registro: 'lead_organico',
    fecha_registro: toDateInputValue(lead.created_at) || new Date().toISOString().slice(0, 10),
    estatus_comercial: 'cliente',
    consultor_id: lead.consultor_id || profile?.id || undefined,
    notas: [
      `Cliente convertido desde lead organico ${lead.id}.`,
      lead.cita_meet_link || lead.meet_link ? `Meet: ${lead.cita_meet_link || lead.meet_link}` : '',
      lead.cita_notas_cliente ? `Notas de cita: ${lead.cita_notas_cliente}` : '',
    ].filter(Boolean).join('\n'),
  });

  const archiveLeadForHistory = async (lead: LeadRecord, etiqueta: string, motivo?: string) => {
    if (!authHeaders) return false;
    const body = JSON.stringify({
      etiqueta,
      motivo,
      guardar_historico: true,
      tipo_origen: 'lead_organico',
      fuente_registro: 'lead_organico',
    });

    const archiveAttempts = [
      { path: `/api/admin/leads-espera/${lead.id}/archivar`, method: 'PATCH' },
      { path: `/api/admin/leads-espera/${lead.id}/historico`, method: 'POST' },
      { path: `/api/admin/leads-espera/${lead.id}`, method: 'DELETE' },
    ];

    for (const attempt of archiveAttempts) {
      const res = await fetch(getAdminUrl(attempt.path), {
        method: attempt.method,
        headers: authHeaders,
        body,
      });
      if (res.ok) return true;
      if (res.status !== 404 && res.status !== 405) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message || payload?.error || 'No fue posible guardar el lead en historico.');
      }
    }

    return false;
  };

  const handleConvertLeadToClient = async (lead: LeadRecord) => {
    if (!authHeaders) return;
    try {
      setLoadingAction(true);
      setLeadError(null);

      let convertedByBackend = false;
      const convertBody = JSON.stringify({ consultor_id: lead.consultor_id || profile?.id, guardar_historico: true });
      let convertRes = await fetch(getAdminUrl(`/api/admin/leads-espera/${lead.id}/convertir-cliente`), {
        method: 'POST',
        headers: authHeaders,
        body: convertBody,
      });

      if (convertRes.status === 404 || convertRes.status === 405) {
        convertRes = await fetch(getAdminUrl(`/api/admin/leads-espera/${lead.id}/pasar-a-cliente`), {
          method: 'POST',
          headers: authHeaders,
          body: convertBody,
        });
      }

      if (convertRes.ok) {
        convertedByBackend = true;
      } else if (convertRes.status !== 404 && convertRes.status !== 405) {
        const payload = await convertRes.json().catch(() => null);
        throw new Error(payload?.error?.message || payload?.error || 'No fue posible pasar el lead a cliente.');
      }

      if (!convertedByBackend) {
        const createRes = await fetch(getAdminUrl('/api/admin/clientes-consultor'), {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(buildClientPayloadFromLead(lead)),
        });
        const createPayload = await createRes.json().catch(() => null);
        if (!createRes.ok) throw new Error(createPayload?.error?.message || createPayload?.error || 'No fue posible crear el cliente desde el lead.');
        await archiveLeadForHistory(lead, 'lead_convertido_cliente', 'Lead organico convertido a cliente.');
      }

      toast.success(`Lead "${lead.nombre}" pasado a clientes.`);
      await loadLeads();
      await loadStats();
      await loadManualClients();
      if (historyInitiallyLoaded) await loadClientHistory();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al pasar lead a cliente.';
      setLeadError(msg);
      toast.error(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleScheduleLead = async (leadId: string) => {
    if (!profile || !authHeaders) return;
    const draft = scheduleDrafts[leadId] || defaultScheduleDraft();
    setScheduleErrors((prev) => { const { [leadId]: _, ...rest } = prev; return rest; });
    if (!draft.fecha_hora_inicio) {
      setScheduleErrors((prev) => ({ ...prev, [leadId]: 'Selecciona fecha y hora para la sesión.' }));
      throw new Error('Selecciona fecha y hora para la sesión.');
    }
    const start = new Date(draft.fecha_hora_inicio);
    if (start.getTime() < Date.now() - 60_000) {
      setScheduleErrors((prev) => ({ ...prev, [leadId]: 'La fecha debe ser futura.' }));
      throw new Error('La fecha debe ser futura.');
    }
    const end = new Date(start.getTime() + draft.duracion * 60 * 1000);
    const res = await fetch(getAdminUrl(`/api/admin/leads-espera/${leadId}/asignar-sesion`), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        consultor_id: profile.id,
        fecha_hora_inicio: start.toISOString(),
        fecha_hora_fin: end.toISOString(),
        notas_cliente: draft.notas_cliente.trim() || undefined,
        estatus_comercial: draft.estatus_comercial,
      }),
    });
    if (!res.ok) {
      const errPayload = await res.json().catch(() => null);
      const detail = errPayload?.error?.message || errPayload?.message || errPayload?.error;
      if (res.status === 409) {
        throw new Error(
          detail
            ? `Conflicto de horario: ${detail}`
            : 'El consultor ya tiene una cita o un bloqueo en ese horario. Elige otra fecha/hora.'
        );
      }
      throw new Error(detail || 'No fue posible asignar la sesión.');
    }
    const payload = await res.json();
    const meetLink = payload?.data?.appointment?.meet_link;
    if (meetLink) setMeetLinks((prev) => ({ ...prev, [leadId]: meetLink }));
    toast.success('Sesión agendada e invitación enviada.');
    setExpandedLeadId(null);
    await loadLeads();
    await loadStats();
  };

  const updateScheduleDraft = (leadId: string, patch: Partial<ScheduleDraft>) => {
    setScheduleDrafts((current) => ({
      ...current,
      [leadId]: { ...(current[leadId] || defaultScheduleDraft()), ...patch },
    }));
  };

  const toggleSchedule = (leadId: string) => {
    setExpandedLeadId((current) => (current === leadId ? null : leadId));
  };

  useEffect(() => {
    if (!selectedClient) {
      setEditingClient(false);
      setEditClientDraft(null);
      setClientFiles([]);
      setSelectedUploadFiles(null);
      setUploadCampo('archivos_extras');
      return;
    }
    setEditClientDraft(createClientEditDraft(selectedClient));
    loadClientFiles(selectedClient.id);
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedHistory) return;
    setClientFiles([]);
    setClientFilesError(null);
    if (selectedHistory.cliente_manual_id) {
      loadClientFiles(selectedHistory.cliente_manual_id);
    }
  }, [selectedHistory]);

  const updateEditClientDraft = (patch: Partial<ClientEditDraft>) => {
    setEditClientDraft((current) => current ? { ...current, ...patch } : current);
  };

  const updateNewClientDraft = (patch: Partial<ClientEditDraft>) => {
    setNewClientDraft((current) => ({ ...current, ...patch }));
  };

  const buildManualClientPayload = (draft: ClientEditDraft) => {
    const servicios = draft.servicios
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      no_cliente: draft.no_cliente.trim() || undefined,
      nombre: draft.nombre.trim(),
      apellido: draft.apellido.trim() || undefined,
      email: draft.email.trim(),
      telefono_whatsapp: draft.telefono_whatsapp.trim() || undefined,
      empresa: draft.empresa.trim() || undefined,
      asesor_comercial: draft.asesor_comercial.trim() || undefined,
      evento_previo: draft.evento_previo.trim() || undefined,
      puesto: draft.puesto.trim() || undefined,
      servicios,
      fuente_registro: draft.fuente_registro.trim() || 'manual_consultor',
      fecha_registro: draft.fecha_registro || undefined,
      importe_total: draft.importe_total || undefined,
      ene: draft.ene || undefined,
      feb: draft.feb || undefined,
      mar: draft.mar || undefined,
      abr: draft.abr || undefined,
      may: draft.may || undefined,
      jun: draft.jun || undefined,
      jul: draft.jul || undefined,
      ago: draft.ago || undefined,
      sep: draft.sep || undefined,
      oct: draft.oct || undefined,
      nov: draft.nov || undefined,
      dic: draft.dic || undefined,
      saldo: draft.saldo || undefined,
      expediente: draft.expediente.trim() || undefined,
      fecha_sesion_1: draft.fecha_sesion_1 || undefined,
      fecha_sesion_2: draft.fecha_sesion_2 || undefined,
      observaciones: draft.observaciones.trim() || undefined,
      comentarios: draft.comentarios.trim() || undefined,
      benchmark: draft.benchmark.trim() || undefined,
      revision_financiera: draft.revision_financiera.trim() || undefined,
      minuta: draft.minuta.trim() || undefined,
      candidato: draft.candidato.trim() || undefined,
      ct: draft.ct.trim() || undefined,
      comentarios_ct: draft.comentarios_ct.trim() || undefined,
      status: draft.status.trim() || undefined,
      factura_1: draft.factura_1.trim() || undefined,
      factura_2: draft.factura_2.trim() || undefined,
      estatus_comercial: draft.estatus_comercial || 'cliente',
      notas: draft.notas.trim() || undefined,
      consultor_id: isSuperAdmin ? draft.consultor_id || undefined : undefined,
    };
  };

  const handleUpdateManualClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authHeaders || !selectedClient || !editClientDraft) return;
    try {
      setLoading(true);
      const res = await fetch(getAdminUrl(`/api/admin/clientes-consultor/${selectedClient.id}`), {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(buildManualClientPayload(editClientDraft)),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible actualizar el cliente.');
      const updated = payload?.data || { ...selectedClient, ...editClientDraft };
      setSelectedClient(updated);
      setManualClients((current) => current.map((client) => client.id === selectedClient.id ? updated : client));
      setEditingClient(false);
      toast.success('Cliente actualizado.');
      await loadManualClients();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar cliente.';
      toast.error(msg);
      setManualClientsError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Register consultor ─────────────────────────────────────
  const handleRegisterConsultor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    try {
      setLoading(true);
      const res = await fetch(getAdminUrl('/api/admin/consultores'), {
        method: 'POST',
        headers: authHeaders!,
        body: JSON.stringify({
          nombre: regNombre.trim(),
          apellido: regApellido.trim() || undefined,
          email: regEmail.trim(),
          password: regPassword,
          rol: regRol,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || 'No fue posible registrar el consultor.');
      const msg = `Consultor «${payload.data?.nombre}» registrado correctamente.`;
      setRegSuccess(msg);
      toast.success(msg);
      setRegNombre(''); setRegApellido(''); setRegEmail('');
      setRegPassword('');
      setRegRol('consultant');
      await loadConsultores();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar.';
      setRegError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    if (!authHeaders) return;
    try {
      const res = await fetch(getAdminUrl(`/api/admin/consultores/${id}/toggle-activo`), {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ activo }),
      });
      if (!res.ok) throw new Error('No fue posible actualizar el estado.');
      toast.success(activo ? 'Consultor activado.' : 'Consultor desactivado.');
      await loadConsultores();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar.');
    }
  };

  // ── Delete consultor ───────────────────────────────────────
  const performDeleteConsultor = async (c: ConsultorProfile) => {
    if (!authHeaders) return;
    try {
      const res = await fetch(getAdminUrl(`/api/admin/consultores/${c.id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.error?.message || p?.error || 'No fue posible eliminar el consultor.');
      }
      toast.success(`Consultor «${c.nombre}» eliminado.`);
      await loadConsultores();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar.';
      toast.error(msg);
      setConsultoresError(msg);
    }
  };

  // ── Delete lead ────────────────────────────────────────────
  const performDeleteLead = async (lead: LeadRecord) => {
    if (!authHeaders) return;
    try {
      setLoadingAction(true);
      await archiveLeadForHistory(lead, 'lead_eliminado', 'Lead enviado al historico desde el portal.');
      toast.success(`Lead "${lead.nombre}" enviado al historico.`);
      await loadLeads();
      await loadStats();
      if (historyInitiallyLoaded) await loadClientHistory();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al enviar al historico.';
      toast.error(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const resetClientForm = () => {
    setNewClientDraft(createEmptyClientDraft());
  };

  const handleCreateManualClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClientError(null);
    setClientSuccess(null);
    try {
      if (!authHeaders) return;
      setLoading(true);
      const res = await fetch(getAdminUrl('/api/admin/clientes-consultor'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(buildManualClientPayload(newClientDraft)),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible agregar el cliente.');
      const msg = `Cliente "${payload.data?.nombre || newClientDraft.nombre}" agregado correctamente.`;
      setClientSuccess(msg);
      toast.success(msg);
      if (newClientFiles?.length && payload.data?.id) {
        await uploadClientFiles(payload.data.id, newClientFiles, newClientFileCampo);
        toast.success('Archivos guardados correctamente.');
      }
      resetClientForm();
      setNewClientFiles(null);
      setNewClientFileCampo('archivos_extras');
      await loadManualClients();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al agregar cliente.';
      setClientError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClientFiles = async () => {
    if (!selectedClient) return;
    try {
      setLoading(true);
      const uploaded = await uploadClientFiles(selectedClient.id, selectedUploadFiles, uploadCampo);
      if (uploaded.length > 0) {
        setClientFiles((current) => uploaded.concat(current));
        setSelectedUploadFiles(null);
        toast.success('Archivos guardados correctamente.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al subir archivos.';
      setClientFilesError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClientFile = async (file: ClientFileRecord) => {
    const clientId = selectedClient?.id || selectedHistory?.cliente_manual_id;
    if (!clientId || !authOnlyHeaders) return;
    try {
      const res = await fetch(getAdminUrl(`/api/admin/clientes-consultor/${clientId}/archivos/${file.id}`), {
        headers: authOnlyHeaders,
      });
      if (!res.ok) throw new Error('No fue posible abrir el archivo.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al abrir archivo.';
      setClientFilesError(msg);
      toast.error(msg);
    }
  };

  const handleDeleteClientFile = async (fileId: string) => {
    if (!selectedClient || !authHeaders) return;
    try {
      setLoading(true);
      const res = await fetch(getAdminUrl(`/api/admin/clientes-consultor/${selectedClient.id}/archivos/${fileId}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible eliminar el archivo.');
      setClientFiles((current) => current.filter((file) => file.id !== fileId));
      toast.success('Archivo eliminado.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar archivo.';
      setClientFilesError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const performArchiveManualClient = async (client: ManualClientRecord) => {
    if (!authHeaders) return;
    try {
      setLoading(true);
      const res = await fetch(getAdminUrl(`/api/admin/clientes-consultor/${client.id}`), {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ etiqueta: 'cliente_removido' }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible mover el cliente al historico.');
      toast.success(`Cliente "${client.nombre}" movido al historico.`);
      await loadManualClients();
      if (historyInitiallyLoaded) await loadClientHistory();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al archivar cliente.';
      toast.error(msg);
      setManualClientsError(msg);
    } finally {
      setLoading(false);
    }
  };

  const performRestoreHistoryClient = async (history: HistoryRecord) => {
    const restoreId = getHistoryRestoreId(history);
    if (!authHeaders || !restoreId) return;
    try {
      setLoading(true);
      const body = JSON.stringify({ cliente_manual_id: history.cliente_manual_id, cliente_id: history.cliente_id });
      let res = await fetch(getAdminUrl(`/api/admin/historico-clientes/${history.id}/restaurar`), {
        method: 'PATCH',
        headers: authHeaders,
        body,
      });

      if (res.status === 404 || res.status === 405) {
        res = await fetch(getAdminUrl(`/api/admin/historico-clientes/${history.id}/reactivar`), {
          method: 'PATCH',
          headers: authHeaders,
          body,
        });
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible reactivar el cliente.');

      toast.success(`Cliente "${history.nombre || history.email}" reactivado.`);
      setSelectedHistory(null);
      setExpandedHistoryId(null);
      await loadClientHistory();
      await loadManualClients();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al reactivar cliente.';
      toast.error(msg);
      setClientHistoryError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);
    if (pwdNew.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError('Las contraseñas no coinciden.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(getAdminUrl('/api/admin/profile/change-password'), {
        method: 'POST',
        headers: authHeaders!,
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible cambiar la contraseña.');
      setPwdSuccess('Contraseña actualizada correctamente.');
      toast.success('Contraseña actualizada correctamente.');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al cambiar la contraseña.';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Login UX
  const [showPassword, setShowPassword] = useState(false);

  // ─────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const q = leadsSearch.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const hay = [l.nombre, l.email, l.empresa, l.puesto, l.telefono_whatsapp]
        .map(toSafeText)
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, leadsSearch]);

  const filteredConsultores = useMemo(() => {
    const q = consultoresSearch.trim().toLowerCase();
    if (!q) return consultores;
    return consultores.filter((c) => {
      const hay = [c.nombre, c.apellido, c.email, c.especialidad].map(toSafeText).filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [consultores, consultoresSearch]);

  const filteredManualClients = useMemo(() => {
    const q = clientsSearch.trim().toLowerCase();
    return manualClients.filter((client) => {
      if (clientStatusFilter && toSafeText(client.estatus_comercial) !== clientStatusFilter) return false;
      if (clientServiceFilter && !parseServicios(client.servicios).some((s) => s.toLowerCase() === clientServiceFilter.toLowerCase())) return false;
      if (!q) return true;
      const hay = [
        client.nombre,
        client.apellido,
        client.email,
        client.telefono_whatsapp,
        client.empresa,
        client.puesto,
        client.consultor_nombre,
        client.consultor_apellido,
      ].map(toSafeText).filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [manualClients, clientsSearch, clientStatusFilter, clientServiceFilter]);

  const filteredClientHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return clientHistory.filter((item) => {
      if (historyTagFilter && toSafeText(item.etiqueta) !== historyTagFilter) return false;
      if (historyOriginFilter && (toSafeText(item.tipo_origen) || toSafeText(item.fuente_registro)) !== historyOriginFilter) return false;
      if (historyServiceFilter && !parseServicios(item.servicios).some((s) => s.toLowerCase() === historyServiceFilter.toLowerCase())) return false;
      if (!q) return true;
      const hay = [
        item.nombre,
        item.email,
        item.telefono_whatsapp,
        item.empresa,
        item.puesto,
        item.tipo_origen,
        item.etiqueta,
        item.motivo,
      ].map(toSafeText).filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [clientHistory, historySearch, historyTagFilter, historyOriginFilter, historyServiceFilter]);

  const clientStatusOptions = useMemo(
    () => Array.from(new Set(manualClients.map((c) => toSafeText(c.estatus_comercial).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [manualClients]
  );

  const clientServiceOptions = useMemo(
    () => Array.from(new Set(manualClients.flatMap((c) => parseServicios(c.servicios)).map((s) => s.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [manualClients]
  );

  const historyTagOptions = useMemo(
    () => Array.from(new Set(clientHistory.map((i) => toSafeText(i.etiqueta).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [clientHistory]
  );

  const historyOriginOptions = useMemo(
    () => Array.from(new Set(clientHistory.map((i) => (toSafeText(i.tipo_origen) || toSafeText(i.fuente_registro)).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [clientHistory]
  );

  const historyServiceOptions = useMemo(
    () => Array.from(new Set(clientHistory.flatMap((i) => parseServicios(i.servicios)).map((s) => s.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [clientHistory]
  );

  const clientsActiveFilters = [clientStatusFilter, clientServiceFilter].filter(Boolean).length;
  const historyActiveFilters = [historyTagFilter, historyOriginFilter, historyServiceFilter].filter(Boolean).length;

  // ─────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────
  const renderPdfClientFields = (
    draft: ClientEditDraft,
    onChange: (patch: Partial<ClientEditDraft>) => void,
    readOnly: boolean
  ) => {
    const input = (label: string, field: keyof ClientEditDraft, type = 'text', placeholder = '') => (
      <div className="advisor-field">
        <label>{label}</label>
        <input type={type} value={draft[field]} onChange={(e) => onChange({ [field]: e.target.value } as Partial<ClientEditDraft>)} placeholder={placeholder} disabled={readOnly} />
      </div>
    );

    const textarea = (label: string, field: keyof ClientEditDraft, rows = 3) => (
      <div className="advisor-field">
        <label>{label}</label>
        <textarea value={draft[field]} onChange={(e) => onChange({ [field]: e.target.value } as Partial<ClientEditDraft>)} rows={rows} disabled={readOnly} />
      </div>
    );

    return (
      <>
        <div className="advisor-client-form-section">
          <span className="advisor-client-section-label">Datos generales</span>
          <div className="advisor-register-row">{input('No. cliente', 'no_cliente')}{input('Fecha de registro', 'fecha_registro', 'date')}</div>
          <div className="advisor-register-row">{input('Nombre *', 'nombre')}{input('Apellido', 'apellido')}</div>
          <div className="advisor-register-row">{input('Correo electronico *', 'email', 'email')}{input('Telefono / WhatsApp', 'telefono_whatsapp')}</div>
          <div className="advisor-register-row">{input('Empresa', 'empresa')}{input('Puesto', 'puesto')}</div>
          <div className="advisor-register-row">{input('Asesor comercial', 'asesor_comercial')}{input('Evento previo', 'evento_previo')}</div>
          <div className="advisor-field">
            <label>Servicios</label>
            <input value={draft.servicios} onChange={(e) => onChange({ servicios: e.target.value })} placeholder="Fiscal, Contable, Financiera" disabled={readOnly} />
          </div>
          <div className="advisor-register-row">
            <div className="advisor-field">
              <label>Estatus comercial</label>
              <select value={draft.estatus_comercial} onChange={(e) => onChange({ estatus_comercial: e.target.value })} disabled={readOnly}>
                <option value="interesado">Interesado</option>
                <option value="prospecto">Prospecto</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div className="advisor-field">
              <label>Fuente</label>
              <input value={draft.fuente_registro} onChange={(e) => onChange({ fuente_registro: e.target.value })} disabled={readOnly} />
            </div>
          </div>
          {isSuperAdmin && (
            <div className="advisor-field">
              <label>Consultor asignado</label>
              <select value={draft.consultor_id} onChange={(e) => onChange({ consultor_id: e.target.value })} disabled={readOnly}>
                <option value="">Mi usuario</option>
                {consultores.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.apellido ? ` ${c.apellido}` : ''}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="advisor-client-form-section">
          <span className="advisor-client-section-label">Importes y mensualidades</span>
          <div className="advisor-register-row">{input('Importe total', 'importe_total', 'number')}{input('Saldo', 'saldo', 'number')}</div>
          <div className="advisor-month-grid">
            {(['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] as Array<keyof ClientEditDraft>).map((month) => (
              <div className="advisor-field" key={month}>
                <label>{String(month).toUpperCase()}</label>
                <input type="number" value={draft[month]} onChange={(e) => onChange({ [month]: e.target.value } as Partial<ClientEditDraft>)} disabled={readOnly} />
              </div>
            ))}
          </div>
        </div>

        <div className="advisor-client-form-section">
          <span className="advisor-client-section-label">Expediente y sesiones</span>
          <div className="advisor-register-row">{input('Expediente', 'expediente')}{input('Status', 'status')}</div>
          <div className="advisor-register-row">{input('Fecha sesion 1', 'fecha_sesion_1', 'date')}{input('Fecha sesion 2', 'fecha_sesion_2', 'date')}</div>
          <div className="advisor-register-row">{input('Factura 1', 'factura_1')}{input('Factura 2', 'factura_2')}</div>
          {textarea('Observaciones', 'observaciones', 3)}
          {textarea('Comentarios', 'comentarios', 3)}
        </div>

        <div className="advisor-client-form-section">
          <span className="advisor-client-section-label">Seguimiento interno</span>
          {textarea('Benchmark', 'benchmark', 3)}
          {textarea('Revision financiera', 'revision_financiera', 3)}
          {textarea('Minuta', 'minuta', 3)}
          <div className="advisor-register-row">{input('Candidato', 'candidato')}{input('CT', 'ct')}</div>
          {textarea('Comentarios CT', 'comentarios_ct', 3)}
          {textarea('Notas internas', 'notas', 4)}
        </div>
      </>
    );
  };

  const renderNewClientFilesSection = () => (
    <div className="advisor-client-form-section advisor-files-section">
      <span className="advisor-client-section-label">Archivos extras</span>
      <div className="advisor-upload-row">
        <div className="advisor-field">
          <label>Tipo de archivo</label>
          <input value={newClientFileCampo} onChange={(e) => setNewClientFileCampo(e.target.value)} placeholder="factura, contrato, archivos_extras" />
        </div>
        <div className="advisor-field advisor-file-input-field">
          <label>Archivos</label>
          <input type="file" multiple onChange={(e) => setNewClientFiles(e.target.files)} />
        </div>
      </div>
    </div>
  );

  const renderClientFilesSection = (readOnly = false) => (
    <div className="advisor-client-form-section advisor-files-section">
      <span className="advisor-client-section-label">Archivos extras</span>
      {!readOnly && (
        <div className="advisor-upload-row">
          <div className="advisor-field">
            <label>Tipo de archivo</label>
            <input value={uploadCampo} onChange={(e) => setUploadCampo(e.target.value)} placeholder="factura, contrato, archivos_extras" />
          </div>
          <div className="advisor-field advisor-file-input-field">
            <label>Archivos</label>
            <input type="file" multiple onChange={(e) => setSelectedUploadFiles(e.target.files)} />
          </div>
          <button type="button" className="advisor-submit" disabled={loading || !selectedUploadFiles?.length} onClick={handleUploadClientFiles}>
            Subir archivos
          </button>
        </div>
      )}
      {clientFilesError && <p className="advisor-error">{clientFilesError}</p>}
      {filesLoading ? (
        <p className="advisor-client-detail-note">Cargando archivos...</p>
      ) : clientFiles.length === 0 ? (
        <p className="advisor-client-detail-note">Sin archivos guardados.</p>
      ) : (
        <div className="advisor-file-list">
          {clientFiles.map((file) => (
            <div key={file.id} className="advisor-file-row">
              <div>
                <strong>{file.nombre_original}</strong>
                <span>{file.campo || 'archivos_extras'} - {formatFileSize(file.size_bytes)}</span>
              </div>
              <div className="advisor-file-actions">
                <button type="button" className="advisor-ghost advisor-file-link" onClick={() => handleOpenClientFile(file)}>Abrir</button>
                {!readOnly && <button type="button" className="advisor-action danger" disabled={loading} onClick={() => handleDeleteClientFile(file.id)}>Eliminar</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Show a clear message when the production frontend has no API configured.
  if (API_NOT_CONFIGURED) {
    return (
      <main className="advisor-shell">
        <section className="advisor-login">
          <div className="advisor-login-card">
            <img src={logoMenu} alt="Díaz Lara" className="advisor-login-logo" />
            <span className="advisor-kicker">Configuración pendiente</span>
            <h1 className="advisor-title">Portal no disponible</h1>
            <p className="advisor-copy">
              Este sitio se publicó sin una URL de backend configurada (<code>VITE_API_URL</code>).
              El portal de asesores requiere un servidor backend accesible por HTTPS.
              Contacta al administrador para terminar la configuración.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!token || !profile) {
    return (
      <main className="advisor-shell">
        <button
          type="button"
          className="advisor-theme-toggle advisor-login-theme"
          onClick={toggleTheme}
          aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <section className="advisor-login">
          <motion.div
            className="advisor-login-card"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <img src={logoMenu} alt="Díaz Lara" className="advisor-login-logo" />
            <span className="advisor-kicker">Acceso interno</span>
            <h1 className="advisor-title">Portal de asesores</h1>
            <p className="advisor-copy">
              Acceso exclusivo para consultores. Ingresa con tus credenciales para gestionar leads y sesiones.
            </p>
            <form className="advisor-form" onSubmit={handleLogin} noValidate>
              <div className="advisor-field">
                <label htmlFor="advisor-email">Correo del consultor</label>
                <input
                  id="advisor-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="advisor-field advisor-password-field">
                <label htmlFor="advisor-password">Contraseña</label>
                <div className="advisor-password-wrap">
                  <input
                    id="advisor-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="advisor-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button className="advisor-submit" type="submit" disabled={loading}>
                {loading ? 'Ingresando…' : 'Entrar al portal'}
              </button>
            </form>
            <AnimatePresence>
              {loginError && (
                <motion.p
                  className="advisor-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {loginError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN PANEL
  // ─────────────────────────────────────────────────────────
  return (
    <main className="advisor-shell">
      {/* ── Top nav ── */}
      <nav className="advisor-nav">
        <div className="advisor-nav-inner">
          <a href="/" className="advisor-nav-brand" aria-label="Inicio">
            <img src={monograma} alt="Díaz Lara" className="advisor-nav-logo" />
            <span className="advisor-nav-brand-text">Panel de asesores</span>
          </a>
          <div className="advisor-nav-tabs">
            <button type="button" className={`advisor-nav-tab ${view === 'leads' ? 'active' : ''}`} onClick={() => setView('leads')}>
              Leads
            </button>
            <button type="button" className={`advisor-nav-tab ${view === 'clientes_consultor' || view === 'agregar_cliente' ? 'active' : ''}`} onClick={() => setView('clientes_consultor')}>
              Clientes
            </button>
            <button type="button" className={`advisor-nav-tab ${view === 'historico_clientes' ? 'active' : ''}`} onClick={() => setView('historico_clientes')}>
              Historico
            </button>
            {isSuperAdmin && (
              <button type="button" className={`advisor-nav-tab ${view === 'consultores' ? 'active' : ''}`} onClick={() => setView('consultores')}>
                Administración
              </button>
            )}
          </div>
          <div className="advisor-nav-right">
            <button
              type="button"
              className="advisor-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              title={`Tema ${theme === 'dark' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <div className="advisor-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="advisor-user-trigger"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="advisor-avatar advisor-avatar-sm">{getInitials(profile.nombre, profile.apellido)}</span>
                <span className="advisor-nav-user">{profile.nombre}</span>
                <span className="advisor-user-caret" aria-hidden>▾</span>
              </button>
              {userMenuOpen && (
                <div className="advisor-user-dropdown" role="menu">
                  <div className="advisor-user-dropdown-header">
                    <p className="advisor-user-dropdown-name">{profile.nombre}{profile.apellido ? ` ${profile.apellido}` : ''}</p>
                    <p className="advisor-user-dropdown-email">{profile.email}</p>
                    <p className="advisor-user-dropdown-email">{isSuperAdmin ? 'Administrador' : 'Consultor'}</p>
                  </div>
                  <button type="button" className="advisor-user-dropdown-item" onClick={() => { setUserMenuOpen(false); setView('cuenta'); }}>
                    Mi cuenta
                  </button>
                  <button type="button" className="advisor-user-dropdown-item danger" onClick={() => { setUserMenuOpen(false); handleLogout(); }}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="advisor-panel">

        {/* ─── LEADS ─────────────────────────────────────── */}
        {view === 'leads' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Control de leads</span>
                <h1 className="advisor-title">Hola, {profile.nombre}</h1>
                <p className="advisor-copy">
                  Revisa, aprueba o rechaza los leads de la landing y asígnales sesión con Google Meet.
                </p>
              </div>
              <div className="advisor-header-actions">
                <button
                  className="advisor-icon-btn"
                  type="button"
                  onClick={async () => {
                    setRefreshing(true);
                    try { await loadLeads(); await loadStats(); }
                    finally { setRefreshing(false); }
                  }}
                  disabled={refreshing || loading}
                  aria-label="Actualizar leads"
                  title="Actualizar"
                >
                  <span className={refreshing ? 'icon-spin' : ''} aria-hidden>↻</span>
                  <span>Actualizar</span>
                </button>
              </div>
            </header>

            <div className="advisor-stats">
              {(['pendiente', 'aprobado', 'sesion_agendada', 'rechazado'] as LeadEstado[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`advisor-stat ${activeEstado === e ? 'is-active' : ''}`}
                  onClick={() => setActiveEstado(e)}
                  style={{ textAlign: 'left', font: 'inherit', color: 'inherit' }}
                >
                  <span className="advisor-stat-label">{ESTADO_LABELS[e]}</span>
                  <span className="advisor-stat-value">
                    <CountUp value={leadStats[e]} />
                  </span>
                  <span className="advisor-stat-hint">
                    {e === activeEstado ? 'Visualizando' : 'Click para ver'}
                  </span>
                </button>
              ))}
            </div>

            <div className="advisor-board">
              <div className="advisor-leads-toolbar">
                <div className="advisor-search">
                  <span className="advisor-search-icon" aria-hidden>🔍</span>
                  <input
                    type="search"
                    placeholder="Buscar por nombre, email, empresa o teléfono…"
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    aria-label="Buscar leads"
                  />
                </div>
                <div className="advisor-filters">
                  {(['pendiente', 'aprobado', 'sesion_agendada', 'rechazado'] as LeadEstado[]).map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      className={`advisor-filter ${activeEstado === estado ? 'active' : ''}`}
                      onClick={() => setActiveEstado(estado)}
                    >
                      {ESTADO_LABELS[estado]}
                    </button>
                  ))}
                </div>
              </div>

              {leadError && <p className="advisor-error">{leadError}</p>}

              <div className="advisor-grid">
                {loading && !leadsInitiallyLoaded && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <article key={`skeleton-${i}`} className="advisor-lead-card advisor-lead-skeleton">
                        <div className="row">
                          <Skeleton width={44} height={44} radius="50%" />
                          <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                            <Skeleton width="50%" height={16} />
                            <Skeleton width="35%" height={12} />
                          </div>
                        </div>
                        <Skeleton width="80%" height={12} />
                        <Skeleton width="60%" height={12} />
                        <div className="row">
                          <Skeleton width={90} height={28} radius={8} />
                          <Skeleton width={120} height={28} radius={8} />
                        </div>
                      </article>
                    ))}
                  </>
                )}

                {!loading && filteredLeads.length === 0 && (
                  <div className="advisor-empty-state">
                    <span className="advisor-empty-icon" aria-hidden>
                      {leadsSearch ? '🔎' : '📭'}
                    </span>
                    <p className="advisor-empty-title">
                      {leadsSearch
                        ? 'Sin resultados para tu búsqueda'
                        : `No hay leads en estado «${ESTADO_LABELS[activeEstado]}»`}
                    </p>
                    <p className="advisor-empty-hint">
                      {leadsSearch
                        ? 'Prueba con otro término o limpia el filtro.'
                        : 'Cuando lleguen nuevos registros, aparecerán aquí.'}
                    </p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                {filteredLeads.map((lead, idx) => {
                  const services = parseServicios(lead.servicios);
                  const scheduleDraft = scheduleDrafts[lead.id] || defaultScheduleDraft();
                  const resolvedMeetLink = meetLinks[lead.id] || lead.cita_meet_link || lead.meet_link;

                  return (
                    <motion.article
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
                      className="advisor-lead-card"
                    >
                      <div className="advisor-lead-top">
                        <div className="advisor-lead-info">
                          <h2 className="advisor-lead-name">
                            <span className="advisor-avatar">{getInitials(lead.nombre)}</span>
                            <span>{lead.nombre}</span>
                          </h2>
                          <p className="advisor-lead-email">
                            <a href={`mailto:${lead.email}`}>{lead.email}</a>
                          </p>
                          {lead.telefono_whatsapp && (
                            <p className="advisor-lead-phone">
                              <a href={`https://wa.me/${lead.telefono_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                                {lead.telefono_whatsapp}
                              </a>
                            </p>
                          )}
                        </div>
                        <div className="advisor-badges">
                          <span className="advisor-badge">{ESTADO_LABELS[lead.estado]}</span>
                          <span className={`advisor-badge ${ESTATUS_COLORS[lead.estatus_comercial]}`}>
                            {lead.estatus_comercial}
                          </span>
                        </div>
                      </div>

                      {(lead.empresa || lead.puesto) && (
                        <p className="advisor-lead-org">{[lead.empresa, lead.puesto].filter(Boolean).join(' · ')}</p>
                      )}

                      {services.length > 0 && (
                        <div className="advisor-services">
                          {services.map((s) => <span key={s} className="advisor-service">{s}</span>)}
                        </div>
                      )}

                      {resolvedMeetLink && (
                        <div className="advisor-meet-row">
                          <span className="advisor-meet-icon">📹</span>
                          <a href={resolvedMeetLink} className="advisor-meet-link" target="_blank" rel="noreferrer">
                            Abrir Google Meet
                          </a>
                          <button type="button" className="advisor-copy-btn" onClick={() => navigator.clipboard.writeText(resolvedMeetLink)}>
                            Copiar link
                          </button>
                        </div>
                      )}

                      {lead.estado === 'sesion_agendada' && lead.cita_fecha_hora_inicio && (
                        <div className="advisor-session-info">
                          <p className="advisor-session-title">🗓 Sesión agendada</p>
                          <p className="advisor-session-date">{formatSessionDate(lead.cita_fecha_hora_inicio)}</p>
                          {lead.consultor_nombre && (
                            <p className="advisor-session-meta">
                              Consultor: <strong>{lead.consultor_nombre}{lead.consultor_apellido ? ` ${lead.consultor_apellido}` : ''}</strong>
                            </p>
                          )}
                          {lead.cita_estado && (
                            <p className="advisor-session-meta">Estado de la cita: <strong>{lead.cita_estado}</strong></p>
                          )}
                        </div>
                      )}

                      <p className="advisor-note">
                        Registrado el {new Date(lead.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>

                      <div className="advisor-lead-actions">
                        {lead.estado === 'pendiente' && (
                          <button type="button" className="advisor-action" disabled={loadingAction} onClick={() => runLeadAction(() => handleApprove(lead.id))}>
                            ✓ Aprobar
                          </button>
                        )}
                        {lead.estado !== 'rechazado' && (
                          <button type="button" className="advisor-action" disabled={loadingAction} onClick={() => setConfirmConvertLead(lead)}>
                            Pasar a cliente
                          </button>
                        )}
                        {lead.estado !== 'rechazado' && (
                          <button type="button" className="advisor-ghost" onClick={() => toggleSchedule(lead.id)}>
                            {expandedLeadId === lead.id
                              ? 'Cancelar'
                              : lead.estado === 'sesion_agendada'
                                ? '📅 Reprogramar sesión'
                                : '📅 Asignar sesión'}
                          </button>
                        )}
                        {lead.estado !== 'rechazado' && (
                          <button type="button" className="advisor-action danger" disabled={loadingAction} onClick={() => { setRejectReason(''); setRejectTarget(lead); }}>
                            ✕ Rechazar
                          </button>
                        )}
                        <button type="button" className="advisor-action danger" disabled={loadingAction} onClick={() => setConfirmDelete(lead)}>
                          🗑 Eliminar
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                      {expandedLeadId === lead.id && (
                        <motion.div
                          key="schedule"
                          className="advisor-schedule"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p className="advisor-schedule-title">Agendar sesión — se creará evento en Google Calendar y se enviará invitación por correo</p>
                          <div className="advisor-schedule-row">
                            <div className="advisor-field">
                              <label htmlFor={`schedule-${lead.id}`}>Fecha y hora</label>
                              <input
                                id={`schedule-${lead.id}`}
                                type="datetime-local"
                                value={scheduleDraft.fecha_hora_inicio}
                                onChange={(e) => updateScheduleDraft(lead.id, { fecha_hora_inicio: e.target.value })}
                              />
                            </div>
                            <div className="advisor-field">
                              <label htmlFor={`dur-${lead.id}`}>Duración</label>
                              <select
                                id={`dur-${lead.id}`}
                                value={scheduleDraft.duracion}
                                onChange={(e) => updateScheduleDraft(lead.id, { duracion: Number(e.target.value) })}
                              >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>1 hora</option>
                                <option value={90}>1.5 horas</option>
                              </select>
                            </div>
                            <div className="advisor-field">
                              <label htmlFor={`status-${lead.id}`}>Estatus comercial</label>
                              <select
                                id={`status-${lead.id}`}
                                value={scheduleDraft.estatus_comercial}
                                onChange={(e) => updateScheduleDraft(lead.id, { estatus_comercial: e.target.value as EstatusComercial })}
                              >
                                <option value="interesado">Interesado</option>
                                <option value="prospecto">Prospecto</option>
                                <option value="cliente">Cliente</option>
                              </select>
                            </div>
                          </div>
                          <div className="advisor-field">
                            <label htmlFor={`notes-${lead.id}`}>Notas internas</label>
                            <input
                              id={`notes-${lead.id}`}
                              type="text"
                              value={scheduleDraft.notas_cliente}
                              onChange={(e) => updateScheduleDraft(lead.id, { notas_cliente: e.target.value })}
                              placeholder="Observaciones sobre el cliente o la sesión"
                            />
                          </div>
                          {scheduleErrors[lead.id] && (
                            <p className="advisor-schedule-error">{scheduleErrors[lead.id]}</p>
                          )}
                          <button type="button" className="advisor-action" disabled={loadingAction} onClick={() => runLeadAction(() => handleScheduleLead(lead.id))}>
                            {loadingAction ? 'Creando evento…' : '📅 Confirmar y crear Google Meet'}
                          </button>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {view === 'clientes_consultor' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Clientes consultores</span>
                <h1 className="advisor-title">Clientes</h1>
                <p className="advisor-copy">Consulta clientes agregados manualmente por el equipo y registra nuevos clientes no organicos.</p>
              </div>
              <div className="advisor-header-actions">
                <button className="advisor-icon-btn" type="button" onClick={loadManualClients} aria-label="Actualizar clientes">
                  <span aria-hidden>↻</span>
                  <span>Actualizar</span>
                </button>
                <button className="advisor-submit" type="button" onClick={() => setView('agregar_cliente')}>+ Agregar cliente</button>
              </div>
            </header>

            {selectedClient ? (
              <div className="advisor-board advisor-client-detail-view">
                <button type="button" className="advisor-ghost advisor-client-back" onClick={() => setSelectedClient(null)}>
                  Volver a clientes
                </button>
                <div className="advisor-client-detail-hero">
                  <span className="advisor-avatar advisor-client-detail-avatar">{getInitials(selectedClient.nombre, selectedClient.apellido || undefined)}</span>
                  <div>
                    <span className="advisor-kicker">Vista del cliente</span>
                    <h2 className="advisor-client-detail-title">{selectedClient.nombre}{selectedClient.apellido ? ` ${selectedClient.apellido}` : ''}</h2>
                    <p className="advisor-consultor-meta">{selectedClient.email}</p>
                  </div>
                  <div className="advisor-client-top-actions">
                    <span className={`advisor-badge ${ESTATUS_COLORS[selectedClient.estatus_comercial as EstatusComercial] || ''}`}>
                      {selectedClient.estatus_comercial || 'cliente'}
                    </span>
                    <button
                      type="button"
                      className="advisor-action"
                      disabled={loading}
                      onClick={() => {
                        setEditClientDraft(createClientEditDraft(selectedClient));
                        setEditingClient((current) => !current);
                      }}
                    >
                      {editingClient ? 'Cerrar' : 'Editar'}
                    </button>
                    <button type="button" className="advisor-action danger" disabled={loading} onClick={() => setConfirmArchiveClient(selectedClient)}>
                      Dar de baja
                    </button>
                  </div>
                </div>

                {editClientDraft && (
                  <form className={`advisor-form advisor-client-edit-form ${!editingClient ? 'is-readonly' : ''}`} onSubmit={handleUpdateManualClient} noValidate>
                    {renderPdfClientFields(editClientDraft, updateEditClientDraft, !editingClient)}
                    {renderClientFilesSection()}
                    {editingClient && (
                      <div className="advisor-register-actions">
                        <button type="submit" className="advisor-submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
                        <button type="button" className="advisor-ghost" onClick={() => { setEditClientDraft(createClientEditDraft(selectedClient)); setEditingClient(false); }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </form>
                )}

                 <DiagnosticoForm clientId={selectedClient.id} />
              </div>
            ) : (
            <>
            <div className="advisor-client-summary">
              <div>
                <h2>Gestion de Clientes</h2>
                <p>Administra y consulta la informacion de tus clientes</p>
              </div>
              <div className="advisor-client-count">
                <strong>{manualClients.length}</strong>
                <span>Clientes</span>
              </div>
            </div>

            <div className="advisor-client-search-row">
              <div className="advisor-leads-toolbar">
                <div className="advisor-search">
                  <span className="advisor-search-icon" aria-hidden>🔍</span>
                  <input
                    type="search"
                    placeholder="Buscar cliente o empresa"
                    value={clientsSearch}
                    onChange={(e) => setClientsSearch(e.target.value)}
                    aria-label="Buscar clientes"
                  />
                </div>
                <div className="advisor-filter-menu" ref={clientsFilterRef}>
                  <button
                    type="button"
                    className={`advisor-filter-trigger${clientsActiveFilters > 0 ? ' has-filters' : ''}`}
                    onClick={() => setClientsFilterOpen((v) => !v)}
                    aria-label="Abrir filtros"
                    aria-expanded={clientsFilterOpen}
                    title="Filtros"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {clientsActiveFilters > 0 && <span className="advisor-filter-badge">{clientsActiveFilters}</span>}
                  </button>
                  {clientsFilterOpen && (
                    <div className="advisor-filter-dropdown">
                      <div className="advisor-filter-dropdown-inner">
                        <div className="advisor-field">
                          <label>Estatus</label>
                          <select value={clientStatusFilter} onChange={(e) => setClientStatusFilter(e.target.value)}>
                            <option value="">Todos los estatus</option>
                            {clientStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="advisor-field">
                          <label>Servicio</label>
                          <select value={clientServiceFilter} onChange={(e) => setClientServiceFilter(e.target.value)}>
                            <option value="">Todos los servicios</option>
                            {clientServiceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        {clientsActiveFilters > 0 && (
                          <button
                            type="button"
                            className="advisor-ghost"
                            onClick={() => { setClientStatusFilter(''); setClientServiceFilter(''); }}
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="advisor-board advisor-client-board">

              {manualClientsError && <p className="advisor-error">{manualClientsError}</p>}

              {!clientsInitiallyLoaded && (
                <div className="advisor-consultor-list">
                  {[0, 1, 2].map((i) => (
                    <div key={`client-skeleton-${i}`} className="advisor-consultor-row">
                      <Skeleton width={44} height={44} radius="50%" />
                      <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                        <Skeleton width="42%" height={14} />
                        <Skeleton width="64%" height={12} />
                      </div>
                      <Skeleton width={92} height={28} radius={8} />
                    </div>
                  ))}
                </div>
              )}

              {clientsInitiallyLoaded && filteredManualClients.length === 0 && (
                <div className="advisor-empty-state">
                  <span className="advisor-empty-icon" aria-hidden>{clientsSearch || clientsActiveFilters > 0 ? '🔎' : '👥'}</span>
                  <p className="advisor-empty-title">{clientsSearch || clientsActiveFilters > 0 ? 'Sin resultados' : 'No hay clientes registrados'}</p>
                  <p className="advisor-empty-hint">{clientsSearch || clientsActiveFilters > 0 ? 'Prueba con otro término o limpia los filtros.' : 'Agrega el primer cliente para verlo aqui.'}</p>
                </div>
              )}

              <div className="advisor-client-grid">
                <AnimatePresence initial={false}>
                  {filteredManualClients.map((client, idx) => {
                    const services = parseServicios(client.servicios);
                    const consultorName = [client.consultor_nombre, client.consultor_apellido].filter(Boolean).join(' ');
                    const isExpanded = expandedClientId === client.id;
                    return (
                      <motion.article
                        key={client.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.15) }}
                        className={`advisor-client-card ${isExpanded ? 'is-expanded' : ''}`}
                        onClick={() => setExpandedClientId((current) => current === client.id ? null : client.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedClientId((current) => current === client.id ? null : client.id);
                          }
                        }}
                      >
                        <div className="advisor-client-card-head">
                          <span className="advisor-avatar advisor-client-card-avatar">{getInitials(client.nombre, client.apellido || undefined)}</span>
                          <div className="advisor-consultor-info">
                            <p className="advisor-consultor-name">{client.nombre}{client.apellido ? ` ${client.apellido}` : ''}</p>
                            <p className="advisor-consultor-meta">{client.empresa || 'Sin empresa registrada'}</p>
                          </div>
                          {client.estatus_comercial && (
                            <span className={`advisor-badge ${ESTATUS_COLORS[client.estatus_comercial as EstatusComercial] || ''}`}>
                              {client.estatus_comercial}
                            </span>
                          )}
                        </div>

                        <p className="advisor-client-compact-meta">
                          <span>{client.email}</span>
                        </p>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              className="advisor-client-card-body"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="advisor-client-card-facts">
                                <p className="advisor-client-fact">
                                  <span>Correo</span>
                                  <strong>{client.email}</strong>
                                </p>
                                <p className="advisor-client-fact">
                                  <span>Puesto</span>
                                  <strong>{client.puesto || 'Sin puesto'}</strong>
                                </p>
                                <p className="advisor-client-fact">
                                  <span>Telefono</span>
                                  <strong>{client.telefono_whatsapp || 'Sin telefono'}</strong>
                                </p>
                              </div>
                              <div className="advisor-client-card-tags">
                                {consultorName && <span className="advisor-client-tag">Consultor: {consultorName}</span>}
                                <span className="advisor-client-tag muted">{client.fuente_registro || 'manual_consultor'}</span>
                              </div>
                              {services.length > 0 && (
                                <div className="advisor-services advisor-services-compact">
                                  {services.slice(0, 3).map((service) => <span key={service} className="advisor-service">{service}</span>)}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="advisor-client-card-actions">
                          <span className="advisor-client-card-hint">{isExpanded ? 'Detalle rapido abierto' : 'Click para desplegar'}</span>
                          <button
                            type="button"
                            className="advisor-client-expand"
                            aria-label={`Ver detalle de ${client.nombre}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                            }}
                          >
                           Ver cliente
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            </>
            )}
          </>
        )}

        {view === 'agregar_cliente' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Nuevo cliente</span>
                <h1 className="advisor-title">Agregar cliente</h1>
                <p className="advisor-copy">Registra clientes no organicos en CLIENTES_CONSULTOR.</p>
              </div>
            </header>

            <div className="advisor-board advisor-register-board">
              <form className="advisor-form advisor-register-form" onSubmit={handleCreateManualClient} noValidate>
                {renderPdfClientFields(newClientDraft, updateNewClientDraft, false)}
                {renderNewClientFilesSection()}
                <div className="advisor-register-actions">
                  <button type="submit" className="advisor-submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Agregar cliente'}
                  </button>
                  <button type="button" className="advisor-ghost" onClick={() => setView('clientes_consultor')}>
                    Ver clientes
                  </button>
                </div>
                {clientError && <p className="advisor-error">{clientError}</p>}
                {clientSuccess && <p className="advisor-success">{clientSuccess}</p>}
              </form>
            </div>
          </>
        )}

        {view === 'historico_clientes' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Historico clientes</span>
                <h1 className="advisor-title">Historico</h1>
                <p className="advisor-copy">Consulta clientes y leads archivados desde el portal.</p>
              </div>
              <div className="advisor-header-actions">
                <button className="advisor-icon-btn" type="button" onClick={loadClientHistory} aria-label="Actualizar historico">
                  <span aria-hidden>↻</span>
                  <span>Actualizar</span>
                </button>
              </div>
            </header>

            {selectedHistory ? (
              <div className="advisor-board advisor-client-detail-view">
                <button type="button" className="advisor-ghost advisor-client-back" onClick={() => setSelectedHistory(null)}>
                  Volver al historico
                </button>
                <div className="advisor-client-detail-hero">
                  <span className="advisor-avatar advisor-client-detail-avatar">{getInitials(selectedHistory.nombre)}</span>
                  <div>
                    <span className="advisor-kicker">Registro historico</span>
                    <h2 className="advisor-client-detail-title">{selectedHistory.nombre}</h2>
                    <p className="advisor-consultor-meta">{selectedHistory.email}</p>
                  </div>
                  <div className="advisor-client-top-actions">
                    {selectedHistory.etiqueta && <span className="advisor-pill off">{selectedHistory.etiqueta}</span>}
                    {getHistoryRestoreId(selectedHistory) && (
                      <button
                        type="button"
                        className="advisor-action"
                        disabled={loading}
                        onClick={() => setConfirmRestoreHistory(selectedHistory)}
                      >
                        Reactivar cliente
                      </button>
                    )}
                  </div>
                </div>
                <form className="advisor-form advisor-client-edit-form is-readonly" noValidate>
                  {renderPdfClientFields(createHistoryClientDraft(selectedHistory), () => undefined, true)}
                  <div className="advisor-client-form-section">
                    <span className="advisor-client-section-label">Historico</span>
                    <div className="advisor-register-row">
                      <div className="advisor-field">
                        <label>Etiqueta</label>
                        <input value={selectedHistory.etiqueta || 'Sin etiqueta'} disabled />
                      </div>
                      <div className="advisor-field">
                        <label>Archivado</label>
                        <input value={selectedHistory.archived_at ? new Date(selectedHistory.archived_at).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : 'Sin fecha'} disabled />
                      </div>
                    </div>
                  </div>
                </form>
                {getHistoryRestoreId(selectedHistory) && renderClientFilesSection(true)}
              </div>
            ) : (
            <>
            <div className="advisor-client-summary">
              <div>
                <h2>Historico de Clientes</h2>
                <p>Consulta clientes y leads archivados desde el portal</p>
              </div>
              <div className="advisor-client-count">
                <strong>{clientHistory.length}</strong>
                <span>Registros</span>
              </div>
            </div>

            <div className="advisor-client-search-row">
              <div className="advisor-leads-toolbar">
                <div className="advisor-search">
                  <span className="advisor-search-icon" aria-hidden>🔍</span>
                  <input
                    type="search"
                    placeholder="Buscar historico"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    aria-label="Buscar historico de clientes"
                  />
                </div>
                <div className="advisor-filter-menu" ref={historyFilterRef}>
                  <button
                    type="button"
                    className={`advisor-filter-trigger${historyActiveFilters > 0 ? ' has-filters' : ''}`}
                    onClick={() => setHistoryFilterOpen((v) => !v)}
                    aria-label="Abrir filtros"
                    aria-expanded={historyFilterOpen}
                    title="Filtros"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {historyActiveFilters > 0 && <span className="advisor-filter-badge">{historyActiveFilters}</span>}
                  </button>
                  {historyFilterOpen && (
                    <div className="advisor-filter-dropdown">
                      <div className="advisor-filter-dropdown-inner">
                        <div className="advisor-field">
                          <label>Etiqueta</label>
                          <select value={historyTagFilter} onChange={(e) => setHistoryTagFilter(e.target.value)}>
                            <option value="">Todas las etiquetas</option>
                            {historyTagOptions.map((t) => <option key={t} value={t}>{formatHistoryTag(t) || t}</option>)}
                          </select>
                        </div>
                        <div className="advisor-field">
                          <label>Origen</label>
                          <select value={historyOriginFilter} onChange={(e) => setHistoryOriginFilter(e.target.value)}>
                            <option value="">Todos los origenes</option>
                            {historyOriginOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="advisor-field">
                          <label>Servicio</label>
                          <select value={historyServiceFilter} onChange={(e) => setHistoryServiceFilter(e.target.value)}>
                            <option value="">Todos los servicios</option>
                            {historyServiceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        {historyActiveFilters > 0 && (
                          <button
                            type="button"
                            className="advisor-ghost"
                            onClick={() => { setHistoryTagFilter(''); setHistoryOriginFilter(''); setHistoryServiceFilter(''); }}
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="advisor-board advisor-client-board">

              {clientHistoryError && <p className="advisor-error">{clientHistoryError}</p>}

              {!historyInitiallyLoaded && (
                <div className="advisor-consultor-list">
                  {[0, 1, 2].map((i) => (
                    <div key={`history-skeleton-${i}`} className="advisor-consultor-row">
                      <Skeleton width={44} height={44} radius="50%" />
                      <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                        <Skeleton width="42%" height={14} />
                        <Skeleton width="66%" height={12} />
                      </div>
                      <Skeleton width={110} height={28} radius={8} />
                    </div>
                  ))}
                </div>
              )}

              {historyInitiallyLoaded && filteredClientHistory.length === 0 && (
                <div className="advisor-empty-state">
                  <span className="advisor-empty-icon" aria-hidden>{historySearch || historyActiveFilters > 0 ? '🔎' : '🗂'}</span>
                  <p className="advisor-empty-title">{historySearch || historyActiveFilters > 0 ? 'Sin resultados' : 'No hay historico registrado'}</p>
                  <p className="advisor-empty-hint">{historySearch || historyActiveFilters > 0 ? 'Prueba con otro término o limpia los filtros.' : 'Cuando archives clientes, apareceran aqui.'}</p>
                </div>
              )}

              <div className="advisor-client-grid advisor-history-grid">
                <AnimatePresence initial={false}>
                  {filteredClientHistory.map((item, idx) => {
                    const services = parseServicios(item.servicios);
                    const isExpanded = expandedHistoryId === item.id;
                    const displayName = item.nombre || item.email || 'Cliente sin nombre';
                    const historyTag = formatHistoryTag(item.etiqueta);
                    return (
                      <motion.article
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.15) }}
                        className={`advisor-client-card advisor-history-card ${isExpanded ? 'is-expanded' : ''}`}
                        onClick={() => setExpandedHistoryId((current) => current === item.id ? null : item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedHistoryId((current) => current === item.id ? null : item.id);
                          }
                        }}
                      >
                        <div className="advisor-client-card-head">
                          <span className="advisor-avatar advisor-client-card-avatar">{getInitials(displayName)}</span>
                          <div className="advisor-consultor-info">
                          <p className="advisor-consultor-name" title={displayName}>{displayName}</p>
                          <p className="advisor-consultor-meta">{item.empresa || item.tipo_origen || 'Sin empresa'}</p>
                          </div>
                          {historyTag && <span className="advisor-pill off advisor-history-tag" title={item.etiqueta || historyTag}>{historyTag}</span>}
                        </div>

                        <p className="advisor-client-compact-meta">
                          <span>{item.email}</span>
                        </p>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              className="advisor-client-card-body"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="advisor-client-card-facts">
                                <p className="advisor-client-fact"><span>Origen</span><strong>{item.tipo_origen || 'Sin origen'}</strong></p>
                                <p className="advisor-client-fact"><span>Estatus</span><strong>{item.estatus_comercial || item.estado_lead || 'Sin estatus'}</strong></p>
                                <p className="advisor-client-fact"><span>Archivado</span><strong>{item.archived_at ? new Date(item.archived_at).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : 'Sin fecha'}</strong></p>
                              </div>
                              <div className="advisor-client-card-tags">
                                {item.tipo_origen && <span className="advisor-client-tag">{item.tipo_origen}</span>}
                                {item.fuente_registro && <span className="advisor-client-tag muted">{item.fuente_registro}</span>}
                              </div>
                              {services.length > 0 && (
                                <div className="advisor-services advisor-services-compact">
                                  {services.slice(0, 3).map((service) => <span key={service} className="advisor-service">{service}</span>)}
                                </div>
                              )}
                              {item.motivo && <p className="advisor-client-note">{item.motivo}</p>}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="advisor-client-card-actions">
                          <span className="advisor-client-card-hint">{isExpanded ? 'Detalle rapido abierto' : 'Click para desplegar'}</span>
                          <button
                            type="button"
                            className="advisor-client-expand"
                            aria-label={`Ver historico de ${displayName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHistory(item);
                            }}
                          >
                            Ver registro
                          </button>
                          {getHistoryRestoreId(item) && (
                            <button
                              type="button"
                              className="advisor-client-expand"
                              aria-label={`Reactivar cliente ${displayName}`}
                              disabled={loading}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRestoreHistory(item);
                              }}
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            </>
            )}
          </>
        )}

        {/* ─── CONSULTORES ─────────────────────────────────── */}
        {view === 'consultores' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Equipo</span>
                <h1 className="advisor-title">Administración</h1>
                <p className="advisor-copy">Gestiona consultores, accesos y permisos del portal.</p>
              </div>
              <div className="advisor-header-actions">
                <button className="advisor-icon-btn" type="button" onClick={loadConsultores} aria-label="Actualizar consultores">
                  <span aria-hidden>↻</span>
                  <span>Actualizar</span>
                </button>
                <button className="advisor-submit" type="button" onClick={() => setView('registrar')}>+ Nuevo consultor</button>
              </div>
            </header>

            <div className="advisor-board">
              <div className="advisor-leads-toolbar">
                <div className="advisor-search">
                  <span className="advisor-search-icon" aria-hidden>🔍</span>
                  <input
                    type="search"
                    placeholder="Buscar por nombre, email o especialidad…"
                    value={consultoresSearch}
                    onChange={(e) => setConsultoresSearch(e.target.value)}
                    aria-label="Buscar consultores"
                  />
                </div>
              </div>

              {consultoresError && <p className="advisor-error">{consultoresError}</p>}

              {!consultoresInitiallyLoaded && (
                <div className="advisor-consultor-list">
                  {[0, 1, 2].map((i) => (
                    <div key={`csk-${i}`} className="advisor-consultor-row">
                      <Skeleton width={44} height={44} radius="50%" />
                      <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                        <Skeleton width="40%" height={14} />
                        <Skeleton width="60%" height={12} />
                      </div>
                      <Skeleton width={80} height={28} radius={8} />
                    </div>
                  ))}
                </div>
              )}

              {consultoresInitiallyLoaded && filteredConsultores.length === 0 && (
                <div className="advisor-empty-state">
                  <span className="advisor-empty-icon" aria-hidden>{consultoresSearch ? '🔎' : '👥'}</span>
                  <p className="advisor-empty-title">
                    {consultoresSearch ? 'Sin resultados' : 'No hay consultores registrados'}
                  </p>
                  <p className="advisor-empty-hint">
                    {consultoresSearch ? 'Prueba con otro término.' : 'Crea el primer asesor para comenzar.'}
                  </p>
                </div>
              )}

              <div className="advisor-consultor-list">
                <AnimatePresence initial={false}>
                  {filteredConsultores.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.15) }}
                      className="advisor-consultor-row"
                    >
                      <span className="advisor-avatar">{getInitials(c.nombre, c.apellido)}</span>
                      <div className="advisor-consultor-info">
                        <p className="advisor-consultor-name">{c.nombre}{c.apellido ? ` ${c.apellido}` : ''}</p>
                        <p className="advisor-consultor-meta">
                          {c.email}
                          {c.especialidad ? ` · ${c.especialidad}` : ''}
                        </p>
                      </div>
                      <span className={`advisor-pill ${c.rol === 'super_admin' ? 'on' : ''}`}>
                        {c.rol === 'super_admin' ? 'Admin' : 'Consultor'}
                      </span>
                      <span className={`advisor-pill ${c.activo ? 'on' : 'off'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        type="button"
                        className={c.activo ? 'advisor-ghost' : 'advisor-action'}
                        onClick={() => handleToggleActivo(c.id, !c.activo)}
                      >
                        {c.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        className="advisor-action danger"
                        onClick={() => setConfirmDeleteConsultor(c)}
                      >
                        Eliminar
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {/* ─── REGISTRAR ───────────────────────────────────── */}
        {view === 'registrar' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Nuevo acceso</span>
                <h1 className="advisor-title">Registrar consultor</h1>
                <p className="advisor-copy">Crea una cuenta de acceso al portal para un nuevo asesor del equipo.</p>
              </div>
            </header>

            <div className="advisor-board advisor-register-board">
              <form className="advisor-form advisor-register-form" onSubmit={handleRegisterConsultor} noValidate>
                <div className="advisor-register-row">
                  <div className="advisor-field">
                    <label htmlFor="reg-nombre">Nombre *</label>
                    <input id="reg-nombre" type="text" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} placeholder="Nombre" required />
                  </div>
                  <div className="advisor-field">
                    <label htmlFor="reg-apellido">Apellido</label>
                    <input id="reg-apellido" type="text" value={regApellido} onChange={(e) => setRegApellido(e.target.value)} placeholder="Apellido (opcional)" />
                  </div>
                </div>
                <div className="advisor-field">
                  <label htmlFor="reg-email">Correo electrónico *</label>
                  <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="consultor@diazlara.mx" required />
                </div>
                <div className="advisor-field">
                  <label htmlFor="reg-password">Contraseña inicial *</label>
                  <input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                </div>
                <div className="advisor-field">
                  <label htmlFor="reg-rol">Rol *</label>
                  <select id="reg-rol" value={regRol} onChange={(e) => setRegRol(e.target.value as 'consultant' | 'super_admin')}>
                    <option value="consultant">Consultor</option>
                    <option value="super_admin">Administrador</option>
                  </select>
                </div>
                <div className="advisor-register-actions">
                  <button type="submit" className="advisor-submit" disabled={loading}>
                    {loading ? 'Registrando…' : 'Crear cuenta de consultor'}
                  </button>
                  <button type="button" className="advisor-ghost" onClick={() => setView('consultores')}>
                    Ver consultores
                  </button>
                </div>
                {regError && <p className="advisor-error">{regError}</p>}
                {regSuccess && <p className="advisor-success">{regSuccess}</p>}
              </form>
            </div>
          </>
        )}

        {/* ─── MI CUENTA ────────────────────────────────── */}
        {view === 'cuenta' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Cuenta</span>
                <h1 className="advisor-title">Mi cuenta</h1>
                <p className="advisor-copy">Actualiza tu contraseña de acceso al portal.</p>
              </div>
            </header>

            <div className="advisor-board advisor-register-board">
              <div className="advisor-consultor-row" style={{ marginBottom: '1.5rem' }}>
                <span className="advisor-avatar">{getInitials(profile.nombre, profile.apellido)}</span>
                <div className="advisor-consultor-info">
                  <p className="advisor-consultor-name">{profile.nombre}{profile.apellido ? ` ${profile.apellido}` : ''}</p>
                  <p className="advisor-consultor-meta">{profile.email}</p>
                </div>
              </div>
              <form className="advisor-form advisor-register-form" onSubmit={handleChangePassword} noValidate>
                <div className="advisor-field">
                  <label htmlFor="pwd-current">Contraseña actual *</label>
                  <input id="pwd-current" type="password" autoComplete="current-password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} required />
                </div>
                <div className="advisor-field">
                  <label htmlFor="pwd-new">Nueva contraseña *</label>
                  <input id="pwd-new" type="password" autoComplete="new-password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
                <div className="advisor-field">
                  <label htmlFor="pwd-confirm">Confirmar nueva contraseña *</label>
                  <input id="pwd-confirm" type="password" autoComplete="new-password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} required minLength={6} />
                </div>
                <div className="advisor-register-actions">
                  <button type="submit" className="advisor-submit" disabled={loading}>
                    {loading ? 'Actualizando…' : 'Cambiar contraseña'}
                  </button>
                </div>
                {pwdError && <p className="advisor-error">{pwdError}</p>}
                {pwdSuccess && <p className="advisor-success">{pwdSuccess}</p>}
              </form>
            </div>
          </>
        )}

      </section>

      {/* ── Modales ───────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Enviar lead al historico"
        description={confirmDelete ? `Seguro que deseas enviar el lead de "${confirmDelete.nombre}" (${confirmDelete.email}) al historico? Dejara de aparecer en leads activos.` : ''}
        confirmLabel="Enviar al historico"
        variant="danger"
        loading={loadingAction}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          const target = confirmDelete;
          setConfirmDelete(null);
          await performDeleteLead(target);
        }}
      />

      <ConfirmDialog
        open={!!confirmConvertLead}
        title="Pasar lead a cliente"
        description={confirmConvertLead ? `Seguro que deseas crear un cliente activo con los datos de "${confirmConvertLead.nombre}"? El lead organico se guardara en historico como convertido.` : ''}
        confirmLabel="Pasar a cliente"
        loading={loadingAction}
        onCancel={() => setConfirmConvertLead(null)}
        onConfirm={async () => {
          if (!confirmConvertLead) return;
          const target = confirmConvertLead;
          setConfirmConvertLead(null);
          await handleConvertLeadToClient(target);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteConsultor}
        title="Eliminar consultor"
        description={confirmDeleteConsultor ? `¿Seguro que deseas eliminar al consultor "${confirmDeleteConsultor.nombre}${confirmDeleteConsultor.apellido ? ' ' + confirmDeleteConsultor.apellido : ''}"? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        variant="danger"
        loading={loading}
        onCancel={() => setConfirmDeleteConsultor(null)}
        onConfirm={async () => {
          if (!confirmDeleteConsultor) return;
          const target = confirmDeleteConsultor;
          setConfirmDeleteConsultor(null);
          await performDeleteConsultor(target);
        }}
      />

      <ConfirmDialog
        open={!!confirmArchiveClient}
        title="Dar de baja cliente"
        description={confirmArchiveClient ? `Seguro que deseas dar de baja a "${confirmArchiveClient.nombre}" (${confirmArchiveClient.email})? Se movera al historico.` : ''}
        confirmLabel="Dar de baja"
        variant="danger"
        loading={loading}
        onCancel={() => setConfirmArchiveClient(null)}
        onConfirm={async () => {
          if (!confirmArchiveClient) return;
          const target = confirmArchiveClient;
          setConfirmArchiveClient(null);
          await performArchiveManualClient(target);
        }}
      />

      <ConfirmDialog
        open={!!confirmRestoreHistory}
        title="Reactivar cliente"
        description={confirmRestoreHistory ? `Seguro que deseas reactivar a "${confirmRestoreHistory.nombre || confirmRestoreHistory.email}"? Volvera a aparecer en clientes activos.` : ''}
        confirmLabel="Reactivar"
        loading={loading}
        onCancel={() => setConfirmRestoreHistory(null)}
        onConfirm={async () => {
          if (!confirmRestoreHistory) return;
          const target = confirmRestoreHistory;
          setConfirmRestoreHistory(null);
          await performRestoreHistoryClient(target);
        }}
      />

      <AnimatePresence>
        {rejectTarget && (
          <motion.div
            className="ui-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => { setRejectTarget(null); setRejectReason(''); }}
          >
            <motion.div
              className="ui-modal"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="ui-modal-title">Rechazar lead</h2>
              <p className="ui-modal-desc">
                ¿Por qué rechazas a <strong>{rejectTarget.nombre}</strong>? El motivo se guardará para auditoría.
              </p>
              <div className="advisor-field" style={{ marginBottom: 16 }}>
                <label htmlFor="reject-reason">Motivo (opcional)</label>
                <input
                  id="reject-reason"
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej. No es perfil objetivo, datos inválidos…"
                  autoFocus
                />
              </div>
              <div className="ui-modal-actions">
                <button
                  type="button"
                  className="ui-modal-btn ui-modal-btn-ghost"
                  onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="ui-modal-btn ui-modal-btn-danger"
                  onClick={confirmRejectLead}
                  disabled={loading}
                >
                  Confirmar rechazo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default AdvisorPortal;

