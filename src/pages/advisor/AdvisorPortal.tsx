import { useEffect, useRef, useState } from 'react';
import './advisor.css';
import logoMenu from '../../assets/logo menu.png';
import monograma from '../../assets/monograma.png';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';
const ADMIN_TOKEN_KEY = 'diazlara_advisor_token';

type View = 'leads' | 'consultores' | 'registrar' | 'cuenta';

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

const parseServicios = (servicios: LeadRecord['servicios']) => {
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

const AdvisorPortal = () => {
  // Auth
  const [email, setEmail] = useState('contacto@diazlara.mx');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => window.localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [profile, setProfile] = useState<ConsultorProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Change password
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : undefined;

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
    const res = await fetch(getAdminUrl('/api/admin/consultores'), { headers: authHeaders });
    if (!res.ok) { setConsultoresError('No fue posible cargar los consultores.'); return; }
    const payload = await res.json();
    setConsultores(Array.isArray(payload.data) ? payload.data : []);
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
    loadLeads().catch(() => setLeadError('No fue posible actualizar los leads.'));
  }, [activeEstado]);

  useEffect(() => {
    if (view === 'consultores' && token) loadConsultores();
  }, [view]);

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
    setExpandedLeadId(null);
    setLeadError(null);
  };

  // ── Lead actions ───────────────────────────────────────────
  const runLeadAction = async (action: () => Promise<void>) => {
    try {
      setLeadError(null);
      setLoading(true);
      await action();
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'No fue posible completar la acción.');
    } finally {
      setLoading(false);
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

  const handleReject = async (leadId: string) => {
    if (!authHeaders) return;
    const motivo = window.prompt('Motivo del rechazo (opcional):', '') || '';
    const res = await fetch(getAdminUrl(`/api/admin/leads-espera/${leadId}/rechazar`), {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ motivo }),
    });
    if (!res.ok) throw new Error('No fue posible rechazar el lead.');
    await loadLeads();
  };

  const handleScheduleLead = async (leadId: string) => {
    if (!profile || !authHeaders) return;
    const draft = scheduleDrafts[leadId] || defaultScheduleDraft();
    if (!draft.fecha_hora_inicio) throw new Error('Selecciona fecha y hora para la sesión.');
    const start = new Date(draft.fecha_hora_inicio);
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
    setExpandedLeadId(null);
    await loadLeads();
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
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || 'No fue posible registrar el consultor.');
      setRegSuccess(`Consultor "${payload.data?.nombre}" registrado correctamente.`);
      setRegNombre(''); setRegApellido(''); setRegEmail('');
      setRegPassword('');
      await loadConsultores();
    } catch (error) {
      setRegError(error instanceof Error ? error.message : 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    if (!authHeaders) return;
    await fetch(getAdminUrl(`/api/admin/consultores/${id}/toggle-activo`), {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ activo }),
    });
    await loadConsultores();
  };

  // ── Delete consultor ───────────────────────────────────────
  const handleDeleteConsultor = async (c: ConsultorProfile) => {
    if (!authHeaders) return;
    const fullName = `${c.nombre}${c.apellido ? ' ' + c.apellido : ''}`;
    if (!window.confirm(`¿Seguro que deseas eliminar al consultor "${fullName}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(getAdminUrl(`/api/admin/consultores/${c.id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.error?.message || p?.error || 'No fue posible eliminar el consultor.');
      }
      await loadConsultores();
    } catch (error) {
      setConsultoresError(error instanceof Error ? error.message : 'Error al eliminar.');
    }
  };

  // ── Delete lead ────────────────────────────────────────────
  const handleDeleteLead = async (lead: LeadRecord) => {
    if (!authHeaders) return;
    if (!window.confirm(`¿Seguro que deseas eliminar el registro de "${lead.nombre}" (${lead.email})? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(getAdminUrl(`/api/admin/leads-espera/${lead.id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.error?.message || p?.error || 'No fue posible eliminar el lead.');
      }
      await loadLeads();
      await loadStats();
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Error al eliminar.');
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
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch (error) {
      setPwdError(error instanceof Error ? error.message : 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────
  if (!token || !profile) {
    return (
      <main className="advisor-shell">
        <section className="advisor-login">
          <div className="advisor-login-card">
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
              <div className="advisor-field">
                <label htmlFor="advisor-password">Contraseña</label>
                <input
                  id="advisor-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className="advisor-submit" type="submit" disabled={loading}>
                {loading ? 'Ingresando…' : 'Entrar al portal'}
              </button>
            </form>
            {loginError && <p className="advisor-error">{loginError}</p>}
          </div>
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
            <button type="button" className={`advisor-nav-tab ${view === 'consultores' ? 'active' : ''}`} onClick={() => setView('consultores')}>
              Consultores
            </button>
          </div>
          <div className="advisor-nav-right">
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
                <button className="advisor-ghost" type="button" onClick={() => runLeadAction(async () => { await loadLeads(); await loadStats(); })} disabled={loading}>
                  ↺ Actualizar
                </button>
              </div>
            </header>

            <div className="advisor-stats">
              {(['pendiente', 'aprobado', 'sesion_agendada', 'rechazado'] as LeadEstado[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  className="advisor-stat"
                  onClick={() => setActiveEstado(e)}
                  style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
                >
                  <span className="advisor-stat-label">{ESTADO_LABELS[e]}</span>
                  <span className="advisor-stat-value">{leadStats[e]}</span>
                  <span className="advisor-stat-hint">
                    {e === activeEstado ? 'Visualizando' : 'Click para ver'}
                  </span>
                </button>
              ))}
            </div>

            <div className="advisor-board">
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

              {leadError && <p className="advisor-error">{leadError}</p>}
              {loading && <p className="advisor-hint">Cargando…</p>}

              <div className="advisor-grid">
                {leads.length === 0 && !loading && (
                  <p className="advisor-empty">No hay leads en estado «{ESTADO_LABELS[activeEstado]}».</p>
                )}

                {leads.map((lead) => {
                  const services = parseServicios(lead.servicios);
                  const scheduleDraft = scheduleDrafts[lead.id] || defaultScheduleDraft();
                  const resolvedMeetLink = meetLinks[lead.id] || lead.cita_meet_link || lead.meet_link;

                  return (
                    <article key={lead.id} className="advisor-lead-card">
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
                          <button type="button" className="advisor-action" disabled={loading} onClick={() => runLeadAction(() => handleApprove(lead.id))}>
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
                          <button type="button" className="advisor-action danger" disabled={loading} onClick={() => runLeadAction(() => handleReject(lead.id))}>
                            ✕ Rechazar
                          </button>
                        )}
                        <button type="button" className="advisor-action danger" disabled={loading} onClick={() => handleDeleteLead(lead)}>
                          🗑 Eliminar
                        </button>
                      </div>

                      {expandedLeadId === lead.id && (
                        <div className="advisor-schedule">
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
                          <button type="button" className="advisor-action" disabled={loading} onClick={() => runLeadAction(() => handleScheduleLead(lead.id))}>
                            {loading ? 'Creando evento…' : '📅 Confirmar y crear Google Meet'}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── CONSULTORES ─────────────────────────────────── */}
        {view === 'consultores' && (
          <>
            <header className="advisor-header">
              <div>
                <span className="advisor-kicker">Equipo</span>
                <h1 className="advisor-title">Consultores</h1>
                <p className="advisor-copy">Lista de todos los asesores registrados en el portal.</p>
              </div>
              <div className="advisor-header-actions">
                <button className="advisor-ghost" type="button" onClick={loadConsultores}>↺ Actualizar</button>
                <button className="advisor-submit" type="button" onClick={() => setView('registrar')}>+ Nuevo consultor</button>
              </div>
            </header>

            <div className="advisor-board">
              {consultoresError && <p className="advisor-error">{consultoresError}</p>}
              {consultores.length === 0 && !consultoresError && (
                <p className="advisor-empty">No hay consultores registrados.</p>
              )}
              <div className="advisor-consultor-list">
                {consultores.map((c) => (
                  <div key={c.id} className="advisor-consultor-row">
                    <span className="advisor-avatar">{getInitials(c.nombre, c.apellido)}</span>
                    <div className="advisor-consultor-info">
                      <p className="advisor-consultor-name">{c.nombre}{c.apellido ? ` ${c.apellido}` : ''}</p>
                      <p className="advisor-consultor-meta">
                        {c.email}
                        {c.especialidad ? ` · ${c.especialidad}` : ''}
                      </p>
                    </div>
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
                      onClick={() => handleDeleteConsultor(c)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
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
    </main>
  );
};

export default AdvisorPortal;
