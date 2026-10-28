import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import '../../styles/footer/Footer.css';

export default function Footer({ onOpenAuthModal, isLoggedIn, onNavigateToAdmin }) {
  const handleFeatureLink = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      if (typeof onOpenAuthModal === 'function') onOpenAuthModal();
    }
  };

  const handleAdminLink = (e) => {
    if (typeof onNavigateToAdmin === 'function') {
      e.preventDefault();
      onNavigateToAdmin();
    } else {
      window.location.hash = '#admin';
    }
  };

  return (
    <footer className="footer-root">
      <div className="footer-container">
        
        <div className="footer-main-grid">
          
          <div className="footer-brand-column">
            <a href="#home" className="footer-logo-link">
              <div className="footer-logo-circle">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="footer-brand-text">
                <span className="footer-brand-prefix">IIUC </span>
                <span className="footer-brand-suffix">ThesisVerse</span>
              </div>
            </a>
            
            <p className="footer-brand-desc">
              An intelligent thesis supervision &amp; academic resource universe for IIUCians. Powered by Department of CSE &amp; EEE.
            </p>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-column-heading">Quick Resources</h4>
            
            <div className="footer-links-two-cols">
              
              <ul className="footer-links-list">
                <li>
                  <a href="#supervisors" className="footer-link-item" onClick={handleFeatureLink}>Supervisor Directory</a>
                </li>
                <li>
                  <a href="#journals" className="footer-link-item" onClick={handleFeatureLink}>Journal &amp; Paper Discovery</a>
                </li>
                <li>
                  <a href="#ai-assistant" className="footer-link-item" onClick={handleFeatureLink}>AI Research Assistant</a>
                </li>
              </ul>

              <ul className="footer-links-list">
                <li>
                  <a href="#guidelines" className="footer-link-item" onClick={handleFeatureLink}>Thesis &amp; Defense Guidelines</a>
                </li>
                <li>
                  <a href="#templates" className="footer-link-item" onClick={handleFeatureLink}>Download Templates Center</a>
                </li>
                <li>
                  <a
                    href="#admin"
                    className="footer-link-item flex items-center gap-1.5 text-emerald-400 font-semibold hover:text-emerald-300"
                    onClick={handleAdminLink}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Control Panel</span>
                  </a>
                </li>
              </ul>

            </div>
          </div>

        </div>

        <div className="footer-bottom-bar flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="footer-copyright-text">
            &copy; 2026 IIUC ThesisVerse · International Islamic University Chittagong. All rights reserved.
          </p>
          <button
            type="button"
            onClick={handleAdminLink}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-transparent border-0 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Administrator Access</span>
          </button>
        </div>

      </div>
    </footer>
  );
}