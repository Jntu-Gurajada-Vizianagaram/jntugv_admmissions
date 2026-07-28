import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { APPLICATION_OPEN_LABEL, useApplicationOpen } from '../utils/applicationSchedule';
import './ModernHeader.css';

export default function ModernHeader() {
  const applicationOpen = useApplicationOpen();
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
            <li>
              {applicationOpen
                ? <NavLink to="/application-RUKF-IIBMP">Application</NavLink>
                : <span className="application-link-disabled" title={`Opens ${APPLICATION_OPEN_LABEL}`}>Application</span>}
            </li>
            <li><NavLink to="/candidate-login">Submitted Login</NavLink></li>
            <li><NavLink to="/admin">Department Login</NavLink></li>
            <li>
              {applicationOpen ? (
                <Link to="/application-RUKF-IIBMP" className="btn btn-primary nav-cta">
                  <ClipboardList size={16} />
                  Apply
                </Link>
              ) : (
                <span className="btn btn-primary nav-cta application-link-disabled" title={`Opens ${APPLICATION_OPEN_LABEL}`}>
                  <ClipboardList size={16} />
                  Opens 30 Jul, 5 PM
                </span>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
