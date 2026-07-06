import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container text-center">
          <p className="disclaimer">
            <strong>Disclaimer:</strong> © This is the official website of Directorate of Admissions, Jawaharlal Nehru Technological University Gurajada Vizianagaram
          </p>
          <ul className="footer-nav">
            <li><a href="#policies">Website Policies</a></li>
            <li><a href="#copyright">Copyright Policy</a></li>
            <li><a href="#terms">Terms of service</a></li>
            <li><a href="#help">Help</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom text-center">
        <p>
          © Copyright 2026 <strong>JNTUGV</strong>. All Rights Reserved
        </p>
        <a href="#top" className="back-to-top">^</a>
      </div>
    </footer>
  );
}
