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
            <h1>Congregation Backup</h1>
            <p className="report-description">
              Export all congregation data (areas, families, and members) for the selected church to a CSV file.
            </p>

            {/* Filter Section */}
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
                    Create Backup
                  </button>
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
