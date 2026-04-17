import React, { useState } from 'react';
import { SERVICES } from '../data';

interface ServicesProps {
  scrollTo: (id: string) => void;
}

const Services: React.FC<ServicesProps> = ({ scrollTo }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="services-section">
      <div className="services-container">
        {/* Header */}
        <div className="services-header">
          <div className="services-label">
            NUESTRAS DISCIPLINAS
          </div>
          <h2 className="services-title">
            Servicios de consultoría
          </h2>
          <p className="services-subtitle">
            Equipo multidisciplinario con más de 15 años resolviendo asuntos de alta complejidad.
          </p>
        </div>

        {/* Accordion */}
        <div className="services-accordion">
          {SERVICES.map(s => {
            const isOpen = expandedId === s.id;
            return (
              <div
                key={s.id}
                className={`service-item ${isOpen ? 'open' : ''}`}
              >
                {/* Service header row */}
                <div
                  onClick={() => setExpandedId(isOpen ? null : s.id)}
                  className="service-header"
                >
                  <span className="service-num">
                    {s.num}
                  </span>
                  <div className="service-title-group">
                    <h3 className="service-title">
                      {s.title}
                    </h3>
                    <span className="service-subtitle-text">
                      {s.subtitle}
                    </span>
                  </div>
                  <div className={`service-toggle ${isOpen ? 'open' : ''}`}>
                    +
                  </div>
                </div>

                {/* Expandable content */}
                <div className={`service-content ${isOpen ? 'open' : ''}`}>
                  <div className="service-content-inner">
                    <p className="service-desc">
                      {s.desc}
                    </p>
                    <ul className="service-features">
                      {s.features.map((f, fi) => (
                        <li key={fi} className="service-feature">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Bottom border */}
          <div className="service-border-bottom" />
        </div>

        {/* CTA Button */}
        <div className="services-cta-wrapper">
          <button
            onClick={() => scrollTo('sesion')}
            className="services-cta"
          >
            Agenda tu sesión estratégica
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
