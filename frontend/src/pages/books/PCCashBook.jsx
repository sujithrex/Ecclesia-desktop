import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, CurrencyDollar, Wallet, ArrowUp, ArrowDown, Printer } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './PCCashBook.css';

Modal.setAppElement('#root');

const PCCashBook = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Income sources state
  const [receiptsTotal, setReceiptsTotal] = useState(0);
  const [sangamTotal, setSangamTotal] = useState(0);
  const [hfTotal, setHfTotal] = useState(0);
  const [offertoryTotal, setOffertoryTotal] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);

  const [expenseForm, setExpenseForm] = useState({
    vno: '',
    date: new Date().toISOString().split('T')[0],
    expenseDetails: '',
    amount: ''
  });

  const [openingBalanceForm, setOpeningBalanceForm] = useState('');

  const expensesTableRef = useRef(null);
  const expensesDataTableRef = useRef(null);

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
    { label: 'PC Cash Book' }
  ];

  const totalIncome = receiptsTotal + sangamTotal + hfTotal + offertoryTotal;
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const balance = openingBalance + totalIncome - totalExpenses;

  const isAprilMonth = month === 'April';

  // Financial year months order (April to March)
  const financialYearMonths = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

  const loadExpenses = async () => {
    if (!pastorate || !year || !month) return;
    try {
      const result = await window.electron.pcCashBook.getExpenses(pastorate.pastorateName, year.year, month);
      if (result.success) setExpenses(result.data || []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const loadIncomeSources = async () => {
    if (!pastorate || !year || !month) return;
    try {
      // Load receipts
      const receiptsResult = await window.electron.receipt.getByPastorateYearMonth(
        pastorate.pastorateName, year.year, month
      );
      if (receiptsResult.success) {
        const total = (receiptsResult.data || []).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        setReceiptsTotal(total);
      }

      // Load sangam payments
      const sangamResult = await window.electron.sangam.getPayments(
        pastorate.pastorateName, year.year, month
      );
      if (sangamResult.success) {
        const total = (sangamResult.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        setSangamTotal(total);
      }

      // Load harvest festival payments
      const hfResult = await window.electron.harvestFestival.getPayments(
        pastorate.pastorateName, year.year, month
      );
      if (hfResult.success) {
        const total = (hfResult.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        setHfTotal(total);
      }

      // Load church offertory
      const offertoryResult = await window.electron.churchOffertory.getByPastorateYearMonth(
        pastorate.pastorateName, year.year, month
      );
      if (offertoryResult.success) {
        const total = (offertoryResult.data || []).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        setOffertoryTotal(total);
      }
    } catch (error) {
      console.error('Failed to load income sources:', error);
    }
  };

  // Helper function to get income for a specific month
  const getMonthIncome = async (monthName) => {
    let total = 0;
    try {
      const receiptsResult = await window.electron.receipt.getByPastorateYearMonth(pastorate.pastorateName, year.year, monthName);
      if (receiptsResult.success) total += (receiptsResult.data || []).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

      const sangamResult = await window.electron.sangam.getPayments(pastorate.pastorateName, year.year, monthName);
      if (sangamResult.success) total += (sangamResult.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      const hfResult = await window.electron.harvestFestival.getPayments(pastorate.pastorateName, year.year, monthName);
      if (hfResult.success) total += (hfResult.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      const offertoryResult = await window.electron.churchOffertory.getByPastorateYearMonth(pastorate.pastorateName, year.year, monthName);
      if (offertoryResult.success) total += (offertoryResult.data || []).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    } catch (error) {
      console.error(`Failed to get income for ${monthName}:`, error);
    }
    return total;
  };

  // Helper function to get expenses for a specific month
  const getMonthExpenses = async (monthName) => {
    try {
      const result = await window.electron.pcCashBook.getExpenses(pastorate.pastorateName, year.year, monthName);
      if (result.success) return (result.data || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    } catch (error) {
      console.error(`Failed to get expenses for ${monthName}:`, error);
    }
    return 0;
  };

  const loadOpeningBalance = async () => {
    if (!pastorate || !year || !month) return;
    try {
      // Get April's opening balance (user entered)
      const aprilBalanceResult = await window.electron.pcCashBook.getOpeningBalance(pastorate.pastorateName, year.year);
      const aprilOpeningBalance = aprilBalanceResult.success && aprilBalanceResult.data ? parseFloat(aprilBalanceResult.data.amount) || 0 : 0;

      if (month === 'April') {
        setOpeningBalance(aprilOpeningBalance);
        return;
      }

      // For other months, calculate opening balance from previous months
      const currentMonthIndex = financialYearMonths.indexOf(month);
      let calculatedBalance = aprilOpeningBalance;

      // Sum up all previous months (from April to month before current)
      for (let i = 0; i < currentMonthIndex; i++) {
        const prevMonth = financialYearMonths[i];
        const monthIncome = await getMonthIncome(prevMonth);
        const monthExpenses = await getMonthExpenses(prevMonth);
        calculatedBalance += (monthIncome - monthExpenses);
      }

      setOpeningBalance(calculatedBalance);
    } catch (error) {
      console.error('Failed to load opening balance:', error);
    }
  };

  useEffect(() => {
    if (!pastorate || !year || !month) {
      navigate('/dashboard');
      return;
    }
    setIsLoading(true);
    Promise.all([loadExpenses(), loadIncomeSources(), loadOpeningBalance()])
      .finally(() => setIsLoading(false));
  }, [pastorate, year, month]);

  const openAddModal = async () => {
    try {
      const result = await window.electron.pcCashBook.getNextVNo(pastorate.pastorateName, year.year, month);
      setExpenseForm({
        vno: result.success ? result.data : '001',
        date: new Date().toISOString().split('T')[0],
        expenseDetails: '',
        amount: ''
      });
      setIsAddModalOpen(true);
    } catch (error) {
      console.error('Failed to get next VNo:', error);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.expenseDetails.trim()) {
      toast.error('Please enter expense details');
      return;
    }
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        pastorateName: pastorate.pastorateName,
        year: year.year,
        month: month,
        vno: expenseForm.vno,
        date: expenseForm.date,
        expenseDetails: expenseForm.expenseDetails,
        amount: parseFloat(expenseForm.amount)
      };

      const result = await window.electron.pcCashBook.createExpense(data);
      if (result.success) {
        toast.success('Expense added!');
        await loadExpenses();
        setIsAddModalOpen(false);
      } else {
        toast.error(result.message || 'Failed to add expense');
      }
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      vno: expense.vno,
      date: expense.date || new Date().toISOString().split('T')[0],
      expenseDetails: expense.expenseDetails,
      amount: expense.amount
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.expenseDetails.trim()) {
      toast.error('Please enter expense details');
      return;
    }
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        vno: expenseForm.vno,
        date: expenseForm.date,
        expenseDetails: expenseForm.expenseDetails,
        amount: parseFloat(expenseForm.amount)
      };

      const result = await window.electron.pcCashBook.updateExpense(editingExpense.id, data);
      if (result.success) {
        toast.success('Expense updated!');
        await loadExpenses();
        setIsEditModalOpen(false);
      } else {
        toast.error(result.message || 'Failed to update expense');
      }
    } catch (error) {
      toast.error('Failed to update expense');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (expense) => {
    setDeleteTarget(expense);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsLoading(true);
      const result = await window.electron.pcCashBook.deleteExpense(deleteTarget.id);
      if (result.success) {
        toast.success('Expense deleted!');
        await loadExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      toast.error('Failed to delete expense');
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

  const openOpeningBalanceModal = () => {
    if (!isAprilMonth) return;
    setOpeningBalanceForm(openingBalance.toString());
    setIsOpeningBalanceModalOpen(true);
  };

  const handleOpeningBalanceSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const amount = parseFloat(openingBalanceForm) || 0;
      const result = await window.electron.pcCashBook.saveOpeningBalance(
        pastorate.pastorateName, year.year, amount
      );
      if (result.success) {
        toast.success('Opening balance saved!');
        setOpeningBalance(amount);
        setIsOpeningBalanceModalOpen(false);
      } else {
        toast.error(result.message || 'Failed to save opening balance');
      }
    } catch (error) {
      toast.error('Failed to save opening balance');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    try {
      setIsLoading(true);
      
      // Load all data for PDF
      const offertoryResult = await window.electron.churchOffertory.getByPastorateYearMonth(
        pastorate.pastorateName, year.year, month
      );
      const receiptsResult = await window.electron.receipt.getByPastorateYearMonth(
        pastorate.pastorateName, year.year, month
      );
      const expensesResult = await window.electron.pcCashBook.getExpenses(
        pastorate.pastorateName, year.year, month
      );

      const churchOffertories = offertoryResult.success ? offertoryResult.data || [] : [];
      const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
      const expensesList = expensesResult.success ? expensesResult.data || [] : [];

      // Group offertories by church
      const churchMap = {};
      churchOffertories.forEach(o => {
        if (!churchMap[o.churchName]) {
          churchMap[o.churchName] = { churchName: o.churchName, totalAmount: 0 };
        }
        churchMap[o.churchName].totalAmount += parseFloat(o.totalAmount) || 0;
      });
      const churchOffertoryList = Object.values(churchMap);
      const churchOffertoryTotal = churchOffertoryList.reduce((sum, c) => sum + c.totalAmount, 0);
      const receiptsTotal = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const expensesTotal = expensesList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      // Calculate running balances
      let runningBalance = openingBalance;
      const churchOffertorisWithBalance = churchOffertoryList.map(c => {
        runningBalance += c.totalAmount;
        return { ...c, runningBalance };
      });
      const receiptsWithBalance = receipts.map(r => {
        runningBalance += parseFloat(r.amount) || 0;
        return {
          ...r,
          dateFormatted: r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-',
          amount: parseFloat(r.amount) || 0,
          runningBalance
        };
      });
      const expensesWithBalance = expensesList.map(e => {
        runningBalance -= parseFloat(e.amount) || 0;
        return {
          ...e,
          dateFormatted: e.date ? new Date(e.date).toLocaleDateString('en-IN') : '-',
          amount: parseFloat(e.amount) || 0,
          runningBalance
        };
      });

      const reportData = {
        pastorateName: pastorate.pastorateName,
        month,
        year: year.year,
        openingBalance,
        churchOffertories: churchOffertorisWithBalance,
        churchOffertoryTotal,
        receipts: receiptsWithBalance,
        receiptsTotal,
        expenses: expensesWithBalance,
        expensesTotal,
        totalReceiptsWithOpening: openingBalance + churchOffertoryTotal + receiptsTotal,
        finalBalance: runningBalance
      };

      const result = await window.electron.pcCashBook.generatePDF(reportData);
      if (result.success) {
        toast.success('PDF generated!');
      } else {
        toast.error(result.message || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // DataTable setup
  useEffect(() => {
    if (expensesDataTableRef.current) expensesDataTableRef.current.destroy();
    if (expensesTableRef.current) {
      expensesDataTableRef.current = $(expensesTableRef.current).DataTable({
        data: expenses,
        columns: [
          { data: 'vno', title: 'VNo' },
          { data: 'date', title: 'Date', render: (data) => data ? new Date(data).toLocaleDateString('en-IN') : '-' },
          { data: 'expenseDetails', title: 'Expense Details' },
          { data: 'amount', title: 'Amount', render: (data) => `₹${parseFloat(data).toFixed(2)}` },
          {
            data: null, title: 'Actions', orderable: false, render: (data, type, row) => `
              <div class="pccb-action-icons">
                <button class="pccb-icon-btn pccb-edit-btn" data-id="${row.id}" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
                </button>
                <button class="pccb-icon-btn pccb-delete-btn" data-id="${row.id}" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                </button>
                <button class="pccb-icon-btn pccb-history-btn" data-id="${row.id}" title="History">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm-8-48A95.44,95.44,0,0,0,60.08,60.15C52.81,67.51,46.35,74.59,40,82V64a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H72a8,8,0,0,0,0-16H49c7.15-8.42,14.27-16.35,22.39-24.57a80,80,0,1,1,1.66,114.75,8,8,0,1,0-11,11.64A96,96,0,1,0,128,32Z"></path></svg>
                </button>
              </div>`
          }
        ],
        pageLength: 10,
        order: [[0, 'asc']],
        language: { emptyTable: 'No expenses this month' },
        destroy: true
      });

      $(expensesTableRef.current).off('click')
        .on('click', '.pccb-edit-btn', function () {
          const e = expenses.find(x => x.id == $(this).data('id'));
          if (e) openEditModal(e);
        })
        .on('click', '.pccb-delete-btn', function () {
          const e = expenses.find(x => x.id == $(this).data('id'));
          if (e) openDeleteModal(e);
        })
        .on('click', '.pccb-history-btn', function () {
          const e = expenses.find(x => x.id == $(this).data('id'));
          if (e) openHistoryModal(e);
        });
    }
  }, [expenses]);

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
            <div className="pccb-title-row">
              <h1 className="book-title">PC Cash Book - {pastorate?.pastorateShortName} ({year.year} - {month})</h1>
              <div className="pccb-title-buttons">
                <button 
                  className="pccb-report-btn"
                  onClick={() => navigate('/books/pc-cash-book-report', { state: { pastorate, year, month } })}
                >
                  PC Cash Book
                </button>
                <button 
                  className="pccb-print-btn"
                  onClick={handlePrintPDF}
                >
                  <Printer size={18} /> Print PC Cash Book
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="pccb-stats-section">
              <div className="pccb-stat-card pccb-income-card">
                <div className="pccb-stat-icon"><ArrowUp size={28} weight="duotone" /></div>
                <div className="pccb-stat-content">
                  <p className="pccb-stat-label">Total Income</p>
                  <h3 className="pccb-stat-value">₹{totalIncome.toFixed(2)}</h3>
                </div>
              </div>
              <div className="pccb-stat-card pccb-expense-card">
                <div className="pccb-stat-icon pccb-expense-icon"><ArrowDown size={28} weight="duotone" /></div>
                <div className="pccb-stat-content">
                  <p className="pccb-stat-label">Total Expenses</p>
                  <h3 className="pccb-stat-value pccb-expense-value">₹{totalExpenses.toFixed(2)}</h3>
                </div>
              </div>
              <div className="pccb-stat-card">
                <div className="pccb-stat-icon"><Wallet size={28} weight="duotone" /></div>
                <div className="pccb-stat-content">
                  <p className="pccb-stat-label">Balance</p>
                  <h3 className={`pccb-stat-value ${balance < 0 ? 'pccb-negative' : ''}`}>₹{balance.toFixed(2)}</h3>
                </div>
              </div>
              <div 
                className={`pccb-stat-card ${isAprilMonth ? 'pccb-clickable' : ''}`}
                onClick={openOpeningBalanceModal}
                title={isAprilMonth ? 'Click to edit opening balance' : 'Opening balance can only be edited in April'}
              >
                <div className="pccb-stat-icon"><CurrencyDollar size={28} weight="duotone" /></div>
                <div className="pccb-stat-content">
                  <p className="pccb-stat-label">Opening Balance {isAprilMonth && <span className="pccb-edit-hint">(Click to edit)</span>}</p>
                  <h3 className="pccb-stat-value">₹{openingBalance.toFixed(2)}</h3>
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="pccb-tables-section">
              <div className="pccb-table-container">
                <div className="pccb-table-header">
                  <h2 className="pccb-table-title">Expenses - {month}</h2>
                  <div className="pccb-table-actions">
                    <button onClick={openAddModal} className="pccb-action-btn">
                      <Plus size={18} /> Add Expense
                    </button>
                  </div>
                </div>
                <div className="pccb-table-wrapper">
                  <table ref={expensesTableRef} className="display" style={{ width: '100%' }}></table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={isAddModalOpen} onRequestClose={() => setIsAddModalOpen(false)} className="pccb-modal" overlayClassName="pccb-modal-overlay">
        <div className="pccb-modal-header">
          <h2>Add Expense</h2>
          <button onClick={() => setIsAddModalOpen(false)} className="pccb-modal-close">&times;</button>
        </div>
        <form onSubmit={handleAddSubmit} className="pccb-modal-form">
          <div className="pccb-form-group">
            <label>VNo *</label>
            <input
              type="text"
              value={expenseForm.vno}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, vno: e.target.value }))}
              required
            />
          </div>
          <div className="pccb-form-group">
            <label>Date *</label>
            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className="pccb-form-group">
            <label>Expense Details *</label>
            <input
              type="text"
              value={expenseForm.expenseDetails}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDetails: e.target.value }))}
              placeholder="Enter expense details"
              required
            />
          </div>
          <div className="pccb-form-group">
            <label>Amount *</label>
            <input
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              required
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
            />
          </div>
          <div className="pccb-form-actions">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="pccb-cancel-btn">Cancel</button>
            <button type="submit" className="pccb-submit-btn">Save</button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className="pccb-modal" overlayClassName="pccb-modal-overlay">
        <div className="pccb-modal-header">
          <h2>Edit Expense</h2>
          <button onClick={() => setIsEditModalOpen(false)} className="pccb-modal-close">&times;</button>
        </div>
        <form onSubmit={handleEditSubmit} className="pccb-modal-form">
          <div className="pccb-form-group">
            <label>VNo *</label>
            <input
              type="text"
              value={expenseForm.vno}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, vno: e.target.value }))}
              required
            />
          </div>
          <div className="pccb-form-group">
            <label>Date *</label>
            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className="pccb-form-group">
            <label>Expense Details *</label>
            <input
              type="text"
              value={expenseForm.expenseDetails}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDetails: e.target.value }))}
              placeholder="Enter expense details"
              required
            />
          </div>
          <div className="pccb-form-group">
            <label>Amount *</label>
            <input
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              required
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
            />
          </div>
          <div className="pccb-form-actions">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="pccb-cancel-btn">Cancel</button>
            <button type="submit" className="pccb-submit-btn">Update</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onRequestClose={() => setIsDeleteModalOpen(false)} className="pccb-modal pccb-delete-modal" overlayClassName="pccb-modal-overlay">
        <div className="pccb-modal-header pccb-delete-header">
          <h2>Confirm Delete</h2>
          <button onClick={() => setIsDeleteModalOpen(false)} className="pccb-modal-close">&times;</button>
        </div>
        <div className="pccb-delete-content">
          <p>Are you sure you want to delete this expense?</p>
          {deleteTarget && (
            <div className="pccb-delete-info">
              <p><strong>VNo:</strong> {deleteTarget.vno}</p>
              <p><strong>Details:</strong> {deleteTarget.expenseDetails}</p>
              <p><strong>Amount:</strong> ₹{parseFloat(deleteTarget.amount).toFixed(2)}</p>
            </div>
          )}
          <div className="pccb-form-actions">
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="pccb-cancel-btn">Cancel</button>
            <button type="button" onClick={handleConfirmDelete} className="pccb-delete-confirm-btn">Delete</button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onRequestClose={() => setIsHistoryModalOpen(false)} className="pccb-modal pccb-history-modal" overlayClassName="pccb-modal-overlay">
        <div className="pccb-modal-header">
          <h2>Edit History</h2>
          <button onClick={() => setIsHistoryModalOpen(false)} className="pccb-modal-close">&times;</button>
        </div>
        <div className="pccb-history-content">
          {historyItem?.editHistory?.length > 0 ? (
            <div className="pccb-history-list">
              {[...historyItem.editHistory].reverse().map((c, i) => (
                <div key={i} className="pccb-history-item">
                  <strong>{c.field}:</strong> <span className="pccb-old-val">{c.oldValue}</span> → <span className="pccb-new-val">{c.newValue}</span>
                  <div className="pccb-history-time">{formatHistoryDate(c.timestamp)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="pccb-no-history">No edit history.</p>
          )}
          <div className="pccb-form-actions">
            <button onClick={() => setIsHistoryModalOpen(false)} className="pccb-cancel-btn">Close</button>
          </div>
        </div>
      </Modal>

      {/* Opening Balance Modal */}
      <Modal isOpen={isOpeningBalanceModalOpen} onRequestClose={() => setIsOpeningBalanceModalOpen(false)} className="pccb-modal" overlayClassName="pccb-modal-overlay">
        <div className="pccb-modal-header">
          <h2>Edit Opening Balance</h2>
          <button onClick={() => setIsOpeningBalanceModalOpen(false)} className="pccb-modal-close">&times;</button>
        </div>
        <form onSubmit={handleOpeningBalanceSubmit} className="pccb-modal-form">
          <div className="pccb-form-group">
            <label>Opening Balance for {year?.year} *</label>
            <input
              type="number"
              value={openingBalanceForm}
              onChange={(e) => setOpeningBalanceForm(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Enter opening balance"
            />
          </div>
          <div className="pccb-form-actions">
            <button type="button" onClick={() => setIsOpeningBalanceModalOpen(false)} className="pccb-cancel-btn">Cancel</button>
            <button type="submit" className="pccb-submit-btn">Save</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default PCCashBook;
