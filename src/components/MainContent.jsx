import React from 'react';
import './MainContent.css';

export default function MainContent() {
  return (
    <div className="main-content">
      <div className="container">
        <div className="row">
          
          {/* Left Column - Main Details */}
          <div className="col-lg-8 col-md-8 col-sm-12 pt-5">
            <h3 className="welcome-text">Welcome to Research Programs 2026-27</h3>
            <hr />
            <p align="justify">
              Applications are invited through online mode for admissions into <strong>5 Years International Integrated Bachelor's and Master's in Professional Software Engineering (IIBMP)</strong> in B.Tech.(CSE) with M.Sc. in Professional Software Engineering and B.Tech. (ECE) with M.Sc. in Digital Business Management to study in <strong>JNTUGV and Knowledge Foundation of Reutlingen University, Germany</strong>, for the academic year 2026-27. Admissions will be based on JEE (Mains)-2026 / TG EAPCET-2026 Ranks.
            </p>

            <p>
              <span className="arrow-icon">⟶</span> <a href="#notification" target="_blank" rel="noopener noreferrer">Notification</a>
            </p>
            <p>
              <span className="arrow-icon">⟶</span> <a href="#booklet" target="_blank" rel="noopener noreferrer">Information Booklet of IIBMP</a>
            </p>

            <div className="text-center mt-4 mb-4">
              <a href="#steps" className="steps-btn" target="_blank" rel="noopener noreferrer">
                <strong>Steps for Online Application Submission</strong>
              </a>
            </div>

            <h3 className="section-title">APPLICATION</h3>
            <div className="table-responsive">
              <table className="table table-bordered table-striped ziom-equal">
                <tbody className="ziom-apps">
                  <tr>
                    <td>
                      <a href="#step1"><span>STEP 1:</span> Application Fee Payment</a>
                      <ul>
                        <li>
                          <a href="#step1-link">5 Years International Integrated Bachelor's and Master's in Professional (IIBMP) <span className="text-danger blink_me">(Online Submission)</span></a>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="#step2"><span>STEP 2:</span> Fill Application Form</a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="#step3"><span>STEP 3:</span> Print Your Filled in Application Form</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="ziom-bold">
                      <a href="#status">Know Your Payment Status</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Latest News */}
          <div className="col-lg-4 col-md-4 col-sm-12 pt-5">
            <h3 className="section-title">LATEST NEWS</h3>
            <div className="table-responsive">
              <table className="table table-bordered table-striped ziom-equal ziom-middle">
                <tbody className="ziom-apps">
                  <tr>
                    <td>Application forms will be accepted through online mode only</td>
                  </tr>
                  <tr>
                    <td>Payment can be made through Debit Card / Internet Banking</td>
                  </tr>
                  <tr>
                    <td>
                      <i className="icofont-pushpin"></i>
                      <strong>Registration Fee :</strong><br />
                      Last Date for submission of application<br />
                      <span className="bullet">»</span> <strong>With registration fee Rs.2000/- </strong> 10.07.2026<br />
                      <span className="bullet">»</span> <strong>With late fee of Rs. 1,000/- </strong> 14.07.2026<br />
                      <span className="bullet text-danger">»</span> <strong>Date of Counselling for Admission into IIBMP - </strong> <span className="text-danger">15.07.2026 at 10.00 am</span><br />
                      <span className="bullet">»</span> <strong>Venue of Spot Admission Counselling: Directorate of Admissions, JNTUGV, Bobbili Highway, Dwarapudi, Vizianagaram.</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
