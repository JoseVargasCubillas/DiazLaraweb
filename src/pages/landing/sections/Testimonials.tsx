import React from 'react';
import { TESTIMONIALS } from '../data';
import fotoGamaliel from '../../../assets/fotogamaliel.png';
import fotoOscar from '../../../assets/fotooscar.png';
import fotoMiguel from '../../../assets/fotomiguel.png';
import monograma from '../../../assets/monograma.png';

const avatarImages: Record<string, string> = {
  gamaliel: fotoGamaliel,
  oscar: fotoOscar,
  miguel: fotoMiguel,
};

const Testimonials: React.FC = () => (
  <>
    {/* Testimonials Section */}
    <section className="testimonials-section">
      <div className="testimonials-container">
        {/* Header */}
        <div className="testimonials-header">
          <div className="testimonials-label">
            TESTIMONIOS REALES
          </div>
          <h2 className="testimonials-title">
            Resultados que hablan por sí solos
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="testimonials-list">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              {/* Quote Content */}
              <div className="testimonial-content">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{t.text}</p>
              </div>

              {/* Author Info */}
              <div className="testimonial-author">
                <img
                  src={avatarImages[t.avatar]}
                  alt={t.name}
                  className="testimonial-avatar"
                />
                <div className="testimonial-name">{t.name}</div>
                <div className="testimonial-role">{t.role}</div>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Logo Section with Gradient */}
    <section className="logo-gradient-section">
      <div className="logo-gradient-container">
        <img
          src={monograma}
          alt="Díaz Lara"
          className="logo-gradient-image"
        />
      </div>
    </section>
  </>
);

export default Testimonials;
