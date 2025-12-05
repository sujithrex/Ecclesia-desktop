import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import { 
  Receipt, 
  Coins, 
  BookOpen, 
  Users, 
  Notebook, 
  FileText, 
  CurrencyDollar 
} from '@phosphor-icons/react';
import './MonthBooks.css';

const MonthBooks = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    { label: year?.year || 'Year', path: '/year-books', state: { pastorate, year } },
    { label: month || 'Month' }
  ];

  useEffect(() => {
    if (!pastorate || !year || !month) {
      navigate('/dashboard');
      return;
    }
  }, []);

  if (!pastorate || !year || !month) {
    return null;
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      <div className="month-books-container">
        <header className="month-books-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/year-books', { state: { pastorate, year } })} className="back-btn">
                Back to Year
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="month-books-main">
          <div className="month-books-content">
            {/* Books of Accounts Section */}
            <div className="books-section">
              <h2 className="section-title">Books of Accounts - {month} {year.year}</h2>
              <div className="books-grid">
                <div className="book-card" onClick={() => navigate('/books/receipt-note', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <Receipt size={40} weight="duotone" />
                  </div>
                  <h3>Receipt Note</h3>
                  <p>Manage receipt notes</p>
                </div>

                <div className="book-card" onClick={() => navigate('/books/church-offertory', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <Coins size={40} weight="duotone" />
                  </div>
                  <h3>Church Offertory</h3>
                  <p>Manage church offertories</p>
                </div>

                <div className="book-card" onClick={() => navigate('/books/harvest-festival-note', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <BookOpen size={40} weight="duotone" />
                  </div>
                  <h3>Harvest Festival Note</h3>
                  <p>Manage harvest festival notes</p>
                </div>

                <div className="book-card" onClick={() => navigate('/books/sangam-note', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <Users size={40} weight="duotone" />
                  </div>
                  <h3>Sangam Note</h3>
                  <p>Manage sangam notes</p>
                </div>

                <div className="book-card" onClick={() => navigate('/books/pc-cash-book', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <Notebook size={40} weight="duotone" />
                  </div>
                  <h3>PC Cash Book</h3>
                  <p>Manage PC cash book</p>
                </div>

                <div className="book-card" onClick={() => navigate('/books/indent-slip', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <FileText size={40} weight="duotone" />
                  </div>
                  <h3>Indent Slip</h3>
                  <p>Manage indent slips</p>
                </div>

                <div className="book-card" onClick={() => navigate('/books/rough-cash-book', { state: { pastorate, year, month } })}>
                  <div className="card-icon">
                    <CurrencyDollar size={40} weight="duotone" />
                  </div>
                  <h3>Rough Cash Book</h3>
                  <p>Manage rough cash book</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MonthBooks;
