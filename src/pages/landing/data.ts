// ── Design tokens ──────────────────────────────────────────────────────────────
export const C = {
  navy:      '#13305a',
  navyDark:  '#0e2444',
  navyDeep:  '#091a33',
  cream:     '#efe8e0',
  offWhite:  '#f5f5f3',
  white:     '#ffffff',
  textDark:  '#0e2444',
  textMid:   '#4a5a72',
  textLight: '#8896a7',
  border:    'rgba(19,48,90,0.1)',
  borderNav: 'rgba(255,255,255,0.1)',
} as const;

// ── TypeScript interfaces ───────────────────────────────────────────────────────
export interface Service {
  id:       string;
  num:      string;
  title:    string;
  subtitle: string;
  desc:     string;
  features: string[];
}

export interface Testimonial {
  text:   string;
  name:   string;
  role:   string;
  avatar: string;
}

export interface HeroSlide {
  pre:       string;
  headline:  string;
  sub:       string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface HighlightPart {
  text:        string;
  highlighted: boolean;
}

// ── parseHighlight ──────────────────────────────────────────────────────────────
// Splits "texto {destacado} texto" into HighlightPart[]
export function parseHighlight(text: string): HighlightPart[] {
  const parts: HighlightPart[] = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), highlighted: false });
    parts.push({ text: match[1], highlighted: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), highlighted: false });
  return parts;
}

// ── SERVICES ────────────────────────────────────────────────────────────────────
export const SERVICES: Service[] = [
  {
    id: 'impuestos', num: '01',
    title: 'Impuestos',
    subtitle: 'Consultoría Fiscal',
    desc: 'Diseñamos e implementamos estrategias fiscales con sustento legal para optimizar la carga tributaria y mitigar riesgos frente a la autoridad. Nuestro enfoque no es reactivo, es estructural y preventivo.',
    features: ['Planeación fiscal estratégica', 'Cumplimiento tributario integral', 'Optimización de ISR y PTU', 'Auditoría fiscal preventiva', 'Atención y defensa ante Servicio de Administración Tributaria', 'Definición de régimen fiscal óptimo'],
  },
  {
    id: 'precios', num: '02',
    title: 'Estudios de Precios',
    subtitle: 'Precios de Transferencia',
    desc: 'Elaboramos estudios técnicos de precios de transferencia bajo estándares nacionales e internacionales, asegurando el cumplimiento y la correcta defensa de operaciones entre partes relacionadas.',
    features: ['Estudio técnico de precios de transferencia', 'Análisis funcional y de comparabilidad', 'Benchmarking especializado', 'Documentación comprobatoria', 'Declaraciones informativas', 'Defensa ante revisiones fiscales', 'Acompañamiento en reestructuras'],
  },
  {
    id: 'contabilidad', num: '03',
    title: 'Contabilidad',
    subtitle: 'Consultoría Contable',
    desc: 'Transformamos la contabilidad en una herramienta de control y toma de decisiones, asegurando información financiera confiable, oportuna y alineada a objetivos fiscales.',
    features: ['Estados financieros mensuales', 'Contabilidad electrónica', 'Control de nómina', 'Conciliaciones bancarias', 'CFDI y cumplimiento digital', 'Reportes gerenciales', 'Integración contable-fiscal'],
  },
  {
    id: 'corporativo', num: '04',
    title: 'Corporativo',
    subtitle: 'Derecho Empresarial',
    desc: 'Estructuramos y protegemos legalmente tu empresa mediante esquemas corporativos sólidos, contratos estratégicos y cumplimiento normativo alineado a tus objetivos de crecimiento.',
    features: ['Constitución y reestructura societaria', 'Contratos mercantiles y civiles', 'Asambleas y actas corporativas', 'Fusiones y escisiones', 'Gobierno corporativo'],
  },
  {
    id: 'diagnostico', num: '05',
    title: 'Diagnóstico para Metodologías',
    subtitle: 'Evaluación Estratégica',
    desc: 'Analizamos a profundidad la operación fiscal, financiera y legal de tu empresa para identificar riesgos, oportunidades y definir las metodologías óptimas de estructuración y crecimiento.',
    features: ['Diagnóstico fiscal-financiero integral', 'Identificación de riesgos críticos', 'Evaluación de materialidad', 'Definición de metodologías (Cómo Cobrar, Holding, Intangibles, etc.)', 'Plan de acción estructurado', 'Priorización estratégica', 'Base para implementación de consultoría'],
  },
  {
    id: 'patrimonial', num: '06',
    title: 'Planeación Patrimonial',
    subtitle: 'Holding y Estructuras',
    desc: 'Diseñamos estructuras patrimoniales y corporativas que permiten separar riesgos, optimizar impuestos y asegurar la continuidad y protección del patrimonio empresarial y familiar.',
    features: ['Estructuras holding', 'Reorganización corporativa', 'Fideicomisos', 'Blindaje patrimonial', 'Estrategias de dividendos', 'Planeación sucesoria', 'Protección de activos'],
  },
  {
    id: 'financiera', num: '07',
    title: 'Consultoría Financiera',
    subtitle: 'Estrategia y Análisis',
    desc: 'Convertimos la información financiera en decisiones estratégicas mediante análisis, proyecciones y modelos que permiten escalar el negocio con control.',
    features: ['Análisis financiero estratégico', 'Proyecciones y presupuestos', 'Modelos financieros', 'Evaluación de inversiones', 'Control de flujo de efectivo', 'Indicadores de gestión'],
  },
];

// ── SERVICE_OPTIONS (for the intake form) ──────────────────────────────────────
export const SERVICE_OPTIONS = [
  'Impuestos y planeación fiscal',
  'Estudios de precios de transferencia',
  'Contabilidad y nómina',
  'Corporativo y derecho empresarial',
  'Diagnóstico para metodologías',
  'Planeación patrimonial y holding',
  'Consultoría financiera',
  'No estoy seguro, necesito orientación',
];

// ── SESSION_BENEFITS ────────────────────────────────────────────────────────────
export const SESSION_BENEFITS = [
  {
    icon: 'icon01',
    title: 'Panorama inicial de tu situación',
    desc: 'Revisamos de forma general cómo estás operando hoy para entender tu contexto y ubicar posibles focos de atención.',
  },
  {
    icon: 'icon02',
    title: 'Claridad sobre lo que necesitas',
    desc: 'Te orientamos sobre el tipo de servicio o estrategia que podría ajustarse a tu caso.',
  },
  {
    icon: 'icon03',
    title: 'Siguientes pasos recomendados',
    desc: 'Te compartimos a nivel general qué camino deberías seguir para avanzar de forma ordenada.',
  },
  {
    icon: 'icon04',
    title: 'Recomendación de servicio',
    desc: 'Te indicamos cómo podemos apoyarte y cuál sería el siguiente paso para trabajar juntos.',
  },
];

// ── FAQS ────────────────────────────────────────────────────────────────────────
export const FAQS: FaqItem[] = [
  {
    q: '¿Cuánto tiempo toma el proceso?',
    a: 'La llamada toma 15 minutos, donde conversamos sobre tu situación actual, para después determinar la cotización adecuada para tu servicio.',
  },
  {
    q: '¿Cuánto cuesta la llamada de diagnóstico?',
    a: 'La llamada es gratuita, en esta te asesoraremos cual es el servicio adecuado para ti.',
  },
  {
    q: '¿Para quién está diseñado?',
    a: 'Empresarios, directores, personas físicas con actividad empresarial y familias que buscan proteger su patrimonio.',
  },
  {
    q: '¿Ya tengo contador o abogado?',
    a: 'Complementamos a tu equipo con una visión independiente y especializada. Trabajamos en coordinación o de forma independiente.',
  },
  {
    q: '¿Qué valor real obtengo?',
    a: 'Claridad y control total. Identificamos riesgos ocultos, oportunidades de optimización y un plan de acción concreto.',
  },
  {
    q: '¿Mis datos están protegidos?',
    a: '100% confidencial bajo NDA. No recibimos comisiones de terceros: asesoría objetiva garantizada.',
  },
];






// ── TESTIMONIALS ────────────────────────────────────────────────────────────────
export const TESTIMONIALS: Testimonial[] = [

  {
    text: 'Después de más de ocho años operando sin estructura formal, Diego y su equipo me acompañaron en una reestructuración fiscal completa: holding, empresa operadora, estudio de precios de transferencia, contratos con fecha cierta y migración de persona física a moral. No es el típico consultor teórico; es un mentor que ha vivido cada estrategia que enseña.',
    name: 'Lic. Gamaliel Javier Gómez García',
    role: 'Director General, Gama Industrial Especializada',
    avatar: 'gamaliel',
  },
  {
    text: 'Implementamos una estructura tipo holding para protección patrimonial y aplicamos esquemas que facilitan deducciones legítimas de regalías y comisiones entre socios. Aunque al principio parece un camino complejo, la orientación profesional de Diego genera confianza y resultados que sin duda justifican la inversión.',
    name: 'Oscar Ortega Flores',
    role: 'Director, Wisphub SA de CV',
    avatar: 'oscar',
  },
  {
    text: 'Lo que empezó como una asesoría fiscal terminó siendo una reingeniería total de mi visión como líder y de cómo dirijo mi empresa. Hoy SSIAA tiene 47 personas comprometidas, finanzas alineadas, operaciones estructuradas e indicadores reales. Diego no solo ayudó a que mi empresa crezca diez veces, también me ayudó a crecer diez veces como líder.',
    name: 'Miguel Angel Pérez',
    role: 'Socio Fundador, SSIAA',
    avatar: 'miguel',
  },
];

// ── PARTNERS ────────────────────────────────────────────────────────────────────
export const PARTNERS = [
  'Grupo Empresarial Norte',
  'Inmobiliaria Valdés',
  'Cadena Restaurantes Mex',
  'Constructora Altus',
  'Holding Familia Torres',
  'Exportadora del Bajío',
  'Clínica Santa Elena',
  'Despacho Jurídico Ríos',
  'Transportes del Pacífico',
  'Agro-Industrial Lerma',
  'Fintech Capital MX',
  'Bienes Raíces Monclova',
  'Textil San Lorenzo',
  'Distribuidora Noroeste',
  'Consultoría GBM',
];

// ── HERO_SLIDES ─────────────────────────────────────────────────────────────────
// Words in {braces} will be displayed in italic Libre Baskerville with cream color
export const HERO_SLIDES: HeroSlide[] = [
  {
    pre: 'Consultoría estratégica fiscal',
    headline: 'Tu empresa merece {certeza}, no incertidumbre fiscal',
    sub: 'Consultoría fiscal, contable y financiera con un enfoque estratégico y orientado a resultados.'
  },
  {
    pre: 'Planeación fiscal',
    headline: '¿Cuánto te está costando no tener una {estrategia} fiscal?',
    sub: 'Cada día sin un plan es dinero que tu empresa deja sobre la mesa.'
  },
  {
    pre: 'Planeación patrimonial',
    headline: 'Protege hoy lo que {construiste} durante años',
    sub: 'Estructuras holding y planeación patrimonial diseñados a tu medida.'
  },
  {
    pre: 'Defensa fiscal',
    headline: 'El SAT no espera. Tu {estrategia} tampoco debería',
    sub: 'Diagnóstico, prevención y defensa fiscal con más de 15 años de experiencia.'
  },
  {
    pre: 'Análisis financiero',
    headline: 'Decisiones sin datos es apostar. Nosotros te damos {certeza}',
    sub: 'Análisis financiero, estudios de precios y auditoría para decidir con confianza.'
  },
];
