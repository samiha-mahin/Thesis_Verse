import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Download,
  Library,
  Settings,
  LogOut,
  ShieldCheck,
  Globe,
  ArrowLeft
} from 'lucide-react';
import AdminLogin from './AdminLogin';
import Overview from './pages/Overview';
import UsersPage from './pages/UsersPage';
import GuidelinesPage from './pages/GuidelinesPage';
import TemplatesPage from './pages/TemplatesPage';
import JournalsPage from './pages/JournalsPage';
import SettingsPage from './pages/SettingsPage';
import { getAdminSession, adminLogout } from '../services/adminApi';

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'guidelines', label: 'Thesis Guidelines', icon: BookOpen },
  { key: 'templates', label: 'Templates', icon: Download },
  { key: 'journals', label: 'Journal Guide', icon: Library },
  { key: 'settings', label: 'Settings', icon: Settings }
];

const pageFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  const cleanKey = hash.replace(/^admin\/?/, '').replace(/^admin-/, '');
  return NAV.some((n) => n.key === cleanKey) ? cleanKey : 'overview';
};

export default function AdminApp({ onExit }) {
  const [admin, setAdmin] = useState(() => getAdminSession());
  const [page, setPage] = useState(pageFromHash);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleExit = () => {
    if (typeof onExit === 'function') {
      onExit();
    } else {
      window.location.hash = '#home';
    }
  };

  if (!admin) {
    return <AdminLogin onLogin={setAdmin} onExit={handleExit} />;
  }

  const go = (key) => {
    window.location.hash = `admin-${key}`;
    setPage(key);
  };

  const logout = () => {
    adminLogout();
    setAdmin(null);
  };

  const pageProps = { notify: setToast };

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <div className="adm-brand-icon">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="adm-brand-title">ThesisVerse Admin</p>
            <p className="adm-brand-sub">IIUC Control Panel</p>
          </div>
          <div className="md:hidden ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={handleExit}
              title="Return to public website"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`adm-nav-btn ${page === key ? 'active' : ''}`}
              onClick={() => go(key)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}

          {/* Quick link back to website */}
          <div className="pt-3 mt-3 border-t border-white/10 hidden md:block">
            <button
              type="button"
              className="adm-nav-btn text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
              onClick={handleExit}
            >
              <Globe className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>View Main Website</span>
            </button>
          </div>
        </nav>

        <div className="adm-sidebar-footer">
          <div className="min-w-0">
            <p className="adm-user-name">{admin.name}</p>
            <p className="adm-user-email">{admin.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm flex-1"
              onClick={handleExit}
              title="Return to website"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="adm-main">
        {page === 'overview' && <Overview onNavigate={go} />}
        {page === 'users' && <UsersPage {...pageProps} />}
        {page === 'guidelines' && <GuidelinesPage {...pageProps} />}
        {page === 'templates' && <TemplatesPage {...pageProps} />}
        {page === 'journals' && <JournalsPage {...pageProps} />}
        {page === 'settings' && <SettingsPage admin={admin} onAdminChange={setAdmin} {...pageProps} />}
      </main>

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  );
}
