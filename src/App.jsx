import { BrowserRouter as Router, Routes, Route, Navigate } from './lib/router';
import { FormProvider } from './context/FormContext';
import Home from './components/Home';
import ApplicationForm from './components/ApplicationForm';
import CandidateLogin from './components/CandidateLogin';
import ModernHeader from './components/ModernHeader';
import AdminConsole from './components/AdminConsole';
import NotFound from './components/NotFound';
import './App.css';

export default function App() {
  return (
    <Router>
      <FormProvider>
        <div className="app-container">
          <ModernHeader />
          <main className="main-content-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/administration" element={<Home focusSection="administration" />} />
              <Route path="/programmes" element={<Home focusSection="programmes" />} />
              <Route path="/notifications" element={<Home focusSection="notifications" />} />
              <Route path="/latest-admissions" element={<Home focusSection="latest-admissions" />} />
              <Route path="/contact" element={<Home focusSection="contact" />} />
              <Route path="/application-RUKF-IIBMP" element={<ApplicationForm />} />
              <Route path="/register" element={<CandidateLogin />} />
              <Route path="/login" element={<CandidateLogin />} />
              <Route path="/status" element={<CandidateLogin />} />
              <Route path="/candidate-login" element={<Navigate to="/register" replace />} />
              <Route path="/admin" element={<AdminConsole />} />
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
