import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { updateAdminAccount } from '../../services/adminApi';
import api from '../../services/api';

export default function SettingsPage({ admin, onAdminChange, notify }) {
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Gemini AI Status
  const [aiStatus, setAiStatus] = useState({
    loading: true,
    geminiEnabled: false,
    model: '',
    provider: 'Google Gemini AI',
    status: 'checking'
  });

  const checkAiStatus = async () => {
    setAiStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.getChatStatus();
      if (res && res.ok) {
        setAiStatus({
          loading: false,
          geminiEnabled: res.geminiEnabled,
          model: res.model,
          provider: res.provider || 'Google Gemini AI',
          status: res.status
        });
      } else {
        setAiStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setAiStatus((prev) => ({ ...prev, loading: false, status: 'error' }));
    }
  };

  useEffect(() => {
    checkAiStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    const result = await updateAdminAccount(admin.id, { name, email, currentPassword, newPassword });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdminChange(result.admin);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    notify('Admin account updated');
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your admin account and platform intelligence settings." />

      <div className="flex flex-col gap-6 max-w-3xl">
        {/* Gemini AI Status Card */}
        <div className="adm-card p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Google Gemini AI Assistant</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time neural intelligence powering the ThesisVerse research assistant chatbot.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={checkAiStatus}
              title="Refresh AI Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiStatus.loading ? 'animate-spin' : ''}`} />
              <span>Verify</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {aiStatus.geminiEnabled ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Status: {aiStatus.geminiEnabled ? 'Connected & Active' : 'API Key Setup Ready'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {aiStatus.geminiEnabled
                    ? `Powered by ${aiStatus.model} with MongoDB Atlas context injection.`
                    : 'Running on contextual knowledge engine. Add GEMINI_API_KEY to activate generative responses.'}
                </p>
              </div>
            </div>

            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="adm-btn adm-btn-secondary adm-btn-sm shrink-0"
            >
              <span>Google AI Studio</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
            <strong>How to configure:</strong> Open <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">backend/.env</code> and set <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">GEMINI_API_KEY=your_key_here</code>. The chatbot automatically incorporates verified IIUC supervisor profiles, guidelines, templates, and journal links into Gemini&apos;s system prompt.
          </div>
        </div>

        {/* Admin Account Settings */}
        <form className="adm-card p-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <h2 className="text-base font-bold text-slate-900">Admin Account Credentials</h2>
          <div className="adm-grid-2">
            <div className="adm-field">
              <label className="adm-label">Name</label>
              <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="adm-field">
              <label className="adm-label">Admin email</label>
              <input type="email" className="adm-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <p className="adm-section-title">Change password (optional)</p>
          <div className="adm-grid-2">
            <div className="adm-field adm-span-2">
              <label className="adm-label">Current password</label>
              <input type="password" className="adm-input" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">New password</label>
              <input type="password" className="adm-input" autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">Confirm new password</label>
              <input type="password" className="adm-input" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>

          {error && <p className="adm-error">{error}</p>}

          <div>
            <button type="submit" className="adm-btn adm-btn-primary">Save changes</button>
          </div>
        </form>
      </div>
    </>
  );
}
