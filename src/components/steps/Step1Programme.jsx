import React from 'react';
import { useForm } from '../../context/useForm';
import { collectMessages, positiveInteger, required, textFormat } from '../../utils/validation';
import InlineDocumentUpload from '../InlineDocumentUpload';
import './Step1Programme.css';
import './Step3Academics.css';

const PROGRAMMES = [
  'B. Tech in CSE & M. Sc in Professional Software Engineering',
  'B. Tech in ECE & M. Sc in Digital Business Management',
];

const EXAMS = [
  { key: 'ap', label: 'AP-EAPCET-2026', docKey: 'doc_ap_rank', docLabel: 'AP-EAPCET-2026 Rank Card' },
  { key: 'tg', label: 'TG-EAPCET-2026', docKey: 'doc_tg_rank', docLabel: 'TG-EAPCET-2026 Rank Card' },
  { key: 'jee', label: 'JEE (MAINS)', docKey: 'doc_jee_rank', docLabel: 'JEE (MAINS) Rank Card' },
  { key: 'others', label: 'Others', docKey: 'doc_others', docLabel: 'Other Competitive Exam Proof' },
];

export default function Step1Programme({ onNext }) {
  const { data, updateData } = useForm();
  const [showErrors, setShowErrors] = React.useState(false);

  const updateProgramme = (fields) => {
    updateData({ ...data, programme: { ...data.programme, ...fields } });
  };

  const toggleExam = (examKey) => {
    const selected = data.programme.eligibility.includes(examKey)
      ? data.programme.eligibility.filter(key => key !== examKey)
      : [...data.programme.eligibility, examKey];

    updateProgramme({ eligibility: selected });
  };

  const updateExam = (examKey, field, value) => {
    const normalizedValue = field === 'rank'
      ? value.replace(/\D/g, '')
      : ['examName', 'hallTicket'].includes(field)
        ? value.toUpperCase()
        : value;
    updateProgramme({
      exams: {
        ...data.programme.exams,
        [examKey]: { ...data.programme.exams[examKey], [field]: normalizedValue },
      },
    });
  };

  const validationMessages = () => {
    const messages = [
      required(data.programme.applied, 'Programme applied is required.'),
      data.programme.eligibility.length === 0 ? 'Select at least one eligibility exam.' : '',
    ];

    data.programme.eligibility.forEach((examKey) => {
      const exam = data.programme.exams[examKey];
      const examMeta = EXAMS.find(item => item.key === examKey);
      const label = examKey === 'others' && exam.examName ? exam.examName : examMeta.label;

      if (examKey === 'others') {
        messages.push(textFormat(exam.examName, 'Other competitive exam name'));
      }

      messages.push(textFormat(exam.hallTicket, `${label} hall ticket number`));
      messages.push(positiveInteger(exam.rank, `${label} rank`));

      if (!data.documents[examMeta.docKey]) {
        messages.push(`${examMeta.docLabel} upload is required.`);
      }
    });

    return collectMessages(messages);
  };

  const errors = validationMessages();
  const canContinue = errors.length === 0;

  const handleNext = () => {
    if (!canContinue) {
      setShowErrors(true);
      return;
    }
    onNext();
  };

  return (
    <div className="form-step-anim">
      <div className="step-header">
        <h3 className="step-title">Step 1: Programme & Eligibility Details</h3>
        <p className="step-desc">Select the programme and all competitive exams through which the applicant is eligible.</p>
      </div>

      {showErrors && (
        <div className="step-error">
          <strong>Please correct the following:</strong>
          <ul className="step-error-list">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="form-card programme-card">
        <div className="form-card-title">
          <span className="form-card-num">1</span>
          Name of the Programme Applied <span className="required-star">*</span>
        </div>

        <div className="programme-options">
          {PROGRAMMES.map(programme => (
            <label key={programme} className="option-row">
              <input
                type="radio"
                name="applied"
                value={programme}
                checked={data.programme.applied === programme}
                onChange={(event) => updateProgramme({ applied: event.target.value })}
              />
              <span>{programme}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-card programme-card">
        <div className="form-card-title">
          <span className="form-card-num">2</span>
          Eligibility Criteria <span className="required-star">*</span>
        </div>

        <div className="exam-selector-grid">
          {EXAMS.map(exam => (
            <label key={exam.key} className="option-row compact">
              <input
                type="checkbox"
                checked={data.programme.eligibility.includes(exam.key)}
                onChange={() => toggleExam(exam.key)}
              />
              <span>{exam.label}</span>
            </label>
          ))}
        </div>

        {data.programme.eligibility.length > 0 && (
          <div className="exam-details-grid">
            {EXAMS.filter(exam => data.programme.eligibility.includes(exam.key)).map(exam => (
              <div key={exam.key} className="exam-detail-panel">
                <h4>{exam.label} Details <span className="required-star">*</span></h4>
                {exam.key === 'others' && (
                  <div className="form-group-floating">
                    <input
                      className="form-input-floating"
                      placeholder=" "
                      value={data.programme.exams.others.examName}
                      style={{ textTransform: 'uppercase' }}
                      onChange={(event) => updateExam('others', 'examName', event.target.value)}
                    />
                    <label className="form-label-floating">Competitive Exam Name <span className="required-star">*</span></label>
                  </div>
                )}
                <div className="form-group-floating">
                  <input
                    className="form-input-floating"
                    placeholder=" "
                    value={data.programme.exams[exam.key].hallTicket}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(event) => updateExam(exam.key, 'hallTicket', event.target.value)}
                  />
                  <label className="form-label-floating">Hall Ticket No. <span className="required-star">*</span></label>
                </div>
                <div className="form-group-floating">
                  <input
                    className="form-input-floating"
                    placeholder=" "
                    value={data.programme.exams[exam.key].rank}
                    onChange={(event) => updateExam(exam.key, 'rank', event.target.value)}
                  />
                  <label className="form-label-floating">Rank <span className="required-star">*</span></label>
                </div>
                <InlineDocumentUpload docKey={exam.docKey} label={exam.docLabel} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="step-nav" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Next: Personal Details
        </button>
      </div>
    </div>
  );
}
