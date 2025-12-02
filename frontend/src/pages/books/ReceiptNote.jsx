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

  // Load categories on mount
  useEffect(() => {
    if (pastorate) {
      loadCategories();
    }
  }, [pastorate]);

  const handleCreateReceipt = () => {
    // Navigate to receipt creation page (to be created later)
    navigate('/books/receipt-note/create', { state: { pastorate, year } });
  };

  const handleEditReceipt = (receipt) => {
    // Navigate to receipt edit page (to be created later)
    navigate('/books/receipt-note/edit', { state: { pastorate, year, receipt } });
  };

  const handleDeleteReceipt = (receipt) => {
    // For now, just remove from state
    setReceipts(prev => prev.filter(r => r.id !== receipt.id));
    toast.success('Receipt deleted successfully!');
  };

  // Initialize DataTables
  useEffect(() => {
    if (receiptsTableRef.current && !receiptsDataTableRef.current) {
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
        }
      });

      // Handle button clicks
      $(receiptsTableRef.current).on('click', '.edit', function() {
        const id = parseInt($(this).data('id'));
        const receipt = receipts.find(r => r.id === id);
        if (receipt) handleEditReceipt(receipt);
      });

      $(receiptsTableRef.current).on('click', '.delete', function() {
        const id = parseInt($(this).data('id'));
        const receipt = receipts.find(r => r.id === id);
        if (receipt) handleDeleteReceipt(receipt);
      });
    }

    return () => {
      if (receiptsDataTableRef.current) {
        receiptsDataTableRef.current.destroy();
        receiptsDataTableRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (categoriesTableRef.current && !categoriesDataTableRef.current) {
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
        }
      });

      // Handle button clicks
      $(categoriesTableRef.current).on('click', '.edit', function() {
        const id = parseInt($(this).data('id'));
        const category = categories.find(c => c.id === id);
        if (category) openEditCategoryModal(category);
      });

      $(categoriesTableRef.current).on('click', '.delete', function() {
        const id = parseInt($(this).data('id'));
        const category = categories.find(c => c.id === id);
        if (category) openDeleteModal(category);
      });
    }

    return () => {
      if (categoriesDataTableRef.current) {
        categoriesDataTableRef.current.destroy();
        categoriesDataTableRef.current = null;
      }
    };
  }, []);

  // Update DataTables when data changes
  useEffect(() => {
    if (receiptsDataTableRef.current) {
      receiptsDataTableRef.current.clear();
      receiptsDataTableRef.current.rows.add(receipts);
      receiptsDataTableRef.current.draw();
    }
  }, [receipts]);

  useEffect(() => {
    if (categoriesDataTableRef.current) {
      categoriesDataTableRef.current.clear();
      categoriesDataTableRef.current.rows.add(categories);
      categoriesDataTableRef.current.draw();
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
    </>
  );
};

export default ReceiptNote;
