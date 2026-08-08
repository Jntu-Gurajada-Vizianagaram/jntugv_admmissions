import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadApplicationPdf } from '../utils/downloadApplicationPdf';
import PrintableApplication from './PrintableApplication';
import './CandidateStatusCard.css';

const IN_PROGRESS_STATUS = 'Under Review / Verification in Progress';
const FINAL_STATUSES = ['Verified', 'Needs Correction', 'Rejected', 'Admitted Submitted'];

const normalizeStatus = (status = 'Submitted') => (
  status === 'Under Review' ? IN_PROGRESS_STATUS : status
);

const formatDateTime = (text) => {
  if (!text) return 'Pending';
  return new Date(text).toLocaleString();
};

export default function CandidateStatusCard({ application }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

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
  const downloadPdf = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadApplicationPdf(application.registrationNo);
    } catch (error) {
      setDownloadError(error.message || 'Unable to download the application PDF.');
    } finally {
      setDownloading(false);
    }
  };

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

      {application.application && (
        <>
          <button
            type="button"
            className="btn btn-primary candidate-download-button"
            onClick={downloadPdf}
            disabled={downloading}
          >
            <Download size={18} aria-hidden="true" />
            {downloading ? 'Preparing PDF…' : 'Download Application PDF'}
          </button>
          {downloadError && <div className="status-error">{downloadError}</div>}
          <div className="candidate-pdf-source" aria-hidden="true">
            <PrintableApplication
              data={application.application}
              regNo={application.registrationNo}
            />
          </div>
        </>
      )}
    </div>
  );
}
