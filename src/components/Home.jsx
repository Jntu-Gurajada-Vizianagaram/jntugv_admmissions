import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import './Home.css';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="hero-badge">
            Applications are commencing shortly
          </motion.div>
          <motion.div variants={itemVariants} className="commencing-marker">
            <strong>Admissions Notice</strong>
            <span>IIBMP 2026-27 online applications will commence shortly. Please keep scanned certificates and entrance rank cards ready.</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="hero-title">
            International Integrated Bachelor's & Master's Program <span className="text-gradient"> (IIBMP)</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="hero-subtitle">
            A prestigious 5-year joint degree program by <strong>JNTUGV</strong> and <strong>Knowledge Foundation of Reutlingen University, Germany</strong>.
          </motion.p>
          <motion.div variants={itemVariants} className="hero-cta-group">
            <Link to="/application-RUKF-IIBMP" className="btn btn-primary btn-lg">
              Preview Application <ArrowRight size={20} />
            </Link>
            <a href="#details" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'white' }}>
              View Details
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Cards Section */}
      <section id="details" className="features-section">
        <div className="container-inner">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            Program Highlights
          </motion.h2>
          
          <motion.div 
            className="grid-cards"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="feature-card">
              <div className="card-icon"><Monitor size={40} color="var(--accent-blue)" /></div>
              <h3>B.Tech (CSE) + M.Sc (PSE)</h3>
              <p>Professional Software Engineering track focusing on modern full-stack development, cloud architecture, and AI.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="card-icon"><Cpu size={40} color="var(--accent-gold)" /></div>
              <h3>B.Tech (ECE) + M.Sc (DBM)</h3>
              <p>Digital Business Management track blending core electronics with global digital business strategies.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="card-icon"><Globe size={40} color="#10b981" /></div>
              <h3>Study in Germany</h3>
              <p>Complete your Master's degree at Reutlingen University, Germany with international exposure and opportunities.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Application Steps Section */}
      <section className="steps-section">
        <div className="container-inner">
          <div className="steps-layout">
            <motion.div 
              className="steps-info"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="section-heading text-left">How to Apply</h2>
              <p className="steps-desc">The application process is completely online. Ensure you have your JEE (Mains) or TG EAPCET ranks ready.</p>
              
              <div className="timeline">
                {[
                  { title: "Registration & Payment", desc: "Pay the initial registration fee securely online." },
                  { title: "Fill Application Form", desc: "Provide personal, academic, and entrance exam details." },
                  { title: "Upload Documents", desc: "Upload scanned copies of required certificates and photos." }
                ].map((step, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"><CheckCircle2 size={24} /></div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              className="important-dates-card glass"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3>Important Dates</h3>
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
                  <span className="date-value text-gradient">15.07.2026 @ 10:00 AM</span>
                </li>
              </ul>
              <div className="dates-footer">
                <strong>Venue:</strong> Directorate of Admissions, JNTUGV, Bobbili Highway, Dwarapudi, Vizianagaram.
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
