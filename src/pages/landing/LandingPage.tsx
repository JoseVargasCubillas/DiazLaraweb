import React, { useEffect, useRef, useState } from 'react';
import './landing.css';

import NavBar        from './sections/NavBar';
import Hero          from './sections/Hero';
// import Partners      from './sections/Partners'; // Hidden - pending approval
import Services      from './sections/Services';
import ParallaxBreak from './sections/ParallaxBreak';
import About         from './sections/About';
import Testimonials  from './sections/Testimonials';
import SessionForm   from './sections/SessionForm';
import FAQ           from './sections/FAQ';
import CTABanner     from './sections/CTABanner';
import Footer        from './sections/Footer';

const SECTION_IDS = ['inicio', 'servicios', 'nosotros', 'sesion', 'faq'];

const LandingPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('inicio');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
    );
    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
  };

  return (
    <div className="dl-landing">
      <NavBar activeSection={activeSection} scrollTo={scrollTo} />

      <div id="inicio">
        <Hero scrollTo={scrollTo} />
      </div>

      {/* Partners section hidden - pending approval */}
      {/* <Partners /> */}

      <div id="servicios">
        <Services scrollTo={scrollTo} />
      </div>

      <ParallaxBreak />

      <div id="nosotros">
        <About />
      </div>

      <Testimonials />

      <div id="sesion">
        <SessionForm />
      </div>

      <div id="faq">
        <FAQ />
      </div>

      <CTABanner scrollTo={scrollTo} />

      <Footer scrollTo={scrollTo} />
    </div>
  );
};

export default LandingPage;
