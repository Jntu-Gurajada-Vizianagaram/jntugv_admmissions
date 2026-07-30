import React from 'react';
import { AlertTriangle, CheckCircle2, IndianRupee } from 'lucide-react';
import { useForm } from '../../context/useForm';
import './Step5Payment.css';
import './Step3Academics.css';

export default function Step5Payment({ onBack }) {
  const { data } = useForm();

  return (
    <div className="form-step-anim">
      <div className="step-header">
        <h3 className="step-title">Step 5: Fee Payment Notice</h3>
        <p className="step-desc">
          Payment process is not declared at this time due to technical issues. The application cannot be finally submitted without payment.
        </p>
      </div>

      <div className="payment-card wide-payment-card">
        <div className="payment-summary">
          <h4>Current Fee Instructions</h4>
          <div className="summary-row">
            <span>Application Type:</span>
            <span>RUKF-IIBMP 2026-27</span>
          </div>
          <div className="summary-row">
            <span>Candidate Name:</span>
            <span>{data.personal.name || 'Not Provided'}</span>
          </div>
        </div>

        <div className="payment-hold-card" role="status">
          <div className="payment-hold-icon">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4>Payment Process Not Yet Declared</h4>
            <p>
              Due to technical issues, online payment instructions and transaction entry are temporarily withheld. Please save your draft and continue after the payment process is enabled.
            </p>
          </div>
        </div>

        <div className="payment-instruction-grid">
          <article>
            <IndianRupee size={22} />
            <div>
              <strong>Counselling Fee</strong>
              <span>The counselling fee must be paid along with the application once the payment process is declared.</span>
            </div>
          </article>
          <article>
            <CheckCircle2 size={22} />
            <div>
              <strong>Tuition Fee</strong>
              <span>Rs. 1,50,000 tuition fee will be paid only after admission fulfilment, as directed by the Director of Admissions.</span>
            </div>
          </article>
        </div>

        <p className="payment-note">
          Payment will be processed shortly. Until then, use Save Draft to preserve your completed application details.
        </p>
      </div>

      <div className="step-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary application-link-disabled" disabled>
          Final Submission Opens After Payment
        </button>
      </div>
    </div>
  );
}
