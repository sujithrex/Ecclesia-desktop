import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, Trash } from '@phosphor-icons/react';
import './PaySangam.css';

const PaySangam = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [lastReceiptNumber, setLastReceiptNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [churches, setChurches] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  
  // Global selections (like HF Bulk Entry)
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [selectedServiceDate, setSelectedServiceDate] = useState('');
  
  const [sangamRows, setSangamRows] = useState([
    { id: 1, receiptNo: 1, date: new Date().toISOString().split('T')[0], memberName: '', familyName: '', amount: '', showMemberDropdown: false, showFamilyDropdown: false, memberSearchTerm: '', familySearchTerm: '', isFreetextMember: false },
    { id: 2, receiptNo: 2, date: new Date().toISOString().split('T')[0], memberName: '', familyName: '', amount: '', showMemberDropdown: false, showFamilyDropdown: false, memberSearchTerm: '', familySearchTerm: '', isFreetextMember: false },
    { id: 3, receiptNo: 3, date: new Date().toISOString().split('T')[0], memberName: '', familyName: '', amount: '', showMemberDropdown: false, showFamilyDropdown: false, memberSearchTerm: '', familySearchTerm: '', isFreetextMember: false }
  ]);

  const memberDropdownRefs = useRef({});
  const familyDropdownRefs = useRef({});

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
    { label: 'Sangam Note', path: '/books/sangam-note', state: { pastorate, year, month } },
    { label: 'Pay Sangam' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      setSangamRows(prev => prev.map(row => {
        let updates = {};
        if (memberDropdownRefs.current[row.id] && !memberDropdownRefs.current[row.id].contains(event.target)) {
          updates.showMemberDropdown = false;
        }
        if (familyDropdownRefs.current[row.id] && !familyDropdownRefs.current[row.id].contains(event.target)) {
          updates.showFamilyDropdown = false;
        }
        return Object.keys(updates).length > 0 ? { ...row, ...updates } : row;
      }));
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!pastorate || !year || !month) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [pastorate, year, month]);

  // Load services when church is selected
  useEffect(() => {
    if (selectedChurchId) {
      loadServicesForChurch(parseInt(selectedChurchId));
    } else {
      setAvailableServices([]);
      setSelectedServiceDate('');
    }
  }, [selectedChurchId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load churches for this pastorate
      const churchResult = await window.electron.church.getAll();
      if (churchResult.success && churchResult.data) {
        const pastorateChurches = churchResult.data.filter(c => c.pastorateName === pastorate.pastorateName);
        setChurches(pastorateChurches);
      }

      // Load members with family info
      const memberResult = await window.electron.member.getAll();
      if (memberResult.success && memberResult.data) {
        const membersWithDetails = await Promise.all(memberResult.data.map(async (member) => {
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
            familyName
          };
        }));
        setMembers(membersWithDetails);
      }

      // Load all families for dropdown
      const familyResult = await window.electron.family.getAll();
      if (familyResult.success && familyResult.data) {
        setFamilies(familyResult.data.map(f => ({ id: f.id, name: f.familyName })));
      }

      // Load all sangam payments for this year to calculate previous paid (year total, not month)
      const paymentsResult = await window.electron.sangam.getPaymentsByYear(pastorate.pastorateName, year.year);
      if (paymentsResult.success) {
        setAllPayments(paymentsResult.data || []);
      }

      // Load next receipt number
      const receiptResult = await window.electron.sangam.getNextReceiptNumber(pastorate.pastorateName, year.year, month);
      if (receiptResult.success) {
        const nextNo = receiptResult.data;
        setLastReceiptNumber(nextNo);
        updateReceiptNumbers(nextNo);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load services for a specific church from Church Offertory
  const loadServicesForChurch = async (churchId) => {
    if (!pastorate || !year || !month || !churchId) {
      setAvailableServices([]);
      return;
    }
    try {
      const result = await window.electron.churchOffertory.getByPastorateYearMonth(pastorate.pastorateName, year.year, month);
      if (result.success && result.data) {
        const churchOffertory = result.data.find(o => o.churchId === churchId);
        if (churchOffertory && churchOffertory.services) {
          const services = churchOffertory.services.map(s => s.date).sort();
          setAvailableServices(services);
          // Auto-select first service if available
          if (services.length > 0 && !selectedServiceDate) {
            setSelectedServiceDate(services[0]);
          }
        } else {
          setAvailableServices([]);
        }
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      setAvailableServices([]);
    }
  };

  // Calculate previously paid amount for a member
  const getPreviouslyPaid = (memberName) => {
    if (!memberName) return 0;
    return allPayments
      .filter(p => p.memberName.toLowerCase() === memberName.toLowerCase())
      .reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
  };

  const updateReceiptNumbers = (startNumber) => {
    const startNum = parseInt(startNumber);
    setSangamRows(prev => prev.map((row, index) => ({
      ...row,
      receiptNo: startNum + index
    })));
  };

  const handleLastReceiptNumberChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setLastReceiptNumber(value);
    updateReceiptNumbers(value);
  };

  const handleRowChange = (id, field, value) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Member dropdown handlers
  const handleMemberSearch = (id, searchTerm) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? {
        ...row,
        memberSearchTerm: searchTerm,
        memberName: searchTerm,
        showMemberDropdown: true,
        isFreetextMember: true,
        familyName: '',
        familySearchTerm: ''
      } : row
    ));
  };

  const handleMemberSelect = (id, member) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? {
        ...row,
        memberName: member.name,
        familyName: member.familyName,
        memberSearchTerm: member.name,
        familySearchTerm: member.familyName,
        showMemberDropdown: false,
        isFreetextMember: false
      } : row
    ));
  };

  const handleMemberFocus = (id) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? { ...row, showMemberDropdown: true } : row
    ));
  };

  // Family dropdown handlers
  const handleFamilySearch = (id, searchTerm) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? {
        ...row,
        familySearchTerm: searchTerm,
        familyName: searchTerm,
        showFamilyDropdown: true
      } : row
    ));
  };

  const handleFamilySelect = (id, family) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? {
        ...row,
        familyName: family.name,
        familySearchTerm: family.name,
        showFamilyDropdown: false
      } : row
    ));
  };

  const handleFamilyFocus = (id) => {
    setSangamRows(prev => prev.map(row =>
      row.id === id ? { ...row, showFamilyDropdown: true } : row
    ));
  };

  const getFilteredMembers = (searchTerm) => {
    if (!searchTerm) return members.slice(0, 10);
    return members.filter(m =>
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  };

  const getFilteredFamilies = (searchTerm) => {
    if (!searchTerm) return families.slice(0, 10);
    return families.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  };

  const addRow = () => {
    const lastRow = sangamRows[sangamRows.length - 1];
    const nextReceiptNo = lastRow.receiptNo + 1;

    const newRow = {
      id: Date.now(),
      receiptNo: nextReceiptNo,
      date: new Date().toISOString().split('T')[0],
      memberName: '',
      familyName: '',
      amount: '',
      showMemberDropdown: false,
      showFamilyDropdown: false,
      memberSearchTerm: '',
      familySearchTerm: '',
      isFreetextMember: false
    };

    setSangamRows(prev => [...prev, newRow]);
  };

  const removeRow = (id) => {
    if (sangamRows.length <= 1) {
      toast.error('At least one row is required');
      return;
    }
    setSangamRows(prev => prev.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    // Validate church and service selection
    if (!selectedChurchId) {
      toast.error('Please select a church');
      return;
    }
    if (!selectedServiceDate) {
      toast.error('Please select a service date');
      return;
    }

    const validRows = sangamRows.filter(row =>
      row.memberName && row.amount && parseInt(row.amount) > 0
    );

    if (validRows.length === 0) {
      toast.error('Please fill at least one complete entry');
      return;
    }

    try {
      setIsLoading(true);

      for (const row of validRows) {
        const paymentData = {
          pastorateName: pastorate.pastorateName,
          year: year.year,
          month: month,
          receiptNumber: row.receiptNo,
          memberName: row.memberName,
          familyName: row.familyName,
          amount: parseInt(row.amount),
          date: row.date,
          churchId: parseInt(selectedChurchId),
          serviceDate: selectedServiceDate
        };

        const result = await window.electron.sangam.createPayment(paymentData);
        if (!result.success) {
          throw new Error('Failed to create payment');
        }
      }

      toast.success(`${validRows.length} sangam payment(s) created!`);
      navigate('/books/sangam-note', { state: { pastorate, year, month } });
    } catch (error) {
      toast.error('Failed to save payments');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format service date for display
  const formatServiceDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (!pastorate || !year || !month) {
    return null;
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message="Loading..." />}
      <div className="sg-pay-container">
        <header className="sg-pay-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/books/sangam-note', { state: { pastorate, year, month } })} className="back-btn">
                Back
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="sg-pay-main">
          <div className="sg-pay-content">
            <h1 className="sg-pay-title">Pay Sangam - {pastorate?.pastorateShortName} ({month} {year?.year})</h1>

            {/* Global Selection Section */}
            <div className="sg-pay-global-section">
              <div className="sg-pay-global-row">
                <div className="sg-pay-global-item">
                  <label>Church *</label>
                  <select
                    value={selectedChurchId}
                    onChange={(e) => setSelectedChurchId(e.target.value)}
                    className="sg-pay-select"
                  >
                    <option value="">Select Church</option>
                    {churches.map(c => (
                      <option key={c.id} value={c.id}>{c.churchName}</option>
                    ))}
                  </select>
                </div>
                <div className="sg-pay-global-item">
                  <label>Service Date *</label>
                  {availableServices.length > 0 ? (
                    <select
                      value={selectedServiceDate}
                      onChange={(e) => setSelectedServiceDate(e.target.value)}
                      className="sg-pay-select"
                    >
                      <option value="">Select Service</option>
                      {availableServices.map(s => (
                        <option key={s} value={s}>{formatServiceDate(s)}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={selectedServiceDate}
                      onChange={(e) => setSelectedServiceDate(e.target.value)}
                      className="sg-pay-select"
                      placeholder="No services found"
                    />
                  )}
                </div>
                <div className="sg-pay-global-item">
                  <label>Starting Receipt No</label>
                  <input
                    type="number"
                    value={lastReceiptNumber}
                    onChange={handleLastReceiptNumberChange}
                    min="1"
                    className="sg-pay-receipt-input"
                  />
                </div>
              </div>
            </div>

            {/* Sangam Entry Canvas */}
            <div className="sg-pay-canvas">
              <h2 className="sg-pay-canvas-title">Sangam Entries</h2>

              <div className="sg-pay-table-wrapper">
                <table className="sg-pay-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Date</th>
                      <th>Member Name</th>
                      <th>Family Name</th>
                      <th>Amount</th>
                      <th>Previously Paid</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sangamRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            value={row.receiptNo}
                            readOnly
                            className="sg-pay-input sg-pay-readonly"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                            className="sg-pay-input"
                          />
                        </td>
                        <td>
                          <div className="sg-pay-dropdown-wrapper" ref={el => memberDropdownRefs.current[row.id] = el}>
                            <input
                              type="text"
                              value={row.memberSearchTerm}
                              onChange={(e) => handleMemberSearch(row.id, e.target.value)}
                              onFocus={() => handleMemberFocus(row.id)}
                              placeholder="Type member name..."
                              className="sg-pay-input"
                            />
                            {row.showMemberDropdown && (
                              <div className="sg-pay-dropdown-list">
                                {getFilteredMembers(row.memberSearchTerm).length > 0 ? (
                                  getFilteredMembers(row.memberSearchTerm).map(member => (
                                    <div
                                      key={member.id}
                                      className="sg-pay-dropdown-item"
                                      onClick={() => handleMemberSelect(row.id, member)}
                                    >
                                      {member.displayName}
                                    </div>
                                  ))
                                ) : (
                                  <div className="sg-pay-dropdown-empty">No members found (free text allowed)</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="sg-pay-dropdown-wrapper" ref={el => familyDropdownRefs.current[row.id] = el}>
                            <input
                              type="text"
                              value={row.familySearchTerm}
                              onChange={(e) => handleFamilySearch(row.id, e.target.value)}
                              onFocus={() => handleFamilyFocus(row.id)}
                              placeholder="Type family name..."
                              className="sg-pay-input"
                              disabled={!row.isFreetextMember && row.memberName}
                            />
                            {row.showFamilyDropdown && row.isFreetextMember && (
                              <div className="sg-pay-dropdown-list">
                                {getFilteredFamilies(row.familySearchTerm).length > 0 ? (
                                  getFilteredFamilies(row.familySearchTerm).map(family => (
                                    <div
                                      key={family.id}
                                      className="sg-pay-dropdown-item"
                                      onClick={() => handleFamilySelect(row.id, family)}
                                    >
                                      {family.name}
                                    </div>
                                  ))
                                ) : (
                                  <div className="sg-pay-dropdown-empty">No families found (free text allowed)</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                            placeholder="0"
                            min="1"
                            step="1"
                            className="sg-pay-input"
                          />
                        </td>
                        <td>
                          <div className="sg-pay-prev-paid">
                            ₹{getPreviouslyPaid(row.memberName)}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => removeRow(row.id)}
                            className="sg-pay-remove-btn"
                            title="Remove row"
                          >
                            <Trash size={18} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sg-pay-canvas-actions">
                <button onClick={addRow} className="sg-pay-add-btn">
                  <Plus size={20} weight="bold" />
                  Add Row
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="sg-pay-save-section">
              <button onClick={handleSave} className="sg-pay-save-btn">
                Save Sangam Payments
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PaySangam;
