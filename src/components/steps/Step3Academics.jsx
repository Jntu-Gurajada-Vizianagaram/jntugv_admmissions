import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from '../../context/useForm';
import { collectMessages, required, textFormat, yearFormat } from '../../utils/validation';
import './Step3Academics.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const COLUMNS = [
  { key: 'examination', label: 'Examination', placeholder: 'SSC / Inter / Degree' },
  { key: 'year', label: 'Year of Passing', placeholder: 'YYYY' },
  { key: 'classDivision', label: 'Class / Division', placeholder: 'First class' },
  { key: 'marksGrade', label: '% Marks / Grade', placeholder: '95% / 9.5' },
  { key: 'institution', label: 'Board / School / College / University', placeholder: 'Institution name' },
  { key: 'stateStudied', label: 'State Studied', placeholder: 'State' },
  { key: 'subjects', label: 'Subjects Studied', placeholder: 'MPC / relevant subjects' },
];

const UPPERCASE_COLUMNS = new Set(['examination', 'classDivision', 'institution', 'stateStudied', 'subjects']);

function RequiredLabel({ children }) {
  return <>{children} <span className="required-star">*</span></>;
}

function EducationFileInput({ row, index, updateEducation }) {
  const inputRef = useRef(null);

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File exceeds 2MB limit.');
      event.target.value = '';
      return;
    }

    updateEducation(index, 'certificateFile', file);
  };

  return (
    <div className="education-upload-cell">
      <button type="button" className={`edu-upload-button ${row.certificateFile ? 'uploaded' : ''}`} onClick={() => inputRef.current.click()}>
        {row.certificateFile ? row.certificateFile.name : 'Upload Certificate *'}
      </button>
      {row.certificateFile && (
        <button
          type="button"
          className="table-link-button"
          onClick={() => updateEducation(index, 'certificateFile', null)}
          aria-label={`Remove ${row.examination || 'education'} certificate`}
          title="Remove certificate"
        >
          <X size={17} aria-hidden="true" />
        </button>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={handleFile} />
    </div>
  );
}

export default function Step3Academics({ onNext, onBack }) {
  const { data, updateEducation, addEducationRow, removeEducationRow } = useForm();
  const [showErrors, setShowErrors] = useState(false);

  const fieldProps = (index, key) => ({
    value: data.education[index][key] || '',
    onChange: (event) => updateEducation(
      index,
      key,
      key === 'year'
        ? event.target.value.replace(/\D/g, '').slice(0, 4)
        : UPPERCASE_COLUMNS.has(key)
          ? event.target.value.toUpperCase()
          : event.target.value
    ),
    className: 'form-input-floating',
    style: {
      padding: '0.7rem',
      fontSize: '0.85rem',
      minWidth: key === 'institution' ? 220 : 140,
      textTransform: UPPERCASE_COLUMNS.has(key) ? 'uppercase' : undefined,
    },
    required: true,
  });

  const validationMessages = () => {
    const messages = [];

    if (data.education.length === 0) {
      messages.push('At least one educational qualification is required.');
    }

    data.education.forEach((row, index) => {
      const rowLabel = `Education row ${index + 1}`;
      messages.push(textFormat(row.examination, `${rowLabel} examination`));
      messages.push(yearFormat(row.year, `${rowLabel} year of passing`));
      messages.push(textFormat(row.classDivision, `${rowLabel} class / division`));
      messages.push(required(row.marksGrade, `${rowLabel} marks / grade is required.`));
      messages.push(textFormat(row.institution, `${rowLabel} board / school / college / university`));
      messages.push(textFormat(row.stateStudied, `${rowLabel} state studied`));
      messages.push(textFormat(row.subjects, `${rowLabel} subjects studied`));
      if (!row.certificateFile) messages.push(`${rowLabel} certificate upload is required.`);
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
        <h3 className="step-title">Step 3: Educational Qualifications</h3>
        <p className="step-desc">Upload each qualification certificate in the same row to keep the verification flow correct.</p>
      </div>

      {showErrors && (
        <div className="step-error">
          <strong>Please correct the following:</strong>
          <ul className="step-error-list">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="table-responsive" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table className="education-entry-table">
          <thead>
            <tr>
              <th>S.No</th>
              {COLUMNS.map(column => (
                <th key={column.key}><RequiredLabel>{column.label}</RequiredLabel></th>
              ))}
              <th><RequiredLabel>Certificate</RequiredLabel></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.education.map((edu, index) => (
              <tr key={edu.id}>
                <td>{index + 1}</td>
                {COLUMNS.map(column => (
                  <td key={column.key}>
                    <input type="text" placeholder={column.placeholder} {...fieldProps(index, column.key)} />
                  </td>
                ))}
                <td>
                  <EducationFileInput row={edu} index={index} updateEducation={updateEducation} />
                </td>
                <td>
                  <button
                    type="button"
                    className="table-link-button danger"
                    onClick={() => removeEducationRow(edu.id)}
                    aria-label={`Remove education row ${index + 1}`}
                    title="Remove education row"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button type="button" className="btn btn-outline" onClick={addEducationRow}>
          + Add Qualification
        </button>
      </div>

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>Next: Additional Documents</button>
      </div>
    </div>
  );
}
