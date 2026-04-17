import React from 'react';

interface CTABannerProps {
  scrollTo: (id: string) => void;
}

const CTABanner: React.FC<CTABannerProps> = ({ scrollTo }) => (
  <section className="cta-section">
    <div className="cta-container">
      <div className="cta-content">
        <h2 className="cta-title">¿Listo para dar el siguiente paso?</h2>
        <p className="cta-subtitle">
          Agenda tu llamada de diagnóstico y recibe una estrategia personalizada.
        </p>
      </div>
      <button onClick={() => scrollTo('sesion')} className="cta-button">
        Reserva tu videollamada
      </button>
    </div>
  </section>
);

export default CTABanner;
