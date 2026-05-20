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
import DiagnosticoForm from './DiagnosticoForm';

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
  nombre: string;
  apellido?: string | null;
  email: string;
  telefono_whatsapp?: string | null;
  empresa?: string | null;
  puesto?: string | null;
  servicios?: string[] | string | null;
  fuente_registro?: string | null;
  estatus_comercial?: EstatusComercial | string | null;
  notas?: string | null;
  created_at?: string | null;
  consultor_nombre?: string | null;
  consultor_apellido?: string | null;
  consultor_email?: string | null;
};

type HistoryRecord = {
  id: string;
  lead_id?: string | null;
  cliente_id?: string | null;
  cliente_manual_id?: string | null;
  consultor_id?: string | null;
  tipo_origen?: string | null;
  fuente_registro?: string | null;
  nombre: string;
  email: string;
  telefono_whatsapp?: string | null;
  empresa?: string | null;
  puesto?: string | null;
  servicios?: string[] | string | null;
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

const parseServicios = (servicios: string[] | string | null | undefined) => {
  if (Array.isArray(servicios)) {
    return servicios;
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

const getInitials = (name: string, lastName?: string) => {
  const a = (name?.trim()?.[0] || '').toUpperCase();
  const b = (lastName?.trim()?.[0] || name?.trim()?.split(/\s+/)[1]?.[0] || '').toUpperCase();
  return (a + b) || '?';
};

const formatHistoryTag = (tag?: string | null) => {
  if (!tag) return '';
  return tag.replace(/_/g, ' ').replace(/^cliente\s+/i, '').trim();
};

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
  const [confirmArchiveClient, setConfirmArchiveClient] = useState<ManualClientRecord | null>(null);
  const [selectedClient, setSelectedClient] = useState<ManualClientRecord | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Navigation
  const [view, setView] = useState<View>('leads');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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
  const [clientNombre, setClientNombre] = useState('');
  const [clientApellido, setClientApellido] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientTelefono, setClientTelefono] = useState('');
  const [clientEmpresa, setClientEmpresa] = useState('');
  const [clientPuesto, setClientPuesto] = useState('');
  const [clientServicios, setClientServicios] = useState('');
  const [clientNotas, setClientNotas] = useState('');
  const [clientConsultorId, setClientConsultorId] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [clientSuccess, setClientSuccess] = useState<string | null>(null);

  // Change password
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : undefined;
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
      body: JSON.stringify({ motivo }),
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
      const res = await fetch(getAdminUrl(`/api/admin/leads-espera/${lead.id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.error?.message || p?.error || 'No fue posible eliminar el lead.');
      }
      toast.success(`Lead «${lead.nombre}» eliminado.`);
      await loadLeads();
      await loadStats();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar.';
      toast.error(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const resetClientForm = () => {
    setClientNombre('');
    setClientApellido('');
    setClientEmail('');
    setClientTelefono('');
    setClientEmpresa('');
    setClientPuesto('');
    setClientServicios('');
    setClientNotas('');
    setClientConsultorId('');
  };

  const handleCreateManualClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClientError(null);
    setClientSuccess(null);
    try {
      if (!authHeaders) return;
      setLoading(true);
      const servicios = clientServicios
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const res = await fetch(getAdminUrl('/api/admin/clientes-consultor'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          nombre: clientNombre.trim(),
          apellido: clientApellido.trim() || undefined,
          email: clientEmail.trim(),
          telefono_whatsapp: clientTelefono.trim() || undefined,
          empresa: clientEmpresa.trim() || undefined,
          puesto: clientPuesto.trim() || undefined,
          servicios,
          fuente_registro: 'manual_consultor',
          estatus_comercial: 'cliente',
          notas: clientNotas.trim() || undefined,
          consultor_id: isSuperAdmin ? clientConsultorId || undefined : undefined,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || 'No fue posible agregar el cliente.');
      const msg = `Cliente "${payload.data?.nombre || clientNombre}" agregado correctamente.`;
      setClientSuccess(msg);
      toast.success(msg);
      resetClientForm();
      await loadManualClients();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al agregar cliente.';
      setClientError(msg);
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
      const hay = [c.nombre, c.apellido, c.email, c.especialidad].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [consultores, consultoresSearch]);

  const filteredManualClients = useMemo(() => {
    const q = clientsSearch.trim().toLowerCase();
    if (!q) return manualClients;
    return manualClients.filter((client) => {
      const hay = [
        client.nombre,
        client.apellido,
        client.email,
        client.telefono_whatsapp,
        client.empresa,
        client.puesto,
        client.consultor_nombre,
        client.consultor_apellido,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [manualClients, clientsSearch]);

  const filteredClientHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return clientHistory;
    return clientHistory.filter((item) => {
      const hay = [
        item.nombre,
        item.email,
        item.telefono_whatsapp,
        item.empresa,
        item.puesto,
        item.tipo_origen,
        item.etiqueta,
        item.motivo,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [clientHistory, historySearch]);

  const selectedClientServices = useMemo(
    () => (selectedClient ? parseServicios(selectedClient.servicios) : []),
    [selectedClient]
  );

  // ─────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────
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
                  <span className={`advisor-badge ${ESTATUS_COLORS[selectedClient.estatus_comercial as EstatusComercial] || ''}`}>
                    {selectedClient.estatus_comercial || 'cliente'}
                  </span>
                </div>

                <div className="advisor-client-detail-grid">
                  <div className="advisor-client-detail-block">
                    <span>Telefono</span>
                    {selectedClient.telefono_whatsapp ? (
                      <a href={`https://wa.me/${selectedClient.telefono_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{selectedClient.telefono_whatsapp}</a>
                    ) : (
                      <strong>No registrado</strong>
                    )}
                  </div>
                  <div className="advisor-client-detail-block">
                    <span>Empresa</span>
                    <strong>{selectedClient.empresa || 'No registrada'}</strong>
                  </div>
                  <div className="advisor-client-detail-block">
                    <span>Puesto</span>
                    <strong>{selectedClient.puesto || 'No registrado'}</strong>
                  </div>
                  <div className="advisor-client-detail-block">
                    <span>Consultor</span>
                    <strong>{[selectedClient.consultor_nombre, selectedClient.consultor_apellido].filter(Boolean).join(' ') || 'Sin asignar'}</strong>
                  </div>
                  <div className="advisor-client-detail-block">
                    <span>Fuente</span>
                    <strong>{selectedClient.fuente_registro || 'manual_consultor'}</strong>
                  </div>
                  <div className="advisor-client-detail-block">
                    <span>Registro</span>
                    <strong>
                      {selectedClient.created_at
                        ? new Date(selectedClient.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })
                        : 'Sin fecha'}
                    </strong>
                  </div>
                </div>

                {selectedClientServices.length > 0 && (
                  <div className="advisor-client-detail-section">
                    <span className="advisor-client-section-label">Servicios</span>
                    <div className="advisor-services advisor-services-compact">
                      {selectedClientServices.map((service) => <span key={service} className="advisor-service">{service}</span>)}
                    </div>
                  </div>
                )}

                <div className="advisor-client-detail-section">
                  <span className="advisor-client-section-label">Notas</span>
                  <p className="advisor-client-detail-note">{selectedClient.notas || 'Sin notas internas registradas.'}</p>
                </div>

                <div className="advisor-client-card-actions">
                  <button type="button" className="advisor-action danger" disabled={loading} onClick={() => setConfirmArchiveClient(selectedClient)}>
                    Mover a historico
                  </button>
                </div>

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
                  <span className="advisor-empty-icon" aria-hidden>{clientsSearch ? '🔎' : '👥'}</span>
                  <p className="advisor-empty-title">{clientsSearch ? 'Sin resultados' : 'No hay clientes registrados'}</p>
                  <p className="advisor-empty-hint">{clientsSearch ? 'Prueba con otro termino.' : 'Agrega el primer cliente para verlo aqui.'}</p>
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
                <div className="advisor-register-row">
                  <div className="advisor-field">
                    <label htmlFor="client-nombre">Nombre *</label>
                    <input id="client-nombre" type="text" value={clientNombre} onChange={(e) => setClientNombre(e.target.value)} placeholder="Nombre" required />
                  </div>
                  <div className="advisor-field">
                    <label htmlFor="client-apellido">Apellido</label>
                    <input id="client-apellido" type="text" value={clientApellido} onChange={(e) => setClientApellido(e.target.value)} placeholder="Apellido (opcional)" />
                  </div>
                </div>
                <div className="advisor-field">
                  <label htmlFor="client-email">Correo electronico *</label>
                  <input id="client-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="cliente@empresa.com" required />
                </div>
                <div className="advisor-field">
                  <label htmlFor="client-telefono">Telefono / WhatsApp</label>
                  <input id="client-telefono" type="tel" value={clientTelefono} onChange={(e) => setClientTelefono(e.target.value)} placeholder="+52..." />
                </div>
                <div className="advisor-register-row">
                  <div className="advisor-field">
                    <label htmlFor="client-empresa">Empresa</label>
                    <input id="client-empresa" type="text" value={clientEmpresa} onChange={(e) => setClientEmpresa(e.target.value)} placeholder="Empresa" />
                  </div>
                  <div className="advisor-field">
                    <label htmlFor="client-puesto">Puesto</label>
                    <input id="client-puesto" type="text" value={clientPuesto} onChange={(e) => setClientPuesto(e.target.value)} placeholder="Puesto" />
                  </div>
                </div>
                <div className="advisor-field">
                  <label htmlFor="client-servicios">Servicios</label>
                  <input id="client-servicios" type="text" value={clientServicios} onChange={(e) => setClientServicios(e.target.value)} placeholder="Fiscal, Contable, Financiera" />
                </div>
                {isSuperAdmin && (
                  <div className="advisor-register-row">
                    <div className="advisor-field">
                      <label htmlFor="client-consultor">Consultor asignado</label>
                      <select id="client-consultor" value={clientConsultorId} onChange={(e) => setClientConsultorId(e.target.value)}>
                        <option value="">Mi usuario</option>
                        {consultores.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}{c.apellido ? ` ${c.apellido}` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="advisor-field">
                  <label htmlFor="client-notas">Notas</label>
                  <textarea id="client-notas" value={clientNotas} onChange={(e) => setClientNotas(e.target.value)} placeholder="Notas internas del cliente" rows={4} />
                </div>
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
                  {selectedHistory.etiqueta && <span className="advisor-pill off">{selectedHistory.etiqueta}</span>}
                </div>
                <div className="advisor-client-detail-grid">
                  <div className="advisor-client-detail-block"><span>Origen</span><strong>{selectedHistory.tipo_origen || 'Sin origen'}</strong></div>
                  <div className="advisor-client-detail-block"><span>Empresa</span><strong>{selectedHistory.empresa || 'No registrada'}</strong></div>
                  <div className="advisor-client-detail-block"><span>Puesto</span><strong>{selectedHistory.puesto || 'No registrado'}</strong></div>
                  <div className="advisor-client-detail-block"><span>Telefono</span><strong>{selectedHistory.telefono_whatsapp || 'No registrado'}</strong></div>
                  <div className="advisor-client-detail-block"><span>Estatus</span><strong>{selectedHistory.estatus_comercial || selectedHistory.estado_lead || 'Sin estatus'}</strong></div>
                  <div className="advisor-client-detail-block"><span>Archivado</span><strong>{selectedHistory.archived_at ? new Date(selectedHistory.archived_at).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : 'Sin fecha'}</strong></div>
                </div>
                {parseServicios(selectedHistory.servicios).length > 0 && (
                  <div className="advisor-client-detail-section">
                    <span className="advisor-client-section-label">Servicios</span>
                    <div className="advisor-services advisor-services-compact">
                      {parseServicios(selectedHistory.servicios).map((service) => <span key={service} className="advisor-service">{service}</span>)}
                    </div>
                  </div>
                )}
                <div className="advisor-client-detail-section">
                  <span className="advisor-client-section-label">Motivo</span>
                  <p className="advisor-client-detail-note">{selectedHistory.motivo || 'Sin motivo registrado.'}</p>
                </div>
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
                  <span className="advisor-empty-icon" aria-hidden>{historySearch ? '🔎' : '🗂'}</span>
                  <p className="advisor-empty-title">{historySearch ? 'Sin resultados' : 'No hay historico registrado'}</p>
                  <p className="advisor-empty-hint">{historySearch ? 'Prueba con otro termino.' : 'Cuando archives clientes, apareceran aqui.'}</p>
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
        title="Eliminar lead"
        description={confirmDelete ? `¿Seguro que deseas eliminar el registro de "${confirmDelete.nombre}" (${confirmDelete.email})? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
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
        title="Mover cliente al historico"
        description={confirmArchiveClient ? `Seguro que deseas mover a "${confirmArchiveClient.nombre}" (${confirmArchiveClient.email}) al historico? Dejara de aparecer en clientes activos.` : ''}
        confirmLabel="Mover al historico"
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
