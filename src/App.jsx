import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from './lib/router';
import { useLocation } from './lib/routerHooks';
import { FormProvider } from './context/FormContext';
import Home from './components/Home';
import ApplicationForm from './components/ApplicationForm';
import CandidateLogin from './components/CandidateLogin';
import ModernHeader from './components/ModernHeader';
import AdminConsole from './components/AdminConsole';
import NotFound from './components/NotFound';
import './App.css';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <FormProvider>
        <ScrollToTop />
        <div className="app-container">
          <ModernHeader />
          <main className="main-content-area">
            <Routes>
              <Route path="/" element={<Home page="home" />} />
              <Route path="/administration" element={<Home page="administration" />} />
              <Route path="/programmes" element={<Home page="programmes" />} />
              <Route path="/notifications" element={<Home page="notifications" />} />
              <Route path="/fee-details" element={<Home page="fee-details" />} />
              <Route path="/latest-admissions" element={<Home page="latest-admissions" />} />
              <Route path="/contact" element={<Home page="contact" />} />
              <Route path="/application-RUKF-IIBMP" element={<ApplicationForm />} />
              <Route path="/register" element={<CandidateLogin />} />
              <Route path="/login" element={<CandidateLogin />} />
              <Route path="/status" element={<CandidateLogin />} />
              <Route path="/candidate-login" element={<Navigate to="/register" replace />} />
              <Route path="/admin" element={<AdminConsole />} />
              <Route path="/admin/dashboard" element={<AdminConsole />} />
              <Route path="/admin/applications" element={<AdminConsole />} />
              <Route path="/admin/applications/:registrationNo" element={<AdminConsole />} />
              <Route path="/admin/applications/:registrationNo/:reviewStep" element={<AdminConsole />} />
              <Route path="/admin/reports" element={<AdminConsole />} />
              <Route path="/admin/users" element={<AdminConsole />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="site-footer">
            <div className="site-footer-inner">
              <p>Copyright © Directorate of Admissions, JNTUGV.</p>
              <p>Website designed, developed and maintained by Programmer, Digital Monitoring Cell.</p>
              <p>
                Support contact for website down or website errors:{' '}
                <a href="mailto:support@jntugv.edu.in">support@jntugv.edu.in</a>
                <span aria-hidden="true"> | </span>
                <a href="mailto:dmc@jntugv.edu.in">dmc@jntugv.edu.in</a>
              </p>
            </div>
          </footer>
        </div>
      </FormProvider>
    </Router>
  );
}
