import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardList, Download, FileSearch, LayoutDashboard, LogOut, Printer, RefreshCw, UserPlus, Users } from 'lucide-react';
import { NavLink } from '../lib/router';
import { useLocation, useNavigate, useSearchParams } from '../lib/routerHooks';
import {
  adminLogin,
  clearAdminToken,
  completeAdminPasswordReset,
  createVerificationOfficer,
  getAdminApplication,
  getAdminSession,
  listAdminApplicationReports,
  listAdminApplications,
  listVerificationOfficers,
  requestAdminPasswordReset,
  updateAdminApplication,
  updateVerificationOfficer,
  validateAdminPasswordReset,
} from '../lib/api';
import PrintableApplication from './PrintableApplication';
import PasswordField from './PasswordField';
import { printApplication } from '../utils/printApplication';
import './AdminConsole.css';

const STATUSES = ['Submitted', 'Under Review / Verification in Progress', 'Verified', 'Needs Correction', 'Rejected'];
const ROLE_LABELS = {
  admin: 'Convenor',
  'co-convenor': 'Co-convenor',
  officer: 'Verification Officer',
};
const PAYMENT_ROW_DEFINITIONS = [
  { title: 'Counselling Fee' },
  { title: 'First-Year Tuition Fee' },
];
const normalizePaymentRows = (payments = []) => PAYMENT_ROW_DEFINITIONS.map((definition, index) => ({
  title: definition.title,
  amount: '',
  txn_ref: '',
  txn_date: '',
  mode: '',
  status: '',
  ...(payments[index] || {}),
}));
const emptyStageNotes = () => Object.fromEntries(STATUSES.map(status => [status, '']));
const normalizeStatus = (status = 'Submitted') => (
  status === 'Under Review' ? 'Under Review / Verification in Progress' : status
);
const canManageAdmissions = (user) => ['admin', 'co-convenor'].includes(user?.role);
const roleLabel = (role) => ROLE_LABELS[role] || role;
const reportDateKey = (value = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date(value));
const reportDateTime = (value) => (
  value
    ? new Date(value).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : 'Not available'
);
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const reviewPath = (registrationNo) => `/admin/applications/${encodeURIComponent(registrationNo)}`;

export default function AdminConsole() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken') || '';
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetForm, setResetForm] = useState({ name: '', username: '', role: 'Verification Officer', contactNumber: '' });
  const [resetMessage, setResetMessage] = useState('');
  const [resetUser, setResetUser] = useState(null);
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [records, setRecords] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [reportDate, setReportDate] = useState('');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Submitted');
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStages, setVerificationStages] = useState(emptyStageNotes);
  const [paymentRows, setPaymentRows] = useState(() => normalizePaymentRows());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [officers, setOfficers] = useState([]);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', role: 'officer' });
  const [officerMessage, setOfficerMessage] = useState('');

  const selectedApplication = selected?.application;
  const currentVerifierName = adminUser?.name || adminUser?.username || '';
  const activeAssignees = officers.filter(officer => officer.active && ['co-convenor', 'officer'].includes(officer.role));
  const departmentLogins = officers.filter(officer => ['co-convenor', 'officer'].includes(officer.role));
  const activeSection = location.pathname.split('/')[2] || 'dashboard';
  const routeRegistrationNo = activeSection === 'applications'
    ? decodeURIComponent(location.pathname.split('/')[3] || '')
    : '';
  const isConvenor = adminUser?.role === 'admin';
  const permittedSections = isConvenor
    ? ['dashboard', 'applications', 'reports', 'users']
    : ['dashboard', 'applications'];

  const loadOfficers = useCallback(async () => {
    if (!canManageAdmissions(adminUser)) return;
    const result = await listVerificationOfficers();
    setOfficers(result.officers || []);
  }, [adminUser]);

  const loadRecords = useCallback(async () => {
    if (!adminUser) return;
    setLoading(true);
    setError('');
    try {
      const result = await listAdminApplications({ search, status });
      setRecords(result.applications || []);
    } catch (err) {
      setError(err.message || 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  }, [adminUser, search, status]);

  const loadReportRecords = useCallback(async () => {
    if (adminUser?.role !== 'admin') return;
    try {
      setError('');
      const result = await listAdminApplicationReports();
      setReportRows(result.reports || []);
    } catch (err) {
      setError(err.message || 'Unable to load daily applications report');
    }
  }, [adminUser]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const result = await adminLogin(loginForm);
      setAdminUser(result.user);
    } catch (err) {
      setLoginError(err.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    setLoginError('');
    setResetMessage('');
    setLoading(true);
    try {
      const result = await requestAdminPasswordReset(resetForm);
      setResetMessage(result.message || 'Password reset request sent.');
      setResetForm({ name: '', username: '', role: 'Verification Officer', contactNumber: '' });
      setShowResetForm(false);
    } catch (err) {
      setLoginError(err.message || 'Unable to send password reset request');
    } finally {
      setLoading(false);
    }
  };

  const completePasswordSetup = async (event) => {
    event.preventDefault();
    setLoginError('');
    setResetMessage('');
    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await completeAdminPasswordReset({ token: resetToken, password: newPasswordForm.password });
      setResetMessage(result.message || 'Password updated. You can now login.');
      setNewPasswordForm({ password: '', confirmPassword: '' });
      setResetUser(null);
      setSearchParams({});
    } catch (err) {
      setLoginError(err.message || 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAdminToken();
    setAdminUser(null);
    setSelected(null);
    setRecords([]);
    setReportRows([]);
    navigate('/admin', { replace: true });
  };

  const openRecord = useCallback(async (registrationNo) => {
    setLoading(true);
    setError('');
    try {
      const record = await getAdminApplication(registrationNo);
      const normalizedStatus = normalizeStatus(record.status);
      const normalizedStages = {
        ...emptyStageNotes(),
        ...(record.verificationStages || {}),
      };
      if (record.verificationStages?.['Under Review'] && !normalizedStages['Under Review / Verification in Progress']) {
        normalizedStages['Under Review / Verification in Progress'] = record.verificationStages['Under Review'];
      }
      setSelected({ ...record, status: normalizedStatus });
      setReviewStatus(normalizedStatus);
      setAssignedOfficerId(record.assignedOfficerId || '');
      setVerifiedBy(record.verifiedBy || currentVerifierName);
      setVerificationNotes(record.verificationNotes || '');
      setVerificationStages(normalizedStages);
      setPaymentRows(normalizePaymentRows(record.application?.payments));
    } catch (err) {
      setError(err.message || 'Unable to open application');
    } finally {
      setLoading(false);
    }
  }, [currentVerifierName]);

  const reviewRecord = useCallback((registrationNo) => {
    navigate(reviewPath(registrationNo));
    if (selected?.registrationNo !== registrationNo) {
      openRecord(registrationNo);
    }
  }, [navigate, openRecord, selected?.registrationNo]);

  const saveVerification = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const verifierName = verifiedBy.trim() || currentVerifierName;
      const record = await updateAdminApplication(selected.registrationNo, {
        status: reviewStatus,
        ...(canManageAdmissions(adminUser) ? { assignedOfficerId } : {}),
        verifiedBy: verifierName,
        verificationNotes,
        verificationStages,
        payments: paymentRows,
      });
      setSelected(record);
      setAssignedOfficerId(record.assignedOfficerId || '');
      setVerifiedBy(record.verifiedBy || verifierName);
      setPaymentRows(normalizePaymentRows(record.application?.payments));
      await loadRecords();
    } catch (err) {
      setError(err.message || 'Unable to update verification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resetToken) return;
    getAdminSession()
      .then(result => setAdminUser(result.user))
      .catch(() => clearAdminToken());
  }, [resetToken]);

  useEffect(() => {
    if (!resetToken) return;
    clearAdminToken();
    setAdminUser(null);
    setLoginError('');
    setResetMessage('');
    validateAdminPasswordReset(resetToken)
      .then(result => setResetUser(result.user))
      .catch(err => setLoginError(err.message || 'Password setup link is invalid or expired.'));
  }, [resetToken]);

  useEffect(() => {
    if (adminUser) {
      loadRecords();
      loadOfficers().catch(err => setError(err.message || 'Unable to load officers'));
      loadReportRecords();
    }
  }, [adminUser, loadOfficers, loadRecords, loadReportRecords]);

  useEffect(() => {
    if (!adminUser || !routeRegistrationNo) return;
    if (selected?.registrationNo === routeRegistrationNo) return;
    openRecord(routeRegistrationNo);
  }, [adminUser, openRecord, routeRegistrationNo, selected?.registrationNo]);

  const addOfficer = async (event) => {
    event.preventDefault();
    setError('');
    setOfficerMessage('');
    try {
      const result = await createVerificationOfficer(officerForm);
      setOfficerForm({ name: '', email: '', role: 'officer' });
      setOfficerMessage(result.credentialsSent
        ? result.message
        : `${result.message} Temporary password: ${result.temporaryPassword}`);
      await loadOfficers();
    } catch (err) {
      setError(err.message || 'Unable to create officer');
    }
  };

  const toggleOfficer = async (officer) => {
    await updateVerificationOfficer(officer.id, { active: !officer.active });
    await loadOfficers();
  };

  const counts = useMemo(() => ({
    total: records.length,
    verified: records.filter(record => record.status === 'Verified').length,
    pending: records.filter(record => ['Submitted', 'Under Review', 'Under Review / Verification in Progress'].includes(record.status)).length,
  }), [records]);

  const dailyApplications = useMemo(() => (
    reportDate
      ? reportRows.filter(record => record.applicationStatus === 'Submitted' && reportDateKey(record.activityDate) === reportDate)
      : reportRows.filter(record => record.applicationStatus === 'Submitted')
  ), [reportDate, reportRows]);

  const dailyDrafts = useMemo(() => (
    reportDate
      ? reportRows.filter(record => record.applicationStatus === 'Under Process' && reportDateKey(record.activityDate) === reportDate)
      : reportRows.filter(record => record.applicationStatus === 'Under Process')
  ), [reportDate, reportRows]);

  const reportScopeLabel = reportDate ? `for ${reportDate}` : 'till date';

  const dailyCounts = useMemo(() => ({
    total: dailyApplications.length,
    submitted: dailyApplications.filter(record => record.status === 'Submitted').length,
    underReview: dailyApplications.filter(record => ['Under Review', 'Under Review / Verification in Progress'].includes(record.status)).length,
    verified: dailyApplications.filter(record => record.status === 'Verified').length,
    drafts: dailyDrafts.length,
  }), [dailyApplications, dailyDrafts]);
  const hasFilteredOutReportRows = Boolean(
    reportDate
    && !dailyApplications.length
    && !dailyDrafts.length
    && reportRows.length,
  );
  const allSubmittedReportCount = reportRows.filter(record => record.applicationStatus === 'Submitted').length;
  const allDraftReportCount = reportRows.filter(record => record.applicationStatus === 'Under Process').length;

  const downloadDailyReport = () => {
    const header = ['Type', 'Registration / Login', 'Candidate', 'Mobile', 'Email', 'Programme', 'Status', 'Step', 'Date Time'];
    const submittedRows = dailyApplications.map(record => [
      'Submitted',
      record.referenceNo,
      record.name,
      record.phoneNumber,
      record.email,
      record.programme,
      record.verificationStatus,
      '',
      record.activityDate,
    ]);
    const draftRows = dailyDrafts.map(record => [
      'Draft',
      record.referenceNo,
      record.name,
      record.phoneNumber,
      record.email,
      record.programme,
      record.applicationStatus,
      record.currentStep,
      record.activityDate,
    ]);
    const blob = new Blob([
      [header, ...submittedRows, ...draftRows].map(row => row.map(csvCell).join(',')).join('\r\n'),
    ], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `JNTUGV-applications-${reportDate || 'all-dates'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printDailyReport = () => {
    document.body.classList.add('print-daily-report');
    window.print();
    window.setTimeout(() => document.body.classList.remove('print-daily-report'), 500);
  };

  if (resetToken) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={completePasswordSetup}>
          <p className="page-kicker">Department Login</p>
          <h2>Set New Password</h2>
          {resetUser ? (
            <p>{resetUser.name} | {resetUser.username}</p>
          ) : (
            <p>Validating password setup link.</p>
          )}
          {loginError && <div className="status-error">{loginError}</div>}
          {resetMessage && <div className="status-success">{resetMessage}</div>}
          {resetUser && (
            <>
              <label>
                New Password
                <PasswordField
                  value={newPasswordForm.password}
                  onChange={(event) => setNewPasswordForm(prev => ({ ...prev, password: event.target.value }))}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirm Password
                <PasswordField
                  value={newPasswordForm.confirmPassword}
                  onChange={(event) => setNewPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                  autoComplete="new-password"
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={loading}>Update Password</button>
            </>
          )}
          <button type="button" className="btn btn-outline" onClick={() => setSearchParams({})}>
            Back to Login
          </button>
        </form>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <p className="page-kicker">Admissions Office</p>
          <h2>Department Login</h2>
          <p>Login to retrieve applications, assign Co-convenors and Verification Officers, and maintain admissions verification.</p>
          {loginError && <div className="status-error">{loginError}</div>}
          {resetMessage && <div className="status-success">{resetMessage}</div>}
          <label>
            Username
            <input value={loginForm.username} onChange={(event) => setLoginForm(prev => ({ ...prev, username: event.target.value }))} />
          </label>
          <label>
            Password
            <PasswordField value={loginForm.password} onChange={(event) => setLoginForm(prev => ({ ...prev, password: event.target.value }))} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>Login</button>
          <div className="admin-login-support">
            <span>Forgot password?</span>
            <button type="button" className="table-link-button" onClick={() => setShowResetForm(prev => !prev)}>
              Request reset
            </button>
          </div>
          {showResetForm && (
            <div className="password-reset-panel">
              <label>
                Name
                <input value={resetForm.name} onChange={(event) => setResetForm(prev => ({ ...prev, name: event.target.value }))} />
              </label>
              <label>
                Username / Email
                <input value={resetForm.username} onChange={(event) => setResetForm(prev => ({ ...prev, username: event.target.value }))} />
              </label>
              <label>
                Role
                <select value={resetForm.role} onChange={(event) => setResetForm(prev => ({ ...prev, role: event.target.value }))}>
                  <option>Convenor</option>
                  <option>Co-convenor</option>
                  <option>Verification Officer</option>
                </select>
              </label>
              <label>
                Contact Number
                <input value={resetForm.contactNumber} onChange={(event) => setResetForm(prev => ({ ...prev, contactNumber: event.target.value }))} />
              </label>
              <button type="button" className="btn btn-outline" onClick={submitPasswordReset} disabled={loading}>
                Send Reset Request
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-console">
      <section className="admin-hero no-print">
        <div>
          <p className="page-kicker">Department Login</p>
          <h2>IIBMP 2026 Admissions Database</h2>
          <p>Directorate of Admissions Convenor can create department logins, assign applications, verify documents, and print admissions records.</p>
        </div>
        <div className="admin-stats">
          <span><strong>{adminUser.name}</strong>{roleLabel(adminUser.role)}</span>
          <span><strong>{counts.total}</strong>Total</span>
          <span><strong>{counts.pending}</strong>Pending</span>
          <span><strong>{counts.verified}</strong>Verified</span>
          <button type="button" className="btn btn-outline" onClick={logout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </section>

      <nav className="admin-subnav no-print" aria-label="Department portal navigation">
        <NavLink to="/admin/dashboard"><LayoutDashboard size={18} /> Dashboard</NavLink>
        <NavLink to="/admin/applications"><ClipboardList size={18} /> Applications</NavLink>
        {isConvenor && <NavLink to="/admin/reports"><BarChart3 size={18} /> Reports</NavLink>}
        {isConvenor && <NavLink to="/admin/users"><Users size={18} /> User Management</NavLink>}
      </nav>

      {!permittedSections.includes(activeSection) && (
        <section className="admin-access-denied">
          <h3>Access restricted</h3>
          <p>Your {roleLabel(adminUser.role)} account does not have permission to open this page.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/admin/dashboard')}>Return to Dashboard</button>
        </section>
      )}

      {activeSection === 'dashboard' && (
        <section className="admin-dashboard-grid no-print">
          <button type="button" className="admin-action-card" onClick={() => navigate('/admin/applications')}>
            <ClipboardList size={28} /><span><strong>Review Applications</strong><small>Search, assign, verify and print submitted applications.</small></span>
          </button>
          {isConvenor && <button type="button" className="admin-action-card" onClick={() => navigate('/admin/reports')}>
            <BarChart3 size={28} /><span><strong>Daily Reports</strong><small>View, print or export date-wise application receipts.</small></span>
          </button>}
          {isConvenor && <button type="button" className="admin-action-card" onClick={() => navigate('/admin/users')}>
            <Users size={28} /><span><strong>Manage Department Users</strong><small>Create accounts and control officer access.</small></span>
          </button>}
        </section>
      )}

      {isConvenor && activeSection === 'reports' && (
        <section className="daily-report-section">
          <div className="daily-report-header">
            <div>
              <p className="page-kicker">Convenor Report</p>
              <h3><BarChart3 size={21} /> Application Reports</h3>
              <p>Showing submitted and drafted applications {reportScopeLabel}. Select a date to filter the report.</p>
            </div>
            <div className="daily-report-actions no-print">
              <label>
                Filter by Date
                <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
              </label>
              {reportDate && (
                <button type="button" className="btn btn-outline" onClick={() => setReportDate('')}>
                  All Dates
                </button>
              )}
              <button type="button" className="btn btn-outline" onClick={loadReportRecords}>
                <RefreshCw size={17} /> Refresh
              </button>
              <button type="button" className="btn btn-outline" onClick={downloadDailyReport} disabled={!dailyApplications.length && !dailyDrafts.length}>
                <Download size={17} /> CSV
              </button>
              <button type="button" className="btn btn-primary" onClick={printDailyReport} disabled={!dailyApplications.length && !dailyDrafts.length}>
                <Printer size={17} /> Print Report
              </button>
            </div>
          </div>

          <div className="daily-report-summary">
            <span><strong>{dailyCounts.total}</strong>Received</span>
            <span><strong>{dailyCounts.drafts}</strong>Drafted</span>
            <span><strong>{dailyCounts.underReview}</strong>Under Review</span>
            <span><strong>{dailyCounts.verified}</strong>Verified</span>
          </div>

          {hasFilteredOutReportRows && (
            <div className="admin-report-notice no-print">
              <strong>No records matched {reportDate}.</strong>
              <span>Clear the date filter to view all {allSubmittedReportCount} submitted and {allDraftReportCount} drafted application records.</span>
              <button type="button" className="admin-table-action" onClick={() => setReportDate('')}>All Dates</button>
            </div>
          )}

          <div className="report-table-panel">
            <div className="report-subsection-title">
              <h4>Received Applications</h4>
              <p>{reportDate ? 'Filtered submitted applications ready for assignment and verification.' : 'All submitted applications received till date.'}</p>
            </div>
            <div className="daily-report-table-wrap">
              <table className="daily-report-table">
                <thead>
                  <tr><th>S.No</th><th>Registration No.</th><th>Candidate</th><th>Mobile</th><th>Programme</th><th>Status</th><th>Received Time</th><th className="no-print">Action</th></tr>
                </thead>
                <tbody>
                  {dailyApplications.map((record, index) => (
                    <tr key={record.referenceNo}>
                      <td>{index + 1}</td>
                      <td>{record.referenceNo}</td>
                      <td>{record.name || 'Not provided'}</td>
                      <td>{record.phoneNumber || 'Not provided'}</td>
                      <td>{record.programme}</td>
                      <td><span className="admin-status-pill">{normalizeStatus(record.verificationStatus)}</span></td>
                      <td>{reportDateTime(record.activityDate)}</td>
                      <td className="no-print">
                        <button type="button" className="admin-table-action" onClick={() => reviewRecord(record.referenceNo)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!dailyApplications.length && (
                    <tr><td colSpan="8" className="admin-empty">{reportDate ? 'No submitted applications were received on this date.' : 'No submitted applications found.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-table-panel">
            <div className="report-subsection-title">
              <h4>Drafted Applications</h4>
              <p>{reportDate ? 'Filtered applicant logins with saved progress.' : 'All applicant logins with saved progress till date.'}</p>
            </div>
            <div className="daily-report-table-wrap">
              <table className="daily-report-table">
                <thead>
                  <tr><th>S.No</th><th>Applicant Login</th><th>Candidate</th><th>Mobile</th><th>Email</th><th>Programme</th><th>Step</th><th>Saved Time</th></tr>
                </thead>
                <tbody>
                  {dailyDrafts.map((record, index) => (
                    <tr key={record.referenceNo}>
                      <td>{index + 1}</td>
                      <td>{record.referenceNo || 'Not issued'}</td>
                      <td>{record.name || 'Not provided'}</td>
                      <td>{record.phoneNumber || 'Not provided'}</td>
                      <td>{record.email || 'Not provided'}</td>
                      <td>{record.programme || '-'}</td>
                      <td><span className="admin-status-pill draft">Step {record.currentStep}</span></td>
                      <td>{reportDateTime(record.activityDate)}</td>
                    </tr>
                  ))}
                  {!dailyDrafts.length && (
                    <tr><td colSpan="8" className="admin-empty">{reportDate ? 'No application drafts were saved on this date.' : 'No application drafts found.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {isConvenor && activeSection === 'users' && (
        <section className="officer-console no-print">
          <div>
            <h3>Department Login Management</h3>
            <p>Create Co-convenor and Verification Officer logins. The username and a secure temporary password are automatically emailed to the officer.</p>
          </div>
          <form className="officer-form" onSubmit={addOfficer}>
            <input required placeholder="Name" value={officerForm.name} onChange={(event) => setOfficerForm(prev => ({ ...prev, name: event.target.value }))} />
            <input required type="email" placeholder="Email address (used as username)" value={officerForm.email} onChange={(event) => setOfficerForm(prev => ({ ...prev, email: event.target.value }))} />
            <select value={officerForm.role} onChange={(event) => setOfficerForm(prev => ({ ...prev, role: event.target.value }))}>
              <option value="officer">Verification Officer</option>
              <option value="co-convenor">Co-convenor</option>
            </select>
            <button type="submit" className="btn btn-accent">
              <UserPlus size={17} />
              Add Login
            </button>
          </form>
          {officerMessage && <div className="status-success">{officerMessage}</div>}
          <div className="officer-list">
            {departmentLogins.map(officer => (
              <div key={officer.id} className="officer-item">
                <strong>{officer.name}</strong>
                <span>{officer.username} | {roleLabel(officer.role)}</span>
                <button type="button" className="table-link-button" onClick={() => toggleOfficer(officer)}>
                  {officer.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'applications' && permittedSections.includes(activeSection) && <section className="admin-layout">
        <aside className="admin-list-panel no-print">
          <div className="admin-filters">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, mobile, email, reg no" />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="button" className="btn btn-primary" onClick={loadRecords} disabled={loading}>
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          {error && <div className="status-error">{error}</div>}

          <div className="admin-review-table-wrap">
            <table className="admin-review-table">
              <thead>
                <tr><th>Registration No.</th><th>Candidate</th><th>Mobile</th><th>Email</th><th>Programme</th><th>Submitted</th><th>Status</th><th>Assigned</th><th>Action</th></tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.registrationNo} className={selected?.registrationNo === record.registrationNo ? 'active' : ''}>
                    <td>{record.registrationNo}</td>
                    <td>
                      <strong>{record.candidateName || 'Unnamed Candidate'}</strong>
                    </td>
                    <td>{record.mobile || 'No mobile'}</td>
                    <td>{record.email || 'No email'}</td>
                    <td>{record.programme}</td>
                    <td>{reportDateTime(record.submittedAt)}</td>
                    <td><span className="admin-status-pill">{normalizeStatus(record.status)}</span></td>
                    <td>{record.assignedOfficerName || 'Unassigned'}</td>
                    <td>
                      <button type="button" className="admin-table-action" onClick={() => reviewRecord(record.registrationNo)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {!records.length && !loading && <tr><td colSpan="9" className="admin-empty">No applications found.</td></tr>}
              </tbody>
            </table>
          </div>
        </aside>

        <main className="admin-detail-panel">
          {!selectedApplication && (
            <div className="admin-placeholder no-print">
              <FileSearch size={42} />
              <h3>Select an application</h3>
              <p>Open a submitted record to verify documents and print the college copy.</p>
            </div>
          )}

          {selectedApplication && (
            <>
              <div className="admin-review-card no-print">
                <div>
                  <h3>{selected.registrationNo}</h3>
                  <p>{selectedApplication.personal.name} | {selectedApplication.personal.mobile}</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={printApplication}>
                  <Printer size={17} />
                  Print Application
                </button>
              </div>

              <div className="admin-verification no-print">
                <label>
                  Status
                  <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
                    {STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                {canManageAdmissions(adminUser) && (
                  <label>
                    Assigned To
                    <select value={assignedOfficerId} onChange={(event) => setAssignedOfficerId(event.target.value)}>
                      <option value="">Unassigned</option>
                      {activeAssignees.map(officer => (
                        <option key={officer.id} value={officer.id}>{officer.name} ({roleLabel(officer.role)})</option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Verified By
                  <input value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} placeholder="Officer name" />
                </label>
                <label className="admin-notes">
                  Verification Notes
                  <textarea value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} placeholder="Document remarks, corrections, counselling notes" />
                </label>
                <button type="button" className="btn btn-accent" onClick={saveVerification} disabled={loading}>
                  <CheckCircle2 size={17} />
                  Save Verification
                </button>
              </div>

              <section className="admin-payment-entry no-print">
                <div>
                  <h3>Payment Details for Verified Print Sheet</h3>
                  <p>Enter payment information received from the candidate. Saved values will appear in subsequent application printouts.</p>
                </div>
                <div className="admin-payment-table-wrap">
                  <table className="admin-payment-table">
                    <thead>
                      <tr><th>Fee Type</th><th>Amount</th><th>Receipt / Reference No.</th><th>Payment Date</th><th>Mode</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {paymentRows.map((payment, index) => (
                        <tr key={payment.title}>
                          <td><strong>{payment.title}</strong></td>
                          <td><input value={payment.amount || payment.fee || ''} onChange={(event) => setPaymentRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, amount: event.target.value.replace(/[^\d.]/g, '') } : row))} placeholder="Amount" /></td>
                          <td><input value={payment.txn_ref || ''} onChange={(event) => setPaymentRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, txn_ref: event.target.value.toUpperCase() } : row))} placeholder="Reference number" /></td>
                          <td><input type="date" value={payment.txn_date || ''} onChange={(event) => setPaymentRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, txn_date: event.target.value } : row))} /></td>
                          <td><input value={payment.mode || ''} onChange={(event) => setPaymentRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, mode: event.target.value.toUpperCase() } : row))} placeholder="SBI Collect / Cash" /></td>
                          <td>
                            <select value={payment.status || ''} onChange={(event) => setPaymentRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, status: event.target.value } : row))}>
                              <option value="">Select</option>
                              <option value="Received">Received</option>
                              <option value="Verified">Verified</option>
                              <option value="Pending">Pending</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-payment-save-row">
                  <p className="admin-payment-save-note">Payment details are stored with the verification record.</p>
                  <button type="button" className="btn btn-accent" onClick={saveVerification} disabled={loading}>
                    <CheckCircle2 size={17} /> Save Payment Details
                  </button>
                </div>
              </section>

              <section className="admin-stage-reviews no-print">
                <h3>{reviewStatus} Verification Review</h3>
                <div className="admin-selected-stage-note">
                  <label className="active">
                    <span>{reviewStatus}</span>
                    <textarea
                      value={verificationStages[reviewStatus] || ''}
                      onChange={(event) => setVerificationStages(prev => ({ ...prev, [reviewStatus]: event.target.value }))}
                      placeholder={`Review remarks for ${reviewStatus}`}
                    />
                  </label>
                </div>
              </section>

              <PrintableApplication
                data={selectedApplication}
                regNo={selected.registrationNo}
                verification={{
                  status: selected.status,
                  submittedAt: selected.submittedAt,
                  verifiedAt: selected.verifiedAt,
                  verifiedBy: selected.verifiedBy,
                  assignedOfficerName: selected.assignedOfficerName,
                  verificationNotes: selected.verificationNotes,
                  verificationStages: selected.verificationStages,
                }}
              />
            </>
          )}
        </main>
      </section>}
    </div>
  );
}
