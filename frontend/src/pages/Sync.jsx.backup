import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import LoadingScreen from '../components/LoadingScreen';
import './Sync.css';

Modal.setAppElement('#root');

const Sync = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Sync' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const result = await window.electron.google.checkAuth();
      if (result.success && result.isAuthenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Check auth error:', error);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setLoadingMessage('Connecting to Google Drive...\nPlease authorize in your browser.');
      setIsLoading(true);

      // Authenticate (this will open browser and wait for callback)
      const authResult = await window.electron.google.authenticate();
      
      if (authResult.success) {
        setIsAuthenticated(true);
        toast.success('Successfully connected to Google Drive!');
        setIsSyncModalOpen(true);
      } else {
        toast.error(authResult.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google connect error:', error);
      toast.error('Failed to connect with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncModalOpen(false);
      setLoadingMessage('Uploading database to Google Drive...');
      setIsLoading(true);

      const result = await window.electron.google.uploadDatabase();
      
      if (result.success) {
        toast.success(`Database uploaded successfully!\nFile: ${result.fileName}`);
      } else {
        toast.error(result.message || 'Failed to upload database');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync with Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to disconnect from Google Drive?');
      if (!confirmed) return;

      setLoadingMessage('Disconnecting...');
      setIsLoading(true);

      const result = await window.electron.google.disconnect();
      if (result.success) {
        setIsAuthenticated(false);
        toast.success('Disconnected from Google Drive');
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message={loadingMessage} />}
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
              
              <h1 className="sync-title">
                {isAuthenticated ? 'Google Drive Connected' : 'Synchronize Your Data'}
              </h1>
              
              <p className="sync-description">
                {isAuthenticated 
                  ? 'Your account is connected to Google Drive. You can now sync your church data to the cloud and access it from your Android device.'
                  : 'Connect your account with Google to seamlessly synchronize your church data across multiple devices. This integration enables you to access and manage your congregation information from your Android device, ensuring your data remains consistent and up-to-date wherever you are.'
                }
              </p>

              {!isAuthenticated ? (
                <button className="google-connect-btn" onClick={handleGoogleConnect}>
                  <svg className="google-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Connect with Google</span>
                </button>
              ) : (
                <div className="connected-actions">
                  <button className="sync-now-btn" onClick={() => setIsSyncModalOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="white"/>
                    </svg>
                    <span>Sync Now</span>
                  </button>
                  <button className="disconnect-btn" onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </div>
              )}

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

      {/* Sync Confirmation Modal */}
      <Modal
        isOpen={isSyncModalOpen}
        onRequestClose={() => setIsSyncModalOpen(false)}
        className="sync-modal"
        overlayClassName="sync-modal-overlay"
      >
        <div className="modal-header">
          <h2>Sync to Google Drive</h2>
          <button className="modal-close-btn" onClick={() => setIsSyncModalOpen(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="sync-modal-text">
            This will upload your entire church database to Google Drive. 
            The backup will be stored securely in your Google Drive account in the "Ecclesia Backups" folder.
          </p>
          <p className="sync-modal-note">
            <strong>Note:</strong> This process may take a few moments depending on your database size and internet connection.
          </p>
        </div>
        <div className="modal-footer">
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsSyncModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="submit-btn" onClick={handleSync}>
              Upload to Drive
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sync;
