import React from 'react';
import { Link } from '../lib/router';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  IndianRupee,
  MapPin,
  Plane,
  Users,
} from 'lucide-react';
import { APPLICATION_COMMENCE_LABEL, useApplicationOpen } from '../utils/applicationSchedule';
import './Home.css';

const studentReferencePdfs = [
  {
    title: 'Notification and Timeline',
    description: 'Official admissions notification with the published schedule and important dates.',
    url: 'https://api.jntugv.edu.in/media/1785324527457-5e5544e2-38a8-41d0-8337-0e4bb8e2dd8a.pdf',
  },
  {
    title: 'Information Booklet',
    description: 'Programme details, eligibility, fee structure, documents, and counselling information.',
    url: 'https://api.jntugv.edu.in/media/1785324382397-7f161667-50e2-408d-a98f-62c0a9c03b7b.pdf',
  },
];

export default function Home() {
  const applicationOpen = useApplicationOpen();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="brand-row" aria-label="University logos">
            <img src="/jntugv-logo.png" alt="JNTUGV" />
            <span />
            <img src="/reutlingen-logo.png" alt="Reutlingen University" />
          </div>

          <div className="hero-badge">Admissions 2026-27 · Notification dated 29.07.2026</div>
          <h1 className="hero-title">Study in India and Germany</h1>
          <p className="hero-subtitle">
            Five-year International Integrated Bachelor&apos;s and Master&apos;s Programme offered by JNTU-GV with Knowledge Foundation @ Reutlingen University, Germany.
          </p>

          <div className="home-application-card">
            <span>Online applications commence 30 July 2026</span>
            <h2>First Batch · RUKF-IIBMP 2026-27</h2>
            <p>Earn a B.Tech degree from JNTU-GV and an M.Sc degree through Knowledge Foundation @ Reutlingen University in one integrated five-year pathway.</p>
            {applicationOpen ? (
              <Link to="/register" className="btn btn-primary">
                <ClipboardList size={18} />
                Register and Apply
              </Link>
            ) : (
              <span className="btn btn-primary application-link-disabled" aria-disabled="true">
                <ClipboardList size={18} />
                {APPLICATION_COMMENCE_LABEL}
              </span>
            )}
          </div>

          <div className="notice-panel">
            <strong>Selection basis</strong>
            <span>70% of seats through AP EAPCET-2026 rank and 30% through JEE (Main)-2026 rank. Eligibility requires 60% aggregate in Intermediate / 10+2 with Mathematics, Physics and Chemistry.</span>
          </div>
        </div>
      </section>

      <section className="student-reference-section" aria-labelledby="student-reference-heading">
        <div className="container-inner">
          <div className="section-title-row">
            <div>
              <h2 id="student-reference-heading" className="section-heading text-left">Student References</h2>
              <p>Read the official admission documents before registration and payment.</p>
            </div>
          </div>

          <div className="pdf-reference-grid">
            {studentReferencePdfs.map((pdf) => (
              <article className="pdf-reference-card" key={pdf.url}>
                <div className="pdf-reference-header">
                  <div className="card-icon"><FileText size={24} /></div>
                  <div>
                    <h3>{pdf.title}</h3>
                    <p>{pdf.description}</p>
                  </div>
                </div>
                <a className="btn btn-outline pdf-open-link" href={pdf.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} />
                  Open PDF
                </a>
              </article>
            ))}
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
              <div className="card-icon"><Users size={28} /></div>
              <h3>120 Seats</h3>
              <p>Total intake is 60 seats in Computer Science and Engineering and 60 seats in Electronics and Communication Engineering.</p>
            </div>
          </div>

          <div className="programme-facts" aria-label="Programme overview">
            <article>
              <GraduationCap size={24} />
              <div>
                <strong>Five-year integrated programme</strong>
                <span>First 3 years at JNTU-GV, Vizianagaram; final 2 years at KFRU, Germany.</span>
              </div>
            </article>
            <article>
              <IndianRupee size={24} />
              <div>
                <strong>Published tuition structure</strong>
                <span>₹1,50,000 per year for the first 3 years and €6,000 per semester for the final 4 semesters.</span>
              </div>
            </article>
            <article>
              <Plane size={24} />
              <div>
                <strong>International study pathway</strong>
                <span>English-medium programme with the final two years in Germany and an eligible 18-month post-study job-search period.</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="container-inner">
          <div className="steps-layout">
            <div className="steps-info">
              <h2 className="section-heading text-left">Application Flow</h2>
              <p className="steps-desc">Apply online and keep the required certificates ready. Admission is provisional and subject to eligibility, original-document verification, counselling, and seat availability.</p>

              <div className="timeline">
                {[
                  { title: 'Confirm eligibility', desc: 'Indian National / PIO / OCI candidate with at least 60% in Intermediate or equivalent with Mathematics, Physics and Chemistry.' },
                  { title: 'Complete the online application', desc: 'Enter personal, academic and entrance-exam details and choose the preferred integrated programme.' },
                  { title: 'Upload supporting documents', desc: 'Provide Class 10 and 10+2 certificates, AP EAPCET / JEE (Main) rank card or scorecard, Aadhaar, photo, signature and applicable certificates.' },
                  { title: 'Attend counselling in person', desc: 'Bring all original certificates, first-year tuition fee of ₹1,50,000 and counselling fee of ₹2,000.' },
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
                  <span className="date-label">Online Application Opens</span>
                  <span className="date-value">30.07.2026</span>
                </li>
                <li>
                  <span className="date-label">Last Date for Online Application</span>
                  <span className="date-value">14.08.2026</span>
                </li>
                <li>
                  <span className="date-label">Last Date with ₹1,000 Late Fee</span>
                  <span className="date-value">18.08.2026</span>
                </li>
                <li className="highlight-date">
                  <span className="date-label">Admission Counselling</span>
                  <span className="date-value">19.08.2026 · 10:00 AM</span>
                </li>
              </ul>
              <div className="dates-footer">
                <MapPin size={18} aria-hidden="true" />
                <span><strong>Venue:</strong> Directorate of Admissions, JNTU-GV, Dwarapudi, Vizianagaram.</span>
              </div>
              <p className="dates-note">Candidates must attend in person. Attending counselling does not guarantee admission.</p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
