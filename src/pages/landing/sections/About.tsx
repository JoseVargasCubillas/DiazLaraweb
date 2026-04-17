import React from 'react';
import { C } from '../data';

const CARDS = [
  { title: 'Qué nos distingue',        desc: 'Enfoque integral que combina técnica fiscal, orientación empresarial y experiencia multidisciplinaria para soluciones que protegen y potencian tu organización.' },
  { title: 'Cómo trabajamos',          desc: 'Modelo colaborativo con especialistas de distintas áreas. Analizamos riesgos con visión estratégica y diseñamos planes desde la prevención hasta la defensa.' },
  { title: 'Qué resultados generamos', desc: 'Organizaciones más fuertes: reducimos riesgos legales y fiscales, optimizamos recursos y generamos certidumbre en un entorno regulatorio cambiante.' },
];

const About: React.FC = () => (
  <section id="nosotros" style={{ padding: '120px 48px', background: C.navy }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 72 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: C.cream, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 16 }}>
          Así marcamos la diferencia
        </div>
        <h2 style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -1 }}>
          Excelencia y orientación al cliente
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {CARDS.map((c, i) => (
          <div
            key={i}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,232,224,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderNav;              e.currentTarget.style.transform = ''; }}
            style={{
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.borderNav}`,
              borderRadius: 12, padding: '40px 28px', transition: 'all 0.4s',
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: C.cream, letterSpacing: 2, marginBottom: 24 }}>0{i + 1}</div>
            <h3 style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: -0.3 }}>{c.title}</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, margin: 0 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
