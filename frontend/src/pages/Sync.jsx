import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import './Sync.css';

const Sync = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Sync' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoogleConnect = () => {
    // TODO: Implement Google authentication
    console.log('Connect with Google');
  };

  return (
    <>
      <TitleBar />
      <StatusBar />
      <div className="sync-container">
        <header className="sync-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/dashboard')} className="back-btn">
                Back to Dashboard
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="sync-main">
          <div className="sync-content">
            <div className="sync-card">
              
              <h1 className="sync-title">Synchronize Your Data</h1>
              
              <p className="sync-description">
                Connect your account with Google to seamlessly synchronize your church data across multiple devices. 
                This integration enables you to access and manage your congregation information from your Android device, 
                ensuring your data remains consistent and up-to-date wherever you are.
              </p>

              <button className="google-connect-btn" onClick={handleGoogleConnect}>
                <svg className="google-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Connect with Google</span>
              </button>

              <div className="sync-features">
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#34A853"/>
                  </svg>
                  <span>Real-time data synchronization</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#34A853"/>
                  </svg>
                  <span>Access from Android devices</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#34A853"/>
                  </svg>
                  <span>Secure cloud storage</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Sync;
