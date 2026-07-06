import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './ModernHeader.css';

export default function ModernHeader() {
  return (
    <header className="modern-header">
      <div className="header-container">
        <div className="header-logo-section">
          <Link to="/" className="logo-link">
            <div className="modern-emblem">
              <span>JNTU</span>
              <span className="gv">GV</span>
            </div>
            <div className="header-titles">
              <h1 className="header-main-title">Directorate of Admissions</h1>
              <h2 className="header-sub-title">Jawaharlal Nehru Technological University Gurajada Vizianagaram</h2>
            </div>
          </Link>
        </div>
        <nav className="header-nav">
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><a href="/#details">Program</a></li>
            <li><NavLink to="/status">Status</NavLink></li>
            <li><NavLink to="/admin">College Console</NavLink></li>
            <li>
              <Link to="/application-RUKF-IIBMP" className="btn btn-primary nav-cta">
                Apply Now
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
