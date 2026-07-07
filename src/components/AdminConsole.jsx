import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileSearch, LogOut, Printer, RefreshCw, UserPlus } from 'lucide-react';
import {
  adminLogin,
  clearAdminToken,
  createVerificationOfficer,
  getAdminApplication,
  getAdminSession,
  listAdminApplications,
  listVerificationOfficers,
  updateAdminApplication,
  updateVerificationOfficer,
} from '../lib/api';
import PrintableApplication from './PrintableApplication';
import './AdminConsole.css';

const STATUSES = ['Submitted', 'Under Review / Verification in Progress', 'Verified', 'Needs Correction', 'Rejected'];
const ROLE_LABELS = {
  admin: 'Convenor',
  'co-convenor': 'Co-convenor',
  officer: 'Verification Officer',
};
const emptyStageNotes = () => Object.fromEntries(STATUSES.map(status => [status, '']));
const normalizeStatus = (status = 'Submitted') => (
  status === 'Under Review' ? 'Under Review / Verification in Progress' : status
);
const canManageAdmissions = (user) => ['admin', 'co-convenor'].includes(user?.role);
const roleLabel = (role) => ROLE_LABELS[role] || role;

function UploadedDocumentPreview({ item }) {
  const [blobUrl, setBlobUrl] = useState('');
  const [error, setError] = useState('');
  const type = item.file?.type || '';
  const isImage = type.startsWith('image/');
  const isPdf = type === 'application/pdf' || item.file?.name?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const loadBlob = async () => {
      if (!item.file?.url) return;

      try {
        const response = await fetch(item.file.url);
        if (!response.ok) throw new Error('Unable to load document preview');
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) setBlobUrl(objectUrl);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load document preview');
      }
    };

    loadBlob();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.file?.url]);

  return (
    <div className="admin-doc-preview-item">
      <div className="admin-doc-preview-head">
        <strong>{item.label}</strong>
        <span>{item.file?.name || item.file?.storedName || 'Uploaded file'}</span>
      </div>
      <div className="admin-doc-blob-frame">
        {!blobUrl && !error && <span className="admin-muted">Loading preview...</span>}
        {error && <span className="admin-muted">{error}</span>}
        {blobUrl && isImage && <img src={blobUrl} alt={item.label} />}
        {blobUrl && isPdf && <iframe src={`${blobUrl}#toolbar=1&navpanes=0`} title={item.label} />}
        {blobUrl && !isImage && !isPdf && (
          <object data={blobUrl} type={type || 'application/octet-stream'}>
            <span className="admin-muted">Preview is not available for this file type.</span>
          </object>
        )}
      </div>
    </div>
  );
}

function DocumentPreviews({ application }) {
  const educationDocs = application.education
    .filter(row => row.certificateFile)
    .map((row, index) => ({ label: `${row.examination || `Education ${index + 1}`} Certificate`, file: row.certificateFile }));

  const supportingDocs = [
    { label: 'AP Rank Card', file: application.documents.doc_ap_rank },
    { label: 'TG Rank Card', file: application.documents.doc_tg_rank },
    { label: 'JEE Rank Card', file: application.documents.doc_jee_rank },
    { label: 'Aadhaar Card', file: application.documents.doc_aadhar },
    { label: 'Caste / Category Certificate', file: application.documents.doc_caste },
    { label: application.documents.other_doc_title || 'Other Proof', file: application.documents.doc_others },
  ].filter(item => item.file);

  const paymentDocs = application.payments
    .filter(payment => payment.proofFile)
    .map((payment, index) => ({ label: `SBI Collect Receipt ${index + 1}`, file: payment.proofFile }));

  const docs = [...educationDocs, ...supportingDocs, ...paymentDocs];

  return (
    <div className="admin-doc-preview-grid">
      {docs.length === 0 && <span className="admin-muted">No uploaded files found.</span>}
      {docs.map(item => (
        <UploadedDocumentPreview key={`${item.label}-${item.file?.url}`} item={item} />
      ))}
    </div>
  );
}

export default function AdminConsole() {
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Submitted');
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStages, setVerificationStages] = useState(emptyStageNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [officers, setOfficers] = useState([]);
  const [officerForm, setOfficerForm] = useState({ name: '', username: '', password: '', role: 'officer' });

  const selectedApplication = selected?.application;
  const currentVerifierName = adminUser?.name || adminUser?.username || '';
  const activeAssignees = officers.filter(officer => officer.active && ['co-convenor', 'officer'].includes(officer.role));
  const departmentLogins = officers.filter(officer => ['co-convenor', 'officer'].includes(officer.role));

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

  const logout = () => {
    clearAdminToken();
    setAdminUser(null);
    setSelected(null);
    setRecords([]);
  };

  const openRecord = async (registrationNo) => {
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
    } catch (err) {
      setError(err.message || 'Unable to open application');
    } finally {
      setLoading(false);
    }
  };

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
      });
      setSelected(record);
      setAssignedOfficerId(record.assignedOfficerId || '');
      setVerifiedBy(record.verifiedBy || verifierName);
      await loadRecords();
    } catch (err) {
      setError(err.message || 'Unable to update verification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminSession()
      .then(result => setAdminUser(result.user))
      .catch(() => clearAdminToken());
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadRecords();
      loadOfficers().catch(err => setError(err.message || 'Unable to load officers'));
    }
  }, [adminUser, loadOfficers, loadRecords]);

  const addOfficer = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await createVerificationOfficer(officerForm);
      setOfficerForm({ name: '', username: '', password: '', role: 'officer' });
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

  if (!adminUser) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <p className="page-kicker">Admissions Office</p>
          <h2>Department Login</h2>
          <p>Login to retrieve applications, assign Co-convenors and Verification Officers, and maintain admissions verification.</p>
          {loginError && <div className="status-error">{loginError}</div>}
          <label>
            Username
            <input value={loginForm.username} onChange={(event) => setLoginForm(prev => ({ ...prev, username: event.target.value }))} />
          </label>
          <label>
            Password
            <input type="password" value={loginForm.password} onChange={(event) => setLoginForm(prev => ({ ...prev, password: event.target.value }))} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>Login</button>
          <div className="admin-login-support">
            <span>Forgot password?</span>
            <a href="mailto:da@jntugv.edu.in?subject=Admissions%20Portal%20Password%20Reset%20Request&body=Please%20reset%20my%20admissions%20portal%20login.%0A%0AName%3A%0AUsername%20/%20Email%3A%0ARole%20(Convenor%20/%20Co-convenor%20/%20Verification%20Officer)%3A%0AContact%20Number%3A">
              Request reset by email
            </a>
          </div>
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

      {adminUser.role === 'admin' && (
        <section className="officer-console no-print">
          <div>
            <h3>Department Login Management</h3>
            <p>Create and maintain Co-convenor and Verification Officer logins for this admissions process.</p>
          </div>
          <form className="officer-form" onSubmit={addOfficer}>
            <input placeholder="Name" value={officerForm.name} onChange={(event) => setOfficerForm(prev => ({ ...prev, name: event.target.value }))} />
            <input placeholder="Username" value={officerForm.username} onChange={(event) => setOfficerForm(prev => ({ ...prev, username: event.target.value }))} />
            <input type="password" placeholder="Password" value={officerForm.password} onChange={(event) => setOfficerForm(prev => ({ ...prev, password: event.target.value }))} />
            <select value={officerForm.role} onChange={(event) => setOfficerForm(prev => ({ ...prev, role: event.target.value }))}>
              <option value="officer">Verification Officer</option>
              <option value="co-convenor">Co-convenor</option>
            </select>
            <button type="submit" className="btn btn-accent">
              <UserPlus size={17} />
              Add Login
            </button>
          </form>
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

      <section className="admin-layout">
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

          <div className="admin-record-list">
            {records.map(record => (
              <button
                type="button"
                key={record.registrationNo}
                className={`admin-record ${selected?.registrationNo === record.registrationNo ? 'active' : ''}`}
                onClick={() => openRecord(record.registrationNo)}
              >
                <span>{record.registrationNo}</span>
                <strong>{record.candidateName || 'Unnamed Candidate'}</strong>
                <small>{record.status} | {record.assignedOfficerName || 'Unassigned'} | {record.mobile || 'No mobile'}</small>
              </button>
            ))}
            {!records.length && !loading && <div className="admin-empty">No applications found.</div>}
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
                <button type="button" className="btn btn-outline" onClick={() => window.print()}>
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

              <section className="admin-documents no-print">
                <h3>Uploaded Documents Preview</h3>
                <DocumentPreviews application={selectedApplication} />
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
      </section>
    </div>
  );
}
