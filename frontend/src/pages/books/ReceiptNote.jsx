import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Receipt, CurrencyDollar, Tag, Hash, Plus, PencilLine, Trash } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './ReceiptNote.css';

Modal.setAppElement('#root');

const ReceiptNote = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [categories, setCategories] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const receiptsTableRef = useRef(null);
  const categoriesTableRef = useRef(null);
  const receiptsDataTableRef = useRef(null);
  const categoriesDataTableRef = useRef(null);

  // Default categories
  const defaultCategories = [
    'Birthday Thanks Offertory',
    'Marriage Thanks Offertory',
    'House Visit Offertory',
    'House Warming Offertory',
    'Thanks Offertory'
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
    { label: 'Receipt Note' }
  ];

  // Stats calculations
  const stats = {
    totalReceipts: receipts.length,
    totalAmount: receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    totalCategories: categories.length,
    lastReceiptNumber: receipts.length > 0 ? Math.max(...receipts.map(r => r.receiptNo)) : 0
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
      // Load categories from localStorage (global for pastorate)
      const storedCategories = localStorage.getItem(`categories_${pastorate.pastorateName}`);
      
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
        localStorage.setItem(`categories_${pastorate.pastorateName}`, JSON.stringify(initialCategories));
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
      // Update category
      const updatedCategories = categories.map(cat => 
        cat.id === currentCategory.id 
          ? { ...cat, name: categoryName, updatedAt: new Date().toISOString() }
          : cat
      );
      setCategories(updatedCategories);
      localStorage.setItem(`categories_${pastorate.pastorateName}`, JSON.stringify(updatedCategories));
      toast.success('Category updated successfully!');
    } else {
      // Create new category
      const newCategory = {
        id: Date.now(),
        name: categoryName,
        createdAt: new Date().toISOString()
      };
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      localStorage.setItem(`categories_${pastorate.pastorateName}`, JSON.stringify(updatedCategories));
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
      localStorage.setItem(`categories_${pastorate.pastorateName}`, JSON.stringify(updatedCategories));
      toast.success('Category deleted successfully!');
      closeDeleteModal();
    }
  };

  // Load categories and receipts on mount
  useEffect(() => {
    if (pastorate) {
      loadCategories();
      loadReceipts();
    }
  }, [pastorate, year, month]);

  const loadReceipts = async () => {
    if (!pastorate || !year || !month) return;
    
    try {
      const result = await window.electron.receipt.getByPastorateYearMonth(
        pastorate.pastorateName,
        year.year,
        month
      );
      if (result.success && result.data) {
        console.log('Loaded receipts:', result.data);
        setReceipts(result.data);
      } else {
        console.log('No receipts found');
        setReceipts([]);
      }
    } catch (error) {
      console.error('Failed to load receipts:', error);
      setReceipts([]);
    }
  };

  const handleCreateReceipt = () => {
    // Navigate to receipt creation page
    navigate('/books/receipt-note/create', { state: { pastorate, year, month } });
  };

  const [isEditReceiptModalOpen, setIsEditReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [receiptFormData, setReceiptFormData] = useState({
    receiptNo: '',
    date: '',
    name: '',
    category: '',
    amount: ''
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyReceipt, setHistoryReceipt] = useState(null);

  const handleEditReceipt = (receipt) => {
    setCurrentReceipt(receipt);
    setReceiptFormData({
      receiptNo: receipt.receiptNo,
      date: receipt.date || new Date().toISOString().split('T')[0],
      name: receipt.name,
      category: receipt.category,
      amount: receipt.amount
    });
    setIsEditReceiptModalOpen(true);
  };

  const closeEditReceiptModal = () => {
    setIsEditReceiptModalOpen(false);
    setCurrentReceipt(null);
  };

  const handleViewHistory = (receipt) => {
    setHistoryReceipt(receipt);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryReceipt(null);
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

  const handleReceiptFormChange = (e) => {
    const { name, value } = e.target;
    setReceiptFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const updates = {
        ...receiptFormData,
        amount: parseFloat(receiptFormData.amount)
      };

      const result = await window.electron.receipt.update(currentReceipt.id, updates);
      
      if (result.success) {
        // Reload receipts to get updated data with history
        await loadReceipts();
        toast.success('Receipt updated successfully!');
        closeEditReceiptModal();
      } else {
        toast.error('Failed to update receipt');
      }
    } catch (error) {
      toast.error('Failed to update receipt');
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReceipt = async (receipt) => {
    try {
      const result = await window.electron.receipt.delete(receipt.id);
      if (result.success) {
        await loadReceipts();
        toast.success('Receipt deleted successfully!');
      } else {
        toast.error('Failed to delete receipt');
      }
    } catch (error) {
      toast.error('Failed to delete receipt');
      console.error('Delete error:', error);
    }
  };

  const formatHistoryTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Initialize DataTables
  useEffect(() => {
    // Destroy existing table if it exists
    if (receiptsDataTableRef.current) {
      receiptsDataTableRef.current.destroy();
      receiptsDataTableRef.current = null;
    }

    if (receiptsTableRef.current) {
      receiptsDataTableRef.current = $(receiptsTableRef.current).DataTable({
        data: receipts,
        columns: [
          { data: 'receiptNo', title: 'R.No' },
          { data: 'name', title: 'Name' },
          { 
            data: 'amount', 
            title: 'Amount',
            render: (data) => `₹${parseFloat(data).toFixed(2)}`
          },
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
                  <button class="icon-btn history" data-id="${row.id}" title="View History">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm-8-48A95.44,95.44,0,0,0,60.08,60.15C52.81,67.51,46.35,74.59,40,82V64a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H72a8,8,0,0,0,0-16H49.62C55.24,86.8,61,77.92,67.6,70.66a80,80,0,1,1-1.67,114.78,8,8,0,0,0-11.11,11.52A96,96,0,1,0,128,32Z"></path></svg>
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
        order: [[0, 'desc']],
        language: {
          emptyTable: 'No receipts found'
        },
        destroy: true
      });

      // Handle button clicks
      $(receiptsTableRef.current).on('click', '.edit', function() {
        const id = $(this).data('id');
        const receipt = receipts.find(r => r.id == id);
        if (receipt) handleEditReceipt(receipt);
      });

      $(receiptsTableRef.current).on('click', '.history', function() {
        const id = $(this).data('id');
        const receipt = receipts.find(r => r.id == id);
        if (receipt) handleViewHistory(receipt);
      });

      $(receiptsTableRef.current).on('click', '.delete', function() {
        const id = $(this).data('id');
        const receipt = receipts.find(r => r.id == id);
        if (receipt) handleDeleteReceipt(receipt);
      });
    }
  }, [receipts]);

  useEffect(() => {
    // Destroy existing table if it exists
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

      // Handle button clicks
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
            <h1 className="book-title">Receipt Note - {pastorate?.pastorateShortName || 'Pastorate Name'}{month ? ` (${month} ${year?.year || ''})` : year ? ` (${year.year})` : ''}</h1>

            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-icon">
                  <Receipt size={32} weight="duotone" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">No of Receipts</p>
                  <h3 className="stat-value">{stats.totalReceipts}</h3>
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
                  <Hash size={32} weight="duotone" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Last Receipt Number</p>
                  <h3 className="stat-value">{stats.lastReceiptNumber}</h3>
                </div>
              </div>
            </div>

            {/* Tables Section */}
            <div className="tables-section">
              {/* Receipts Table */}
              <div className="table-container">
                <div className="table-header">
                  <h2 className="table-title">Receipts</h2>
                  <button onClick={handleCreateReceipt} className="action-btn primary">
                    <Plus size={20} weight="bold" />
                    Create Receipt
                  </button>
                </div>
                <div className="table-wrapper">
                  <table ref={receiptsTableRef} className="display" style={{ width: '100%' }}></table>
                </div>
              </div>

              {/* Categories Table */}
              <div className="table-container">
                <div className="table-header">
                  <h2 className="table-title">Categories</h2>
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

      {/* Edit Receipt Modal */}
      <Modal
        isOpen={isEditReceiptModalOpen}
        onRequestClose={closeEditReceiptModal}
        className="book-modal large-modal"
        overlayClassName="book-modal-overlay"
        contentLabel="Edit Receipt"
      >
        <div className="modal-header themed-header">
          <h2>Edit Receipt</h2>
          <button onClick={closeEditReceiptModal} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleReceiptSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="receiptNo">Receipt Number <span className="required">*</span></label>
              <input
                type="text"
                id="receiptNo"
                name="receiptNo"
                value={receiptFormData.receiptNo}
                readOnly
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date <span className="required">*</span></label>
              <input
                type="date"
                id="date"
                name="date"
                value={receiptFormData.date}
                onChange={handleReceiptFormChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Name <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={receiptFormData.name}
              onChange={handleReceiptFormChange}
              placeholder="Enter name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category <span className="required">*</span></label>
              <select
                id="category"
                name="category"
                value={receiptFormData.category}
                onChange={handleReceiptFormChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount <span className="required">*</span></label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={receiptFormData.amount}
                onChange={handleReceiptFormChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeEditReceiptModal} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Update
            </button>
          </div>
        </form>
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
          <h2>Edit History - Receipt #{historyReceipt?.receiptNo}</h2>
          <button onClick={closeHistoryModal} className="modal-close-btn">&times;</button>
        </div>
        <div className="history-modal-content">
          {historyReceipt?.editHistory && historyReceipt.editHistory.length > 0 ? (
            <div className="history-list">
              {[...historyReceipt.editHistory].reverse().map((change, index) => (
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
              <p>No edit history available for this receipt.</p>
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

export default ReceiptNote;
