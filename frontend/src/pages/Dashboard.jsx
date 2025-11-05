import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
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

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Analytics</h3>
            <p>View your analytics and statistics</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📁</div>
            <h3>Files</h3>
            <p>Manage your files and documents</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Users</h3>
            <p>Manage user accounts and permissions</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure your application settings</p>
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default Dashboard;

