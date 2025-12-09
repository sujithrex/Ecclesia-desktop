import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, CurrencyDollar, Receipt, Users } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './SangamNote.css';

Modal.setAppElement('#root');

const SangamNote = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    receiptNumber: '',
    memberName: '',
    familyName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Searchable dropdown state
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFreetextMode, setIsFreetextMode] = useState(false);
  const dropdownRef = useRef(null);
  const paymentsTableRef = useRef(null);
  const paymentsDataTableRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = members.filter(m =>
    m.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    { label: 'Sangam Note' }
  ];

  const stats = {
    totalEntries: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0),
    uniqueMembers: new Set(payments.map(p => p.memberName)).size
  };

  const loadMembers = async () => {
    try {
      const result = await window.electron.member.getAll();
      if (result.success && result.data) {
        const membersWithDetails = await Promise.all(result.data.map(async (member) => {
          let familyName = '';
          if (member.familyId) {
            const familyResult = await window.electron.family.getById(member.familyId);
            if (familyResult.success && familyResult.data) {
              familyName = familyResult.data.familyName;
            }
          }
          return {
            id: member.id,
            name: member.name,
            displayName: `${member.name} - ${familyName}`,
            familyName,
            familyId: member.familyId
          };
        }));
        setMembers(membersWithDetails);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadPayments = async () => {
    if (!pastorate || !year || !month) return;
    try {
      const result = await window.electron.sangam.getPayments(pastorate.pastorateName, year.year, month);
      if (result.success) setPayments(result.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  useEffect(() => {
    if (!pastorate || !year || !month) {
      navigate('/dashboard');
      return;
    }
    setIsLoading(true);
    Promise.all([loadMembers(), loadPayments()]).finally(() => setIsLoading(false));
  }, [pastorate, year, month]);

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      receiptNumber: payment.receiptNumber,
      memberName: payment.memberName,
      familyName: payment.familyName,
      amount: payment.amount,
      date: payment.date || new Date().toISOString().split('T')[0]
    });
    setSearchTerm(payment.memberName);
    setIsFreetextMode(true);
    setIsEditModalOpen(true);
  };

  const handleMemberSelect = (member) => {
    setPaymentForm(prev => ({
      ...prev,
      memberName: member.name,
      familyName: member.familyName
    }));
    setSearchTerm(member.name);
    setShowDropdown(false);
    setIsFreetextMode(false);
  };

  const handleFreetextInput = (value) => {
    setSearchTerm(value);
    setPaymentForm(prev => ({
      ...prev,
      memberName: value,
      familyName: isFreetextMode ? prev.familyName : ''
    }));
    setIsFreetextMode(true);
    setShowDropdown(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.memberName) {
      toast.error('Please enter member name');
      return;
    }
    if (!paymentForm.amount || parseInt(paymentForm.amount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        pastorateName: pastorate.pastorateName,
        year: year.year,
        month: month,
        receiptNumber: parseInt(paymentForm.receiptNumber),
        memberName: paymentForm.memberName,
        familyName: paymentForm.familyName,
        amount: parseInt(paymentForm.amount),
        date: paymentForm.date
      };

      const result = await window.electron.sangam.updatePayment(editingPayment.id, data);

      if (result.success) {
        toast.success('Payment updated!');
        await loadPayments();
        setIsEditModalOpen(false);
      } else {
        toast.error(result.message || 'Failed to update payment');
      }
    } catch (error) {
      toast.error('Failed to update payment');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (payment) => {
    setDeleteTarget(payment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsLoading(true);
      const result = await window.electron.sangam.deletePayment(deleteTarget.id);
      if (result.success) {
        toast.success('Entry deleted!');
        await loadPayments();
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      toast.error('Failed to delete entry');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const openHistoryModal = (item) => {
    setHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  const formatHistoryDate = (ts) => new Date(ts).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // DataTable setup
  useEffect(() => {
    if (paymentsDataTableRef.current) paymentsDataTableRef.current.destroy();
    if (paymentsTableRef.current) {
      paymentsDataTableRef.current = $(paymentsTableRef.current).DataTable({
        data: payments,
        columns: [
          { data: 'receiptNumber', title: 'Receipt No' },
          { data: 'memberName', title: 'Member Name' },
          { data: 'familyName', title: 'Family Name' },
          { data: 'amount', title: 'Amount', render: (data) => `₹${parseInt(data)}` },
          {
            data: null, title: 'Actions', orderable: false, render: (data, type, row) => `
              <div class="sg-action-icons">
                <button class="sg-icon-btn sg-edit-btn" data-id="${row.id}" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
                </button>
                <button class="sg-icon-btn sg-delete-btn" data-id="${row.id}" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                </button>
                <button class="sg-icon-btn sg-history-btn" data-id="${row.id}" title="History">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm-8-48A95.44,95.44,0,0,0,60.08,60.15C52.81,67.51,46.35,74.59,40,82V64a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H72a8,8,0,0,0,0-16H49c7.15-8.42,14.27-16.35,22.39-24.57a80,80,0,1,1,1.66,114.75,8,8,0,1,0-11,11.64A96,96,0,1,0,128,32Z"></path></svg>
                </button>
              </div>`
          }
        ],
        pageLength: 10,
        order: [[0, 'asc']],
        language: { emptyTable: 'No sangam payments this month' },
        destroy: true
      });

      $(paymentsTableRef.current).off('click')
        .on('click', '.sg-edit-btn', function () {
          const p = payments.find(x => x.id == $(this).data('id'));
          if (p) openEditModal(p);
        })
        .on('click', '.sg-delete-btn', function () {
          const p = payments.find(x => x.id == $(this).data('id'));
          if (p) openDeleteModal(p);
        })
        .on('click', '.sg-history-btn', function () {
          const p = payments.find(x => x.id == $(this).data('id'));
          if (p) openHistoryModal(p);
        });
    }
  }, [payments]);

  if (!pastorate || !year || !month) {
    return (
      <>
        <TitleBar /><StatusBar />
        <div className="book-page-container">
          <header className="book-page-header"><div className="header-content"><div>Loading...</div></div></header>
          <main className="book-page-main"><div className="book-page-content"><p>Redirecting...</p></div></main>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar /><StatusBar />
      {isLoading && <LoadingScreen message="Loading..." />}
      <div className="book-page-container">
        <header className="book-page-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate(-1)} className="back-btn">Back</button>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </header>
        <main className="book-page-main">
          <div className="book-page-content">
            <h1 className="book-title">Sangam Note - {pastorate?.pastorateShortName} ({year.year} - {month})</h1>

            <div className="sangam-stats-section">
              <div className="sg-stat-card">
                <div className="sg-stat-icon"><Receipt size={28} weight="duotone" /></div>
                <div className="sg-stat-content">
                  <p className="sg-stat-label">Total Entries</p>
                  <h3 className="sg-stat-value">{stats.totalEntries}</h3>
                </div>
              </div>
              <div className="sg-stat-card">
                <div className="sg-stat-icon"><CurrencyDollar size={28} weight="duotone" /></div>
                <div className="sg-stat-content">
                  <p className="sg-stat-label">Total Amount</p>
                  <h3 className="sg-stat-value">₹{stats.totalAmount}</h3>
                </div>
              </div>
              <div className="sg-stat-card">
                <div className="sg-stat-icon"><Users size={28} weight="duotone" /></div>
                <div className="sg-stat-content">
                  <p className="sg-stat-label">Unique Members</p>
                  <h3 className="sg-stat-value">{stats.uniqueMembers}</h3>
                </div>
              </div>
            </div>

            <div className="sangam-tables-section">
              <div className="sg-table-container">
                <div className="sg-table-header">
                  <h2 className="sg-table-title">Sangam Payments - {month}</h2>
                  <div className="sg-table-actions">
                    <button onClick={() => navigate('/books/pay-sangam', { state: { pastorate, year, month } })} className="sg-action-btn">
                      <Plus size={18} /> Pay Sangam
                    </button>
                  </div>
                </div>
                <div className="sg-table-wrapper">
                  <table ref={paymentsTableRef} className="display" style={{ width: '100%' }}></table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className="sg-modal" overlayClassName="sg-modal-overlay">
        <div className="sg-modal-header">
          <h2>Edit Sangam Payment</h2>
          <button onClick={() => setIsEditModalOpen(false)} className="sg-modal-close">&times;</button>
        </div>
        <form onSubmit={handleEditSubmit} className="sg-modal-form">
          <div className="sg-form-group">
            <label>Receipt Number *</label>
            <input
              type="number"
              value={paymentForm.receiptNumber}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
              required
              min="1"
            />
          </div>
          <div className="sg-form-group">
            <label>Member Name *</label>
            <div className="sg-searchable-dropdown" ref={dropdownRef}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleFreetextInput(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type to search or enter new name..."
                className="sg-search-input"
              />
              {showDropdown && filteredMembers.length > 0 && (
                <div className="sg-dropdown-list">
                  {filteredMembers.map(m => (
                    <div key={m.id} className="sg-dropdown-item" onClick={() => handleMemberSelect(m)}>
                      {m.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {paymentForm.memberName && (
              <div className="sg-selected-member">Selected: {paymentForm.memberName}</div>
            )}
          </div>
          <div className="sg-form-group">
            <label>Family Name</label>
            <input
              type="text"
              value={paymentForm.familyName}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, familyName: e.target.value }))}
              placeholder="Family name"
            />
          </div>
          <div className="sg-form-group">
            <label>Amount *</label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              required
              min="1"
              step="1"
              placeholder="Enter amount (no decimals)"
            />
          </div>
          <div className="sg-form-group">
            <label>Date *</label>
            <input
              type="date"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className="sg-form-actions">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="sg-cancel-btn">Cancel</button>
            <button type="submit" className="sg-submit-btn">Update</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onRequestClose={() => setIsDeleteModalOpen(false)} className="sg-modal sg-delete-modal" overlayClassName="sg-modal-overlay">
        <div className="sg-modal-header sg-delete-header">
          <h2>Confirm Delete</h2>
          <button onClick={() => setIsDeleteModalOpen(false)} className="sg-modal-close">&times;</button>
        </div>
        <div className="sg-delete-content">
          <p>Are you sure you want to delete this entry?</p>
          {deleteTarget && (
            <div className="sg-delete-info">
              <p><strong>Receipt No:</strong> {deleteTarget.receiptNumber}</p>
              <p><strong>Member:</strong> {deleteTarget.memberName}</p>
              <p><strong>Amount:</strong> ₹{deleteTarget.amount}</p>
            </div>
          )}
          <div className="sg-form-actions">
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="sg-cancel-btn">Cancel</button>
            <button type="button" onClick={handleConfirmDelete} className="sg-delete-confirm-btn">Delete</button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onRequestClose={() => setIsHistoryModalOpen(false)} className="sg-modal sg-history-modal" overlayClassName="sg-modal-overlay">
        <div className="sg-modal-header">
          <h2>Edit History</h2>
          <button onClick={() => setIsHistoryModalOpen(false)} className="sg-modal-close">&times;</button>
        </div>
        <div className="sg-history-content">
          {historyItem?.editHistory?.length > 0 ? (
            <div className="sg-history-list">
              {[...historyItem.editHistory].reverse().map((c, i) => (
                <div key={i} className="sg-history-item">
                  <strong>{c.field}:</strong> <span className="sg-old-val">{c.oldValue}</span> → <span className="sg-new-val">{c.newValue}</span>
                  <div className="sg-history-time">{formatHistoryDate(c.timestamp)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sg-no-history">No edit history.</p>
          )}
          <div className="sg-form-actions">
            <button onClick={() => setIsHistoryModalOpen(false)} className="sg-cancel-btn">Close</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SangamNote;
