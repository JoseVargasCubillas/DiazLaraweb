import React from 'react';

const CARDS = [
  { title: 'Qué nos distingue',        desc: 'Enfoque integral que combina técnica fiscal, orientación empresarial y experiencia multidisciplinaria para soluciones que protegen y potencian tu organización.' },
  { title: 'Cómo trabajamos',          desc: 'Modelo colaborativo con especialistas de distintas áreas. Analizamos riesgos con visión estratégica y diseñamos planes desde la prevención hasta la defensa.' },
  { title: 'Qué resultados generamos', desc: 'Organizaciones más fuertes: reducimos riesgos legales y fiscales, optimizamos recursos y generamos certidumbre en un entorno regulatorio cambiante.' },
];

const About: React.FC = () => (
  <section id="nosotros" className="about-section">
    <div className="about-container">
      <div className="about-header">
        <div className="about-label">
          Así marcamos la diferencia
        </div>
        <h2 className="about-title">
          Excelencia y orientación al cliente
        </h2>
      </div>

      <div className="about-grid">
        {CARDS.map((c, i) => (
          <div key={i} className="about-card">
            <div className="about-card-num">0{i + 1}</div>
            <h3 className="about-card-title">{c.title}</h3>
            <p className="about-card-desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
