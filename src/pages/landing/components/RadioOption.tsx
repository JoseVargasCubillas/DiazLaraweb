import React from 'react';
import { C } from '../data';

interface RadioOptionProps {
  value:    string;
  current:  string;
  onChange: (v: string) => void;
  label:    string;
}

const RadioOption: React.FC<RadioOptionProps> = ({ value, current, onChange, label }) => {
  const active = current === value;
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'rgba(19,48,90,0.06)' : 'transparent',
        border: `1.5px solid ${active ? C.navy : C.border}`,
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${active ? C.navy : C.textLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.navy }} />}
      </div>
      <input type="radio" value={value} checked={active} onChange={() => onChange(value)} style={{ display: 'none' }} />
      <span style={{
        fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: active ? C.textDark : C.textMid, fontWeight: active ? 600 : 400,
      }}>{label}</span>
    </label>
  );
};

export default RadioOption;
