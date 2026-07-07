import React from 'react';
import './CandidateStatusCard.css';

const IN_PROGRESS_STATUS = 'Under Review / Verification in Progress';
const FINAL_STATUSES = ['Verified', 'Needs Correction', 'Rejected'];

const normalizeStatus = (status = 'Submitted') => (
  status === 'Under Review' ? IN_PROGRESS_STATUS : status
);

const formatDateTime = (text) => {
  if (!text) return 'Pending';
  return new Date(text).toLocaleString();
};

export default function CandidateStatusCard({ application }) {
  if (!application) return null;

  const currentStatus = normalizeStatus(application.status);
  const flow = [
    'Submitted',
    IN_PROGRESS_STATUS,
    FINAL_STATUSES.includes(currentStatus) ? currentStatus : 'Final Decision',
  ];
  const activeIndex = FINAL_STATUSES.includes(currentStatus)
    ? 2
    : currentStatus === IN_PROGRESS_STATUS ? 1 : 0;
  const stageRemark = application.verificationStages?.[currentStatus] || application.verificationNotes || '';

  return (
    <div className="candidate-status-card">
      <div className="candidate-status-grid">
        <div>
          <span>Registration Number</span>
          <strong>{application.registrationNo}</strong>
        </div>
        <div>
          <span>Candidate</span>
          <strong>{application.candidateName || 'Not provided'}</strong>
        </div>
        <div>
          <span>Programme</span>
          <strong>{application.programme}</strong>
        </div>
        <div>
          <span>Current Status</span>
          <strong>{currentStatus}</strong>
        </div>
        <div>
          <span>Submitted At</span>
          <strong>{formatDateTime(application.submittedAt)}</strong>
        </div>
        <div>
          <span>Verified At</span>
          <strong>{formatDateTime(application.verifiedAt)}</strong>
        </div>
      </div>

      <div className="candidate-status-flow">
        {flow.map((stage, index) => (
          <div
            key={stage}
            className={`candidate-status-step ${index <= activeIndex ? 'completed' : ''} ${index === activeIndex ? 'active' : ''}`}
          >
            <span>{index + 1}</span>
            <strong>{stage}</strong>
          </div>
        ))}
      </div>

      <div className="candidate-status-note">
        <span>Admissions Office Remarks</span>
        <strong>{stageRemark || 'No remarks recorded.'}</strong>
      </div>
    </div>
  );
}
