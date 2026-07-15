# CLAUDE.md — Guía operativa para agentes (Claude / Copilot CLI)

> Contexto rápido para asistentes automáticos. Léelo antes de tocar código.

## 1. Qué es este repo

- **Nombre:** `diazlara-landing`
- **Stack:** React 19 + TypeScript + Vite 5, `framer-motion` para animaciones.
- **Naturaleza:** **Solo frontend.** El backend (API `/api/...`) vive en otro repositorio y se consume vía HTTP.
- **Ruteo:** No hay React Router. Se detecta la ruta con `window.location.pathname` / `hash` en `src/App.tsx`:
  - `/` → `LandingPage` (captación de leads).
  - `/asesores` o `#/asesores` → `AdvisorPortal` (panel interno).

## 2. Estructura

```
src/
  App.tsx                       ← Selector landing vs. portal
  main.tsx                      ← Bootstrap React
  components/ui/                ← Toast, ConfirmDialog, Skeleton, CountUp
  hooks/useTheme.ts             ← Tema claro/oscuro persistido
  pages/
    landing/                    ← Página pública (marketing + formulario de sesión)
      LandingPage.tsx
      sections/, components/, data.ts, landing.css
    advisor/
      AdvisorPortal.tsx         ← ⚠️ Archivo monolítico (~3.8k líneas). Cerebro del CRM.
      DiagnosticoForm.tsx
      clientStatus.ts           ← Enum `ClientStatus` y helpers
      advisor.css               ← Todo el estilado del portal
```

## 3. Variables de entorno (`.env`)

| Variable | Uso |
|---|---|
| `VITE_API_URL` | Base del backend (ej. `http://localhost:3000`). |
| `VITE_BOOKING_ENDPOINT` | Endpoint público para reservas desde la landing (por defecto `/api/sessions/bookings`). |

En producción, si `VITE_API_URL` apunta a `localhost` mientras el host web no es local, `AdvisorPortal` muestra “API no configurada”.

## 4. Scripts

```bash
npm install        # instalar deps
npm run dev        # Vite dev server
npm run build      # tsc -b + vite build (produce /dist)
npm run preview    # servir /dist
npm run lint       # ESLint (flat config, TS + react-hooks + react-refresh)
```

## 5. Portal de asesores (`AdvisorPortal.tsx`)

### Autenticación
- Token JWT en `localStorage['diazlara_advisor_token']`.
- Se refresca perfil vía `GET /api/admin/profile`.
- `profile.rol`: `'consultant' | 'super_admin'`.
- `isSuperAdmin` habilita las pestañas **Administración** y **Registrar**.

### Vistas (`View` union)

| Vista | Descripción |
|---|---|
| `leads` | Leads capturados en la landing. Filtro por `estado` (`pendiente`, `aprobado`, `sesion_agendada`, `rechazado`). Permite aprobar, rechazar, agendar sesión (Google Meet) o convertir a cliente. |
| `clientes_consultor` | Clientes activos gestionados manualmente. Edición, archivos adjuntos, asignación de consultores. |
| `agregar_cliente` | Alta manual de cliente. |
| `historico_clientes` | Clientes archivados. Permite restaurar. |
| `calendario` | Vista semanal de las sesiones agendadas para las *session holders* (Jessica Tapia y Jazmin Robles). |
| `consultores` (admin) | Gestión de consultores: alta desde `registrar`, cambio de rol, reset de contraseña, toggle activo. |
| `registrar` (admin) | Formulario alta consultor. |
| `cuenta` | Cambio de contraseña propia. |

### Endpoints backend consumidos (todos bajo `VITE_API_URL`)

```
POST   /api/admin/login
GET    /api/admin/profile
POST   /api/admin/profile/change-password
GET    /api/admin/leads-espera?estado=<x>&limit=<n>
PATCH  /api/admin/leads-espera/:id/aprobar
POST   /api/admin/leads-espera/:id/rechazar
POST   /api/admin/leads-espera/:id/asignar-sesion       ← Crea Google Meet + evento
PATCH  /api/admin/leads-espera/:id/cita-estado          ← Actualiza estado de la cita (tomada|no_show|cancelada|reprogramada). El frontend hace fallback a POST del mismo path y a PATCH /leads-espera/:id con { cita_estado }.
POST   /api/admin/leads-espera/:id/convertir-cliente
POST   /api/admin/leads-espera/:id/pasar-a-cliente
PUT    /api/admin/leads-espera/:id
GET    /api/admin/consultores
POST   /api/admin/consultores
POST   /api/admin/consultores/:id/toggle-activo
POST   /api/admin/consultores/:id/reset-password
PATCH  /api/admin/consultores/:id/rol
PUT    /api/admin/consultores/:id
GET/POST/PUT/DELETE /api/admin/clientes-consultor[...]
GET    /api/admin/historico-clientes
POST   /api/admin/historico-clientes/:id/restaurar
GET    /api/admin/asesores-comerciales
GET/POST /api/admin/servicios-clientes
POST   /api/admin/consultoria-sync/{retry|reconcile|backfill}
```

Todos los endpoints admin requieren header `Authorization: Bearer <token>`.

## 6. Reglas de negocio de sesiones (⚠️ importantes)

Las sesiones agendadas desde el panel siguen estas reglas — respétalas al editar:

1. **Duración fija: 15 minutos.**
2. **Ventana horaria: 09:00 – 16:00** (hora local del navegador). El último slot inicia a las **15:45**.
3. **Slots discretos cada 15 min** (`SESSION_TIME_SLOTS` en `AdvisorPortal.tsx`).
4. **Solo dos “session holders” pueden ser asignadas** como consultora de la sesión:
   - **Jessica Tapia**
   - **Jazmin Robles**
   La lista viene de `SESSION_HOLDER_NAMES`. El identificador real (`consultor_id`) se resuelve buscando por nombre + apellido en `consultores` (cargados con `GET /api/admin/consultores`).
5. Cualquier consultor con sesión iniciada puede **agendar** un lead, pero al enviar `POST /leads-espera/:id/asignar-sesion` debe mandar `consultor_id` = ID de Jessica o Jazmin (no el propio). El backend crea el evento en el Google Calendar de esa persona.
6. Jessica y Jazmin visualizan sus sesiones en la vista **Calendario**; ahí validan cuándo tomar cada llamada dentro del rango 9-16 hrs.

Si en el futuro cambia el equipo de session holders, edita **solo** `SESSION_HOLDER_NAMES` en `AdvisorPortal.tsx`; el resto del código se adapta.

## 7. Convenciones / gotchas

- **Archivo monolítico:** `AdvisorPortal.tsx` mezcla estado, fetchs y JSX. Preferimos ediciones quirúrgicas (`edit`) sobre refactors grandes salvo que se pida explícito.
- **Sin librería de UI** — todos los iconos son SVG inline (`IcoSun`, `IcoCalendar`, …) y todo el estilo está en `advisor.css`.
- **Sin librería de calendario** — el calendario es una cuadrícula CSS pura para no añadir dependencias.
- **Toasts:** usa `useToast()` (`toast.success/error/info`) en lugar de `alert`.
- **Confirm dialogs:** usa `<ConfirmDialog />` del `components/ui`.
- **Fechas:** siempre envía ISO (`new Date(...).toISOString()`) al backend; muestra con `toLocaleString('es-MX', ...)`.
- **Servicios:** `parseServicios(...)` acepta string CSV o `string[]`.
- **Estilos:** las clases nuevas deben seguir el prefijo `advisor-…`.
- **Idioma UI:** español mexicano (es-MX). Mantén el tono.
- **Lint:** ejecuta `npm run lint` antes de dar por hecho un cambio; si tocas dependencias, corre `npm run build`.
- **Nunca commitees** contraseñas ni el `.env`. Si el backend no está disponible, la UI muestra estados vacíos — no inventes datos mock.

## 8. Roadmap de referencia (features vivas)

- ✔ Landing con formulario de sesión.
- ✔ Portal admin con leads, clientes, histórico, catálogos.
- ✔ Reglas de sesiones (15 min, 9-16 hrs, holders acotados).
- ✔ Vista Calendario para Jessica Tapia y Jazmin Robles.
- ✎ Próximo natural: filtros de rango en calendario, exportación ICS, notificaciones en tiempo real.
