import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LogIn, Search } from 'lucide-react';
import { getApplicationStatus } from '../lib/api';
import CandidateStatusCard from './CandidateStatusCard';
import './CandidateLogin.css';

export default function CandidateLogin() {
  const [searchParams] = useSearchParams();
  const [registrationNo, setRegistrationNo] = useState((searchParams.get('reg') || '').toUpperCase());
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async (event) => {
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
  }, [registrationNo]);

  useEffect(() => {
    const reg = searchParams.get('reg');
    if (reg) handleLogin({ preventDefault: () => {} });
  }, [handleLogin, searchParams]);

  return (
    <div className="candidate-login-page">
      <section className="candidate-login-panel">
        <div className="candidate-login-copy">
          <p className="page-kicker">Submitted Application Login</p>
          <h2>RUKF-IIBMP Admissions 2026-27</h2>
          <p>Application registration number is generated only after final submission. New candidates should start the application first; submitted candidates can use the generated number to view status and verification progress.</p>
        </div>

        <form className="candidate-login-form" onSubmit={handleLogin}>
          <label>
            Submitted Application Registration Number
            <input
              value={registrationNo}
              onChange={(event) => setRegistrationNo(event.target.value.toUpperCase())}
              placeholder="JNTUGV-IIBMP-2026-XXXXXX"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Checking...' : 'View Submitted Application'}
          </button>
        </form>

        {error && <div className="status-error">{error}</div>}

        <CandidateStatusCard application={application} />

        <div className="candidate-login-actions">
          <Link to="/application-RUKF-IIBMP" className="btn btn-accent">
            <Search size={18} />
            New Candidate: Start Application
          </Link>
        </div>
      </section>
    </div>
  );
}
