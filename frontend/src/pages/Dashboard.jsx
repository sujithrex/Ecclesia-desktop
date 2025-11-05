import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import {
  Certificate,
  Baby,
  Cross,
  BookOpen,
  Heart,
  Cake,
  FileText
} from '@phosphor-icons/react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <>
      <TitleBar />
      <StatusBar />
      <div className="dashboard-container">
        <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="header-actions">
            <button onClick={handleSettings} className="settings-btn">
              Settings
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome back, {user?.username}!</h2>
          <p>You have successfully logged in to your account.</p>
        </div>

        <div className="reports-section">
          <h2 className="section-title">Reports</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card" onClick={() => navigate('/reports/adult-baptism-certificate')}>
              <div className="card-icon">
                <Certificate size={40} weight="duotone" />
              </div>
              <h3>Adult Baptism Certificate</h3>
              <p>Generate adult baptism certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/infant-baptism-certificate')}>
              <div className="card-icon">
                <Baby size={40} weight="duotone" />
              </div>
              <h3>Infant Baptism Certificate</h3>
              <p>Generate infant baptism certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/burial-certificate')}>
              <div className="card-icon">
                <Cross size={40} weight="duotone" />
              </div>
              <h3>Burial Certificate</h3>
              <p>Generate burial certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/sabai-jabitha')}>
              <div className="card-icon">
                <BookOpen size={40} weight="duotone" />
              </div>
              <h3>Sabai Jabitha</h3>
              <p>View Sabai Jabitha records</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/wedding-list')}>
              <div className="card-icon">
                <Heart size={40} weight="duotone" />
              </div>
              <h3>Wedding List</h3>
              <p>View wedding records</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/birthday-list')}>
              <div className="card-icon">
                <Cake size={40} weight="duotone" />
              </div>
              <h3>Birthday List</h3>
              <p>View birthday records</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/letter-head')}>
              <div className="card-icon">
                <FileText size={40} weight="duotone" />
              </div>
              <h3>Letter Head</h3>
              <p>Generate letter head documents</p>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default Dashboard;

