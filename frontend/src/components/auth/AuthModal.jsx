import React, { useState, useEffect } from 'react';
import { X, Lock, GraduationCap, UserRound, ShieldCheck } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { adminLogin } from '../../services/adminApi';
import '../../styles/auth/AuthModal.css';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAuthMode('login');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
  };

  const switchRole = (nextRole) => {
    setRole(nextRole);
    if (nextRole === 'admin') {
      setAuthMode('login');
    }
    setError('');
  };

  const handleLogin = async (values) => {
    setError('');

    if (role === 'admin') {
      const res = await adminLogin(values.identifier, values.password);
      if (!res.ok) {
        setError(res.error || 'Invalid admin credentials');
        return;
      }
      setError('');
      window.location.hash = '#admin';
      if (onLoginSuccess) onLoginSuccess(res.admin);
      if (onClose) onClose();
      return;
    }

    const result = await login({ ...values, role });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    if (onLoginSuccess) onLoginSuccess(result.user);
    if (onClose) onClose();
  };

  const handleRegister = async (values) => {
    setError('');
    const result = await register({ ...values, role });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    if (onLoginSuccess) onLoginSuccess(result.user);
    if (onClose) onClose();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-box" onClick={(e) => e.stopPropagation()}>
        
        <div className="auth-modal-header">
          <div className="auth-header-brand">
            <div className="auth-logo-circle">
              {role === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-white" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="auth-header-title">
                {role === 'admin' ? 'IIUC Admin Control Panel' : 'IIUC ThesisVerse Authentication'}
              </h3>
              <p className="auth-header-subtitle">
                {role === 'admin'
                  ? 'Sign in to access department oversight, user database & guidelines'
                  : 'Unlock supervisor contacts, supervision requests, downloads & AI assistant'}
              </p>
            </div>
          </div>

          <button type="button" className="auth-close-btn" onClick={onClose} aria-label="Close modal">
            <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>

        {/* 3-Way Role Switcher: Student | Supervisor | Admin */}
        <div className="auth-role-switch">
          <button
            type="button"
            className={`auth-role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => switchRole('student')}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>
          <button
            type="button"
            className={`auth-role-btn ${role === 'supervisor' ? 'active' : ''}`}
            onClick={() => switchRole('supervisor')}
          >
            <UserRound className="w-4 h-4" />
            <span>Supervisor</span>
          </button>
          <button
            type="button"
            className={`auth-role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => switchRole('admin')}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Mode Tabs (hidden for Admin since Admin accounts are institutional) */}
        {role !== 'admin' && (
          <div className="auth-tabs-wrapper">
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              New Registration
            </button>
          </div>
        )}

        <div className="auth-modal-body">
          {authMode === 'login' ? (
            <LoginForm
              key={`login-${role}`}
              role={role}
              error={error}
              onSubmit={handleLogin}
              onSwitchToRegister={() => switchMode('register')}
            />
          ) : (
            <RegisterForm
              key={`register-${role}`}
              role={role}
              error={error}
              onSubmit={handleRegister}
              onSwitchToLogin={() => switchMode('login')}
            />
          )}
        </div>

        <div className="auth-security-footer">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {role === 'admin'
              ? 'Restricted to authorized IIUC departmental administrators.'
              : 'Restricted to IIUC students and faculty with valid institutional credentials.'}
          </span>
        </div>

      </div>
    </div>
  );
}
