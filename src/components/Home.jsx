import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ClipboardList, FileCheck2, GraduationCap, ShieldCheck } from 'lucide-react';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="brand-row" aria-label="University logos">
            <img src="/jntugv-logo.png" alt="JNTUGV" />
            <span />
            <img src="/reutlingen-logo.png" alt="Reutlingen University" />
          </div>

          <div className="hero-badge">Applications are commencing shortly</div>
          <h1 className="hero-title">RUKF-IIBMP Admissions 2026-27</h1>
          <p className="hero-subtitle">
            International Integrated Bachelor&apos;s and Master&apos;s Program offered by JNTUGV in collaboration with Knowledge Foundation of Reutlingen University, Germany.
          </p>

          <div className="notice-panel">
            <strong>Admissions Notice</strong>
            <span>Keep scanned certificates, entrance rank cards, Aadhaar, category certificate if applicable, photo, signature, and payment proof ready before starting the application.</span>
          </div>

          <div className="hero-cta-group">
            <Link to="/application-RUKF-IIBMP" className="btn btn-primary btn-lg">
              <ClipboardList size={18} />
              Application Form
            </Link>
            <Link to="/status" className="btn btn-outline btn-lg">
              <FileCheck2 size={18} />
              Track Status
            </Link>
          </div>
        </div>
      </section>

      <section id="details" className="features-section">
        <div className="container-inner">
          <h2 className="section-heading">Programmes Offered</h2>
          <div className="grid-cards">
            <div className="feature-card">
              <div className="card-icon"><GraduationCap size={28} /></div>
              <h3>B.Tech (CSE) + M.Sc (PSE)</h3>
              <p>Computer Science and Engineering with Professional Software Engineering specialization.</p>
            </div>

            <div className="feature-card">
              <div className="card-icon"><GraduationCap size={28} /></div>
              <h3>B.Tech (ECE) + M.Sc (DBM)</h3>
              <p>Electronics and Communication Engineering with Digital Business Management specialization.</p>
            </div>

            <div className="feature-card">
              <div className="card-icon"><ShieldCheck size={28} /></div>
              <h3>Office Verification</h3>
              <p>Document preview, stage-wise review remarks, print, and PDF download are available for admissions office use.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="container-inner">
          <div className="steps-layout">
            <div className="steps-info">
              <h2 className="section-heading text-left">Application Flow</h2>
              <p className="steps-desc">Use a desktop or laptop for the application form so all tables, uploads, preview, and print sections remain visible.</p>

              <div className="timeline">
                {[
                  { title: 'Fill Application', desc: 'Enter programme, personal, academic, entrance exam, and declaration details.' },
                  { title: 'Upload Proofs', desc: 'Attach education certificates, rank cards, category proof, Aadhaar, payment proof, photo, and signature.' },
                  { title: 'Submit and Print', desc: 'Save the registration number, download the PDF, and print the final application.' },
                ].map((step, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"><CheckCircle2 size={22} /></div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="important-dates-card">
              <h3><CalendarDays size={20} /> Important Dates</h3>
              <ul className="dates-list">
                <li>
                  <span className="date-label">Last Date (No Late Fee)</span>
                  <span className="date-value">10.07.2026</span>
                </li>
                <li>
                  <span className="date-label">Last Date (With Rs. 1000 Late Fee)</span>
                  <span className="date-value">14.07.2026</span>
                </li>
                <li className="highlight-date">
                  <span className="date-label">Admission Counselling</span>
                  <span className="date-value">15.07.2026 @ 10:00 AM</span>
                </li>
              </ul>
              <div className="dates-footer">
                <strong>Venue:</strong> Directorate of Admissions, JNTUGV, Bobbili Highway, Dwarapudi, Vizianagaram.
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
