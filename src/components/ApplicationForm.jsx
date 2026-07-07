import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, Printer, Save } from 'lucide-react';
import { useForm } from '../context/useForm';
import { downloadApplicationPdf } from '../utils/downloadApplicationPdf';
import ProgressBar from './ProgressBar';
import PrintableApplication from './PrintableApplication';
import Step1Programme from './steps/Step1Programme';
import Step2Personal from './steps/Step2Personal';
import Step3Academics from './steps/Step3Academics';
import Step4Documents from './steps/Step4Documents';
import Step5Payment from './steps/Step5Payment';
import Step6Review from './steps/Step6Review';
import './ApplicationForm.css';

export default function ApplicationForm() {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const {
    data,
    currentStep,
    nextStep,
    prevStep,
    submitForm,
    submitted,
    regNo,
    resetForm,
    submissionError,
    saveDraft,
    draftStatus,
    isSubmitting,
  } = useForm();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Programme onNext={nextStep} />;
      case 2: return <Step2Personal onNext={nextStep} onBack={prevStep} />;
      case 3: return <Step3Academics onNext={nextStep} onBack={prevStep} />;
      case 4: return <Step4Documents onNext={nextStep} onBack={prevStep} />;
      case 5: return <Step5Payment onNext={nextStep} onBack={prevStep} />;
      case 6: return <Step6Review onSubmit={submitForm} onBack={prevStep} />;
      default: return <Step1Programme onNext={nextStep} />;
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadApplicationPdf(regNo || 'JNTUGV-IIBMP-Application');
    } finally {
      setIsDownloading(false);
    }
  };

  if (submitted) {
    return (
      <div className="application-container">
        <div className="application-device-block">
          <h2>Open on Desktop or Laptop</h2>
          <p>This application form and PDF preview are designed for a wider screen so all columns, uploads, and print formatting remain visible.</p>
        </div>
        <div className="form-wrapper submission-success desktop-only-application">
          <div className="success-mark"><CheckCircle2 size={34} /></div>
          <h2>Application Submitted</h2>
          <p>Your RUKF-IIBMP application has been saved successfully.</p>
          <div className="registration-box">
            <span>Registration Number</span>
            <strong>{regNo}</strong>
          </div>
          <div className="post-submit-reminder">
            <h3>Print or save your application</h3>
            <p>Please print the submitted application or save it as a PDF for future reference and admission counselling.</p>
          </div>
          <div className="success-actions">
            <button type="button" className="btn btn-accent" onClick={() => window.print()}>
              <Printer size={18} />
              Print Application
            </button>
            <button type="button" className="btn btn-outline" onClick={handleDownloadPdf} disabled={isDownloading}>
              <Download size={18} />
              {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
            <Link to={`/status?reg=${encodeURIComponent(regNo)}`} className="btn btn-primary">Track Status</Link>
            <button type="button" className="btn btn-outline" onClick={resetForm}>New Application</button>
          </div>
          <div className="submitted-print-preview">
            <PrintableApplication data={data} regNo={regNo} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="application-container">
      <section className="application-notice-page">
        <div className="application-brand-row" aria-label="University logos">
          <div>
            <img src="/jntugv-logo.png" alt="JNTUGV" />
            <span>JNTUGV</span>
          </div>
          <div>
            <img src="/reutlingen-logo.png" alt="Reutlingen University" />
            <span>Reutlingen University</span>
          </div>
        </div>
        <div className="application-status-badge">Applications are commencing shortly</div>
        <h1>RUKF-IIBMP Admissions 2026-27</h1>
        <p>
          International Integrated Bachelor&apos;s and Master&apos;s Program offered by JNTUGV in collaboration with Knowledge Foundation of Reutlingen University, Germany.
        </p>
        <div className="application-notice-panel">
          <strong>Admissions Notice</strong>
          <span>Keep scanned certificates, entrance rank cards, Aadhaar, category certificate if applicable, photo, signature, and SBI Collect payment receipt PDF ready before starting the application.</span>
        </div>
      </section>
      <div className="application-device-block">
        <h2>Open on Desktop or Laptop</h2>
        <p>This application form is available only on desktop or laptop screens for better visibility and accurate document verification.</p>
      </div>
      <motion.div 
        className="form-wrapper desktop-only-application"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="form-title-row">
          <div>
            <h2 className="form-page-title">RUKF-IIBMP Application Form 2026</h2>
            <p className="draft-status">{draftStatus}</p>
          </div>
          <button
            type="button"
            className="btn btn-outline save-draft-button"
            onClick={() => saveDraft()}
            disabled={isSubmitting}
          >
            <Save size={18} />
            Save Draft
          </button>
        </div>
        
        <ProgressBar currentStep={currentStep} totalSteps={6} />
        {submissionError && <div className="form-alert">{submissionError}</div>}
        
        <div className="form-content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
