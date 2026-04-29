import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'סיסמה',
  required = false,
  minLength,
  className = '',
  autoComplete,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`input pr-10 pl-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink transition"
        tabIndex={-1}
        aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
