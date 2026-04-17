import React, { useEffect, useState } from 'react';
import { HERO_SLIDES, parseHighlight } from '../data';
import fondoHero from '../../../assets/FONDO HERO.mp4';

interface HeroProps {
  scrollTo: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ scrollTo }) => {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % HERO_SLIDES.length);
        setVisible(true);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVideoModalOpen(false);
    };
    if (videoModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [videoModalOpen]);

  const slide = HERO_SLIDES[current];
  const headlineParts = parseHighlight(slide.headline);

  return (
    <>
      <section className="hero-section">
        {/* Video Background */}
        <video
          className="hero-video-bg"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={fondoHero} type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="hero-overlay" />

        <div className="hero-container">
          <div className="hero-grid">
            {/* Left content */}
            <div className="hero-content">
              {/* Brand label */}
              <div className="hero-label">
                DÍAZ LARA CONSULTORES
              </div>

              {/* Headline with Libre Baskerville */}
              <h1
                className="hero-headline"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(12px)',
                }}
              >
                {headlineParts.map((part, i) =>
                  part.highlighted ? (
                    <span key={i} className="hero-highlight">{part.text}</span>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </h1>

              {/* Sub */}
              <p
                className="hero-sub"
                style={{
                  opacity: visible ? 1 : 0,
                }}
              >
                {slide.sub}
              </p>

              {/* Slide indicators */}
              <div className="hero-indicators">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true); }, 300); }}
                    className={`hero-indicator ${i === current ? 'active' : ''}`}
                  />
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => scrollTo('sesion')}
                className="hero-cta"
              >
                Reserva tu videollamada
              </button>
            </div>

            {/* Right side - Video Preview Block */}
            <div className="hero-video-wrapper">
              <div
                onClick={() => setVideoModalOpen(true)}
                className="hero-video-block"
              >
                {/* Díaz Lara label inside video */}
                <div className="video-brand">
                  Díaz Lara
                </div>

                {/* Play button */}
                <div className="video-play-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5.14v14.72a1 1 0 001.5.86l11.5-7.36a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" fill="rgba(255,255,255,0.9)" />
                  </svg>
                </div>

                {/* Video duration */}
                <div className="video-duration">
                  03:24
                </div>
              </div>

              {/* Caption below video */}
              <p className="video-caption">
                Conoce nuestros servicios y cómo podemos ayudarte
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="video-modal-overlay" onClick={() => setVideoModalOpen(false)}>
          {/* Close button */}
          <button
            onClick={() => setVideoModalOpen(false)}
            className="video-modal-close"
          >
            ×
          </button>

          {/* Video container */}
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <div className="video-modal-placeholder">
              <div className="video-modal-brand">Díaz Lara</div>
              <div className="video-modal-text">Video de presentación</div>
              <div className="video-modal-soon">(Próximamente)</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;
