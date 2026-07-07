import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Search } from 'lucide-react';
import { getApplicationStatus } from '../lib/api';
import CandidateStatusCard from './CandidateStatusCard';
import './CandidateLogin.css';

export default function CandidateLogin() {
  const [registrationNo, setRegistrationNo] = useState('');
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!registrationNo.trim()) return;

    setLoading(true);
    setError('');
    setApplication(null);

    try {
      const result = await getApplicationStatus(registrationNo.trim());
      setApplication(result);
    } catch (err) {
      setError(err.message || 'Unable to find application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-login-page">
      <section className="candidate-login-panel">
        <div className="candidate-login-copy">
          <p className="page-kicker">Candidate Login</p>
          <h2>RUKF-IIBMP Admissions 2026-27</h2>
          <p>Use your application registration number to view the submitted application status and admissions office verification progress.</p>
        </div>

        <form className="candidate-login-form" onSubmit={handleLogin}>
          <label>
            Application Registration Number
            <input
              value={registrationNo}
              onChange={(event) => setRegistrationNo(event.target.value.toUpperCase())}
              placeholder="JNTUGV-IIBMP-2026-XXXXXX"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>

        {error && <div className="status-error">{error}</div>}

        <CandidateStatusCard application={application} />

        <div className="candidate-login-actions">
          <Link to="/application-RUKF-IIBMP" className="btn btn-accent">
            <Search size={18} />
            Start Application
          </Link>
          <Link
            to={application?.registrationNo ? `/status?reg=${encodeURIComponent(application.registrationNo)}` : '/status'}
            className="btn btn-outline"
          >
            Track by Status Page
          </Link>
        </div>
      </section>
    </div>
  );
}
