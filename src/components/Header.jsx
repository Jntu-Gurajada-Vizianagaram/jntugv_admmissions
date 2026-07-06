import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <div className="logo-branding">
      <div className="container clearfix">
        <div className="logo float-left">
          {/* Using a placeholder logo or text if logo isn't available, but we'll try to mimic the emblem */}
          <div className="emblem-placeholder">
             <div className="emblem-inner">
               <span>JNTU</span>
               <span>GV</span>
             </div>
          </div>
        </div>
        <div className="branding-text float-left">
          <h1 className="text-center brand-title">Directorate of Admissions</h1>
          <h4 className="text-center brand-subtitle">Jawaharlal Nehru Technological University Gurajada Vizianagaram</h4>
          <span className="text-center brand-address">Bobbili Highway, Dwarapudi, Vizianagaram - 535 003, A.P., India</span>
          {/* <span className="text-center brand-naac">ACCREDITED BY NAAC WITH <strong>'A' GRADE</strong></span> */}
        </div>
      </div>
    </div>
  );
}
