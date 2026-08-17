import React from 'react';
import { Link } from '../lib/router';
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  IndianRupee,
  Landmark,
  MapPin,
  Plane,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { APPLICATION_COMMENCE_LABEL, useApplicationOpen } from '../utils/applicationSchedule';
import './Home.css';

const notifications = [
  {
    title: 'Rescheduling of RUKF-IIBMP Admission Counselling',
    description: 'Admission counselling originally scheduled on 19.08.2026 at 10:00 AM is rescheduled to 20.08.2026 at 10:00 AM.',
    url: '/rescheduling-of-iibmp-programme.pdf',
  },
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

const administrationProfiles = [
  {
    name: 'Prof. V. V. Subba Rao',
    role: "Hon'ble Vice-Chancellor",
    email: 'vc@jntugv.edu.in',
    image: 'https://jntugv.edu.in/assets/vc-BndO31oB.png',
    summary: 'Professor of Mechanical Engineering with extensive academic and administrative experience in technical education.',
  },
  {
    name: 'Prof. D. Rajya Lakshmi',
    role: 'Registrar',
    email: 'registrar@jntugv.edu.in',
    image: 'https://jntugv.edu.in/assets/registrar_new-CGPi7Nx6.jpeg',
    summary: 'Professor of Computer Science and Engineering with teaching, research, evaluation, and university administration experience.',
  },
  {
    name: 'Dr. Shaik Kalesha Vali',
    role: 'Director of Admissions',
    email: 'da@jntugv.edu.in',
    image: 'https://jntugv.edu.in/assets/da-DNVfObaK.jpeg',
    summary: "Officer on Special Duty to Hon'ble Vice-Chancellor and Director (i/c) of IQAC; Professor of Mathematics, Dept. of BS&HSS - JNTU-GV CEV.",
  },
];

const officialContacts = [
  { title: 'Vice Chancellor Peshi', phone: '08922 222606', email: 'ps2vc@jntugv.edu.in' },
  { title: 'Registrar Peshi', phone: '08922 294316', email: 'registrarpeshi@jntugv.edu.in' },
  { title: 'Directorate of Admissions', phone: '', email: 'da@jntugv.edu.in' },
];

export default function Home({ page = 'home' }) {
  const applicationOpen = useApplicationOpen();
  const showAll = page === 'home';
  const showAdministration = showAll || page === 'administration';
  const showContact = showAll || page === 'contact';
  const showNotifications = showAll || page === 'notifications';
  const showFeeDetails = page === 'fee-details';
  const showLatestAdmissions = showAll || page === 'latest-admissions' || page === 'programmes';

  return (
    <div className="home-container">
      {showAll && (
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
            Official admissions portal for JNTU-GV admission notifications, online applications, applicant support, counselling updates, verification, and admission records.
          </p>

          <div className="directorate-action-panel">
            <div>
              <span>Latest Admissions</span>
              <h2>RUKF-IIBMP Admissions 2026-27</h2>
              <p>JNTU-GV/RUKF admissions for the 5 Years International Integrated Bachelor and Master&apos;s Programmes.</p>
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
      )}

      {showAll && (
      <section className="directorate-section">
        <div className="container-inner">
          <div className="directorate-overview-grid">
            <article className="directorate-overview-card">
              <div className="card-icon"><Building2 size={26} /></div>
              <h2>About Directorate</h2>
              <p>
                The Directorate of Admissions manages admission-related activities for undergraduate, postgraduate, research, pharmacy, and special international integrated programmes. It coordinates online applications, entrance or selection processes, admission records, candidate updates, and integration with academic departments.
              </p>
            </article>
            <article className="directorate-overview-card">
              <div className="card-icon"><Landmark size={26} /></div>
              <h2>University</h2>
              <p>
                JNTU College of Engineering, Vizianagaram was established in 2007 as a constituent college of JNTU Hyderabad. Vide University Act No. 22 of 2021, Jawaharlal Nehru Technological University Gurajada, Vizianagaram came into existence as a separate university through G.O.Ms.No.3, dated 12-01-2022.
              </p>
            </article>
            <article className="directorate-overview-card">
              <div className="card-icon"><ShieldCheck size={26} /></div>
              <h2>Administration</h2>
              <p>
                The university jurisdiction covers Vizianagaram, Visakhapatnam, Srikakulam, Parvathipuram Manyam, Alluri Sitharama Raju, and Anakapalli districts, with constituent and affiliated colleges under its academic administration.
              </p>
            </article>
          </div>
        </div>
      </section>
      )}

      {showAdministration && (
      <section className="administration-section">
        <div className="container-inner">
          <div className="section-title-row">
            <div>
              <h2 className="section-heading text-left">Administration</h2>
              <p>Explore the key administrative offices of JNTU-GV and the Directorate units supporting admissions and academic services.</p>
            </div>
          </div>
          <div className="administration-profile-grid">
            {administrationProfiles.map((profile) => (
              <article className="administration-profile-card" key={profile.email}>
                <div className="administration-profile-image">
                  <img src={profile.image} alt={profile.name} />
                </div>
                <div className="administration-profile-content">
                  <span>{profile.role}</span>
                  <h3>{profile.name}</h3>
                  <p>{profile.summary}</p>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {showContact && (
      <section className="contact-strip-section">
        <div className="container-inner">
          <div className="section-title-row">
            <div>
              <h2 className="section-heading text-left">Official Contacts</h2>
              <p>Selected university contact points listed on the official JNTU-GV website.</p>
            </div>
          </div>
          <div className="contact-card-grid">
            {officialContacts.map((contact) => (
              <article className="contact-card" key={contact.title}>
                <div className="card-icon"><Phone size={22} /></div>
                <div>
                  <h3>{contact.title}</h3>
                  {contact.phone && <p>{contact.phone}</p>}
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {showFeeDetails && (
      <section className="fee-details-section">
        <div className="container-inner">
          <div className="fee-page-heading">
            <span className="fee-page-icon"><IndianRupee size={30} /></span>
            <div>
              <p className="page-kicker">RUKF-IIBMP Admissions 2026-27</p>
              <h1>Fee Details and Counselling Instructions</h1>
              <p>Fees are not collected while submitting the online application. Candidates must bring the required fees when attending offline admission counselling in person.</p>
            </div>
          </div>

          <div className="fee-card-grid">
            <article className="fee-detail-card">
              <span>Counselling Fee</span>
              <strong>₹2,000</strong>
              <p>Required at the time of offline admission counselling.</p>
            </article>
            <article className="fee-detail-card featured">
              <span>First-Year Tuition Fee</span>
              <strong>₹1,50,000</strong>
              <p>Required at the time of offline admission counselling to complete the admission process.</p>
            </article>
          </div>

          <div className="fee-instruction-panel">
            <h2>Important Instructions</h2>
            <ul>
              <li>Attend counselling in person at the Office of the Director, Directorate of Admissions, JNTU-GV, Dwarapudi, Vizianagaram.</li>
              <li>Bring all original certificates along with the counselling fee and first-year tuition fee.</li>
              <li>Pay only through the mode instructed by the Directorate of Admissions at the counselling venue, including cash or the prescribed SBI challan, as applicable.</li>
              <li>Strictly follow all Directorate rules, verification requirements, timelines and payment instructions to secure admission.</li>
              <li>Attending counselling does not by itself guarantee admission; admission is subject to eligibility, certificate verification, seat availability and payment of the prescribed fees.</li>
            </ul>
          </div>

          <div className="fee-warning-callout">
            <ShieldCheck size={24} />
            <p><strong>Payment safety:</strong> Do not make payments to unofficial accounts, links or individuals. Follow only instructions issued by the Directorate of Admissions.</p>
          </div>
        </div>
      </section>
      )}

      {showNotifications && (
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
      )}

      {showLatestAdmissions && (
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
                  Online applications are open for 5 Years International Integrated Bachelor and Master&apos;s Programmes. Last date is 14.08.2026, late-fee date is 18.08.2026, and admission counselling is rescheduled to 20.08.2026 at 10:00 AM.
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
                  <span className="date-label">Admission Counselling Rescheduled</span>
                  <span className="date-value">20.08.2026 at 10:00 AM</span>
                  <span className="date-note">Originally scheduled on 19.08.2026 at 10:00 AM.</span>
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
      )}
    </div>
  );
}
