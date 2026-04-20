import React, { useEffect, useState, useRef } from 'react';
import { HERO_SLIDES, parseHighlight } from '../data';
import fondoHero from '../../../assets/FONDO HERO.mp4';
import videoWebDL from '../../../assets/VIDEO WEB DL.mp4';

interface HeroProps {
  scrollTo: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ scrollTo }) => {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [previewMuted, setPreviewMuted] = useState(false);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Try to play with sound on load
  useEffect(() => {
    const video = previewVideoRef.current;
    if (video) {
      video.muted = false;
      video.play().catch(() => {
        // Browser blocked autoplay with sound, fallback to muted
        video.muted = true;
        setPreviewMuted(true);
        video.play();
      });
    }
  }, []);

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
      if (e.key === 'Escape') closeModal();
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

  // Auto-play modal video when opened, mute preview
  useEffect(() => {
    if (videoModalOpen) {
      if (modalVideoRef.current) {
        modalVideoRef.current.play();
        setIsPlaying(true);
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.muted = true;
        setPreviewMuted(true);
      }
    }
  }, [videoModalOpen]);

  const closeModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
    setVideoModalOpen(false);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.pause();
      } else {
        modalVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const togglePreviewMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewVideoRef.current) {
      previewVideoRef.current.muted = !previewVideoRef.current.muted;
      setPreviewMuted(previewVideoRef.current.muted);
    }
  };

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
                {/* Video preview with autoplay */}
                <video
                  ref={previewVideoRef}
                  className="hero-video-preview"
                  autoPlay
                  loop
                  playsInline
                >
                  <source src={videoWebDL} type="video/mp4" />
                </video>

                {/* Mute/Unmute button */}
                <button
                  onClick={togglePreviewMute}
                  className="video-mute-btn"
                >
                  {previewMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 9l-6 6M17 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

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
        <div className="video-modal-overlay" onClick={closeModal}>
          {/* Close button */}
          <button
            onClick={closeModal}
            className="video-modal-close"
          >
            ×
          </button>

          {/* Video container */}
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <video
              ref={modalVideoRef}
              className="video-modal-player"
              playsInline
              onClick={togglePlay}
            >
              <source src={videoWebDL} type="video/mp4" />
            </video>

            {/* Play/Pause overlay button */}
            {!isPlaying && (
              <div className="video-modal-play-overlay" onClick={togglePlay}>
                <div className="video-modal-play-btn">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5.14v14.72a1 1 0 001.5.86l11.5-7.36a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" fill="rgba(255,255,255,0.9)" />
                  </svg>
                </div>
              </div>
            )}

            {/* Controls bar */}
            <div className="video-modal-controls">
              <button onClick={togglePlay} className="video-control-btn">
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="6" y="4" width="4" height="16" rx="1" fill="white" />
                    <rect x="14" y="4" width="4" height="16" rx="1" fill="white" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5.14v14.72a1 1 0 001.5.86l11.5-7.36a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" fill="white" />
                  </svg>
                )}
              </button>
              <button onClick={closeModal} className="video-control-btn video-control-close">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;
