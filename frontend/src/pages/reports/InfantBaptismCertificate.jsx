import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import './ReportPage.css';

const InfantBaptismCertificate = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Infant Baptism Certificate' }
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
            <h1>Infant Baptism Certificate</h1>
            <p>Generate and manage infant baptism certificates.</p>
            {/* Add your report content here */}
          </div>
        </main>
      </div>
    </>
  );
};

export default InfantBaptismCertificate;

