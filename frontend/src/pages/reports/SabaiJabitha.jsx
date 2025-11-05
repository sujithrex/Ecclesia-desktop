import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import './ReportPage.css';

const SabaiJabitha = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Sabai Jabitha' }
  ];

  return (
    <>
      <TitleBar />
      <StatusBar />
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
            <p>View and manage Sabai Jabitha records.</p>
            {/* Add your report content here */}
          </div>
        </main>
      </div>
    </>
  );
};

export default SabaiJabitha;

