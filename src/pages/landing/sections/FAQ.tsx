import React, { useState } from 'react';
import { FAQS } from '../data';

const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  const leftFaqs = FAQS.filter((_, i) => i % 2 === 0);
  const rightFaqs = FAQS.filter((_, i) => i % 2 === 1);

  const renderFaq = (faq: typeof FAQS[0], realIdx: number) => {
    const isOpen = openId === realIdx;
    return (
      <div key={realIdx} className={`faq-item ${isOpen ? 'open' : ''}`}>
        <button
          onClick={() => setOpenId(isOpen ? null : realIdx)}
          className="faq-question"
        >
          <span className="faq-question-text">{faq.q}</span>
          <span className="faq-toggle">+</span>
        </button>
        <div className={`faq-answer ${isOpen ? 'open' : ''}`}>
          <p>{faq.a}</p>
        </div>
      </div>
    );
  };

  return (
    <section id="faq" className="faq-section">
      <div className="faq-container">
        <div className="faq-header">
          <div className="faq-label">PREGUNTAS FRECUENTES</div>
          <h2 className="faq-title">Resolvemos tus dudas</h2>
        </div>

        <div className="faq-grid">
          <div className="faq-column">
            {leftFaqs.map((faq, idx) => renderFaq(faq, idx * 2))}
          </div>
          <div className="faq-column">
            {rightFaqs.map((faq, idx) => renderFaq(faq, idx * 2 + 1))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
