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
              <Route path="/application-RUKF-IIBMP" element={<ApplicationForm />} />
              <Route path="/register" element={<CandidateLogin />} />
              <Route path="/login" element={<CandidateLogin />} />
              <Route path="/status" element={<CandidateLogin />} />
              <Route path="/candidate-login" element={<Navigate to="/register" replace />} />
              <Route path="/admin" element={<AdminConsole />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </FormProvider>
    </Router>
  );
}
