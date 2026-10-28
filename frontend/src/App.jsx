import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import AdminApp from './admin/AdminApp';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ContentProvider } from './context/ContentContext';
import { ChatProvider } from './context/ChatContext';
import './styles/admin/Admin.css';

const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const path = window.location.pathname || '';
  return path.startsWith('/admin') || hash.startsWith('#admin') || hash === '#admin-panel';
};

export default function App() {
  const [isAdminView, setIsAdminView] = useState(checkIsAdminRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdminRoute());
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleExitAdmin = () => {
    window.location.hash = '#home';
    setIsAdminView(false);
  };

  const handleOpenAdmin = () => {
    window.location.hash = '#admin';
    setIsAdminView(true);
  };

  return (
    <AuthProvider>
      <AppDataProvider>
        <ContentProvider>
          <ChatProvider>
            <div className="w-full min-h-screen flex flex-col">
              {isAdminView ? (
                <AdminApp onExit={handleExitAdmin} />
              ) : (
                <Home onNavigateToAdmin={handleOpenAdmin} />
              )}
            </div>
          </ChatProvider>
        </ContentProvider>
      </AppDataProvider>
    </AuthProvider>
  );
}
