import React, { useEffect, useState } from 'react';
import { Eye, Printer, X } from 'lucide-react';
import './PrintableApplication.css';

const EXAM_LABELS = {
  ap: 'AP-EAPCET-2026',
  tg: 'TG-EAPCET-2026',
  jee: 'JEE (MAINS)',
  others: 'With Intermediate Marks',
};
const IN_PROGRESS_STATUS = 'Under Review / Verification in Progress';
const FINAL_STATUSES = ['Verified', 'Needs Correction', 'Rejected'];

const value = (text) => text || '';
const rowHasValue = (row, keys) => keys.some(key => String(row[key] || '').trim() || row[key]);
const fileSrc = (file) => {
  if (!file) return '';
  if (typeof file === 'string') return file;
  return file.url || file.dataUrl || '';
};

function UploadStatus({ file, label, onView }) {
  if (!file) return <span className="upload-status-pending">Pending</span>;

  return (
    <span className="upload-status">
      <span>Uploaded</span>
      <button
        type="button"
        className="upload-view-button"
        onClick={() => onView(file, label)}
        aria-label={`View ${label}`}
        title={`View ${label}`}
        data-html2canvas-ignore="true"
      >
        <Eye size={16} aria-hidden="true" />
      </button>
    </span>
  );
}

function InfoRow({ no, label, children }) {
  return (
    <tr>
      <td className="print-no">{no}</td>
      <td className="print-label">{label}</td>
      <td className="print-colon">:</td>
      <td>{children}</td>
    </tr>
  );
}

const formatDateTime = (text) => {
  if (!text) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(text));
};

const normalizeVerificationStatus = (status = 'Submitted') => (
  status === 'Under Review' ? IN_PROGRESS_STATUS : status
);

export default function PrintableApplication({ data, regNo = '', verification = null }) {
  const [documentViewer, setDocumentViewer] = useState(null);
  const [documentBlobUrl, setDocumentBlobUrl] = useState('');
  const [documentError, setDocumentError] = useState('');
  const { programme, personal, education, documents, payments, declaration } = data;
  const visibleEducation = education.filter(row => (
    rowHasValue(row, ['examination', 'year', 'classDivision', 'marksGrade', 'institution', 'stateStudied', 'subjects'])
    || row.certificateFile
  ));
  const visiblePayments = payments
    .map((payment, index) => ({ ...payment, paymentIndex: index }))
    .filter(payment => (
      payment.paymentIndex === 0
      || rowHasValue(payment, ['txn_ref', 'txn_date', 'mode', 'status'])
      || payment.proofFile
    ));
  const additionalDocuments = [
    programme.eligibility.includes('ap') && { title: 'AP-EAPCET-2026 Rank Card', file: documents.doc_ap_rank },
    programme.eligibility.includes('tg') && { title: 'TG-EAPCET-2026 Rank Card', file: documents.doc_tg_rank },
    programme.eligibility.includes('jee') && { title: 'JEE (MAINS) Rank Card', file: documents.doc_jee_rank },
    { title: 'Aadhar Card Copy', file: documents.doc_aadhar },
    (personal.category && personal.category !== 'OC') || documents.doc_caste ? { title: 'Caste / Category Certificate', file: documents.doc_caste } : null,
    (documents.doc_others || documents.other_doc_title) && {
      title: documents.other_doc_title || 'Other Supporting Document',
      file: documents.doc_others,
    },
  ].filter(Boolean);
  const selectedVerificationStage = normalizeVerificationStatus(verification?.status);
  const verificationFlowStages = [
    'Submitted',
    IN_PROGRESS_STATUS,
    FINAL_STATUSES.includes(selectedVerificationStage) ? selectedVerificationStage : 'Final Decision',
  ];
  const selectedStageIndex = FINAL_STATUSES.includes(selectedVerificationStage)
    ? 2
    : selectedVerificationStage === IN_PROGRESS_STATUS ? 1 : 0;
  const visibleStageRemarks = verification
    ? [{
      stage: selectedVerificationStage,
      remarks: verification.verificationStages?.[selectedVerificationStage]
        || verification.verificationNotes
        || 'No remarks recorded for selected stage.',
    }]
    : [];

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const loadDocument = async () => {
      setDocumentBlobUrl('');
      setDocumentError('');
      if (!documentViewer?.file) return;

      try {
        const isBrowserFile = typeof File !== 'undefined' && documentViewer.file instanceof File;
        if (isBrowserFile) {
          objectUrl = URL.createObjectURL(documentViewer.file);
        } else {
          const source = fileSrc(documentViewer.file);
          if (!source) throw new Error('Document source is unavailable.');
          const response = await fetch(source);
          if (!response.ok) throw new Error('Unable to load this document.');
          objectUrl = URL.createObjectURL(await response.blob());
        }
        if (active) setDocumentBlobUrl(objectUrl);
      } catch (error) {
        if (active) setDocumentError(error.message || 'Unable to load this document.');
      }
    };

    loadDocument();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentViewer]);

  const openDocumentViewer = (file, label) => setDocumentViewer({ file, label });
  const closeDocumentViewer = () => setDocumentViewer(null);
  const printViewedDocument = () => {
    if (!documentBlobUrl) return;
    const printWindow = window.open(documentBlobUrl, '_blank');
    if (printWindow) {
      printWindow.opener = null;
      printWindow.addEventListener('load', () => printWindow.print(), { once: true });
    }
  };

  return (
    <>
    <div className="printable-application" id="printable-application">
      <div className="print-header">
        <img className="print-logo print-logo-left" src="/jntugv-logo.png" alt="JNTUGV logo" />
        <div className="print-header-copy">
          <h1>JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY GURAJADA VIZIANAGARAM</h1>
          <h2>Reutlingen University Knowledge Foundation, Germany</h2>
          <h3>APPLICATION FOR ADMISSION INTO RUKF-IIBMP</h3>
          <p>For any correspondence contact Help Desk: 9493759290 / 9440320423 / +91-8520891128 / 9044115999 / 9044117999</p>
        </div>
        <img className="print-logo print-logo-right" src="/reutlingen-logo.png" alt="Reutlingen University Knowledge Foundation logo" />
      </div>

      <table className="print-meta-table">
        <tbody>
          <tr>
            <td className="print-meta-highlight">
              <strong>Application Registration No:</strong>
              <span>{regNo}</span>
            </td>
            <td rowSpan="2" className="photo-cell">
              {fileSrc(personal.photo) ? <img src={fileSrc(personal.photo)} alt="Applicant" /> : <span>Recent Passport size Photo of the applicant to be affixed</span>}
            </td>
          </tr>
          <tr>
            <td className="print-meta-highlight"><strong>Year of Admission:</strong> 2026</td>
          </tr>
        </tbody>
      </table>

      <table className="print-form-table">
        <tbody>
          <InfoRow no="1." label="Name of the Programme applied">{programme.applied}</InfoRow>
          <InfoRow no="2." label="Eligibility Criteria">
            {programme.eligibility.map(key => (
              <div key={key}>
                {EXAM_LABELS[key]}
                {key === 'others' && programme.exams.others.intermediateMarks
                  ? ` (${programme.exams.others.intermediateMarks}%)`
                  : ''}
              </div>
            ))}
          </InfoRow>
          <tr>
            <td className="print-no">3</td>
            <td className="print-label">Competitive Examination Details</td>
            <td className="print-colon">:</td>
            <td>
              <table className="nested-print-table exam-details-table">
                <tbody>
                  {programme.eligibility.filter(key => key !== 'others').map(key => (
                    <React.Fragment key={key}>
                      <tr>
                        <td>{EXAM_LABELS[key]} Hall Ticket No</td>
                        <td>:</td>
                        <td>{value(programme.exams[key].hallTicket)}</td>
                      </tr>
                      <tr>
                        <td>{EXAM_LABELS[key]} Rank</td>
                        <td>:</td>
                        <td>{value(programme.exams[key].rank)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {programme.eligibility.includes('others') && (
                    <tr>
                      <td>Intermediate Qualifying Hall Ticket No</td>
                      <td>:</td>
                      <td>{value(programme.exams.others.hallTicket)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
          <InfoRow no="4" label="Name of the Candidate (In Capital Letters)">{value(personal.name).toUpperCase()}</InfoRow>
          <InfoRow no="5" label="Father's Name / Guardian's Name">{value(personal.fatherName)}</InfoRow>
          <InfoRow no="6" label="Mother's Name">{value(personal.motherName)}</InfoRow>
          <InfoRow no="7" label="Date of Birth">{value(personal.dob)}</InfoRow>
          <InfoRow no="8" label="Place of Birth">{value(personal.placeOfBirth)}</InfoRow>
          <InfoRow no="9" label="Gender">{value(personal.gender)}</InfoRow>
          <InfoRow no="10" label="Marital Status">{value(personal.maritalStatus)}</InfoRow>
          <InfoRow no="11" label="Nationality">{value(personal.nationality)}</InfoRow>
          <InfoRow no="12" label="Religion">{value(personal.religion)}</InfoRow>
          <InfoRow no="13" label="Aadhar Card Number">{value(personal.aadharNumber)}</InfoRow>
          <InfoRow no="14" label="Passport Number (If any)">{value(personal.passportNumber)}</InfoRow>
          <tr>
            <td className="print-no">15</td>
            <td className="print-label">Contact Number</td>
            <td className="print-colon">:</td>
            <td>
              <div>Land Line Number: {value(personal.landline)}</div>
              <div>Mobile Number: {value(personal.mobile)}</div>
              <div>Alternative Mobile Number: {value(personal.altMobile)}</div>
            </td>
          </tr>
          <InfoRow no="16" label="e-mail Id">{value(personal.email)}</InfoRow>
          <InfoRow no="17" label="Address for Communication">{value(personal.address)}</InfoRow>
          <tr>
            <td className="print-no">18</td>
            <td className="print-label">Identification Marks</td>
            <td className="print-colon">:</td>
            <td>
              <div>Identification Mark-1: {value(personal.idMark1)}</div>
              <div>Identification Mark-2: {value(personal.idMark2)}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <section className="candidate-print-page-two">
        <h4 className="print-section-title">EDUCATIONAL QUALIFICATIONS</h4>
        <table className="print-data-table">
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Examination</th>
            <th>Year of Passing</th>
            <th>Class / Division</th>
            <th>% Marks / Grade</th>
            <th>Name of the Board / School / College / Institute / University</th>
            <th>State Studied</th>
            <th>Subjects studied</th>
            <th>Certificate Uploaded Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleEducation.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>
              <td>{value(row.examination)}</td>
              <td>{value(row.year)}</td>
              <td>{value(row.classDivision)}</td>
              <td>{value(row.marksGrade)}</td>
              <td>{value(row.institution)}</td>
              <td>{value(row.stateStudied)}</td>
              <td>{value(row.subjects)}</td>
              <td><UploadStatus file={row.certificateFile} label={`${row.examination || 'education'} certificate`} onView={openDocumentViewer} /></td>
            </tr>
          ))}
        </tbody>
        </table>

        <h4 className="print-section-title">Additional Documents</h4>
        <table className="print-data-table compact-print-table">
        <thead>
          <tr><th>S.No</th><th>Document title</th><th>Document Uploaded Status</th></tr>
        </thead>
        <tbody>
          {additionalDocuments.map((document, index) => (
            <tr key={document.title}>
              <td>{index + 1}</td>
              <td>{document.title}</td>
              <td><UploadStatus file={document.file} label={document.title} onView={openDocumentViewer} /></td>
            </tr>
          ))}
        </tbody>
        </table>

        <h4 className="print-section-title">Registration Fee Payment details</h4>
        <table className="print-data-table compact-print-table">
        <thead>
          <tr><th>S.No</th><th>Fee Type</th><th>Amount</th><th>SBI Collect Reference No</th><th>Transaction date</th><th>Mode of payment</th><th>Status of payment</th><th>SBI Collect Receipt PDF</th></tr>
        </thead>
        <tbody>
          {visiblePayments.map((payment, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{payment.paymentIndex === 0 ? 'Counselling Fee' : 'First-Year Tuition Fee'}</td>
              <td>{payment.paymentIndex === 0 ? '₹2,000' : '₹1,50,000'}</td>
              <td>{value(payment.txn_ref)}</td>
              <td>{value(payment.txn_date)}</td>
              <td>{value(payment.mode)}</td>
              <td>{payment.status || 'Pending Verification'}</td>
              <td><UploadStatus file={payment.proofFile} label={`payment receipt ${index + 1}`} onView={openDocumentViewer} /></td>
            </tr>
          ))}
        </tbody>
        </table>

        <div className="print-declaration">
          <h4>Declaration</h4>
          <p>I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief.</p>
          <div className="signature-grid">
            <p><strong>Place:</strong> {value(declaration.station)}</p>
            <p><strong>Date:</strong> {value(declaration.date)}</p>
            <div className="signature-block">
              {fileSrc(personal.signature) ? <img src={fileSrc(personal.signature)} alt="Signature" /> : <span />}
              <p>Signature of the applicant</p>
            </div>
          </div>
        </div>
      </section>

      {verification && (
        <div className="office-verification-copy">
          <h4 className="print-section-title">Admissions Office Verification</h4>
          <table className="print-data-table compact-print-table">
            <tbody>
              <tr>
                <th>Current Status</th>
                <td>{selectedVerificationStage}</td>
                <th>Verified By</th>
                <td>{verification.verifiedBy || 'Pending'}</td>
              </tr>
              <tr>
                <th>Assigned To</th>
                <td colSpan="3">{verification.assignedOfficerName || 'Unassigned'}</td>
              </tr>
              <tr>
                <th>Submitted At</th>
                <td>{formatDateTime(verification.submittedAt)}</td>
                <th>Verified At</th>
                <td>{formatDateTime(verification.verifiedAt) || 'Pending'}</td>
              </tr>
              <tr>
                <th>Verification Notes</th>
                <td colSpan="3">{verification.verificationNotes || 'No remarks recorded.'}</td>
              </tr>
            </tbody>
          </table>

          <div className="verification-flow">
            {verificationFlowStages.map((status, index) => (
              <div
                key={status}
                className={`verification-step ${index <= selectedStageIndex ? 'completed' : ''} ${selectedVerificationStage === status ? 'active' : ''}`}
              >
                <span>{index + 1}</span>
                <strong>{status}</strong>
              </div>
            ))}
          </div>

          <table className="print-data-table compact-print-table verification-stage-notes">
            <thead>
              <tr><th>Selected Stage</th><th>Review Remarks</th></tr>
            </thead>
            <tbody>
              {visibleStageRemarks.map(({ stage, remarks }) => (
                <tr key={stage}>
                  <td>{stage}</td>
                  <td>{remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="digital-signature-box">
            <div>
              <strong>Digital Signature</strong>
              <p>This application copy is digitally verified in the JNTUGV admissions console.</p>
            </div>
            <div className="digital-signature-mark">
              <strong>{verification.verifiedBy || 'Admissions Officer'}</strong>
              <span>{formatDateTime(verification.verifiedAt) || 'Verification pending'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
    {documentViewer && (
      <div className="document-viewer-backdrop no-print" role="dialog" aria-modal="true" aria-label={documentViewer.label}>
        <section className="document-viewer">
          <header className="document-viewer-header">
            <div>
              <strong>{documentViewer.label}</strong>
              <span>{documentViewer.file?.name || documentViewer.file?.storedName || 'Uploaded document'}</span>
            </div>
            <div className="document-viewer-actions">
              <button type="button" onClick={printViewedDocument} disabled={!documentBlobUrl}>
                <Printer size={17} aria-hidden="true" />
                Print document
              </button>
              <button type="button" className="document-viewer-close" onClick={closeDocumentViewer} aria-label="Close document viewer">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </header>
          <div className="document-viewer-body">
            {!documentBlobUrl && !documentError && <p>Loading document…</p>}
            {documentError && <p className="document-viewer-error">{documentError}</p>}
            {documentBlobUrl && (
              <iframe
                src={`${documentBlobUrl}#toolbar=1&navpanes=0`}
                title={documentViewer.label}
              />
            )}
          </div>
        </section>
      </div>
    )}
    </>
  );
}
