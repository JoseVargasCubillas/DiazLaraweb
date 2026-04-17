import React from 'react';
import { C, PARTNERS } from '../data';

const Partners: React.FC = () => {
  const doubled = [...PARTNERS, ...PARTNERS];

  return (
    <section style={{ padding: '52px 0', background: C.offWhite, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto 28px', padding: '0 48px' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: C.textLight, letterSpacing: 2.5, textTransform: 'uppercase', textAlign: 'center' }}>
          Confían en nosotros
        </div>
      </div>

      {/* Marquee */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Fade edges */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to right, ${C.offWhite}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to left, ${C.offWhite}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', animation: 'scrollLogos 28s linear infinite', width: 'max-content' }}>
          {doubled.map((p, i) => (
            <div key={i} style={{
              padding: '10px 32px', whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              color: C.textLight, letterSpacing: 0.3,
              borderRight: `1px solid ${C.border}`,
            }}>{p}</div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
