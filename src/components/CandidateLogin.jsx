import React, { useCallback, useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { useLocation, useNavigate, useSearchParams } from '../lib/routerHooks';
import { CheckCircle2, LogIn, Search, UserPlus } from 'lucide-react';
import { applicantLogin, getApplicationStatus, registerApplicant } from '../lib/api';
import { useForm } from '../context/useForm';
import { APPLICATION_COMMENCE_LABEL, useApplicationOpen } from '../utils/applicationSchedule';
import CandidateStatusCard from './CandidateStatusCard';
import PasswordField from './PasswordField';
import './CandidateLogin.css';

export default function CandidateLogin() {
  const applicationOpen = useApplicationOpen();
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreServerDraft } = useForm();
  const [searchParams] = useSearchParams();
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', mobile: '' });
  const [applicantCredentials, setApplicantCredentials] = useState({ username: '', password: '' });
  const [registrationNo, setRegistrationNo] = useState((searchParams.get('reg') || '').toUpperCase());
  const [application, setApplication] = useState(null);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const activeRoute = location.pathname === '/status'
    ? 'status'
    : location.pathname === '/login'
      ? 'login'
      : 'register';

  useEffect(() => {
    if (location.state?.message) setMessage(location.state.message);
  }, [location.state]);

  const handleSubmittedStatus = useCallback(async (event) => {
    event.preventDefault();
    if (!registrationNo.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');
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

  const handleApplicantRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setApplication(null);

    try {
      const result = await registerApplicant({
        year: '2026',
        processCode: 'IIBMP',
        ...registerForm,
      });
      setApplicantCredentials(prev => ({ ...prev, username: result.applicant.username }));
      setRegisterForm({ name: '', email: '', mobile: '' });
      navigate('/login', {
        state: {
          message: `${result.message} Applicant username: ${result.applicant.username}`,
        },
      });
    } catch (err) {
      setError(err.message || 'Unable to register applicant');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicantLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setApplication(null);

    try {
      const result = await applicantLogin(applicantCredentials);
      if (result.submittedApplication?.registrationNo) {
        setApplication(result.submittedApplication);
        navigate(`/status?reg=${encodeURIComponent(result.submittedApplication.registrationNo)}`, {
          state: {
            message: 'Your application has already been submitted. Current status is shown below.',
          },
        });
        return;
      }
      await restoreServerDraft(result.draft, result.applicant);
      navigate('/application-RUKF-IIBMP');
    } catch (err) {
      setError(err.message || 'Unable to continue application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const reg = searchParams.get('reg');
    if (reg) handleSubmittedStatus({ preventDefault: () => {} });
  }, [handleSubmittedStatus, searchParams]);

  return (
    <div className="candidate-login-page">
      <section className="candidate-login-panel">
        <div className="candidate-login-copy">
          <p className="page-kicker">Applicant Registration and Login</p>
          <h2>RUKF-IIBMP Admissions 2026-27</h2>
          <p>Register once, receive your applicant login by email, then continue the application from any device. If the email is not found in your Inbox, check the Spam/Junk folder.</p>
        </div>

        {message && (
          <div className="candidate-alert success" role="status">
            <strong>Success</strong>
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="candidate-alert error" role="alert">
            <strong>Action needed</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="candidate-login-single">
          {activeRoute === 'register' && (
          <form className="candidate-action-card primary" onSubmit={handleApplicantRegister}>
            <div>
              <span className="candidate-card-kicker">New Applicant</span>
              <h3>Create Applicant Login</h3>
              <p>Your username and password will be emailed after registration. Check your Inbox first; if not found, check the Spam/Junk folder.</p>
            </div>
            <label>
              Candidate Name
              <input
                value={registerForm.name}
                onChange={(event) => setRegisterForm(prev => ({ ...prev, name: event.target.value }))}
                placeholder="Candidate full name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm(prev => ({ ...prev, email: event.target.value }))}
                placeholder="candidate@example.com"
              />
            </label>
            <label>
              Mobile
              <input
                value={registerForm.mobile}
                onChange={(event) => setRegisterForm(prev => ({ ...prev, mobile: event.target.value }))}
                placeholder="10-digit mobile"
              />
            </label>
            <button type="submit" className="btn btn-accent" disabled={loading || !applicationOpen}>
              <UserPlus size={18} />
              {loading ? 'Registering...' : 'Register and Email Login'}
            </button>
            <div className="candidate-card-switch">
              <CheckCircle2 size={16} />
              <span>Already registered?</span>
              <Link to="/login">Login to continue</Link>
            </div>
          </form>
          )}

          {activeRoute === 'login' && (
          <form className="candidate-action-card" onSubmit={handleApplicantLogin}>
            <div>
              <span className="candidate-card-kicker">Returning Applicant</span>
              <h3>Continue Application</h3>
              <p>Use the applicant login sent to your email. If it is not in your Inbox, check the Spam/Junk folder.</p>
            </div>
            <label>
              Applicant Username
              <input
                value={applicantCredentials.username}
                onChange={(event) => setApplicantCredentials(prev => ({ ...prev, username: event.target.value.toUpperCase() }))}
                placeholder="IIBMP202600001"
              />
            </label>
            <label>
              Applicant Password
              <PasswordField
                value={applicantCredentials.password}
                onChange={(event) => setApplicantCredentials(prev => ({ ...prev, password: event.target.value }))}
                placeholder="Password received by email"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading || !applicationOpen}>
              <LogIn size={18} />
              {loading ? 'Opening...' : 'Login and Fill Application'}
            </button>
            <div className="candidate-card-switch">
              <span>New applicant?</span>
              <Link to="/register">Register first</Link>
            </div>
          </form>
          )}

          {activeRoute === 'status' && (
        <form className="candidate-action-card submitted-status-form" onSubmit={handleSubmittedStatus}>
          <div>
            <span className="candidate-card-kicker">Submitted Applicant</span>
            <h3>Check Submitted Status</h3>
            <p>Use the final registration number generated after submission.</p>
          </div>
          <label>
            Submitted Application Registration Number
            <input
              value={registrationNo}
              onChange={(event) => setRegistrationNo(event.target.value.toUpperCase())}
              placeholder="JNTUGV-IIBMP-2026-XXXXXX"
            />
          </label>
          <button type="submit" className="btn btn-outline" disabled={loading}>
            <Search size={18} />
            {loading ? 'Checking...' : 'View Submitted Status'}
          </button>
          <div className="candidate-card-switch">
            <span>Still filling the form?</span>
            <Link to="/login">Login to continue</Link>
          </div>
        </form>
          )}
        </div>

        <CandidateStatusCard application={application} />
        {!applicationOpen && (
          <div className="candidate-login-actions">
            <span className="btn btn-accent application-link-disabled" aria-disabled="true">
              <Search size={18} />
              {APPLICATION_COMMENCE_LABEL}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
