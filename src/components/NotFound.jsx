import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-panel">
        <p className="page-kicker">404</p>
        <h2>Page Not Found</h2>
        <p>The page you opened is not available in the admissions portal.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
