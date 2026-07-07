import React from 'react';
import './PrintableApplication.css';

const EXAM_LABELS = {
  ap: 'AP-EAPCET-2026',
  tg: 'TG-EAPCET-2026',
  jee: 'JEE (MAINS)',
  others: 'Others',
};
const IN_PROGRESS_STATUS = 'Under Review / Verification in Progress';
const FINAL_STATUSES = ['Verified', 'Needs Correction', 'Rejected'];

const value = (text) => text || '';
const uploaded = (file) => (file ? 'Uploaded' : 'Pending');
const fileName = (file) => file?.name || file?.storedName || '';
const rowHasValue = (row, keys) => keys.some(key => String(row[key] || '').trim() || row[key]);
const fileSrc = (file) => {
  if (!file) return '';
  if (typeof file === 'string') return file;
  return file.url || file.dataUrl || '';
};

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
  const { programme, personal, education, documents, payments, declaration } = data;
  const visibleEducation = education.filter(row => (
    rowHasValue(row, ['examination', 'year', 'classDivision', 'marksGrade', 'institution', 'stateStudied', 'subjects'])
    || row.certificateFile
  ));
  const visiblePayments = payments.filter(payment => (
    rowHasValue(payment, ['fee', 'txn_ref', 'txn_date', 'mode', 'status'])
    || payment.proofFile
  ));
  const additionalDocuments = [
    programme.eligibility.includes('ap') && { title: 'AP-EAPCET-2026 Rank Card', file: documents.doc_ap_rank },
    programme.eligibility.includes('tg') && { title: 'TG-EAPCET-2026 Rank Card', file: documents.doc_tg_rank },
    programme.eligibility.includes('jee') && { title: 'JEE (MAINS) Rank Card', file: documents.doc_jee_rank },
    { title: 'Aadhar Card Copy', file: documents.doc_aadhar },
    (personal.category && personal.category !== 'OC') || documents.doc_caste ? { title: 'Caste / Category Certificate', file: documents.doc_caste } : null,
    (programme.eligibility.includes('others') || documents.doc_others || documents.other_doc_title) && {
      title: documents.other_doc_title || programme.exams.others.examName || 'Other Competitive Exam Proof',
      file: documents.doc_others,
    },
  ].filter(Boolean);
  const uploadedDocuments = [
    ...visibleEducation.map(row => ({
      title: `${row.examination || 'Educational Qualification'} Certificate`,
      file: row.certificateFile,
    })),
    { title: 'AP Rank Card', file: documents.doc_ap_rank },
    { title: 'TG Rank Card', file: documents.doc_tg_rank },
    { title: 'JEE Rank Card', file: documents.doc_jee_rank },
    { title: 'Aadhaar Card', file: documents.doc_aadhar },
    { title: 'Caste / Category Certificate', file: documents.doc_caste },
    { title: documents.other_doc_title || 'Other Competitive Exam Proof', file: documents.doc_others },
    ...visiblePayments.map((payment, index) => ({
      title: `SBI Collect Receipt ${index + 1}`,
      file: payment.proofFile,
    })),
  ].filter(document => document.file);
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
  return (
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
              <div key={key}>{key === 'others' && programme.exams.others.examName ? programme.exams.others.examName : EXAM_LABELS[key]}</div>
            ))}
          </InfoRow>
          <tr>
            <td className="print-no">3</td>
            <td className="print-label">Competitive Examination Details</td>
            <td className="print-colon">:</td>
            <td>
              <table className="nested-print-table exam-details-table">
                <tbody>
                  {programme.eligibility.map(key => (
                    <React.Fragment key={key}>
                      <tr>
                        <td>{key === 'others' ? value(programme.exams.others.examName) || 'Others' : EXAM_LABELS[key]} Hall Ticket No</td>
                        <td>:</td>
                        <td>{value(programme.exams[key].hallTicket)}</td>
                      </tr>
                      <tr>
                        <td>{key === 'others' ? value(programme.exams.others.examName) || 'Others' : EXAM_LABELS[key]} Rank</td>
                        <td>:</td>
                        <td>{value(programme.exams[key].rank)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
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
              <td>{uploaded(row.certificateFile)}</td>
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
              <td>{uploaded(document.file)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="print-section-title">Uploaded Documents</h4>
      <table className="print-data-table compact-print-table uploaded-documents-table">
        <thead>
          <tr><th>S.No</th><th>Document Name</th><th>Uploaded File</th><th>Status</th></tr>
        </thead>
        <tbody>
          {uploadedDocuments.map((document, index) => (
            <tr key={`${document.title}-${index}`}>
              <td>{index + 1}</td>
              <td>{document.title}</td>
              <td>{fileName(document.file)}</td>
              <td>{uploaded(document.file)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="print-section-title">Registration Fee Payment details</h4>
      <table className="print-data-table compact-print-table">
        <thead>
          <tr><th>S.No</th><th>Application Fee</th><th>SBI Collect Reference No</th><th>Transaction date</th><th>Mode of payment</th><th>Status of payment</th><th>SBI Collect Receipt PDF</th></tr>
        </thead>
        <tbody>
          {visiblePayments.map((payment, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{value(payment.fee)}</td>
              <td>{value(payment.txn_ref)}</td>
              <td>{value(payment.txn_date)}</td>
              <td>{value(payment.mode)}</td>
              <td>{value(payment.status)}</td>
              <td>{uploaded(payment.proofFile)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-declaration">
        <h4>Declaration</h4>
        <p>I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief.</p>
        <div className="signature-grid">
          <div>
            <p>Station: {value(declaration.station)}</p>
            <p>Date: {value(declaration.date)}</p>
          </div>
          <div className="signature-block">
            {fileSrc(personal.signature) ? <img src={fileSrc(personal.signature)} alt="Signature" /> : <span />}
            <p>Signature of the applicant</p>
          </div>
        </div>
      </div>

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
                <th>Assigned Officer</th>
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
  );
}
