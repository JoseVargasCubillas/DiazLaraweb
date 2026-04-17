import React, { useState } from 'react';
import { SERVICE_OPTIONS, SESSION_BENEFITS } from '../data';
import icon01 from '../../../assets/icon01.png';
import icon02 from '../../../assets/icon02.png';
import icon03 from '../../../assets/icon03.png';
import icon04 from '../../../assets/icon04.png';

const iconImages: Record<string, string> = {
  icon01, icon02, icon03, icon04,
};

interface FormState {
  name: string;
  email: string;
  phone: string;
  services: string[];
}

const EMPTY: FormState = {
  name: '', email: '', phone: '', services: [],
};

const SessionForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleService = (s: string) =>
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(s)
        ? prev.services.filter(x => x !== s)
        : [...prev.services, s],
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `SESIÓN ESTRATÉGICA DÍAZ LARA`,
      ``,
      `── CONTACTO ──────────────────────────────`,
      `Nombre   : ${form.name}`,
      `Email    : ${form.email}`,
      `Teléfono : +52 ${form.phone}`,
      ``,
      `── SERVICIOS DE INTERÉS ──────────────────`,
      form.services.join('\n'),
    ].join('\n');

    const mailto = `mailto:ti@diegodiaz.mx?subject=${encodeURIComponent('Sesión Estratégica — ' + form.name)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="sesion" className="session-section">
        <div className="session-success">
          <div className="session-success-icon">✓</div>
          <h2 className="session-success-title">¡Solicitud enviada!</h2>
          <p className="session-success-text">
            Se abrió tu cliente de correo con la solicitud. Confirmamos en menos de 24 hrs.
          </p>
          <button
            onClick={() => { setForm(EMPTY); setSubmitted(false); }}
            className="session-success-btn"
          >Nueva solicitud</button>
        </div>
      </section>
    );
  }

  return (
    <section id="sesion" className="session-section">
      <div className="session-container">
        <div className="session-grid">
          {/* Left: Form */}
          <div className="session-form-wrapper">
            <h2 className="session-title">
              Solicitar sesión<br />estratégica en Díaz Lara
            </h2>
            <p className="session-subtitle">
              Completa tus datos y te contactaremos para confirmar fecha y hora.
            </p>

            <div className="session-content-grid">
              <form onSubmit={handleSubmit} className="session-form">
                {/* Name & Email row */}
                <div className="session-form-row">
                  <div className="session-form-field">
                    <label className="session-label">Nombre*</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className="session-input"
                    />
                  </div>
                  <div className="session-form-field">
                    <label className="session-label">Correo*</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="session-input"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="session-form-field">
                  <label className="session-label">Teléfono*</label>
                  <div className="session-phone-row">
                    <div className="session-phone-prefix">
                      <span className="session-phone-flag">MX México</span>
                      <span className="session-phone-code">+52</span>
                    </div>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      className="session-input session-phone-input"
                    />
                  </div>
                </div>

                {/* Services */}
                <div className="session-form-field">
                  <label className="session-label">
                    ¿Qué servicios necesitas? <span className="session-label-hint">(puedes elegir varios)</span>
                  </label>
                  <div className="session-services-grid">
                    {SERVICE_OPTIONS.map(s => {
                      const checked = form.services.includes(s);
                      return (
                        <label key={s} className={`session-checkbox ${checked ? 'checked' : ''}`}>
                          <div className="session-checkbox-box">
                            {checked && <span>✓</span>}
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(s)}
                            style={{ display: 'none' }}
                          />
                          <span className="session-checkbox-label">{s}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="session-submit">
                  Reserva tu videollamada
                </button>
              </form>

              {/* Right: Info Panel */}
              <div className="session-info-wrapper">
                <div className="session-info-panel">
                  <div className="session-info-header">
                    <span className="session-info-label">SESIÓN ESTRATÉGICA</span>
                    <span className="session-info-time">15 MIN</span>
                  </div>

                  <div className="session-info-content">
                    <h3 className="session-info-title">Lo que obtienes en tu primera llamada:</h3>

                    <div className="session-benefits">
                      {SESSION_BENEFITS.map((b, i) => (
                        <div key={i} className="session-benefit">
                          <img src={iconImages[b.icon]} alt="" className="session-benefit-icon" />
                          <div className="session-benefit-text">
                            <div className="session-benefit-title">{b.title}</div>
                            <div className="session-benefit-desc">{b.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="session-info-note">
                      Esta sesión es de carácter informativo y exploratorio, por lo que no constituye una asesoría fiscal, legal o financiera personalizada.
                    </p>
                  </div>
                </div>

                <div className="session-info-footer">
                  Se abrirá tu correo con la solicitud.<br />
                  Confirmamos en menos de 24 hrs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SessionForm;
