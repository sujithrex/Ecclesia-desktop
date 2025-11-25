import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import './ReportPage.css';

const SabaiJabitha = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [year, setYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Sabai Jabitha' }
  ];

  // Load churches on mount
  useEffect(() => {
    loadChurches();
    setDefaultYear();
  }, []);

  const setDefaultYear = () => {
    const currentYear = new Date().getFullYear();
    setYear(`${currentYear}-${currentYear + 1}`);
  };

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

  const handleGeneratePDF = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    if (!year) {
      toast.error('Please enter year');
      return;
    }

    try {
      setLoadingMessage('Generating Sabai Jabitha PDF...');
      setIsLoading(true);

      const result = await window.electron.sabaiJabitha.generatePDF({
        churchId: selectedChurch.id,
        year
      });

      if (result.success) {
        toast.success('Sabai Jabitha PDF generated and opened successfully!');
      } else {
        toast.error(result.message || 'Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
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
            <h1>Sabai Jabitha</h1>

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
                  <label>Year <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="2025-2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    maxLength="9"
                  />
                </div>

                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    onClick={handleGeneratePDF}
                    className="pdf-btn"
                    disabled={!selectedChurch || !year}
                  >
                    Generate PDF
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

export default SabaiJabitha;

