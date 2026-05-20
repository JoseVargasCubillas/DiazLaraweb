import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type DiagData = {
  q01: string; q02: string; q03: string; q04: string; q05: string; q06: string;
  q07: string[]; q08: string; q09: string; q10: string; q11: string; q12: string;
  q13: string; q14: string; q15: string; q16: string; q17: string; q18: string;
  q19: string; q20: string; q21: string; q22: string; q23: string; q24: string;
  q25: string; q26: string; q27: string; q28: string; q29: string; q30: string;
  q31: string; q32: string; q33: string; q34: string; q35: string; q36: string;
  q37: string; q38: string; q39: string; q40: string; q41: string[]; q42: string;
  q43: string; q44: string; q45: string; q46: string; q47: string; q48: string[];
  q49: string; q50: string; q51: string; q52: string; q53: string; q54: string;
  q55: string[]; q56: string; q57: string; q58: string; q59: string; q60: string;
  q61: string[]; q62: string; q63: string; q64: string; q65: string; q66: string;
  q67: string; q68: string; q69: string; q70: string[]; q71: string[]; q72: string;
  q73: string; q74: string; q75: string; q76: string[]; q77: string; q78: string;
  q79: string[]; q80: string[]; q81: string[]; q82: string; q83: string[]; q84: string;
  q85: string; q86: string;
};

const blank = (): DiagData => ({
  q01: '', q02: '', q03: '', q04: '', q05: '', q06: '', q07: [], q08: '', q09: '', q10: '',
  q11: '', q12: '', q13: '', q14: '', q15: '', q16: '', q17: '', q18: '', q19: '', q20: '',
  q21: '', q22: '', q23: '', q24: '', q25: '', q26: '', q27: '', q28: '', q29: '', q30: '',
  q31: '', q32: '', q33: '', q34: '', q35: '', q36: '', q37: '', q38: '', q39: '', q40: '',
  q41: [], q42: '', q43: '', q44: '', q45: '', q46: '', q47: '', q48: [], q49: '', q50: '',
  q51: '', q52: '', q53: '', q54: '', q55: [], q56: '', q57: '', q58: '', q59: '', q60: '',
  q61: [], q62: '', q63: '', q64: '', q65: '', q66: '', q67: '', q68: '', q69: '', q70: [],
  q71: [], q72: '', q73: '', q74: '', q75: '', q76: [], q77: '', q78: '', q79: [], q80: [],
  q81: [], q82: '', q83: [], q84: '', q85: '', q86: '',
});

const STORE_KEY = (id: string) => `diag_v1_${id}`;

// ─── Component ────────────────────────────────────────────────────────────────

interface DiagnosticoFormProps {
  clientId: string;
}

export const DiagnosticoForm = ({ clientId }: DiagnosticoFormProps) => {
  const toast = useToast();

  const [data, setData] = useState<DiagData>(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY(clientId));
      return raw ? { ...blank(), ...JSON.parse(raw) } : blank();
    } catch {
      return blank();
    }
  });

  const [savedAt, setSavedAt] = useState<string | null>(() => {
    try { return localStorage.getItem(`${STORE_KEY(clientId)}_ts`) || null; } catch { return null; }
  });

  const [openSections, setOpenSections] = useState<Set<number>>(
    () => new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  );

  // ── Setters ────────────────────────────────────────────────────────────────

  const st = (f: keyof DiagData, v: string | string[]) =>
    setData(prev => ({ ...prev, [f]: v }));

  const tog = (f: keyof DiagData, v: string) => {
    const cur = data[f] as string[];
    st(f, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
  };

  const toggleSection = (n: number) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  const handleSave = () => {
    try {
      localStorage.setItem(STORE_KEY(clientId), JSON.stringify(data));
      const ts = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
      localStorage.setItem(`${STORE_KEY(clientId)}_ts`, ts);
      setSavedAt(ts);
      toast.success('Diagnóstico guardado.');
    } catch {
      toast.error('No fue posible guardar el diagnóstico.');
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const tf = (label: string, f: keyof DiagData, ph?: string) => (
    <div className="advisor-field">
      <label>{label}</label>
      <input
        type="text"
        value={data[f] as string}
        onChange={e => st(f, e.target.value)}
        placeholder={ph}
      />
    </div>
  );

  const df = (label: string, f: keyof DiagData) => (
    <div className="advisor-field">
      <label>{label}</label>
      <input type="date" value={data[f] as string} onChange={e => st(f, e.target.value)} />
    </div>
  );

  const ta = (label: string, f: keyof DiagData, rows = 3) => (
    <div className="advisor-field">
      <label>{label}</label>
      <textarea value={data[f] as string} onChange={e => st(f, e.target.value)} rows={rows} />
    </div>
  );

  const sel = (label: string, f: keyof DiagData, opts: string[]) => (
    <div className="advisor-field">
      <label>{label}</label>
      <select value={data[f] as string} onChange={e => st(f, e.target.value)}>
        <option value="">— Selecciona —</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const chk = (label: string, f: keyof DiagData, opts: string[]) => {
    const val = data[f] as string[];
    return (
      <div className="advisor-field">
        <label>{label}</label>
        <div className="diag-checkbox-grid">
          {opts.map(o => (
            <label key={o} className={`diag-checkbox-item${val.includes(o) ? ' is-checked' : ''}`}>
              <input type="checkbox" checked={val.includes(o)} onChange={() => tog(f, o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const row2 = (a: React.ReactNode, b: React.ReactNode) => (
    <div className="advisor-register-row">{a}{b}</div>
  );

  const section = (num: number, title: string, fields: React.ReactNode[], extraClass?: string) => {
    const open = openSections.has(num);
    return (
      <div className={`diag-section${extraClass ? ` ${extraClass}` : ''}`}>
        <button
          type="button"
          className="diag-section-head"
          onClick={() => toggleSection(num)}
          aria-expanded={open}
        >
          <span className="diag-section-num">Sección {num}</span>
          <span className="diag-section-title">{title}</span>
          <span className="diag-section-chevron" aria-hidden>{open ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              className="diag-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              {fields.map((field, i) => (
                <React.Fragment key={i}>{field}</React.Fragment>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="diag-wrap">
      <div className="diag-wrap-header">
        <div>
          <span className="advisor-kicker">Diagnóstico Estratégico</span>
          <p className="diag-wrap-sub">
            Formato Maestro — Integración Inicial Advisory Fiscal, Corporativo y Patrimonial
          </p>
        </div>
        <div className="diag-save-row">
          {savedAt && <span className="diag-saved-status">✓ Guardado el {savedAt}</span>}
          <button type="button" className="advisor-submit" onClick={handleSave}>
            Guardar diagnóstico
          </button>
        </div>
      </div>

      {/* ── Sección 1 ── */}
      {section(1, 'Información General del Cliente', [
        row2(
          tf('1. Nombre completo / Razón social', 'q01'),
          tf('2. RFC', 'q02'),
        ),
        tf('3. Giro principal de la empresa', 'q03'),
        ta('4. Actividades secundarias o líneas de negocio adicionales', 'q04'),
        row2(
          df('5. Fecha de inicio de operaciones', 'q05'),
          tf('6. Ciudad y estado donde opera principalmente', 'q06'),
        ),
        chk('7. Países donde tiene presencia u operaciones', 'q07',
          ['México', 'Estados Unidos', 'Panamá', 'Latinoamérica', 'Europa', 'Asia', 'Otro']),
        tf('8. Página web y/o redes sociales', 'q08'),
        row2(
          tf('9. Nombre del contacto principal', 'q09'),
          tf('10. Puesto del contacto principal', 'q10'),
        ),
        row2(
          tf('11. Teléfono de contacto', 'q11'),
          tf('12. Correo electrónico', 'q12'),
        ),
        tf('13. ¿Quién refirió al cliente o cómo llegó con nosotros?', 'q13'),
      ])}

      {/* ── Sección 2 ── */}
      {section(2, 'Contexto y Estructura Empresarial', [
        ta('14. Describe brevemente cómo inició la empresa y su evolución.', 'q14'),
        sel('15. ¿Actualmente opera como?', 'q15',
          ['Persona Física', 'Persona Moral', 'Ambas']),
        sel('16. ¿Cuántas empresas forman parte actualmente de la operación?', 'q16',
          ['1', '2 a 3', '4 a 6', 'Más de 6']),
        ta('17. Describe brevemente qué función cumple cada empresa.', 'q17'),
        sel('18. ¿Cuenta con holding empresarial?', 'q18',
          ['Sí', 'No', 'En proceso']),
        sel('19. ¿Cuenta con empresas relacionadas o partes relacionadas?', 'q19',
          ['Sí', 'No']),
        ta('20. Describe cómo se relacionan entre sí las empresas o partes relacionadas.', 'q20'),
        sel('21. ¿Cuenta con operaciones internacionales?', 'q21',
          ['Sí', 'No']),
        ta('22. Describa cómo funcionan actualmente las operaciones internacionales.', 'q22'),
        sel('23. ¿Cuenta con LLC, entidades extranjeras o estructuras fuera de México?', 'q23',
          ['Sí', 'No']),
        ta('24. Describir estructura internacional actual.', 'q24'),
        sel('25. ¿Cuenta con socios, accionistas o inversionistas?', 'q25',
          ['Sí', 'No']),
        ta('26. Describir socios, porcentajes y nivel de participación operativa.', 'q26'),
        sel('27. ¿Existen acuerdos entre socios formalizados?', 'q27',
          ['Sí', 'No', 'Parcialmente']),
        ta('28. ¿Cómo se toman actualmente las decisiones importantes?', 'q28'),
      ])}

      {/* ── Sección 3 ── */}
      {section(3, 'Operación y Recursos Humanos', [
        sel('29. Número aproximado de trabajadores', 'q29',
          ['1 a 10', '11 a 30', '31 a 50', '51 a 100', '101 a 300', 'Más de 300']),
        sel('30. ¿Todo el personal se encuentra registrado ante IMSS?', 'q30',
          ['Sí', 'No', 'Parcialmente']),
        ta('31. En caso negativo, describa los esquemas utilizados.', 'q31'),
        sel('32. ¿La nómina es administrada por?', 'q32',
          ['Área interna', 'Despacho externo', 'Mixto']),
        tf('33. Nombre del despacho o contador actual', 'q33'),
        sel('34. ¿Cuenta con organigrama, manuales o procesos documentados?', 'q34',
          ['Sí', 'No', 'Parcialmente']),
        sel('35. ¿Actualmente considera que existe orden administrativo y financiero dentro de la operación?', 'q35',
          ['Sí', 'No', 'Parcialmente']),
        ta('36. Observaciones relevantes sobre operación interna', 'q36'),
      ])}

      {/* ── Sección 4 ── */}
      {section(4, 'Información Financiera y Fiscal', [
        sel('37. Facturación anual aproximada', 'q37',
          ['Menos de $10M', '$10M a $30M', '$30M a $50M', '$50M a $100M', '$100M a $500M', 'Más de $500M']),
        tf('38. Proyección estimada para el ejercicio actual', 'q38'),
        sel('39. ¿Actualmente considera que paga muchos impuestos?', 'q39',
          ['Sí', 'No', 'No está seguro']),
        sel('40. ¿Cuenta actualmente con estrategia fiscal?', 'q40',
          ['Sí', 'No', 'No está seguro']),
        chk('41. ¿Ha recibido requerimientos, auditorías o revisiones por parte de autoridades?', 'q41',
          ['SAT', 'IMSS', 'INFONAVIT', 'Restricción de sello digital', 'Cartas invitación', 'Créditos fiscales', 'Demandas laborales', 'Multas', 'Ninguno']),
        ta('42. Describa brevemente los problemas o situaciones presentadas.', 'q42'),
        sel('43. ¿Existen declaraciones, obligaciones o trámites pendientes?', 'q43',
          ['Sí', 'No', 'No está seguro']),
        sel('44. ¿Existen ejercicios fiscales con pérdidas recurrentes o utilidades mínimas?', 'q44',
          ['Sí', 'No', 'No está seguro']),
        sel('45. ¿Existen operaciones relevantes con partes relacionadas?', 'q45',
          ['Sí', 'No']),
        ta('46. Describir operaciones relevantes entre empresas relacionadas.', 'q46'),
        ta('47. Observaciones fiscales relevantes', 'q47'),
      ])}

      {/* ── Sección 5 ── */}
      {section(5, 'Socios, Formas de Cobro y Flujo de Dinero', [
        chk('48. ¿Cómo reciben ingresos actualmente los socios/directivos?', 'q48',
          ['Nómina', 'Honorarios', 'Dividendos', 'Comisiones', 'Regalías', 'Arrendamiento', 'Retiros informales', 'Otro']),
        ta('49. Describir estructura actual de pagos a socios/directivos.', 'q49'),
        sel('50. ¿Existen préstamos, retiros o aportaciones vigentes?', 'q50',
          ['Sí', 'No']),
        ta('51. En caso afirmativo, describir estructura y soporte documental.', 'q51'),
        sel('52. ¿Existen contratos formales que respalden las formas de cobro?', 'q52',
          ['Sí', 'No', 'Parcialmente']),
        sel('53. ¿Existe separación clara entre finanzas personales y empresariales?', 'q53',
          ['Sí', 'No', 'Parcialmente']),
      ])}

      {/* ── Sección 6 ── */}
      {section(6, 'Activos, Patrimonio y Protección', [
        sel('54. ¿Cuenta con inmuebles?', 'q54', ['Sí', 'No']),
        chk('55. ¿A nombre de quién se encuentran los inmuebles?', 'q55',
          ['Persona Física', 'Empresa', 'Ambas']),
        sel('56. ¿Cuenta con vehículos o activos relevantes?', 'q56', ['Sí', 'No']),
        ta('57. Describa activos relevantes de la empresa o socios.', 'q57'),
        sel('58. ¿Cuenta actualmente con protección patrimonial estructurada?', 'q58',
          ['Sí', 'No', 'No está seguro']),
        sel('59. ¿Cuenta con seguros patrimoniales, empresariales o hombre clave?', 'q59',
          ['Sí', 'No']),
        sel('60. ¿Cuenta con planeación sucesoria o protocolos familiares?', 'q60',
          ['Sí', 'No', 'En proceso']),
      ])}

      {/* ── Sección 7 ── */}
      {section(7, 'Activos Intangibles', [
        chk('61. ¿Cuenta con activos intangibles?', 'q61',
          ['Marca registrada', 'Marca no registrada', 'Software propio', 'Plataforma digital',
           'Base de datos', 'Cursos o contenido digital', 'Comunidad digital', 'Franquicias',
           'Know how', 'Licencias', 'Derechos de autor', 'Metodologías', 'Otro']),
        ta('62. Describa los activos intangibles más importantes.', 'q62'),
        sel('63. ¿Los activos se encuentran protegidos legalmente?', 'q63',
          ['Sí', 'No', 'Parcialmente']),
        sel('64. ¿Actualmente generan ingresos?', 'q64',
          ['Sí', 'No', 'Parcialmente']),
        sel('65. ¿Existe valuación formal de dichos activos?', 'q65', ['Sí', 'No']),
      ])}

      {/* ── Sección 8 ── */}
      {section(8, 'Contratos, Materialidad y Cumplimiento', [
        sel('66. ¿Cuenta con contratos formales con clientes, proveedores o aliados?', 'q66',
          ['Sí', 'No', 'Parcialmente']),
        sel('67. ¿Cuenta con expedientes o soporte documental suficiente de operaciones?', 'q67',
          ['Sí', 'No', 'Parcialmente']),
        sel('68. ¿Cuenta con documentación que respalde ingresos y deducciones?', 'q68',
          ['Sí', 'No', 'Parcialmente']),
        ta('69. Observaciones relevantes sobre contratos y materialidad', 'q69'),
      ])}

      {/* ── Sección 9 ── */}
      {section(9, 'Necesidades, Preocupaciones y Objetivos', [
        chk('70. ¿Qué le preocupa actualmente?', 'q70',
          ['Pago elevado de impuestos', 'Riesgo SAT', 'Problemas entre socios', 'Riesgos laborales',
           'Falta de contratos', 'Desorden administrativo', 'Crecimiento sin estructura',
           'Protección patrimonial', 'Flujo de efectivo', 'Internacionalización',
           'Dependencia operativa', 'Protección familiar', 'Otro']),
        chk('71. ¿Qué le gustaría mejorar, optimizar o proteger?', 'q71',
          ['Holding', 'Planeación fiscal', 'Reducción ISR', 'Blindaje patrimonial',
           'Gobierno corporativo', 'Contratos', 'Internacionalización', 'LLC USA',
           'Planeación sucesoria', 'Protección familiar', 'Materialidad',
           'Empresa de servicios', 'Reestructura societaria', 'Flujo de efectivo', 'Otro']),
        ta('72. Describa cuál considera actualmente su principal problema o necesidad.', 'q72'),
        ta('73. ¿Qué espera lograr con esta asesoría o diagnóstico?', 'q73'),
        ta('74. ¿Qué sería un resultado exitoso para usted?', 'q74'),
        sel('75. Nivel de urgencia', 'q75',
          ['Inmediato', 'Próximos 30 días', 'Próximos 90 días', 'Planeación anual', 'Exploratorio']),
      ])}

      {/* ── Sección 10 ── */}
      {section(10, 'Documentación Disponible', [
        chk('76. Documentación proporcionada por el cliente', 'q76',
          ['Constancia de situación fiscal', 'Declaraciones anuales', 'Balanza de comprobación',
           'Acta constitutiva', 'Opinión de cumplimiento', 'Contratos', 'Estados financieros',
           'Organigrama', 'Nómina', 'Títulos de marca', 'Otro']),
        ta('77. Documentación pendiente por solicitar', 'q77'),
      ])}

      {/* ── Sección 11 — Uso interno ── */}
      {section(11, 'Diagnóstico Interno — Uso Exclusivo del Equipo', [
        sel('78. Nivel de oportunidad detectado', 'q78',
          ['Bajo', 'Medio', 'Alto', 'Premium']),
        chk('79. Perfil del cliente', 'q79',
          ['Conservador', 'Agresivo', 'Técnico', 'Emocional', 'Ordenado',
           'Desordenado', 'Abierto a estrategia', 'Resistente al cambio']),
        chk('80. Riesgos detectados', 'q80',
          ['Riesgo SAT', 'Materialidad débil', 'Mezcla PF/PM', 'Retiros sin soporte',
           'Problemas laborales', 'Falta de contratos', 'Riesgo patrimonial',
           'Operaciones internacionales riesgosas', 'Socios conflictivos',
           'Desorden administrativo', 'Otro']),
        chk('81. Oportunidades detectadas', 'q81',
          ['Holding', 'Empresa de servicios', 'Regalías', 'Estrategia fiscal',
           'Internacionalización', 'LLC', 'Protección patrimonial', 'Gobierno corporativo',
           'Planeación sucesoria', 'Reestructura', 'Materialidad', 'Optimización de socios', 'Otro']),
        ta('82. Observaciones internas relevantes', 'q82'),
        chk('83. Área prioritaria para revisión consultiva', 'q83',
          ['Fiscal', 'Corporativa', 'Patrimonial', 'Laboral', 'Internacional', 'Contractual', 'Financiera']),
        sel('84. Prioridad del caso', 'q84', ['Baja', 'Media', 'Alta', 'Urgente']),
        row2(
          tf('85. Responsable asignado', 'q85'),
          df('86. Fecha tentativa de siguiente reunión', 'q86'),
        ),
      ], 'diag-section-internal')}

      <div className="diag-save-bar">
        {savedAt && <span className="diag-saved-status">✓ Guardado el {savedAt}</span>}
        <button type="button" className="advisor-submit" onClick={handleSave}>
          Guardar diagnóstico
        </button>
      </div>
    </div>
  );
};
