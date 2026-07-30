import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './PasswordField.css';

export default function PasswordField({
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
  required = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onInput={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((next) => !next)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
