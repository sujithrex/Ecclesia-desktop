import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, Trash } from '@phosphor-icons/react';
import './HarvestFestivalBulkEntry.css';

const HarvestFestivalBulkEntry = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;
  const passedMembers = location.state?.members || [];
  const passedChurches = location.state?.churches || [];

  const [members, setMembers] = useState([]);
  const [churches, setChurches] = useState([]);
  const [selectedHfChurchId, setSelectedHfChurchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([
    { id: 1, memberId: '', name: '', auctionAmount: '', initialPayment: '', searchTerm: '' },
    { id: 2, memberId: '', name: '', auctionAmount: '', initialPayment: '', searchTerm: '' },
    { id: 3, memberId: '', name: '', auctionAmount: '', initialPayment: '', searchTerm: '' },
    { id: 4, memberId: '', name: '', auctionAmount: '', initialPayment: '', searchTerm: '' },
    { id: 5, memberId: '', name: '', auctionAmount: '', initialPayment: '', searchTerm: '' }
  ]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});

  const handleLogout = () => { logout(); navigate('/login'); };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    ...(year ? [{ label: year.year, path: '/year-books', state: { pastorate, year } }] : []),
    ...(month ? [{ label: month, path: '/month-books', state: { pastorate, year, month } }] : []),
    { label: 'Harvest Festival', path: '/books/harvest-festival-note', state: { pastorate, year, month } },
    { label: 'Bulk Entry' }
  ];

  useEffect(() => {
    if (!pastorate || !year) { navigate('/dashboard'); return; }
    if (passedMembers.length > 0) { setMembers(passedMembers); }
    else { loadMembers(); }
    if (passedChurches.length > 0) { setChurches(passedChurches); }
    else { loadChurches(); }
  }, [pastorate, year]);

  const loadChurches = async () => {
    try {
      const result = await window.electron.church.getAll();
      if (result.success && result.data) {
        const pastorateChurches = result.data.filter(c => c.pastorateName === pastorate.pastorateName);
        setChurches(pastorateChurches);
      }
    } catch (error) { console.error('Failed to load churches:', error); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null) {
        const ref = dropdownRefs.current[activeDropdown];
        if (ref && !ref.contains(event.target)) {
          setActiveDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const getFilteredMembers = (searchTerm) => {
    return members.filter(m => m.displayName.toLowerCase().includes((searchTerm || '').toLowerCase()));
  };

  const loadMembers = async () => {
    try {
      const result = await window.electron.member.getAll();
      if (result.success && result.data) {
        const membersWithDetails = await Promise.all(result.data.map(async (member) => {
          let familyName = '', churchName = '';
          if (member.familyId) {
            const familyResult = await window.electron.family.getById(member.familyId);
            if (familyResult.success && familyResult.data) {
              familyName = familyResult.data.familyName;
              if (familyResult.data.areaId) {
                const areaResult = await window.electron.area.getById(familyResult.data.areaId);
                if (areaResult.success && areaResult.data && areaResult.data.churchId) {
                  const churchResult = await window.electron.church.getById(areaResult.data.churchId);
                  if (churchResult.success) churchName = churchResult.data.churchName;
                }
              }
            }
          }
          return { id: member.id, name: member.name, displayName: `${member.name} - ${familyName} - ${churchName}` };
        }));
        setMembers(membersWithDetails);
      }
    } catch (error) { console.error('Failed to load members:', error); }
  };

  const totalAmount = rows.reduce((sum, row) => sum + (parseFloat(row.auctionAmount) || 0), 0);

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        if (field === 'searchTerm') {
          return { ...row, searchTerm: value };
        }
        if (field === 'memberId') {
          const member = members.find(m => m.id === parseInt(value));
          return { ...row, memberId: value, name: member?.displayName || '', searchTerm: '' };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleMemberSelect = (rowId, member) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, memberId: member.id, name: member.displayName, searchTerm: '' };
      }
      return row;
    }));
    setActiveDropdown(null);
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: Date.now(), memberId: '', name: '', auctionAmount: '', initialPayment: '', searchTerm: '' }]);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) { toast.error('At least one row required'); return; }
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    if (!selectedHfChurchId) { toast.error('Please select HF Church'); return; }
    if (!selectedDate) { toast.error('Please select date'); return; }
    const validRows = rows.filter(row => row.memberId && row.auctionAmount);
    if (validRows.length === 0) { toast.error('Please fill at least one complete entry'); return; }

    try {
      setIsLoading(true);
      for (const row of validRows) {
        const data = {
          pastorateName: pastorate.pastorateName,
          year: year.year,
          memberId: row.memberId,
          name: row.name,
          auctionAmount: parseFloat(row.auctionAmount),
          initialPayment: parseFloat(row.initialPayment) || 0,
          hfChurchId: parseInt(selectedHfChurchId),
          date: selectedDate
        };
        await window.electron.harvestFestival.createBaseEntry(data);
      }
      toast.success(`${validRows.length} entries created!`);
      navigate('/books/harvest-festival-note', { state: { pastorate, year, month } });
    } catch (error) {
      toast.error('Failed to save entries');
    } finally {
      setIsLoading(false);
    }
  };

  if (!pastorate || !year) return null;

  return (
    <>
      <TitleBar /><StatusBar />
      {isLoading && <LoadingScreen message="Saving..." />}
      <div className="hf-bulk-container">
        <header className="hf-bulk-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/books/harvest-festival-note', { state: { pastorate, year, month } })} className="back-btn">Back</button>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </header>

        <main className="hf-bulk-main">
          <div className="hf-bulk-content">
            <div className="hf-bulk-top">
              <h1 className="page-title">Bulk Entry - Harvest Festival ({year.year})</h1>
              <div className="hf-church-select">
                <label>HF Church *</label>
                <select value={selectedHfChurchId} onChange={(e) => setSelectedHfChurchId(e.target.value)} required>
                  <option value="">Select HF Church</option>
                  {churches.map(c => <option key={c.id} value={c.id}>{c.churchName}</option>)}
                </select>
              </div>
              <div className="hf-date-select">
                <label>Date *</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
              </div>
              <div className="hf-total-card">
                <span className="hf-total-label">Total Amount:</span>
                <span className="hf-total-value">₹{totalAmount.toFixed(2)}</span>
              </div>
              <button onClick={handleSave} className="hf-save-btn">Save All Entries</button>
            </div>

            <div className="hf-bulk-table-wrapper">
              <table className="hf-bulk-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ஏலத்தொகை</th>
                    <th>உடன் வரவு</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="hf-bulk-dropdown" ref={el => dropdownRefs.current[row.id] = el}>
                          <input 
                            type="text" 
                            value={row.searchTerm || row.name} 
                            onChange={(e) => { handleRowChange(row.id, 'searchTerm', e.target.value); setActiveDropdown(row.id); }}
                            onFocus={() => setActiveDropdown(row.id)}
                            placeholder="Type to search member..."
                            className="hf-input"
                          />
                          {activeDropdown === row.id && (
                            <div className="hf-bulk-dropdown-list">
                              {getFilteredMembers(row.searchTerm).length > 0 ? 
                                getFilteredMembers(row.searchTerm).slice(0, 10).map(m => (
                                  <div key={m.id} className="hf-bulk-dropdown-item" onClick={() => handleMemberSelect(row.id, m)}>
                                    {m.displayName}
                                  </div>
                                )) : <div className="hf-bulk-dropdown-empty">No members found</div>
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <input type="number" value={row.auctionAmount} onChange={(e) => handleRowChange(row.id, 'auctionAmount', e.target.value)} placeholder="0.00" step="0.01" min="0" className="hf-input" />
                      </td>
                      <td>
                        <input type="number" value={row.initialPayment} onChange={(e) => handleRowChange(row.id, 'initialPayment', e.target.value)} placeholder="0.00" step="0.01" min="0" className="hf-input" />
                      </td>
                      <td>
                        <button onClick={() => removeRow(row.id)} className="hf-remove-btn"><Trash size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="hf-add-row-btn"><Plus size={20} /> Add Row</button>
          </div>
        </main>
      </div>
    </>
  );
};

export default HarvestFestivalBulkEntry;
