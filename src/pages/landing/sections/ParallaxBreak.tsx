import React, { useRef, useEffect } from 'react';
import consultoresImg from '../../../assets/Consultores.png';

// Video referenced by static path (uploaded directly to Hostinger)
const fondoFrase = '/assets/FONDO FRASE.mp4';

const ParallaxBreak: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use Intersection Observer to play video when it enters viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in viewport, try to play
            video.muted = true;
            const playPromise = video.play();

            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.log('Video play error:', error);
              });
            }
          } else {
            // Video left viewport, pause it
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
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
