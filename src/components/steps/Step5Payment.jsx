import React, { useRef, useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import { useForm } from '../../context/useForm';
import { collectMessages, positiveAmount, required, textFormat } from '../../utils/validation';
import CalendarInput from '../CalendarInput';
import './Step5Payment.css';
import './Step3Academics.css';

const MAX_PROOF_FILE_SIZE = 2 * 1024 * 1024;

const PAYMENT_FIELDS = [
  { key: 'fee', label: 'Application Fee', placeholder: '2000' },
  { key: 'txn_ref', label: 'SBI Collect Reference No', placeholder: 'DU / SBI Collect Reference No' },
  { key: 'txn_date', label: 'Transaction Date', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'mode', label: 'Mode of Payment', placeholder: 'SBI COLLECT' },
  { key: 'status', label: 'Status of Payment', placeholder: 'SUCCESS' },
];

const UPPERCASE_PAYMENT_FIELDS = new Set(['txn_ref', 'mode', 'status']);

function PaymentProofUpload({ payment, index, updatePayment }) {
  const inputRef = useRef(null);

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Payment proof must be uploaded as a PDF receipt.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_PROOF_FILE_SIZE) {
      alert('Payment proof must be less than 2MB.');
      event.target.value = '';
      return;
    }
    updatePayment(index, 'proofFile', file);
  };

  return (
    <div className={`payment-proof-upload ${payment.proofFile ? 'uploaded' : ''}`}>
      <button type="button" onClick={() => inputRef.current.click()}>
        {payment.proofFile ? <Check size={17} /> : <Upload size={17} />}
        <span>{payment.proofFile ? payment.proofFile.name : 'Upload proof'}</span>
      </button>
      {payment.proofFile && (
        <button
          type="button"
          className="payment-proof-remove"
          onClick={() => updatePayment(index, 'proofFile', null)}
          aria-label="Remove payment proof"
        >
          <X size={15} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={handleFile} />
    </div>
  );
}

export default function Step5Payment({ onNext, onBack }) {
  const { data, updatePayment, addPaymentRow, removePaymentRow } = useForm();
  const [showErrors, setShowErrors] = useState(false);

  const paymentHasValue = (payment) => (
    PAYMENT_FIELDS.some(field => String(payment[field.key] || '').trim()) || payment.proofFile
  );
  const activePayments = data.payments.filter(paymentHasValue);
  const successfulPayment = activePayments.some(payment => payment.status?.toLowerCase() === 'success');

  const validationMessages = () => {
    const messages = [];

    if (activePayments.length === 0) {
      messages.push('At least one payment row is required.');
    }

    activePayments.forEach((payment, index) => {
      const rowLabel = `Payment row ${data.payments.indexOf(payment) + 1 || index + 1}`;
      messages.push(positiveAmount(payment.fee, `${rowLabel} application fee`));
      messages.push(textFormat(payment.txn_ref, `${rowLabel} SBI Collect reference number`));
      messages.push(required(payment.txn_date, `${rowLabel} transaction date is required.`));
      messages.push(textFormat(payment.mode, `${rowLabel} mode of payment`));
      messages.push(textFormat(payment.status, `${rowLabel} status of payment`));
      if (!payment.proofFile) messages.push(`${rowLabel} SBI Collect payment receipt PDF upload is required.`);
    });

    if (activePayments.length > 0 && !successfulPayment) {
      messages.push('At least one payment row must have status SUCCESS.');
    }

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
        <h3 className="step-title">Step 5: Registration Fee Payment Details</h3>
        <p className="step-desc">Pay through SBI Collect, then enter the transaction details and upload the SBI Collect receipt as PDF.</p>
      </div>

      {showErrors && (
        <div className="step-error">
          <strong>Please correct the following:</strong>
          <ul className="step-error-list">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="payment-card wide-payment-card">
        <div className="payment-summary">
          <h4>Payment Summary</h4>
          <div className="summary-row">
            <span>Application Type:</span>
            <span>RUKF-IIBMP 2026-27</span>
          </div>
          <div className="summary-row">
            <span>Candidate Name:</span>
            <span>{data.personal.name || 'Not Provided'}</span>
          </div>
          <div className="sbi-collect-note">
            <strong>SBI Collect Payment Procedure</strong>
            <ol>
              <li>Open SBI Collect and complete the admission application fee payment using the official university payment category.</li>
              <li>Download the SBI Collect receipt after payment completion.</li>
              <li>Enter the SBI Collect reference number, transaction date, fee amount, payment mode, and payment status below.</li>
              <li>Upload only the SBI Collect receipt in PDF format as payment proof.</li>
            </ol>
          </div>
        </div>

        <div className="payment-table-wrap">
          <table className="payment-entry-table">
            <thead>
              <tr>
                <th>S.No</th>
                {PAYMENT_FIELDS.map(field => <th key={field.key}>{field.label} <span className="required-star">*</span></th>)}
                <th>SBI Collect Receipt PDF <span className="required-star">*</span></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((payment, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  {PAYMENT_FIELDS.map(field => (
                    <td key={field.key} className={field.type === 'date' ? 'table-calendar-cell' : undefined}>
                      {field.type === 'date' ? (
                        <CalendarInput
                          name={`txn_date_${index}`}
                          label={field.label}
                          value={payment[field.key] || ''}
                          onChange={(event) => updatePayment(index, field.key, event.target.value)}
                          required
                          max="2026-12-31"
                        />
                      ) : (
                        <input
                          type="text"
                          value={payment[field.key] || ''}
                          placeholder={field.placeholder}
                          onChange={(event) => updatePayment(
                            index,
                            field.key,
                            field.key === 'fee'
                              ? event.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
                              : UPPERCASE_PAYMENT_FIELDS.has(field.key)
                                ? event.target.value.toUpperCase()
                                : event.target.value
                          )}
                          style={UPPERCASE_PAYMENT_FIELDS.has(field.key) ? { textTransform: 'uppercase' } : undefined}
                          required
                        />
                      )}
                    </td>
                  ))}
                  <td>
                    <PaymentProofUpload payment={payment} index={index} updatePayment={updatePayment} />
                  </td>
                  <td>
                    <button type="button" className="table-link-button" onClick={() => removePaymentRow(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="payment-actions-row">
          <button type="button" className="btn btn-outline" onClick={addPaymentRow}>+ Add Payment Row</button>
        </div>
      </div>

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Next: Final Preview
        </button>
      </div>
    </div>
  );
}
