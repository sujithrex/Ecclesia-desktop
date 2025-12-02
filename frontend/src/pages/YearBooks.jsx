import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import { Calendar } from '@phosphor-icons/react';
import './YearBooks.css';

const YearBooks = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    { label: year?.year || 'Year Books' }
  ];

  useEffect(() => {
    if (!pastorate || !year) {
      navigate('/dashboard');
      return;
    }
  }, []);

  if (!pastorate || !year) {
    return null;
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      <div className="year-books-container">
        <header className="year-books-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/pastorate', { state: { pastorate } })} className="back-btn">
                Back to Pastorate
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="year-books-main">
          <div className="year-books-content">
            {/* Months Section */}
            <div className="months-section">
              <h2 className="section-title">Months - {year.year}</h2>
              <div className="months-grid">
                {year.months && year.months.map((month, index) => (
                  <div 
                    key={index} 
                    className="month-card"
                    onClick={() => navigate('/month-books', { state: { pastorate, year, month } })}
                  >
                    <div className="card-icon">
                      <Calendar size={40} weight="duotone" />
                    </div>
                    <h3>{month}</h3>
                    <p>{year.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default YearBooks;
