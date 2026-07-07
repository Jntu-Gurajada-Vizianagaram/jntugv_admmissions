import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getApplicationStatus } from '../lib/api';
import CandidateStatusCard from './CandidateStatusCard';
import './StatusPage.css';

export default function StatusPage() {
  const [searchParams] = useSearchParams();
  const [registrationNo, setRegistrationNo] = useState(searchParams.get('reg') || '');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (event) => {
    event?.preventDefault();
    if (!registrationNo.trim()) return;

    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const result = await getApplicationStatus(registrationNo.trim());
      setStatus(result);
    } catch (err) {
      setError(err.message || 'Unable to find application');
    } finally {
      setLoading(false);
    }
  }, [registrationNo]);

  useEffect(() => {
    if (searchParams.get('reg')) lookup();
  }, [lookup, searchParams]);

  return (
    <div className="status-page">
      <section className="status-panel">
        <div>
          <p className="page-kicker">Application Tracking</p>
          <h2>Check Your Application Status</h2>
          <p className="status-copy">Use the registration number generated only after complete final submission. If you have not submitted yet, start the application first.</p>
        </div>

        <form className="status-form" onSubmit={lookup}>
          <div className="form-group-floating">
            <input
              className="form-input-floating"
              placeholder=" "
              value={registrationNo}
              onChange={(event) => setRegistrationNo(event.target.value.toUpperCase())}
            />
            <label className="form-label-floating">Submitted Application Registration Number</label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Search size={18} />
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        {error && <div className="status-error">{error}</div>}

        <CandidateStatusCard application={status} />

        <Link to="/application-RUKF-IIBMP" className="status-link">New candidate: start application</Link>
      </section>
    </div>
  );
}
