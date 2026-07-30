import React from 'react';
import { Link } from '../lib/router';
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  IndianRupee,
  Landmark,
  MapPin,
  Plane,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { APPLICATION_COMMENCE_LABEL, useApplicationOpen } from '../utils/applicationSchedule';
import './Home.css';

const notifications = [
  {
    title: 'RUKF-IIBMP Admissions 2026-27 Notification and Timeline',
    description: 'Official notification with application dates, counselling schedule, and admission instructions.',
    url: 'https://api.jntugv.edu.in/media/1785324527457-5e5544e2-38a8-41d0-8337-0e4bb8e2dd8a.pdf',
  },
  {
    title: 'RUKF-IIBMP Information Booklet 2026-27',
    description: 'Eligibility, programme structure, fee details, documents, selection method, and counselling process.',
    url: 'https://api.jntugv.edu.in/media/1785324382397-7f161667-50e2-408d-a98f-62c0a9c03b7b.pdf',
  },
];

const administration = [
  'Vice-Chancellor',
  'Rector',
  'Registrar',
  'Directorate of Admissions',
  'Digital Monitoring Cell',
];

export default function Home() {
  const applicationOpen = useApplicationOpen();

  return (
    <div className="home-container">
      <section className="directorate-hero">
        <div className="hero-content">
          <div className="brand-row" aria-label="University logos">
            <img src="/jntugv-logo.png" alt="JNTUGV" />
            <span />
            <img src="/reutlingen-logo.png" alt="Reutlingen University" />
          </div>

          <div className="hero-badge">Directorate of Admissions</div>
          <h1 className="hero-title">Jawaharlal Nehru Technological University Gurajada Vizianagaram</h1>
          <p className="hero-subtitle">
            Official admissions portal for university admission notifications, applicant registration, online application submission, counselling updates, and admissions administration.
          </p>

          <div className="directorate-action-panel">
            <div>
              <span>Latest Admissions</span>
              <h2>RUKF-IIBMP Admissions 2026-27</h2>
              <p>Five-year International Integrated Bachelor&apos;s and Master&apos;s Programme offered by JNTU-GV with Knowledge Foundation @ Reutlingen University, Germany.</p>
            </div>
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
        </div>
      </section>

      <section className="directorate-section">
        <div className="container-inner">
          <div className="directorate-overview-grid">
            <article className="directorate-overview-card">
              <div className="card-icon"><Building2 size={26} /></div>
              <h2>About Directorate</h2>
              <p>
                The Directorate of Admissions coordinates admission notifications, online application workflows, applicant support, document verification, counselling schedules, and admission records for notified programmes of JNTU-GV.
              </p>
            </article>
            <article className="directorate-overview-card">
              <div className="card-icon"><Landmark size={26} /></div>
              <h2>University</h2>
              <p>
                Jawaharlal Nehru Technological University Gurajada Vizianagaram serves the academic, administrative, and student support needs of technical education through structured university processes and transparent admissions.
              </p>
            </article>
            <article className="directorate-overview-card">
              <div className="card-icon"><ShieldCheck size={26} /></div>
              <h2>Administration</h2>
              <p>
                Admissions activities are supported through university administration, Directorate officers, verification teams, and the Digital Monitoring Cell for reliable digital service delivery.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="administration-section">
        <div className="container-inner">
          <div className="section-title-row">
            <div>
              <h2 className="section-heading text-left">Administration</h2>
              <p>Admissions processes are carried out under the university administrative structure with dedicated digital and verification support.</p>
            </div>
          </div>
          <div className="administration-list">
            {administration.map((item) => (
              <article key={item}>
                <CheckCircle2 size={20} />
                <span>{item}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="notifications-section" aria-labelledby="notifications-heading">
        <div className="container-inner">
          <div className="section-title-row">
            <div>
              <h2 id="notifications-heading" className="section-heading text-left">Notifications</h2>
              <p>Official admission documents for student reference.</p>
            </div>
          </div>

          <div className="pdf-reference-grid">
            {notifications.map((pdf) => (
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

      <section className="latest-admissions-section">
        <div className="container-inner">
          <div className="latest-admissions-layout">
            <div className="latest-admissions-main">
              <div className="section-title-row">
                <div>
                  <h2 className="section-heading text-left">Latest Admissions</h2>
                  <p>Current online admission process hosted by the Directorate of Admissions.</p>
                </div>
              </div>

              <div className="admission-programme-card">
                <div className="admission-programme-header">
                  <div className="card-icon"><Bell size={24} /></div>
                  <div>
                    <span>Admissions 2026-27</span>
                    <h3>RUKF-IIBMP International Integrated Programme</h3>
                  </div>
                </div>
                <p>
                  First batch admissions for B.Tech + M.Sc integrated pathways in collaboration with Knowledge Foundation @ Reutlingen University, Germany.
                </p>
                <div className="programme-facts" aria-label="Programme overview">
                  <article>
                    <GraduationCap size={24} />
                    <div>
                      <strong>Programmes Offered</strong>
                      <span>B.Tech (CSE) + M.Sc (PSE) and B.Tech (ECE) + M.Sc (DBM).</span>
                    </div>
                  </article>
                  <article>
                    <Users size={24} />
                    <div>
                      <strong>120 Seats</strong>
                      <span>60 seats in Computer Science and Engineering and 60 seats in Electronics and Communication Engineering.</span>
                    </div>
                  </article>
                  <article>
                    <IndianRupee size={24} />
                    <div>
                      <strong>Published Fee Structure</strong>
                      <span>Rs. 1,50,000 per year for first 3 years and EUR 6,000 per semester for final 4 semesters.</span>
                    </div>
                  </article>
                  <article>
                    <Plane size={24} />
                    <div>
                      <strong>International Pathway</strong>
                      <span>First 3 years at JNTU-GV and final 2 years through KFRU, Germany.</span>
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <aside className="important-dates-card">
              <h3><CalendarDays size={20} /> Important Dates</h3>
              <ul className="dates-list">
                <li>
                  <span className="date-label">Online Application Commences</span>
                  <span className="date-value">30.07.2026</span>
                </li>
                <li>
                  <span className="date-label">Last Date for Online Application</span>
                  <span className="date-value">14.08.2026</span>
                </li>
                <li>
                  <span className="date-label">Last Date with Rs. 1,000 Late Fee</span>
                  <span className="date-value">18.08.2026</span>
                </li>
                <li className="highlight-date">
                  <span className="date-label">Admission Counselling</span>
                  <span className="date-value">19.08.2026 at 10:00 AM</span>
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
