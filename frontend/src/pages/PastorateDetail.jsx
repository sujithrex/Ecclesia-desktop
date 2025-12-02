import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import LoadingScreen from '../components/LoadingScreen';
import { Calendar, Plus } from '@phosphor-icons/react';
import './PastorateDetail.css';

Modal.setAppElement('#root');

const PastorateDetail = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate Details' }
  ];

  const handleViewChurch = (church) => {
    navigate(`/congregation/${church.id}`, { state: { church } });
  };

  const openYearModal = () => {
    setIsYearModalOpen(true);
  };

  const closeYearModal = () => {
    setIsYearModalOpen(false);
  };

  const loadYears = async () => {
    if (!pastorate) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call when backend is ready
      // const result = await window.electron.yearBooks.getByPastorate(pastorate.pastorateName);
      // if (result.success) {
      //   setYears(result.data);
      // }
      
      // For now, load from localStorage as temporary storage
      const storedYears = localStorage.getItem(`years_${pastorate.pastorateName}`);
      if (storedYears) {
        setYears(JSON.parse(storedYears));
      }
    } catch (error) {
      console.error('Failed to load years:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearSubmit = async (e) => {
    e.preventDefault();
    const yearString = `${selectedYear}-${selectedYear + 1}`;
    
    // Check if year already exists
    if (years.some(y => y.year === yearString)) {
      toast.error('This year already exists!');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create months array (April to March)
      const months = [
        'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December', 'January', 'February', 'March'
      ];

      const newYear = {
        id: Date.now(),
        pastorateName: pastorate.pastorateName,
        year: yearString,
        from: 'April',
        to: 'March',
        months: months,
        createdAt: new Date().toISOString()
      };

      // TODO: Replace with actual API call when backend is ready
      // const result = await window.electron.yearBooks.create(newYear);
      // if (result.success) {
      //   setYears(prev => [result.data, ...prev]);
      //   toast.success('Year created successfully!');
      //   closeYearModal();
      // }

      // For now, save to localStorage as temporary storage
      const updatedYears = [newYear, ...years];
      setYears(updatedYears);
      localStorage.setItem(`years_${pastorate.pastorateName}`, JSON.stringify(updatedYears));
      
      toast.success('Year created successfully with 12 months!');
      closeYearModal();
    } catch (error) {
      toast.error('Failed to create year. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewYear = (year, e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('.year-card-actions')) {
      return;
    }
    navigate('/year-books', { state: { pastorate, year } });
  };

  const [isEditYearModalOpen, setIsEditYearModalOpen] = useState(false);
  const [isDeleteYearModalOpen, setIsDeleteYearModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(null);
  const [yearToDelete, setYearToDelete] = useState(null);
  const [editYearValue, setEditYearValue] = useState(new Date().getFullYear());

  const openEditYearModal = (year, e) => {
    e.stopPropagation();
    setCurrentYear(year);
    const yearNum = parseInt(year.year.split('-')[0]);
    setEditYearValue(yearNum);
    setIsEditYearModalOpen(true);
  };

  const closeEditYearModal = () => {
    setIsEditYearModalOpen(false);
    setCurrentYear(null);
  };

  const handleEditYearSubmit = async (e) => {
    e.preventDefault();
    const yearString = `${editYearValue}-${editYearValue + 1}`;
    
    // Check if year already exists (excluding current year)
    if (years.some(y => y.year === yearString && y.id !== currentYear.id)) {
      toast.error('This year already exists!');
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedYear = {
        ...currentYear,
        year: yearString,
        updatedAt: new Date().toISOString()
      };

      const updatedYears = years.map(y => y.id === currentYear.id ? updatedYear : y);
      setYears(updatedYears);
      localStorage.setItem(`years_${pastorate.pastorateName}`, JSON.stringify(updatedYears));
      
      toast.success('Year updated successfully!');
      closeEditYearModal();
    } catch (error) {
      toast.error('Failed to update year. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteYearModal = (year, e) => {
    e.stopPropagation();
    setYearToDelete(year);
    setIsDeleteYearModalOpen(true);
  };

  const closeDeleteYearModal = () => {
    setIsDeleteYearModalOpen(false);
    setYearToDelete(null);
  };

  const confirmDeleteYear = () => {
    if (yearToDelete) {
      const updatedYears = years.filter(y => y.id !== yearToDelete.id);
      setYears(updatedYears);
      localStorage.setItem(`years_${pastorate.pastorateName}`, JSON.stringify(updatedYears));
      toast.success('Year deleted successfully!');
      closeDeleteYearModal();
    }
  };

  useEffect(() => {
    if (!pastorate) {
      navigate('/dashboard');
      return;
    }
    loadYears();
  }, [pastorate]);

  if (!pastorate) {
    return null;
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message="Loading..." />}
      <div className="pastorate-detail-container">
        <header className="pastorate-detail-header">
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

        <main className="pastorate-detail-main">
          <div className="pastorate-detail-content">
            {/* Year of Accounts Section */}
            <div className="years-section">
              <div className="section-header">
                <h2 className="section-title">Year of Accounts</h2>
                <button onClick={openYearModal} className="create-year-btn">
                  <Plus size={20} weight="bold" />
                  Create Year Books
                </button>
              </div>
              {years.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">No years found. Create your first year to get started.</p>
                </div>
              ) : (
                <div className="years-grid">
                  {years.map((year, index) => (
                    <div key={index} className="year-card" onClick={(e) => handleViewYear(year, e)}>
                      <div className="year-card-content">
                        <div className="card-icon">
                          <Calendar size={40} weight="duotone" />
                        </div>
                        <h3>{year.year}</h3>
                        <p>{year.from} - {year.to}</p>
                      </div>
                      <div className="year-card-actions">
                        <button onClick={(e) => openEditYearModal(year, e)} className="year-action-btn edit-btn">
                          Edit
                        </button>
                        <button onClick={(e) => openDeleteYearModal(year, e)} className="year-action-btn delete-btn">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="churches-list-section">
              <h2 className="section-title">Churches</h2>
              <div className="churches-grid">
                {pastorate.churches.map((church) => (
                  <div key={church.id} className="church-card">
                    <div className="church-card-content">
                      <h3 className="church-card-title">{church.churchName}</h3>
                      {church.churchNameTamil && (
                        <p className="church-card-tamil">{church.churchNameTamil}</p>
                      )}
                      <p className="church-card-short-name">{church.churchShortName}</p>
                    </div>
                    <div className="church-card-actions">
                      <button 
                        onClick={() => handleViewChurch(church)} 
                        className="view-church-btn"
                      >
                        View Church
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Year Modal */}
      <Modal
        isOpen={isYearModalOpen}
        onRequestClose={closeYearModal}
        className="church-modal"
        overlayClassName="church-modal-overlay"
        contentLabel="Create Year Books"
      >
        <div className="modal-header">
          <h2>Create Year Books</h2>
          <button onClick={closeYearModal} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleYearSubmit} className="church-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fromMonth">From</label>
              <input
                type="text"
                id="fromMonth"
                value="April"
                disabled
                className="disabled-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="toMonth">To</label>
              <input
                type="text"
                id="toMonth"
                value="March"
                disabled
                className="disabled-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="year">Enter Year <span className="required">*</span></label>
            <input
              type="number"
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
              min="1900"
              max="2100"
              placeholder="e.g., 2024"
              required
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Year will be formatted as {selectedYear}-{selectedYear + 1}
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeYearModal} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Year Modal */}
      <Modal
        isOpen={isEditYearModalOpen}
        onRequestClose={closeEditYearModal}
        className="church-modal"
        overlayClassName="church-modal-overlay"
        contentLabel="Edit Year"
      >
        <div className="modal-header">
          <h2>Edit Year</h2>
          <button onClick={closeEditYearModal} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleEditYearSubmit} className="church-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="editFromMonth">From</label>
              <input
                type="text"
                id="editFromMonth"
                value="April"
                disabled
                className="disabled-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="editToMonth">To</label>
              <input
                type="text"
                id="editToMonth"
                value="March"
                disabled
                className="disabled-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="editYear">Enter Year <span className="required">*</span></label>
            <input
              type="number"
              id="editYear"
              value={editYearValue}
              onChange={(e) => setEditYearValue(parseInt(e.target.value) || new Date().getFullYear())}
              min="1900"
              max="2100"
              placeholder="e.g., 2024"
              required
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Year will be formatted as {editYearValue}-{editYearValue + 1}
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeEditYearModal} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Year Confirmation Modal */}
      <Modal
        isOpen={isDeleteYearModalOpen}
        onRequestClose={closeDeleteYearModal}
        className="church-modal delete-modal"
        overlayClassName="church-modal-overlay"
        contentLabel="Delete Year"
      >
        <div className="modal-header">
          <h2>Delete Year</h2>
          <button onClick={closeDeleteYearModal} className="modal-close-btn">&times;</button>
        </div>
        <div className="delete-modal-content">
          <p className="delete-warning">
            Are you sure you want to delete year <strong>{yearToDelete?.year}</strong>?
          </p>
          <p className="delete-subtext">
            This will delete all months and data associated with this year. This action cannot be undone.
          </p>
          <div className="form-actions">
            <button type="button" onClick={closeDeleteYearModal} className="cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={confirmDeleteYear} className="delete-confirm-btn">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PastorateDetail;
