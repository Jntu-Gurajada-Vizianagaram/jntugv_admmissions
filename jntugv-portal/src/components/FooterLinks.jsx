import React from 'react';
import './Footer.css';

export default function FooterLinks() {
  return (
    <div className="footer-links">
      <div className="container">
        <div className="row text-center align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-12 mhrd-section">
            {/* Using text fallback since we don't have the image file, but formatted similar to MHRD */}
            <div className="mhrd-logo-placeholder">
              <span className="mhrd-title">Department of Higher Education</span><br/>
              <span className="mhrd-subtitle">Ministry of Education, Government of India</span>
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 india-section">
            <div className="india-logo-placeholder">
              <strong>india.gov.in</strong><br/>
              <span style={{ fontSize: '10px' }}>National Portal of India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
