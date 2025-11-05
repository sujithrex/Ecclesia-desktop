import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AdultBaptismCertificate from './pages/reports/AdultBaptismCertificate';
import InfantBaptismCertificate from './pages/reports/InfantBaptismCertificate';
import BurialCertificate from './pages/reports/BurialCertificate';
import SabaiJabitha from './pages/reports/SabaiJabitha';
import WeddingList from './pages/reports/WeddingList';
import BirthdayList from './pages/reports/BirthdayList';
import LetterHead from './pages/reports/LetterHead';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '40px',
            },
            success: {
              iconTheme: {
                primary: '#722f37',
                secondary: '#fff',
              },
              style: {
                border: '2px solid #722f37',
              },
            },
            error: {
              iconTheme: {
                primary: '#c33',
                secondary: '#fff',
              },
              style: {
                border: '2px solid #c33',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/adult-baptism-certificate"
            element={
              <ProtectedRoute>
                <AdultBaptismCertificate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/infant-baptism-certificate"
            element={
              <ProtectedRoute>
                <InfantBaptismCertificate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/burial-certificate"
            element={
              <ProtectedRoute>
                <BurialCertificate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/sabai-jabitha"
            element={
              <ProtectedRoute>
                <SabaiJabitha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/wedding-list"
            element={
              <ProtectedRoute>
                <WeddingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/birthday-list"
            element={
              <ProtectedRoute>
                <BirthdayList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/letter-head"
            element={
              <ProtectedRoute>
                <LetterHead />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
