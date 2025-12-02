import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import PastorateDetail from './pages/PastorateDetail';
import YearBooks from './pages/YearBooks';
import MonthBooks from './pages/MonthBooks';
import Settings from './pages/Settings';
import Sync from './pages/Sync';
import ChurchDetail from './pages/ChurchDetail';
import AreaDetail from './pages/AreaDetail';
import FamilyDetail from './pages/FamilyDetail';
import MemberDetail from './pages/MemberDetail';
import AdultBaptismCertificate from './pages/reports/AdultBaptismCertificate';
import InfantBaptismCertificate from './pages/reports/InfantBaptismCertificate';
import BurialCertificate from './pages/reports/BurialCertificate';
import SabaiJabitha from './pages/reports/SabaiJabitha';
import WeddingList from './pages/reports/WeddingList';
import Marriage from './pages/reports/Marriage';
import CreateMarriageRecord from './pages/reports/CreateMarriageRecord';
import BirthdayList from './pages/reports/BirthdayList';
import LetterHead from './pages/reports/LetterHead';
import CongregationBackup from './pages/backups/CongregationBackup';
import CongregationRestore from './pages/backups/CongregationRestore';
import ReceiptNote from './pages/books/ReceiptNote';
import OffertoryNote from './pages/books/OffertoryNote';
import HarvestFestivalNote from './pages/books/HarvestFestivalNote';
import SangamNote from './pages/books/SangamNote';
import PCCashBook from './pages/books/PCCashBook';
import IndentSlip from './pages/books/IndentSlip';
import RoughCashBook from './pages/books/RoughCashBook';
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
                primary: '#B5316A',
                secondary: '#fff',
              },
              style: {
                border: '2px solid #B5316A',
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
            path="/pastorate"
            element={
              <ProtectedRoute>
                <PastorateDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/year-books"
            element={
              <ProtectedRoute>
                <YearBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/month-books"
            element={
              <ProtectedRoute>
                <MonthBooks />
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
            path="/sync"
            element={
              <ProtectedRoute>
                <Sync />
              </ProtectedRoute>
            }
          />
          <Route
            path="/congregation/:id"
            element={
              <ProtectedRoute>
                <ChurchDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/church/:id"
            element={
              <ProtectedRoute>
                <ChurchDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/area/:id"
            element={
              <ProtectedRoute>
                <AreaDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/area/:areaId/family/:id"
            element={
              <ProtectedRoute>
                <FamilyDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/area/:areaId/family/:familyId/member/:id"
            element={
              <ProtectedRoute>
                <MemberDetail />
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
            path="/reports/marriage"
            element={
              <ProtectedRoute>
                <Marriage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/marriage/create"
            element={
              <ProtectedRoute>
                <CreateMarriageRecord />
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
          <Route
            path="/backups/congregation-backup"
            element={
              <ProtectedRoute>
                <CongregationBackup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/backups/congregation-restore"
            element={
              <ProtectedRoute>
                <CongregationRestore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/receipt-note"
            element={
              <ProtectedRoute>
                <ReceiptNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/offertory-note"
            element={
              <ProtectedRoute>
                <OffertoryNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/harvest-festival-note"
            element={
              <ProtectedRoute>
                <HarvestFestivalNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/sangam-note"
            element={
              <ProtectedRoute>
                <SangamNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/pc-cash-book"
            element={
              <ProtectedRoute>
                <PCCashBook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/indent-slip"
            element={
              <ProtectedRoute>
                <IndentSlip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/rough-cash-book"
            element={
              <ProtectedRoute>
                <RoughCashBook />
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
