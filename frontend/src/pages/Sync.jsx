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
  
  // Version states
  const [localVersion, setLocalVersion] = useState(null);
  const [cloudVersion, setCloudVersion] = useState(null);
  
  // Modal states
  const [isSyncUpModalOpen, setIsSyncUpModalOpen] = useState(false);
  const [isSyncDownModalOpen, setIsSyncDownModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  
  // Comparison data
  const [comparison, setComparison] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

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

  useEffect(() => {
    if (isAuthenticated) {
      loadVersions();
    }
  }, [isAuthenticated]);

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

  const loadVersions = async () => {
    try {
      const result = await window.electron.google.getVersions();
      if (result.success) {
        setLocalVersion(result.local);
        setCloudVersion(result.cloud);
      }
    } catch (error) {
      console.error('Load versions error:', error);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setLoadingMessage('Connecting to Google Drive...\nPlease authorize in your browser.');
      setIsLoading(true);

      const authResult = await window.electron.google.authenticate();
      
      if (authResult.success) {
        setIsAuthenticated(true);
        toast.success('Successfully connected to Google Drive!');
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

  const handleSyncUp = async () => {
    try {
      setIsSyncUpModalOpen(false);
      setLoadingMessage('Uploading database to Google Drive...');
      setIsLoading(true);

      const result = await window.electron.google.uploadDatabase();
      
      if (result.success) {
        toast.success(`Database uploaded successfully!\nVersion: ${result.version}`);
        await loadVersions();
      } else {
        toast.error(result.message || 'Failed to upload database');
      }
    } catch (error) {
      console.error('Sync up error:', error);
      toast.error('Failed to sync with Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVersions = async () => {
    setIsVersionModalOpen(true);
  };

  const handleSyncDownClick = async () => {
    try {
      setLoadingMessage('Comparing versions...');
      setIsLoading(true);

      const result = await window.electron.google.compareVersions();
      
      if (result.success) {
        setComparison(result.comparison);
        
        // Initialize all items as selected
        const initialSelection = {};
        Object.keys(result.comparison).forEach(category => {
          if (category !== 'metadata' && category !== 'summary') {
            initialSelection[category] = {};
            const data = result.comparison[category];
            
            // Select all added and modified items by default
            data.added?.forEach(item => {
              initialSelection[category][item.id] = true;
            });
            data.modified?.forEach(item => {
              initialSelection[category][item.id] = true;
            });
          }
        });
        
        setSelectedItems(initialSelection);
        setIsSyncDownModalOpen(true);
      } else {
        toast.error(result.message || 'Failed to compare versions');
      }
    } catch (error) {
      console.error('Sync down error:', error);
      toast.error('Failed to load comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDown = async () => {
    try {
      setIsSyncDownModalOpen(false);
      setLoadingMessage('Syncing data from cloud...');
      setIsLoading(true);

      const result = await window.electron.google.syncDown({ selectedItems });
      
      if (result.success) {
        toast.success('Data synced successfully!');
        await loadVersions();
      } else {
        toast.error(result.message || 'Failed to sync data');
      }
    } catch (error) {
      console.error('Sync down error:', error);
      toast.error('Failed to sync data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleItemSelection = (category, itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [itemId]: !prev[category]?.[itemId]
      }
    }));
  };

  const toggleCategorySelection = (category) => {
    const data = comparison[category];
    const allItems = [...(data.added || []), ...(data.modified || [])];
    const allSelected = allItems.every(item => selectedItems[category]?.[item.id]);
    
    setSelectedItems(prev => ({
      ...prev,
      [category]: allItems.reduce((acc, item) => {
        acc[item.id] = !allSelected;
        return acc;
      }, {})
    }));
  };

  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  const handleDisconnect = async () => {
    try {
      setIsDisconnectModalOpen(false);
      setLoadingMessage('Disconnecting...');
      setIsLoading(true);

      const result = await window.electron.google.disconnect();
      if (result.success) {
        setIsAuthenticated(false);
        setLocalVersion(null);
        setCloudVersion(null);
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
            {!isAuthenticated ? (
              <div className="sync-card">
                <h1 className="sync-title">Synchronize Your Data</h1>
                <p className="sync-description">
                  Connect your account with Google to seamlessly synchronize your church data across multiple devices.
                </p>
                <button className="google-connect-btn" onClick={handleGoogleConnect}>
                  <svg className="google-icon" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Connect with Google</span>
                </button>
              </div>
            ) : (
              <>
                <div className="version-cards">
                  <div className="version-card">
                    <h3>Windows Version</h3>
                    <div className="version-info">
                      <div className="version-number">{localVersion?.version || 'N/A'}</div>
                      {localVersion?.metadata && (
                        <div className="version-details">
                          <p>Windows: V{localVersion.metadata.windowsVersion}</p>
                          <p>Android: V{localVersion.metadata.androidVersion}</p>
                          {localVersion.metadata.lastSyncedAt && (
                            <p className="last-sync">
                              Last synced: {new Date(localVersion.metadata.lastSyncedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="version-card">
                    <h3>Cloud Version</h3>
                    <div className="version-info">
                      {cloudVersion ? (
                        <>
                          <div className="version-number">{cloudVersion.version}</div>
                          <div className="version-details">
                            <p className="last-sync">
                              Uploaded: {new Date(cloudVersion.createdTime).toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="version-number">No backup found</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sync-actions">
                  <button className="sync-btn sync-up-btn" onClick={() => setIsSyncUpModalOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" fill="white"/>
                    </svg>
                    <span>Sync Up</span>
                  </button>

                  <button className="sync-btn sync-down-btn" onClick={handleSyncDownClick} disabled={!cloudVersion}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20l8-8h-5V4H9v8H4l8 8z" fill="white"/>
                    </svg>
                    <span>Sync Down</span>
                  </button>

                  <button className="sync-btn check-version-btn" onClick={handleCheckVersions}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                    </svg>
                    <span>Check Versions</span>
                  </button>
                </div>

                <button className="disconnect-btn-bottom" onClick={() => setIsDisconnectModalOpen(true)}>
                  Disconnect from Google Drive
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Sync Up Modal */}
      <Modal
        isOpen={isSyncUpModalOpen}
        onRequestClose={() => setIsSyncUpModalOpen(false)}
        className="sync-modal"
        overlayClassName="sync-modal-overlay"
      >
        <div className="modal-header">
          <h2>Sync Up to Google Drive</h2>
          <button className="modal-close-btn" onClick={() => setIsSyncUpModalOpen(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="sync-modal-text">
            This will upload your current database to Google Drive with an incremented Windows version.
          </p>
          {localVersion && (
            <div className="version-change">
              <p><strong>Current Version:</strong> {localVersion.version}</p>
              <p><strong>New Version:</strong> ecclesia_win_V{localVersion.metadata.windowsVersion + 1}_android_V{localVersion.metadata.androidVersion}.json</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => setIsSyncUpModalOpen(false)}>Cancel</button>
          <button className="submit-btn" onClick={handleSyncUp}>Upload</button>
        </div>
      </Modal>

      {/* Sync Down Modal */}
      <Modal
        isOpen={isSyncDownModalOpen}
        onRequestClose={() => setIsSyncDownModalOpen(false)}
        className="sync-modal sync-down-modal"
        overlayClassName="sync-modal-overlay"
      >
        <div className="modal-header">
          <h2>Sync Down from Cloud</h2>
          <button className="modal-close-btn" onClick={() => setIsSyncDownModalOpen(false)}>&times;</button>
        </div>
        <div className="modal-body">
          {comparison && (
            <>
              <div className="comparison-summary">
                <h3>Summary</h3>
                <p>Total Changes: {comparison.summary.totalChanges}</p>
                {comparison.metadata.hasConflict && (
                  <div className="conflict-warning">
                    ⚠️ Warning: Both Windows and Android have made changes. Please review carefully.
                  </div>
                )}
              </div>

              <div className="comparison-details">
                {Object.keys(comparison.summary.byCategory).map(category => {
                  const catData = comparison.summary.byCategory[category];
                  if (!catData.hasChanges) return null;

                  return (
                    <div key={category} className="category-section">
                      <div className="category-header" onClick={() => toggleCategory(category)}>
                        <input
                          type="checkbox"
                          checked={comparison[category].added?.every(item => selectedItems[category]?.[item.id]) &&
                                   comparison[category].modified?.every(item => selectedItems[category]?.[item.id])}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleCategorySelection(category);
                          }}
                        />
                        <h4>{catData.label}</h4>
                        <span className="category-counts">
                          {catData.added > 0 && <span className="added">+{catData.added}</span>}
                          {catData.modified > 0 && <span className="modified">~{catData.modified}</span>}
                          {catData.removed > 0 && <span className="removed">-{catData.removed}</span>}
                        </span>
                        <span className="expand-icon">{expandedCategories[category] ? '▼' : '▶'}</span>
                      </div>

                      {expandedCategories[category] && (
                        <div className="category-items">
                          {comparison[category].added?.map(item => (
                            <div key={`add-${item.id}`} className="item-row added-item">
                              <input
                                type="checkbox"
                                checked={selectedItems[category]?.[item.id] || false}
                                onChange={() => toggleItemSelection(category, item.id)}
                              />
                              <span className="item-name">{item.displayName}</span>
                              <span className="item-status">Added</span>
                            </div>
                          ))}

                          {comparison[category].modified?.map(item => (
                            <div key={`mod-${item.id}`} className="item-row modified-item">
                              <input
                                type="checkbox"
                                checked={selectedItems[category]?.[item.id] || false}
                                onChange={() => toggleItemSelection(category, item.id)}
                              />
                              <div className="item-details">
                                <span className="item-name">{item.displayName}</span>
                                <div className="field-changes">
                                  {item.changes.map((change, idx) => (
                                    <div key={idx} className="field-change">
                                      <strong>{change.fieldLabel}:</strong> {change.displayOld} → {change.displayNew}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <span className="item-status">Modified</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => setIsSyncDownModalOpen(false)}>Cancel</button>
          <button className="submit-btn" onClick={handleSyncDown}>Sync Selected</button>
        </div>
      </Modal>

      {/* Version Check Modal */}
      <Modal
        isOpen={isVersionModalOpen}
        onRequestClose={() => setIsVersionModalOpen(false)}
        className="sync-modal version-check-modal"
        overlayClassName="sync-modal-overlay"
      >
        <div className="modal-header">
          <h2>Version Information</h2>
          <button className="modal-close-btn" onClick={() => setIsVersionModalOpen(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="version-comparison">
            <div className="version-block">
              <h3>Local (Windows)</h3>
              {localVersion && (
                <>
                  <p><strong>Version:</strong> {localVersion.version}</p>
                  <p><strong>Windows Version:</strong> V{localVersion.metadata.windowsVersion}</p>
                  <p><strong>Android Version:</strong> V{localVersion.metadata.androidVersion}</p>
                  {localVersion.metadata.lastSyncedBy && (
                    <p><strong>Last Synced By:</strong> {localVersion.metadata.lastSyncedBy}</p>
                  )}
                  {localVersion.metadata.lastSyncedAt && (
                    <p><strong>Last Synced:</strong> {new Date(localVersion.metadata.lastSyncedAt).toLocaleString()}</p>
                  )}
                </>
              )}
            </div>

            <div className="version-block">
              <h3>Cloud</h3>
              {cloudVersion ? (
                <>
                  <p><strong>Version:</strong> {cloudVersion.version}</p>
                  <p><strong>Uploaded:</strong> {new Date(cloudVersion.createdTime).toLocaleString()}</p>
                  <p><strong>Size:</strong> {(cloudVersion.size / 1024).toFixed(2)} KB</p>
                </>
              ) : (
                <p>No cloud backup found</p>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="submit-btn" onClick={() => setIsVersionModalOpen(false)}>Close</button>
        </div>
      </Modal>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onRequestClose={() => setIsDisconnectModalOpen(false)}
        className="sync-modal"
        overlayClassName="sync-modal-overlay"
      >
        <div className="modal-header">
          <h2>Disconnect from Google Drive</h2>
          <button className="modal-close-btn" onClick={() => setIsDisconnectModalOpen(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="sync-modal-text">
            Are you sure you want to disconnect from Google Drive? You will need to reconnect to sync your data.
          </p>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => setIsDisconnectModalOpen(false)}>Cancel</button>
          <button className="submit-btn" onClick={handleDisconnect}>Disconnect</button>
        </div>
      </Modal>
    </>
  );
};

export default Sync;
