import React, { useRef, useEffect } from 'react';
import consultoresImg from '../../../assets/Consultores.png';

// Video referenced by static path (uploaded directly to Hostinger)
const fondoFrase = '/assets/FONDO FRASE.mp4';

const ParallaxBreak: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force video playback with Intersection Observer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Function to attempt playback with retries
    const playWithRetry = () => {
      const attempt = (retries = 0) => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (retries < 5) {
              console.log(`Parallax video play attempt ${retries + 1} failed, retrying...`);
              setTimeout(() => attempt(retries + 1), 300);
            }
          });
        }
      };
      attempt();
    };

    // Try to play immediately
    playWithRetry();

    // Also use Intersection Observer to play when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && video.paused) {
            console.log('Video entering viewport, attempting to play...');
            playWithRetry();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(video);

    // Also try after videos are fully loaded
    const timeout = setTimeout(() => {
      if (video.paused) {
        console.log('Fallback: attempting to play parallax video...');
        playWithRetry();
      }
    }, 2000);

    return () => {
      observer.unobserve(video);
      clearTimeout(timeout);
    };
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
