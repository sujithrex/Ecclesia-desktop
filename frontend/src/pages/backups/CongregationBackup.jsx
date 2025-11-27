import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import '../reports/ReportPage.css';

const CongregationBackup = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Backups', path: '/dashboard' },
    { label: 'Congregation Backup' }
  ];

  // Load churches on mount
  useEffect(() => {
    loadChurches();
  }, []);

  const loadChurches = async () => {
    try {
      const result = await window.electron.church.getAll();
      if (result.success) {
        setChurches(result.data);
        if (result.data.length > 0) {
          setSelectedChurch(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load churches');
    }
  };

  const handleCreateBackup = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    try {
      setLoadingMessage('Creating congregation backup...');
      setIsLoading(true);

      const result = await window.electron.backup.createCongregationBackup({
        churchId: selectedChurch.id
      });

      if (result.success) {
        toast.success(`Backup created successfully!\n${result.recordCount} members exported.`);
      } else {
        toast.error(result.message || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFullBackup = async () => {
    try {
      setLoadingMessage('Creating full database backup...');
      setIsLoading(true);

      const result = await window.electron.backup.createFullDatabase();

      if (result.success) {
        toast.success('Full database backup created successfully!');
      } else {
        if (result.message !== 'Backup canceled') {
          toast.error(result.message || 'Failed to create full backup');
        }
      }
    } catch (error) {
      toast.error('Failed to create full backup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <div className="report-container">
        <header className="report-header">
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

        <main className="report-main">
          <div className="report-content">
            {/* Section 1: Congregation Backup */}
            <div className="backup-section">
              <h1>1. Congregation Backup (CSV)</h1>
              <p className="report-description">
                Export congregation data (areas, families, and members) for a specific church to a CSV file.
              </p>

              <div className="filter-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>Church <span className="required">*</span></label>
                    <select
                      value={selectedChurch?.id || ''}
                      onChange={(e) => {
                        const church = churches.find(c => c.id === parseInt(e.target.value));
                        setSelectedChurch(church);
                      }}
                    >
                      <option value="">Select Church</option>
                      {churches.map(church => (
                        <option key={church.id} value={church.id}>
                          {church.churchName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button
                      onClick={handleCreateBackup}
                      className="pdf-btn"
                      disabled={!selectedChurch}
                    >
                      Create CSV Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Full Database Backup */}
            <div className="backup-section" style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e0e0e0' }}>
              <h1>2. Full Database Backup (JSON)</h1>
              <p className="report-description">
                Export the entire database including all churches, members, certificates, and records to a JSON file.
              </p>

              <div className="filter-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>Backup Type</label>
                    <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>
                      Complete database backup (all data)
                    </p>
                  </div>

                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button
                      onClick={handleCreateFullBackup}
                      className="pdf-btn"
                    >
                      Create Full Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CongregationBackup;
