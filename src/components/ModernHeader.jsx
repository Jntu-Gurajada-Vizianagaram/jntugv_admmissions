import React from 'react';
import { Link, NavLink } from '../lib/router';
import { LogIn } from 'lucide-react';
import { APPLICATION_COMMENCE_LABEL, useApplicationOpen } from '../utils/applicationSchedule';
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
            <li><NavLink to="/administration">Administration</NavLink></li>
            <li><NavLink to="/programmes">Programmes</NavLink></li>
            <li><NavLink to="/notifications">Notifications</NavLink></li>
            <li><NavLink to="/latest-admissions">Latest Admissions</NavLink></li>
            <li><NavLink to="/contact">Contact Us</NavLink></li>
            <li><NavLink to="/admin">Department Login</NavLink></li>
            <li>
              {applicationOpen ? (
                <Link to="/login" className="btn btn-primary nav-cta">
                  <LogIn size={16} />
                  Applicant Login
                </Link>
              ) : (
                <span className="btn btn-primary nav-cta application-link-disabled" title={APPLICATION_COMMENCE_LABEL}>
                  <LogIn size={16} />
                  Commences 5 PM Today
                </span>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
