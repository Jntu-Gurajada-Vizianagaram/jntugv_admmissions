import React, { useRef, useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import { useForm } from '../../context/useForm';
import { collectMessages, positiveAmount, required, textFormat } from '../../utils/validation';
import CalendarInput from '../CalendarInput';
import './Step5Payment.css';
import './Step3Academics.css';

const MAX_PROOF_FILE_SIZE = 2 * 1024 * 1024;

const PAYMENT_FIELDS = [
  { key: 'txn_ref', label: 'SBI Collect Reference No', placeholder: 'DU / SBI Collect Reference No' },
  { key: 'txn_date', label: 'Transaction Date', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'mode', label: 'Mode of Payment', placeholder: 'SBI COLLECT' },
];

const PAYMENT_OPTIONS = [
  { title: 'Counselling Fee', amount: '2000', required: true },
  { title: 'First-Year Tuition Fee', amount: '150000', required: false },
];

const UPPERCASE_PAYMENT_FIELDS = new Set(['txn_ref', 'mode']);

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
  const { data, updatePayment } = useForm();
  const [showErrors, setShowErrors] = useState(false);

  const paymentHasDetails = (payment = {}) => (
    ['txn_ref', 'txn_date', 'mode'].some(key => String(payment[key] || '').trim()) || payment.proofFile
  );
  const activePaymentIndexes = PAYMENT_OPTIONS
    .map((option, index) => (option.required || paymentHasDetails(data.payments[index]) ? index : -1))
    .filter(index => index >= 0);

  const validationMessages = () => {
    const messages = [];

    activePaymentIndexes.forEach((paymentIndex) => {
      const payment = data.payments[paymentIndex] || {};
      const option = PAYMENT_OPTIONS[paymentIndex];
      const rowLabel = option.title;
      messages.push(positiveAmount(option.amount, `${rowLabel} amount`));
      messages.push(textFormat(payment.txn_ref, `${rowLabel} SBI Collect reference number`));
      messages.push(required(payment.txn_date, `${rowLabel} transaction date is required.`));
      messages.push(textFormat(payment.mode, `${rowLabel} mode of payment`));
      if (!payment.proofFile) messages.push(`${rowLabel} SBI Collect payment receipt PDF upload is required.`);
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
              <li>Open SBI Collect and select the official university payment category.</li>
              <li>Download the SBI Collect receipt after payment completion.</li>
              <li>Pay the mandatory ₹2,000 counselling fee and enter its SBI Collect transaction details below.</li>
              <li>The ₹1,50,000 first-year tuition fee may also be paid through SBI Collect now, or paid later as instructed by the University.</li>
              <li>Upload only the SBI Collect receipt in PDF format as payment proof.</li>
            </ol>
          </div>
        </div>

        <div className="payment-entry-list">
          {PAYMENT_OPTIONS.map((option, index) => {
            const payment = data.payments[index] || {};
            const fieldsRequired = option.required || paymentHasDetails(payment);
            return (
            <section className="payment-entry-row" key={index}>
              <div className="payment-row-head">
                <strong>{option.title}</strong>
                <span className={option.required ? 'payment-required-badge' : 'payment-optional-badge'}>
                  {option.required ? 'Mandatory' : 'Optional'}
                </span>
              </div>

              <div className="payment-field-grid">
                <div className="payment-field">
                  <span>Fixed Fee Amount</span>
                  <input type="text" value={`₹${Number(option.amount).toLocaleString('en-IN')}`} readOnly />
                </div>
                {PAYMENT_FIELDS.map(field => (
                  <div key={field.key} className="payment-field">
                    {field.type !== 'date' && (
                      <span>{field.label} {fieldsRequired && <span className="required-star">*</span>}</span>
                    )}
                    {field.type === 'date' ? (
                      <CalendarInput
                        name={`txn_date_${index}`}
                        label={field.label}
                        value={payment[field.key] || ''}
                        onChange={(event) => updatePayment(index, field.key, event.target.value)}
                        required={fieldsRequired}
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
                          UPPERCASE_PAYMENT_FIELDS.has(field.key)
                              ? event.target.value.toUpperCase()
                              : event.target.value
                        )}
                        style={UPPERCASE_PAYMENT_FIELDS.has(field.key) ? { textTransform: 'uppercase' } : undefined}
                        required={fieldsRequired}
                      />
                    )}
                  </div>
                ))}

                <div className="payment-field payment-proof-field">
                  <span>SBI Collect Receipt PDF {fieldsRequired && <span className="required-star">*</span>}</span>
                  <PaymentProofUpload payment={payment} index={index} updatePayment={updatePayment} />
                </div>
              </div>
            </section>
            );
          })}
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
