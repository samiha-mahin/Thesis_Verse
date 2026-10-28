import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ShieldCheck, Info } from 'lucide-react';
import '../../styles/auth/LoginForm.css';

export default function LoginForm({ role = 'student', error, onSubmit, onSwitchToRegister }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const isSupervisor = role === 'supervisor';
  const isAdmin = role === 'admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ identifier, password });
    }
  };

  const handleFillDemoAdmin = () => {
    setIdentifier('admin@iiuc.ac.bd');
    setPassword('Admin@12345');
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      
      <div className="form-group">
        <label className="form-label">
          {isAdmin ? 'Admin Email' : isSupervisor ? 'IIUC Email' : 'Student ID or Email'}
        </label>
        <div className="form-input-wrapper">
          {isAdmin ? (
            <ShieldCheck className="form-field-icon text-emerald-600" />
          ) : (
            <Mail className="form-field-icon" />
          )}
          <input
            type={isAdmin ? 'email' : 'text'}
            className="form-input-field"
            placeholder={
              isAdmin
                ? 'admin@iiuc.ac.bd'
                : isSupervisor
                ? 'e.g. name@iiuc.ac.bd'
                : 'e.g. C223205 or @ugrad.iiuc.ac.bd'
            }
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <div className="password-label-row">
          <label className="form-label">Password</label>
          {!isAdmin && <a href="#forgot" className="forgot-link">Forgot password?</a>}
        </div>
        <div className="form-input-wrapper">
          <KeyRound className="form-field-icon" />
          <input
            type="password"
            className="form-input-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {isAdmin && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px]">Seed: admin@iiuc.ac.bd</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemoAdmin}
            className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      )}

      {error && <p className="form-error-text">{error}</p>}

      <button type="submit" className="login-submit-btn">
        <Lock className="w-3.5 h-3.5" />
        <span>
          Sign In as {isAdmin ? 'Administrator' : isSupervisor ? 'Supervisor' : 'Student'}
        </span>
      </button>

      {!isAdmin && (
        <div className="switch-auth-text">
          <span>Don&apos;t have an account yet? </span>
          <button
            type="button"
            className="switch-auth-link"
            onClick={onSwitchToRegister}
          >
            Register Here
          </button>
        </div>
      )}

    </form>
  );
}
