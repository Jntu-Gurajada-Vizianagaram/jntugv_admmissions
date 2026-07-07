import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import './ModernHeader.css';

export default function ModernHeader() {
  return (
    <header className="modern-header">
      <div className="header-container">
        <div className="header-logo-section">
          <Link to="/" className="logo-link">
            <img className="modern-emblem" src="/jntugv-logo.png" alt="JNTUGV" />
            <div className="header-titles">
              <h1 className="header-main-title">Directorate of Admissions</h1>
              <h2 className="header-sub-title">Jawaharlal Nehru Technological University Gurajada Vizianagaram</h2>
            </div>
          </Link>
        </div>
        <nav className="header-nav">
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/application-RUKF-IIBMP">Application</NavLink></li>
            <li><NavLink to="/status">Status</NavLink></li>
            <li><NavLink to="/admin">College Console</NavLink></li>
            <li>
              <Link to="/application-RUKF-IIBMP" className="btn btn-primary nav-cta">
                <ClipboardList size={16} />
                Apply
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
