import React, { useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { useForm } from '../../context/useForm';
import { collectMessages, textFormat } from '../../utils/validation';
import { downloadApplicationPdf } from '../../utils/downloadApplicationPdf';
import PrintableApplication from '../PrintableApplication';
import './Step6Review.css';

const todayValue = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
};

export default function Step6Review({ onSubmit, onBack }) {
  const { data, updateData, isSubmitting, regNo } = useForm();
  const [showErrors, setShowErrors] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  useEffect(() => {
    if (!data.declaration.date) {
      updateData({
        ...data,
        declaration: { ...data.declaration, date: todayValue() },
      });
    }
  }, [data, updateData]);

  const updateDeclaration = (field, value) => {
    updateData({
      ...data,
      declaration: { ...data.declaration, [field]: value },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = collectMessages([
      textFormat(data.declaration.station, 'Declaration station'),
      data.declaration.agreed ? '' : 'Declaration confirmation must be checked before submission.',
    ]);

    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    await onSubmit();
  };

  const errors = collectMessages([
    textFormat(data.declaration.station, 'Declaration station'),
    data.declaration.agreed ? '' : 'Declaration confirmation must be checked before submission.',
  ]);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadApplicationPdf(regNo || 'JNTUGV-IIBMP-Application-Preview');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="form-step-anim">
      <div className="step-header no-print">
        <h3 className="step-title">Step 6: Final Application Preview</h3>
        <p className="step-desc">Review the completed application in the same section format as the DOCX before printing or submitting.</p>
      </div>

      <div className="review-toolbar no-print">
        <div className="declaration-input-grid">
          <div className="form-group-floating">
            <input
              className="form-input-floating"
              placeholder=" "
              value={data.declaration.station}
              onChange={(event) => updateDeclaration('station', event.target.value)}
            />
            <label className="form-label-floating">Station</label>
          </div>
          <div className="auto-date-field">
            <span className="auto-date-label">Declaration Date</span>
            <strong>{formatDate(data.declaration.date)}</strong>
            <small>Set automatically</small>
          </div>
        </div>
        <div className="review-print-actions">
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={18} />
            Print Application
          </button>
          <button type="button" className="btn btn-accent" onClick={handleDownloadPdf} disabled={isDownloading}>
            <Download size={18} />
            {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <PrintableApplication data={data} regNo={regNo} />

      <section className="review-section declaration-section no-print">
        <h4>Declaration Confirmation</h4>
        {showErrors && (
          <div className="step-error">
            <strong>Please correct the following:</strong>
            <ul className="step-error-list">
              {errors.map(error => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={data.declaration.agreed}
            onChange={(event) => updateDeclaration('agreed', event.target.checked)}
          />
          <span>
            I declare that all the information furnished above is true and correct to the best of my knowledge and belief.
          </span>
        </label>
      </section>

      <div className="step-nav no-print">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back to Edit</button>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={handleSubmit}
          disabled={!data.declaration.agreed || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
