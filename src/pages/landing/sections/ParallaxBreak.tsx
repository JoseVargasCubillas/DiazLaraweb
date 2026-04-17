import React from 'react';
import consultoresImg from '../../../assets/Consultores.png';
import fondoFrase from '../../../assets/FONDO FRASE.mp4';

const ParallaxBreak: React.FC = () => {
  return (
    <div className="parallax-section">
      {/* Team Image */}
      <div className="parallax-image-container">
        <img
          src={consultoresImg}
          alt="Equipo Díaz Lara Consultores"
          className="parallax-image"
        />
      </div>

      {/* Video Banner with Text */}
      <div className="parallax-video-banner">
        {/* Video Background */}
        <video
          className="parallax-video-bg"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={fondoFrase} type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="parallax-overlay" />

        {/* Content */}
        <div className="parallax-content">
          <div className="parallax-label">
            MÁS DE 15 AÑOS DE TRAYECTORIA
          </div>
          <h2 className="parallax-title">
            Protegemos lo que<br />
            <span className="parallax-title-italic">más te importa</span>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default ParallaxBreak;
