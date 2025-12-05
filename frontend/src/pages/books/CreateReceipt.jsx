import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, Trash } from '@phosphor-icons/react';
import './CreateReceipt.css';

const CreateReceipt = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [lastReceiptNumber, setLastReceiptNumber] = useState('0001');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [receiptRows, setReceiptRows] = useState([
    { id: 1, receiptNo: '0001', date: new Date().toISOString().split('T')[0], name: '', memberId: null, category: '', amount: '' },
    { id: 2, receiptNo: '0002', date: new Date().toISOString().split('T')[0], name: '', memberId: null, category: '', amount: '' },
    { id: 3, receiptNo: '0003', date: new Date().toISOString().split('T')[0], name: '', memberId: null, category: '', amount: '' }
  ]);

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
    { label: 'Receipt Note', path: '/books/receipt-note', state: { pastorate, year, month } },
    { label: 'Create Receipt' }
  ];

  useEffect(() => {
    if (!pastorate) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [pastorate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load categories
      const storedCategories = localStorage.getItem(`categories_${pastorate.pastorateName}`);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }

      // Load members from database
      try {
        const result = await window.electron.member.getAll();
        if (result.success && result.data) {
          // Transform members to include area information
          const membersWithArea = await Promise.all(
            result.data.map(async (member) => {
              // Get family to get area
              if (member.familyId) {
                const familyResult = await window.electron.family.getById(member.familyId);
                if (familyResult.success && familyResult.data) {
                  const family = familyResult.data;
                  // Get area
                  if (family.areaId) {
                    const areaResult = await window.electron.area.getById(family.areaId);
                    if (areaResult.success && areaResult.data) {
                      return {
                        id: member.id,
                        name: `${member.respect || ''}. ${member.name}`.trim(),
                        area: areaResult.data.areaName
                      };
                    }
                  }
                }
              }
              return {
                id: member.id,
                name: `${member.respect || ''}. ${member.name}`.trim(),
                area: 'Unknown Area'
              };
            })
          );
          setMembers(membersWithArea);
        }
      } catch (error) {
        console.error('Failed to load members:', error);
        // Fallback to empty array
        setMembers([]);
      }

      // Load last receipt number from database
      try {
        const result = await window.electron.receipt.getNextNumber(
          pastorate.pastorateName,
          year?.year,
          month
        );
        if (result.success) {
          const nextNo = result.data.toString().padStart(4, '0');
          setLastReceiptNumber(nextNo);
          updateReceiptNumbers(nextNo);
        }
      } catch (error) {
        console.error('Failed to load receipt number:', error);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReceiptNumbers = (startNumber) => {
    const startNum = parseInt(startNumber);
    setReceiptRows(prev => prev.map((row, index) => ({
      ...row,
      receiptNo: (startNum + index).toString().padStart(4, '0')
    })));
  };

  const handleLastReceiptNumberChange = (e) => {
    const value = e.target.value.padStart(4, '0');
    setLastReceiptNumber(value);
    updateReceiptNumbers(value);
  };

  const handleRowChange = (id, field, value) => {
    setReceiptRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleMemberSelect = (id, member) => {
    setReceiptRows(prev => prev.map(row => 
      row.id === id ? { 
        ...row, 
        name: `${member.name} - ${member.area}`,
        memberId: member.id 
      } : row
    ));
  };

  const addRow = () => {
    const lastRow = receiptRows[receiptRows.length - 1];
    const nextReceiptNo = (parseInt(lastRow.receiptNo) + 1).toString().padStart(4, '0');
    
    const newRow = {
      id: Date.now(),
      receiptNo: nextReceiptNo,
      date: new Date().toISOString().split('T')[0],
      name: '',
      memberId: null,
      category: '',
      amount: ''
    };
    
    setReceiptRows(prev => [...prev, newRow]);
  };

  const removeRow = (id) => {
    if (receiptRows.length <= 1) {
      toast.error('At least one receipt row is required');
      return;
    }
    setReceiptRows(prev => prev.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    // Validate
    const validRows = receiptRows.filter(row => 
      row.name && row.category && row.amount
    );

    if (validRows.length === 0) {
      toast.error('Please fill at least one complete receipt');
      return;
    }

    try {
      setIsLoading(true);

      // Save receipts to database
      for (const row of validRows) {
        const receiptData = {
          pastorateName: pastorate.pastorateName,
          year: year?.year,
          month: month,
          receiptNo: parseInt(row.receiptNo),
          date: row.date,
          name: row.name.split(' - ')[0], // Extract just the name
          area: row.name.split(' - ')[1] || '', // Extract area
          memberId: row.memberId,
          category: row.category,
          amount: parseFloat(row.amount)
        };

        const result = await window.electron.receipt.create(receiptData);
        if (!result.success) {
          throw new Error('Failed to create receipt');
        }
      }

      toast.success(`${validRows.length} receipt(s) created successfully!`);
      navigate('/books/receipt-note', { state: { pastorate, year, month } });
    } catch (error) {
      toast.error('Failed to save receipts');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pastorate) {
    return null;
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message="Loading..." />}
      <div className="create-receipt-container">
        <header className="create-receipt-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/books/receipt-note', { state: { pastorate, year, month } })} className="back-btn">
                Back
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="create-receipt-main">
          <div className="create-receipt-content">
            <h1 className="page-title">Create Receipt - {pastorate?.pastorateShortName || 'Pastorate'}{month ? ` (${month} ${year?.year || ''})` : ''}</h1>

            {/* Last Receipt Number */}
            <div className="last-receipt-section">
              <label htmlFor="lastReceiptNo">Last Receipt Number:</label>
              <input
                type="text"
                id="lastReceiptNo"
                value={lastReceiptNumber}
                onChange={handleLastReceiptNumberChange}
                maxLength="4"
                className="last-receipt-input"
              />
            </div>

            {/* Receipt Canvas */}
            <div className="receipt-canvas">
              <h2 className="canvas-title">Receipt Entries</h2>
              
              <div className="receipt-table-wrapper">
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            value={row.receiptNo}
                            readOnly
                            className="receipt-input readonly"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                            className="receipt-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                            placeholder="Type member name..."
                            className="receipt-input"
                            list={`members-${row.id}`}
                          />
                          <datalist id={`members-${row.id}`}>
                            {members.map(member => (
                              <option 
                                key={member.id} 
                                value={`${member.name} - ${member.area}`}
                              />
                            ))}
                          </datalist>
                        </td>
                        <td>
                          <select
                            value={row.category}
                            onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                            className="receipt-input"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="receipt-input"
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => removeRow(row.id)}
                            className="remove-row-btn"
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

              <div className="canvas-actions">
                <button onClick={addRow} className="add-row-btn">
                  <Plus size={20} weight="bold" />
                  Add Row
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="save-section">
              <button onClick={handleSave} className="save-btn">
                Save Receipts
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateReceipt;
