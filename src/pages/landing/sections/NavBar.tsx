import React, { useEffect, useState } from 'react';
import { C } from '../data';
import logoMenu from '../../../assets/logo menu.png';

interface NavBarProps {
  activeSection: string;
  scrollTo: (id: string) => void;
}

const LINKS = [
  { label: 'Inicio',    id: 'inicio' },
  { label: 'Servicios', id: 'servicios' },
  { label: 'Nosotros',  id: 'nosotros' },
  { label: 'FAQ',       id: 'faq' },
];

const NavBar: React.FC<NavBarProps> = ({ activeSection, scrollTo }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleNavClick = (id: string) => {
    scrollTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 72,
        background: scrolled ? 'rgba(9,26,51,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(32px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.borderNav}` : 'none',
        transition: 'all 0.4s ease',
        display: 'flex', alignItems: 'center', padding: '0 48px',
      }} className="navbar">
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <button onClick={() => handleNavClick('inicio')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img
              src={logoMenu}
              alt="Díaz Lara - Firma Fiscal Empresarial"
              style={{ height: 40, width: 'auto' }}
            />
          </button>

          {/* Nav links - Desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="nav-links-desktop">
            {LINKS.map(link => {
              const active = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13.5, fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    padding: '6px 14px', borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >{link.label}</button>
              );
            })}
          </div>

          {/* CTA - Desktop */}
          <button
            onClick={() => handleNavClick('sesion')}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.cream; }}
            style={{
              padding: '9px 22px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: C.cream, color: C.navyDark,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, fontWeight: 700,
              transition: 'background 0.2s',
            }}
            className="nav-cta-desktop"
          >Agenda tu diagnóstico</button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: C.cream,
            }}
            className="mobile-menu-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 72,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(9,26,51,0.98)',
            backdropFilter: 'blur(20px)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 24px',
            animation: 'fadeIn 0.3s ease',
          }}
          className="mobile-menu"
        >
          {LINKS.map(link => {
            const active = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 18,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  padding: '16px 0',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {link.label}
              </button>
            );
          })}
          <button
            onClick={() => handleNavClick('sesion')}
            style={{
              marginTop: 24,
              padding: '14px 24px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: C.cream,
              color: C.navyDark,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              width: '100%',
            }}
          >
            Agenda tu diagnóstico
          </button>
        </div>
      )}
    </>
  );
};

export default NavBar;
