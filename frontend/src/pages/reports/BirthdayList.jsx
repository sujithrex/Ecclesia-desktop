import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import './ReportPage.css';

const BirthdayList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Birthday List' }
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
            <h1>Birthday List</h1>
            <p>View and manage birthday records.</p>
            {/* Add your report content here */}
          </div>
        </main>
      </div>
    </>
  );
};

export default BirthdayList;

