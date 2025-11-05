import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import './ChurchDetail.css';

const ChurchDetail = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const church = location.state?.church;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Congregation', path: '/dashboard' },
    { label: church?.churchName || 'Church Details' }
  ];

  if (!church) {
    return (
      <>
        <TitleBar />
        <StatusBar />
        <div className="church-detail-container">
          <header className="church-detail-header">
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

          <main className="church-detail-main">
            <div className="church-detail-content">
              <h1>Church Not Found</h1>
              <p>The requested church details could not be found.</p>
              <button onClick={() => navigate('/dashboard')} className="back-link-btn">
                Return to Dashboard
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      <div className="church-detail-container">
        <header className="church-detail-header">
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

        <main className="church-detail-main">
          <div className="church-detail-content">
            <h1>{church.churchName}</h1>
            
            <div className="detail-grid">
              <div className="detail-card">
                <h3>Church Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Church Name:</span>
                  <span className="detail-value">{church.churchName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Church Short Name:</span>
                  <span className="detail-value">{church.churchShortName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Church Name (Tamil):</span>
                  <span className="detail-value">{church.churchNameTamil}</span>
                </div>
              </div>

              <div className="detail-card">
                <h3>Pastorate Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Pastorate Name:</span>
                  <span className="detail-value">{church.pastorateName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pastorate Short Name:</span>
                  <span className="detail-value">{church.pastorateShortName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pastorate Name (Tamil):</span>
                  <span className="detail-value">{church.pastorateNameTamil}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ChurchDetail;

