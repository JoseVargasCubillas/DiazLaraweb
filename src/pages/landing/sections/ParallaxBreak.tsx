import React, { useRef, useEffect } from 'react';
import consultoresImg from '../../../assets/Consultores.png';

// Video referenced by static path (uploaded directly to Hostinger)
const fondoFrase = '/assets/FONDO FRASE.mp4';

const ParallaxBreak: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force video playback on mount with retry logic
  useEffect(() => {
    const playVideo = (video: HTMLVideoElement | null, name: string) => {
      if (!video) return;

      // Immediate attempt
      const attempt = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log(`${name} autoplay blocked, retrying...`);
            // Retry after a short delay
            setTimeout(attempt, 500);
          });
        }
      };

      attempt();
    };

    playVideo(videoRef.current, 'Parallax video');

    // Also try after a slight delay in case resources aren't loaded
    const timeout = setTimeout(() => {
      playVideo(videoRef.current, 'Parallax video (retry)');
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);
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
          ref={videoRef}
          className="parallax-video-bg"
          muted
          autoPlay
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
