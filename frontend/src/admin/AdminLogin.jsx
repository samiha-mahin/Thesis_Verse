import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, KeyRound, ArrowLeft, Info } from 'lucide-react';
import { adminLogin } from '../services/adminApi';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

export default function AdminLogin({ onLogin, onExit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);

  useEffect(() => {
    if (lockLeft <= 0) return undefined;
    const t = setTimeout(() => setLockLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockLeft > 0 || loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await adminLogin(email, password);
      setLoading(false);

      if (result.ok) {
        onLogin(result.admin);
        return;
      }

      const next = attempts + 1;
      setAttempts(next);
      setPassword('');
      if (next >= MAX_ATTEMPTS) {
        setAttempts(0);
        setLockLeft(LOCK_SECONDS);
        setError(`Too many failed attempts. Try again in ${LOCK_SECONDS} seconds.`);
      } else {
        setError(result.error || 'Invalid admin credentials');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Server connection error');
    }
  };

  const fillDemo = () => {
    setEmail('admin@iiuc.ac.bd');
    setPassword('Admin@12345');
  };

  const handleBack = () => {
    if (typeof onExit === 'function') {
      onExit();
    } else {
      window.location.hash = '#home';
    }
  };

  return (
    <div className="adm-login-wrap">
      <form className="adm-login-card" onSubmit={handleSubmit}>
        <div className="adm-login-logo">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="adm-login-title">ThesisVerse Admin</h1>
          <p className="adm-login-sub">IIUC Departmental Management &amp; Content Control</p>
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="adm-email">Admin email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="adm-email"
              type="email"
              className="adm-input adm-input-with-icon"
              autoComplete="username"
              placeholder="admin@iiuc.ac.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="adm-password">Password</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="adm-password"
              type="password"
              className="adm-input adm-input-with-icon"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <p className="adm-error">
            {lockLeft > 0 ? `Too many failed attempts. Try again in ${lockLeft}s.` : error}
          </p>
        )}

        <button type="submit" className="adm-btn adm-btn-primary w-full" disabled={lockLeft > 0 || loading}>
          {loading ? 'Authenticating...' : 'Sign In as Administrator'}
        </button>

        <button
          type="button"
          className="adm-btn adm-btn-secondary w-full"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Main Website</span>
        </button>

        {/* Quick Demo Helper */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Default Seed Credentials:</span>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="text-[11px] font-mono text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 cursor-pointer transition-colors"
          >
            admin@iiuc.ac.bd · Admin@12345 (Auto-fill)
          </button>
        </div>
      </form>
    </div>
  );
}
