import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Church, CurrencyDollar, Tag, Plus, PencilLine, Trash, ClockCounterClockwise } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './ChurchOffertory.css';

Modal.setAppElement('#root');

const ChurchOffertory = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [categories, setCategories] = useState([]);
  const [offertories, setOffertories] = useState([]);
  const [churches, setChurches] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChurchSelectModalOpen, setIsChurchSelectModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyOffertory, setHistoryOffertory] = useState(null);
  
  const offertoriesTableRef = useRef(null);
  const categoriesTableRef = useRef(null);
  const offertoriesDataTableRef = useRef(null);
  const categoriesDataTableRef = useRef(null);

  // Default categories in Tamil
  const defaultCategories = [
    'நில வருமானம்',
    'வாடகை',
    'கோவில் காணிக்கை',
    'பரி. நற்கருணை காணிக்கை',
    'ஸ்தோத்திர காணிக்கை',
    'பலவித காணிக்கை',
    'சங்க காணிக்கை ( சபை)',
    'சங்க காணிக்கை ( ஊழியர்)',
    'அறுப்பின் பண்டிகை',
    'கல்யாணம் மற்றும் பீஸ்',
    'ஞானஸ்நானம்',
    'பாலியர் சங்கம்',
    'இந்திய மிசனரி சங்கம்'
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    ...(year ? [{ label: year.year, path: '/year-books', state: { pastorate, year } }] : []),
    ...(month ? [{ label: month, path: '/month-books', state: { pastorate, year, month } }] : []),
    { label: 'Church Offertory' }
  ];

  // Stats calculations
  const stats = {
    totalChurches: [...new Set(offertories.map(o => o.churchId))].length,
    totalCategories: categories.length,
    totalAmount: offertories.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0)
  };

  const openCreateCategoryModal = () => {
    setIsEditMode(false);
    setCurrentCategory(null);
    setCategoryName('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category) => {
    setIsEditMode(true);
    setCurrentCategory(category);
    setCategoryName(category.name);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCurrentCategory(null);
    setCategoryName('');
  };

  const loadCategories = () => {
    if (!pastorate) return;
    
    try {
      setIsLoading(true);
      const storedCategories = localStorage.getItem(`offertory_categories_${pastorate.pastorateName}`);
      
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // Initialize with default categories
        const initialCategories = defaultCategories.map((name, index) => ({
          id: Date.now() + index,
          name: name,
          createdAt: new Date().toISOString()
        }));
        setCategories(initialCategories);
        localStorage.setItem(`offertory_categories_${pastorate.pastorateName}`, JSON.stringify(initialCategories));
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    
    if (isEditMode && currentCategory) {
      const updatedCategories = categories.map(cat => 
        cat.id === currentCategory.id 
          ? { ...cat, name: categoryName, updatedAt: new Date().toISOString() }
          : cat
      );
      setCategories(updatedCategories);
      localStorage.setItem(`offertory_categories_${pastorate.pastorateName}`, JSON.stringify(updatedCategories));
      toast.success('Category updated successfully!');
    } else {
      const newCategory = {
        id: Date.now(),
        name: categoryName,
        createdAt: new Date().toISOString()
      };
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      localStorage.setItem(`offertory_categories_${pastorate.pastorateName}`, JSON.stringify(updatedCategories));
      toast.success('Category created successfully!');
    }
    
    closeCategoryModal();
  };

  const openDeleteModal = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete.id);
      setCategories(updatedCategories);
      localStorage.setItem(`offertory_categories_${pastorate.pastorateName}`, JSON.stringify(updatedCategories));
      toast.success('Category deleted successfully!');
      closeDeleteModal();
    }
  };

  const loadChurches = async () => {
    try {
      const result = await window.electron.church.getAll();
      if (result.success && result.data) {
        setChurches(result.data);
      }
    } catch (error) {
      console.error('Failed to load churches:', error);
    }
  };

  const loadOffertories = async () => {
    if (!pastorate || !year || !month) return;
    
    try {
      const result = await window.electron.churchOffertory.getByPastorateYearMonth(
        pastorate.pastorateName,
        year.year,
        month
      );
      if (result.success && result.data) {
        setOffertories(result.data);
      } else {
        setOffertories([]);
      }
    } catch (error) {
      console.error('Failed to load offertories:', error);
      setOffertories([]);
    }
  };

  useEffect(() => {
    if (pastorate) {
      loadCategories();
      loadChurches();
      loadOffertories();
    }
  }, [pastorate, year, month]);

  const handleAddOffertory = (churchId) => {
    const church = churches.find(c => c.id === churchId);
    if (church) {
      navigate('/books/church-offertory/create', { 
        state: { pastorate, year, month, church, categories } 
      });
    }
  };

  const handleChurchSelect = () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    const church = churches.find(c => c.id === parseInt(selectedChurch));
    if (church) {
      navigate('/books/church-offertory/create', { 
        state: { pastorate, year, month, church, categories } 
      });
    }
  };

  const handleEditOffertory = (offertory) => {
    const church = churches.find(c => c.id === offertory.churchId);
    navigate('/books/church-offertory/create', { 
      state: { pastorate, year, month, church, categories, editOffertory: offertory } 
    });
  };

  // Get all churches with their offertory data
  const getAllChurchesWithOffertories = () => {
    // Filter churches by pastorate
    const pastorateChurches = churches.filter(c => c.pastorateName === pastorate.pastorateName);
    
    return pastorateChurches.map(church => {
      const churchOffertories = offertories.filter(o => o.churchId === church.id);
      const totalServices = churchOffertories.reduce((sum, o) => sum + (o.services?.length || 0), 0);
      const totalAmount = churchOffertories.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
      
      return {
        churchId: church.id,
        churchName: church.churchName,
        offertories: churchOffertories,
        totalServices,
        totalAmount,
        hasOffertory: churchOffertories.length > 0
      };
    });
  };

  const churchData = getAllChurchesWithOffertories();

  const handleViewHistory = (offertory) => {
    setHistoryOffertory(offertory);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryOffertory(null);
  };

  const formatHistoryDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Initialize Categories DataTable only
  useEffect(() => {
    if (offertoriesDataTableRef.current) {
      offertoriesDataTableRef.current.destroy();
      offertoriesDataTableRef.current = null;
    }
  }, [offertories, churches]);

  useEffect(() => {
    if (categoriesDataTableRef.current) {
      categoriesDataTableRef.current.destroy();
      categoriesDataTableRef.current = null;
    }

    if (categoriesTableRef.current) {
      categoriesDataTableRef.current = $(categoriesTableRef.current).DataTable({
        data: categories,
        columns: [
          { data: 'name', title: 'Category' },
          {
            data: null,
            title: 'Actions',
            orderable: false,
            render: (data, type, row) => {
              return `
                <div class="action-icons">
                  <button class="icon-btn edit" data-id="${row.id}" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
                  </button>
                  <button class="icon-btn delete" data-id="${row.id}" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                  </button>
                </div>
              `;
            }
          }
        ],
        pageLength: 10,
        order: [[0, 'asc']],
        language: {
          emptyTable: 'No categories found'
        },
        destroy: true
      });

      $(categoriesTableRef.current).on('click', '.edit', function() {
        const id = $(this).data('id');
        const category = categories.find(c => c.id == id);
        if (category) openEditCategoryModal(category);
      });

      $(categoriesTableRef.current).on('click', '.delete', function() {
        const id = $(this).data('id');
        const category = categories.find(c => c.id == id);
        if (category) openDeleteModal(category);
      });
    }
  }, [categories]);

  if (!pastorate) {
    return null;
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message="Loading..." />}
      <div className="book-page-container">
        <header className="book-page-header">
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

        <main className="book-page-main">
          <div className="book-page-content">
            <h1 className="book-title">Church Offertory - {pastorate?.pastorateShortName || 'Pastorate'}{month ? ` (${month} ${year?.year || ''})` : year ? ` (${year.year})` : ''}</h1>

            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-icon">
                  <Church size={32} weight="duotone" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Churches</p>
                  <h3 className="stat-value">{stats.totalChurches}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Tag size={32} weight="duotone" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Categories</p>
                  <h3 className="stat-value">{stats.totalCategories}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <CurrencyDollar size={32} weight="duotone" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Amount</p>
                  <h3 className="stat-value">₹{stats.totalAmount.toFixed(2)}</h3>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="content-section">
              {/* Church Cards */}
              <div className="churches-container">
                <div className="section-header">
                  <h2 className="section-title">Church Offertories</h2>
                </div>
                
                <div className="offertory-church-cards-grid">
                  {churchData.length > 0 ? (
                    churchData.map((church) => (
                      <div key={church.churchId} className="offertory-church-card">
                        <div className="offertory-church-card-header">
                          <h3 className="offertory-church-name">{church.churchName}</h3>
                        </div>
                        <div className="offertory-church-card-body">
                          <div className="offertory-church-stat">
                            <span className="offertory-stat-label">Total Services:</span>
                            <span className="offertory-stat-value">{church.totalServices}</span>
                          </div>
                          <div className="offertory-church-stat">
                            <span className="offertory-stat-label">Total Amount:</span>
                            <span className="offertory-stat-value amount">₹{church.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="offertory-church-card-actions">
                          {church.hasOffertory ? (
                            <>
                              <button 
                                onClick={() => handleEditOffertory(church.offertories[0])}
                                className="offertory-action-btn edit"
                                title="Edit"
                              >
                                <PencilLine size={18} weight="bold" />
                                Edit
                              </button>
                              <button 
                                onClick={() => handleViewHistory(church.offertories[0])}
                                className="offertory-action-btn history"
                                title="View History"
                              >
                                <ClockCounterClockwise size={18} weight="bold" />
                                History
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleAddOffertory(church.churchId)}
                              className="offertory-action-btn add"
                              title="Add Offertory"
                            >
                              <Plus size={18} weight="bold" />
                              Add Offertory
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <p>No churches found in this pastorate.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories Table */}
              <div className="categories-container">
                <div className="section-header">
                  <h2 className="section-title">Categories</h2>
                  <button onClick={openCreateCategoryModal} className="action-btn">
                    <Plus size={20} weight="bold" />
                    Create Category
                  </button>
                </div>
                <div className="table-wrapper">
                  <table ref={categoriesTableRef} className="display" style={{ width: '100%' }}></table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onRequestClose={closeCategoryModal}
        className="book-modal"
        overlayClassName="book-modal-overlay"
        contentLabel={isEditMode ? "Edit Category" : "Create Category"}
      >
        <div className="modal-header themed-header">
          <h2>{isEditMode ? 'Edit Category' : 'Create Category'}</h2>
          <button onClick={closeCategoryModal} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleCategorySubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="categoryName">Category Name <span className="required">*</span></label>
            <input
              type="text"
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeCategoryModal} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        className="book-modal delete-modal"
        overlayClassName="book-modal-overlay"
        contentLabel="Delete Category"
      >
        <div className="modal-header themed-header">
          <h2>Delete Category</h2>
          <button onClick={closeDeleteModal} className="modal-close-btn">&times;</button>
        </div>
        <div className="delete-modal-content">
          <p className="delete-warning">
            Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>?
          </p>
          <p className="delete-subtext">
            This action cannot be undone.
          </p>
          <div className="form-actions">
            <button type="button" onClick={closeDeleteModal} className="cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} className="delete-confirm-btn">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Church Select Modal */}
      <Modal
        isOpen={isChurchSelectModalOpen}
        onRequestClose={() => setIsChurchSelectModalOpen(false)}
        className="book-modal"
        overlayClassName="book-modal-overlay"
        contentLabel="Select Church"
      >
        <div className="modal-header themed-header">
          <h2>Select Church</h2>
          <button onClick={() => setIsChurchSelectModalOpen(false)} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="churchSelect">Church <span className="required">*</span></label>
            <select
              id="churchSelect"
              value={selectedChurch}
              onChange={(e) => setSelectedChurch(e.target.value)}
              required
            >
              <option value="">Select a church</option>
              {churches
                .filter(c => c.pastorateName === pastorate.pastorateName)
                .map(church => (
                  <option key={church.id} value={church.id}>
                    {church.churchName}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsChurchSelectModalOpen(false)} className="cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={handleChurchSelect} className="submit-btn">
              Continue
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onRequestClose={closeHistoryModal}
        className="book-modal history-modal"
        overlayClassName="book-modal-overlay"
        contentLabel="Edit History"
        style={{
          content: {
            width: '70%',
            maxWidth: '900px'
          }
        }}
      >
        <div className="modal-header themed-header">
          <h2>Edit History - {churches.find(c => c.id === historyOffertory?.churchId)?.churchName}</h2>
          <button onClick={closeHistoryModal} className="modal-close-btn">&times;</button>
        </div>
        <div className="history-modal-content">
          {historyOffertory?.editHistory && historyOffertory.editHistory.length > 0 ? (
            <div className="history-list">
              {[...historyOffertory.editHistory].reverse().map((change, index) => (
                <div key={index} className="history-item">
                  <div className="history-field">
                    <strong>{change.field}:</strong>
                  </div>
                  <div className="history-change">
                    <span className="old-value">{change.oldValue}</span>
                    <span className="arrow">→</span>
                    <span className="new-value">{change.newValue}</span>
                  </div>
                  <div className="history-timestamp">
                    {formatHistoryDate(change.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <p>No edit history available for this offertory.</p>
            </div>
          )}
          <div className="form-actions">
            <button type="button" onClick={closeHistoryModal} className="cancel-btn">
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ChurchOffertory;
