import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from 'react-modal';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import './PCCashBookReport.css';

Modal.setAppElement('#root');

const PCCashBookReport = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [isLoading, setIsLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [churchOffertories, setChurchOffertories] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [churches, setChurches] = useState([]);
  const [categories, setCategories] = useState([]);

  // Toggle states
  const [expandedChurches, setExpandedChurches] = useState({});
  const [showReceipts, setShowReceipts] = useState(true);

  // Service detail popup
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedChurchName, setSelectedChurchName] = useState('');

  const financialYearMonths = ['April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'];

  const handleLogout = () => { logout(); navigate('/login'); };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    ...(year ? [{ label: year.year, path: '/year-books', state: { pastorate, year } }] : []),
    ...(month ? [{ label: month, path: '/month-books', state: { pastorate, year, month } }] : []),
    { label: 'PC Cash Book', path: '/books/pc-cash-book', state: { pastorate, year, month } },
    { label: 'Report' }
  ];

  const getMonthIncome = async (monthName) => {
    let total = 0;
    try {
      const receiptsResult = await window.electron.receipt.getByPastorateYearMonth(pastorate.pastorateName, year.year, monthName);
      if (receiptsResult.success) total += (receiptsResult.data || []).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

      const offertoryResult = await window.electron.churchOffertory.getByPastorateYearMonth(pastorate.pastorateName, year.year, monthName);
      if (offertoryResult.success) total += (offertoryResult.data || []).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    } catch (error) {
      console.error(`Failed to get income for ${monthName}:`, error);
    }
    return total;
  };

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
    if (!pastorate || !year || !month) return 0;
    try {
      const aprilBalanceResult = await window.electron.pcCashBook.getOpeningBalance(pastorate.pastorateName, year.year);
      const aprilOpeningBalance = aprilBalanceResult.success && aprilBalanceResult.data ? parseFloat(aprilBalanceResult.data.amount) || 0 : 0;

      if (month === 'April') return aprilOpeningBalance;

      const currentMonthIndex = financialYearMonths.indexOf(month);
      let calculatedBalance = aprilOpeningBalance;

      for (let i = 0; i < currentMonthIndex; i++) {
        const prevMonth = financialYearMonths[i];
        const monthIncome = await getMonthIncome(prevMonth);
        const monthExpenses = await getMonthExpenses(prevMonth);
        calculatedBalance += (monthIncome - monthExpenses);
      }
      return calculatedBalance;
    } catch (error) {
      console.error('Failed to load opening balance:', error);
      return 0;
    }
  };

  const loadData = async () => {
    if (!pastorate || !year || !month) return;
    setIsLoading(true);
    try {
      const ob = await loadOpeningBalance();
      setOpeningBalance(ob);

      // Load churches
      const churchesResult = await window.electron.church.getAll();
      if (churchesResult.success) {
        const pastorateChurches = (churchesResult.data || []).filter(c => c.pastorateName === pastorate.pastorateName);
        setChurches(pastorateChurches);
      }

      // Load categories from localStorage
      const storedCategories = localStorage.getItem(`offertory_categories_${pastorate.pastorateName}`);
      if (storedCategories) setCategories(JSON.parse(storedCategories));

      // Load church offertories
      const offertoryResult = await window.electron.churchOffertory.getByPastorateYearMonth(pastorate.pastorateName, year.year, month);
      if (offertoryResult.success) setChurchOffertories(offertoryResult.data || []);

      // Load receipts
      const receiptsResult = await window.electron.receipt.getByPastorateYearMonth(pastorate.pastorateName, year.year, month);
      if (receiptsResult.success) setReceipts(receiptsResult.data || []);

      // Load expenses
      const expensesResult = await window.electron.pcCashBook.getExpenses(pastorate.pastorateName, year.year, month);
      if (expensesResult.success) setExpenses(expensesResult.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!pastorate || !year || !month) { navigate('/dashboard'); return; }
    loadData();
  }, [pastorate, year, month]);

  // Get church data with offertories
  const getChurchOffertoryData = () => {
    return churches.map(church => {
      const offertory = churchOffertories.find(o => o.churchId === church.id);
      const totalAmount = offertory ? parseFloat(offertory.totalAmount) || 0 : 0;
      const services = offertory?.services || [];
      return { church, offertory, totalAmount, services };
    }).filter(c => c.totalAmount > 0);
  };

  const toggleChurch = (churchId) => {
    setExpandedChurches(prev => ({ ...prev, [churchId]: !prev[churchId] }));
  };

  const openServiceModal = (service, churchName) => {
    setSelectedService(service);
    setSelectedChurchName(churchName);
    setIsServiceModalOpen(true);
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === parseInt(categoryId));
    return cat ? cat.name : `Category ${categoryId}`;
  };

  // Calculate totals
  const churchOffertoryTotal = churchOffertories.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  const receiptsTotal = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalIncome = churchOffertoryTotal + receiptsTotal;
  const expensesTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const finalBalance = openingBalance + totalIncome - expensesTotal;

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '-';

  // Running balance calculation
  let runningBalance = openingBalance;
  let runningReceipts = openingBalance;
  let runningExpenses = 0;

  const churchData = getChurchOffertoryData();

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
      {isLoading && <LoadingScreen message="Loading Report..." />}
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
            <div className="pccbr-report-header">
              <h1 className="pccbr-title">Daily Cash Account Maintained by the Pastorate Chairman</h1>
              <p className="pccbr-subtitle">{pastorate?.pastorateName}</p>
              <p className="pccbr-period">For the month of {month} - {year?.year}</p>
            </div>

            <div className="pccbr-table-container">
              <table className="pccbr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Details</th>
                    <th>Receipts</th>
                    <th>Total (Receipts)</th>
                    <th>Expenses</th>
                    <th>Total (Expenses)</th>
                    <th>Daily Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance */}
                  <tr className="pccbr-opening-row">
                    <td>-</td>
                    <td>Opening Balance</td>
                    <td>₹{openingBalance.toFixed(2)}</td>
                    <td>₹{openingBalance.toFixed(2)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>₹{openingBalance.toFixed(2)}</td>
                  </tr>

                  {/* RECEIPTS Section Header */}
                  <tr className="pccbr-main-section-header">
                    <td colSpan="7">RECEIPTS</td>
                  </tr>

                  {/* Church Offertory Sub-Section */}
                  <tr className="pccbr-sub-section-header">
                    <td colSpan="2">Church Offertory</td>
                    <td></td>
                    <td className="pccbr-section-total">₹{churchOffertoryTotal.toFixed(2)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>

                  {churchData.map(({ church, services, totalAmount }) => {
                    const isExpanded = expandedChurches[church.id];
                    runningReceipts += totalAmount;
                    runningBalance = runningReceipts - runningExpenses;

                    return (
                      <React.Fragment key={`church-${church.id}`}>
                        {/* Church Row */}
                        <tr className="pccbr-church-row" onClick={() => toggleChurch(church.id)}>
                          <td>
                            <span className="pccbr-toggle-icon">
                              {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                            </span>
                          </td>
                          <td>{church.churchName}</td>
                          <td>₹{totalAmount.toFixed(2)}</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>₹{runningBalance.toFixed(2)}</td>
                        </tr>

                        {/* Service Date Rows (when expanded) */}
                        {isExpanded && services.map((service, idx) => (
                          <tr 
                            key={`service-${church.id}-${idx}`} 
                            className="pccbr-service-row"
                            onClick={() => openServiceModal(service, church.churchName)}
                          >
                            <td></td>
                            <td className="pccbr-service-date">↳ {formatDate(service.date)}</td>
                            <td>₹{(service.total || 0).toFixed(2)}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* Receipt Book Sub-Section */}
                  <tr className="pccbr-sub-section-header" onClick={() => setShowReceipts(!showReceipts)}>
                    <td colSpan="2">
                      <span className="pccbr-toggle-icon">{showReceipts ? <CaretDown size={14} /> : <CaretRight size={14} />}</span>
                      Receipt Book
                    </td>
                    <td></td>
                    <td className="pccbr-section-total">₹{receiptsTotal.toFixed(2)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>

                  {showReceipts && receipts.map((receipt, idx) => {
                    runningReceipts += parseFloat(receipt.amount) || 0;
                    runningBalance = runningReceipts - runningExpenses;
                    return (
                      <tr key={`rec-${idx}`} className="pccbr-data-row">
                        <td>{formatDate(receipt.date)}</td>
                        <td>Receipt #{receipt.receiptNo} - {receipt.name || 'N/A'}</td>
                        <td>₹{(parseFloat(receipt.amount) || 0).toFixed(2)}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>₹{runningBalance.toFixed(2)}</td>
                      </tr>
                    );
                  })}

                  {/* Receipts Total Row */}
                  <tr className="pccbr-receipts-total-row">
                    <td colSpan="2"><strong>Total Receipts</strong></td>
                    <td></td>
                    <td><strong>₹{(openingBalance + totalIncome).toFixed(2)}</strong></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* EXPENSES Section */}
                  <tr className="pccbr-main-section-header pccbr-expense-section">
                    <td colSpan="7">EXPENSES</td>
                  </tr>

                  {expenses.map((expense, idx) => {
                    runningExpenses += parseFloat(expense.amount) || 0;
                    runningBalance = runningReceipts - runningExpenses;
                    return (
                      <tr key={`exp-${idx}`} className="pccbr-data-row pccbr-expense-row">
                        <td>{formatDate(expense.date)}</td>
                        <td>VNo: {expense.vno} - {expense.expenseDetails}</td>
                        <td></td>
                        <td></td>
                        <td>₹{(parseFloat(expense.amount) || 0).toFixed(2)}</td>
                        <td></td>
                        <td>₹{runningBalance.toFixed(2)}</td>
                      </tr>
                    );
                  })}

                  {/* Expenses Total Row */}
                  <tr className="pccbr-expenses-total-row">
                    <td colSpan="2"><strong>Total Expenses</strong></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><strong>₹{expensesTotal.toFixed(2)}</strong></td>
                    <td></td>
                  </tr>

                  {/* Grand Total Row */}
                  <tr className="pccbr-total-row">
                    <td colSpan="2"><strong>GRAND TOTAL</strong></td>
                    <td></td>
                    <td><strong>₹{(openingBalance + totalIncome).toFixed(2)}</strong></td>
                    <td></td>
                    <td><strong>₹{expensesTotal.toFixed(2)}</strong></td>
                    <td><strong>₹{finalBalance.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Service Details Modal */}
      <Modal 
        isOpen={isServiceModalOpen} 
        onRequestClose={() => setIsServiceModalOpen(false)} 
        className="pccbr-modal" 
        overlayClassName="pccbr-modal-overlay"
      >
        <div className="pccbr-modal-header">
          <h2>Service Details - {selectedChurchName}</h2>
          <button onClick={() => setIsServiceModalOpen(false)} className="pccbr-modal-close">&times;</button>
        </div>
        <div className="pccbr-modal-content">
          {selectedService && (
            <>
              <p className="pccbr-service-date-title">Date: {formatDate(selectedService.date)}</p>
              <table className="pccbr-service-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedService.categoryAmounts && Object.entries(selectedService.categoryAmounts).map(([catId, amount]) => (
                    <tr key={catId}>
                      <td>{getCategoryName(catId)}</td>
                      <td>₹{(parseFloat(amount) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="pccbr-service-total">
                    <td><strong>Total</strong></td>
                    <td><strong>₹{(selectedService.total || 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
        <div className="pccbr-modal-footer">
          <button onClick={() => setIsServiceModalOpen(false)} className="pccbr-close-btn">Close</button>
        </div>
      </Modal>
    </>
  );
};

export default PCCashBookReport;
