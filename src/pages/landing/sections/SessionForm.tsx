import React, { useEffect } from 'react';
import { SESSION_BENEFITS } from '../data';
import icon01 from '../../../assets/icon01.png';
import icon02 from '../../../assets/icon02.png';
import icon03 from '../../../assets/icon03.png';
import icon04 from '../../../assets/icon04.png';

const iconImages: Record<string, string> = {
  icon01, icon02, icon03, icon04,
};

const HUBSPOT_SCRIPT_SRC = 'https://js.hsforms.net/forms/embed/developer/49215056.js';
const HUBSPOT_FORM_ID = '06a5e57c-726d-4581-8978-a7ceea2b770d';
const HUBSPOT_PORTAL_ID = '49215056';

/**
 * SessionForm — Asesoría Inicial 2026
 * Renderiza el formulario embebido de HubSpot (Developer embed v4).
 * El submit lo maneja HubSpot directamente; los leads llegan al CRM del cliente.
 */
const SessionForm: React.FC = () => {
  useEffect(() => {
    // Carga el script de HubSpot una sola vez.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${HUBSPOT_SCRIPT_SRC}"]`);
    if (existing) return;
    const script = document.createElement('script');
    script.src = HUBSPOT_SCRIPT_SRC;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return (
    <section className="session-section">
      <div className="session-container">
        <div className="session-grid">
          {/* Left: HubSpot form */}
          <div className="session-form-wrapper">
            <h2 className="session-title">
              Asesoría Inicial<br />2026 · Díaz Lara
            </h2>
            <p className="session-subtitle">
              Completa el siguiente formulario y agendaremos tu sesión estratégica.
            </p>

            <div className="session-hubspot-wrapper">
              <div
                className="hs-form-html"
                data-region="na1"
                data-form-id={HUBSPOT_FORM_ID}
                data-portal-id={HUBSPOT_PORTAL_ID}
              />
            </div>
          </div>

          {/* Right: Benefits panel */}
          <div className="session-info-wrapper">
            <div className="session-info-card session-info-card-light">
              <div className="session-info-header session-info-header-light">
                <h3 className="session-info-title-dark">Qué obtendrás en esta sesión</h3>
                <p className="session-info-subtitle-dark">
                  30 min para entender tu operación y proponerte el mejor siguiente paso.
                </p>
              </div>
              <div className="session-info-content session-info-content-light">
                <div className="session-benefits">
                  {SESSION_BENEFITS.map((b) => (
                    <div key={b.title} className="session-benefit">
                      <img src={iconImages[b.icon]} alt="" className="session-benefit-icon" />
                      <div className="session-benefit-text">
                        <div className="session-benefit-title-dark">{b.title}</div>
                        <div className="session-benefit-desc-dark">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="session-info-note-dark">
                  Esta sesión es de carácter informativo y exploratorio, por lo que no
                  constituye una asesoría fiscal, legal o financiera personalizada.
                </p>
              </div>
            </div>
            <div className="session-info-footer">
              Tus datos se envían de forma segura al CRM de Díaz Lara.<br />
              Confirmamos en menos de 24 hrs.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SessionForm;
