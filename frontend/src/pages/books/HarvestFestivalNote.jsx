import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Gavel, CurrencyDollar, Wallet, CalendarCheck, Plus, PencilLine, Trash, ClockCounterClockwise, CreditCard, Eye } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './HarvestFestivalNote.css';

Modal.setAppElement('#root');

const HarvestFestivalNote = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;

  const [baseEntries, setBaseEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSingleEntryModalOpen, setIsSingleEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [addPaymentForm, setAddPaymentForm] = useState({ baseEntryId: '', amount: '', date: new Date().toISOString().split('T')[0], serviceDate: '' });
  const [availableServices, setAvailableServices] = useState([]);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const paymentDropdownRef = useRef(null);
  const [isMemberInfoModalOpen, setIsMemberInfoModalOpen] = useState(false);
  const [selectedMemberInfo, setSelectedMemberInfo] = useState(null);
  const [selectedBaseEntry, setSelectedBaseEntry] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState({ entry: null, payments: [] });
  const [historyItem, setHistoryItem] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [entryForm, setEntryForm] = useState({ memberId: '', name: '', auctionAmount: '', initialPayment: '', hfChurchId: '', date: new Date().toISOString().split('T')[0] });
  const [paymentForm, setPaymentForm] = useState({ baseEntryId: '', name: '', auctionAmount: '', amount: '', date: new Date().toISOString().split('T')[0], serviceDate: '' });
  const [selectedPaymentBaseEntry, setSelectedPaymentBaseEntry] = useState(null);
  const [churches, setChurches] = useState([]);

  const baseEntriesTableRef = useRef(null);
  const paymentsTableRef = useRef(null);
  const baseEntriesDataTableRef = useRef(null);
  const paymentsDataTableRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (entryDropdownRef.current && !entryDropdownRef.current.contains(event.target)) {
        setShowEntryDropdown(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
        setShowPaymentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBaseEntries = baseEntries.filter(e => 
    e.name.toLowerCase().includes(paymentSearchTerm.toLowerCase())
  );

  // Helper function to get month name from date
  const getMonthFromDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  // Helper function to get next Sunday from a date
  const getNextSunday = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    if (day === 0) return dateStr; // Already Sunday
    const daysUntilSunday = 7 - day;
    date.setDate(date.getDate() + daysUntilSunday);
    return date.toISOString().split('T')[0];
  };

  // Load services for a specific church
  const loadServicesForChurch = async (churchId) => {
    if (!pastorate || !year || !month || !churchId) return [];
    try {
      const result = await window.electron.churchOffertory.getByPastorateYearMonth(pastorate.pastorateName, year.year, month);
      if (result.success && result.data) {
        const churchOffertory = result.data.find(o => o.churchId === churchId);
        if (churchOffertory && churchOffertory.services) {
          return churchOffertory.services.map(s => s.date).sort();
        }
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
    return [];
  };

  // Update service date when date changes
  const updateServiceDateFromDate = async (dateStr, churchId, formSetter) => {
    const nextSunday = getNextSunday(dateStr);
    const services = await loadServicesForChurch(churchId);
    setAvailableServices(services);
    
    // Find the service date that matches or is closest after the selected date
    let serviceDate = nextSunday;
    if (services.length > 0) {
      const matchingService = services.find(s => s >= nextSunday);
      serviceDate = matchingService || services[services.length - 1];
    }
    
    formSetter(prev => ({ ...prev, serviceDate }));
  };

  const handleAddPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!addPaymentForm.baseEntryId) { toast.error('Please select a member'); return; }
    if (!addPaymentForm.date) { toast.error('Please select date'); return; }
    if (!addPaymentForm.serviceDate) { toast.error('Please select service date'); return; }
    const baseEntry = baseEntries.find(b => b.id === addPaymentForm.baseEntryId);
    const balance = parseFloat(baseEntry.auctionAmount) - parseFloat(baseEntry.totalPaid || 0);
    if (parseFloat(addPaymentForm.amount) > balance) { toast.error('Amount cannot exceed balance'); return; }
    try {
      setIsLoading(true);
      // Get month from the service date
      const paymentMonth = getMonthFromDate(addPaymentForm.serviceDate);
      const data = { 
        pastorateName: pastorate.pastorateName, 
        year: year.year, 
        month: paymentMonth, 
        baseEntryId: addPaymentForm.baseEntryId, 
        name: baseEntry.name, 
        auctionAmount: parseFloat(baseEntry.auctionAmount), 
        amount: parseFloat(addPaymentForm.amount), 
        date: addPaymentForm.date,
        serviceDate: addPaymentForm.serviceDate
      };
      const result = await window.electron.harvestFestival.createPayment(data);
      if (result.success) { 
        toast.success(`Payment added to ${paymentMonth}!`); 
        await Promise.all([loadBaseEntries(), loadPayments()]); 
        setIsAddPaymentModalOpen(false); 
        setAddPaymentForm({ baseEntryId: '', amount: '', date: new Date().toISOString().split('T')[0], serviceDate: '' }); 
        setPaymentSearchTerm(''); 
        setSelectedBaseEntry(null);
        setAvailableServices([]);
      }
      else toast.error('Failed to save payment');
    } catch (error) { toast.error('Failed to save payment'); } finally { setIsLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    ...(year ? [{ label: year.year, path: '/year-books', state: { pastorate, year } }] : []),
    ...(month ? [{ label: month, path: '/month-books', state: { pastorate, year, month } }] : []),
    { label: 'Harvest Festival Note' }
  ];

  // Searchable dropdown state
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [showEntryDropdown, setShowEntryDropdown] = useState(false);
  const entryDropdownRef = useRef(null);

  const filteredEntryMembers = members.filter(m => 
    m.displayName.toLowerCase().includes(entrySearchTerm.toLowerCase())
  );

  const stats = {
    totalAuctions: baseEntries.length,
    totalAmount: baseEntries.reduce((sum, e) => sum + (parseFloat(e.auctionAmount) || 0), 0),
    totalCollection: baseEntries.reduce((sum, e) => sum + (parseFloat(e.totalPaid) || 0), 0),
    thisMonthCollection: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  const loadChurches = async () => {
    try {
      const result = await window.electron.church.getAll();
      if (result.success && result.data) {
        // Filter churches by pastorate
        const pastorateChurches = result.data.filter(c => c.pastorateName === pastorate.pastorateName);
        setChurches(pastorateChurches);
      }
    } catch (error) { console.error('Failed to load churches:', error); }
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
          return { id: member.id, name: member.name, displayName: `${member.name} - ${familyName} - ${churchName}`, familyName, churchName, familyId: member.familyId };
        }));
        setMembers(membersWithDetails);
      }
    } catch (error) { console.error('Failed to load members:', error); }
  };

  const loadBaseEntries = async () => {
    if (!pastorate || !year) return;
    try {
      const result = await window.electron.harvestFestival.getBaseEntries(pastorate.pastorateName, year.year);
      if (result.success) setBaseEntries(result.data || []);
    } catch (error) { console.error('Failed to load base entries:', error); }
  };

  const loadPayments = async () => {
    if (!pastorate || !year || !month) return;
    try {
      const result = await window.electron.harvestFestival.getPayments(pastorate.pastorateName, year.year, month);
      if (result.success) setPayments(result.data || []);
    } catch (error) { console.error('Failed to load payments:', error); }
  };

  useEffect(() => {
    if (!pastorate || !year) {
      navigate('/dashboard');
      return;
    }
    setIsLoading(true);
    Promise.all([loadChurches(), loadMembers(), loadBaseEntries(), loadPayments()]).finally(() => setIsLoading(false));
  }, [pastorate, year, month]);

  const openSingleEntryModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setEntryForm({ memberId: entry.memberId || '', name: entry.name, auctionAmount: entry.auctionAmount, initialPayment: entry.initialPayment || '', hfChurchId: entry.hfChurchId || '', date: entry.date || new Date().toISOString().split('T')[0] });
    } else {
      setEditingEntry(null);
      setEntryForm({ memberId: '', name: '', auctionAmount: '', initialPayment: '', hfChurchId: '', date: new Date().toISOString().split('T')[0] });
    }
    setIsSingleEntryModalOpen(true);
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    if (!entryForm.hfChurchId) { toast.error('Please select HF Church'); return; }
    if (!entryForm.date) { toast.error('Please select date'); return; }
    try {
      setIsLoading(true);
      const data = { pastorateName: pastorate.pastorateName, year: year.year, memberId: entryForm.memberId, name: entryForm.name, auctionAmount: parseFloat(entryForm.auctionAmount), initialPayment: parseFloat(entryForm.initialPayment) || 0, hfChurchId: parseInt(entryForm.hfChurchId), date: entryForm.date };
      const result = editingEntry ? await window.electron.harvestFestival.updateBaseEntry(editingEntry.id, data) : await window.electron.harvestFestival.createBaseEntry(data);
      if (result.success) { toast.success(editingEntry ? 'Entry updated!' : 'Entry created!'); await loadBaseEntries(); setIsSingleEntryModalOpen(false); }
      else toast.error('Failed to save entry');
    } catch (error) { toast.error('Failed to save entry'); } finally { setIsLoading(false); }
  };

  const handleDeleteBaseEntry = async (entry) => {
    try {
      const result = await window.electron.harvestFestival.deleteBaseEntry(entry.id);
      if (result.success) { toast.success('Entry deleted!'); await loadBaseEntries(); }
    } catch (error) { toast.error('Failed to delete entry'); }
  };

  const openPaymentModal = async (baseEntry, payment = null) => {
    setSelectedPaymentBaseEntry(baseEntry);
    const today = new Date().toISOString().split('T')[0];
    
    // Load services for the base entry's church
    if (baseEntry.hfChurchId) {
      const services = await loadServicesForChurch(baseEntry.hfChurchId);
      setAvailableServices(services);
    }
    
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({ 
        baseEntryId: payment.baseEntryId, 
        name: payment.name, 
        auctionAmount: baseEntry?.auctionAmount || payment.auctionAmount, 
        amount: payment.amount, 
        date: payment.date || today,
        serviceDate: payment.serviceDate || ''
      });
    } else {
      setEditingPayment(null);
      const nextSunday = getNextSunday(today);
      setPaymentForm({ 
        baseEntryId: baseEntry.id, 
        name: baseEntry.name, 
        auctionAmount: baseEntry.auctionAmount, 
        amount: '', 
        date: today,
        serviceDate: nextSunday
      });
    }
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.date) { toast.error('Please select date'); return; }
    if (!paymentForm.serviceDate) { toast.error('Please select service date'); return; }
    // Balance validation
    if (selectedPaymentBaseEntry) {
      const balance = parseFloat(selectedPaymentBaseEntry.auctionAmount) - parseFloat(selectedPaymentBaseEntry.totalPaid || 0);
      const currentPaymentAmount = editingPayment ? parseFloat(editingPayment.amount) : 0;
      const availableBalance = balance + currentPaymentAmount;
      if (parseFloat(paymentForm.amount) > availableBalance) {
        toast.error('Amount cannot exceed balance');
        return;
      }
    }
    try {
      setIsLoading(true);
      // Get month from the service date
      const paymentMonth = getMonthFromDate(paymentForm.serviceDate);
      const data = { 
        pastorateName: pastorate.pastorateName, 
        year: year.year, 
        month: paymentMonth, 
        baseEntryId: paymentForm.baseEntryId, 
        name: paymentForm.name, 
        auctionAmount: parseFloat(paymentForm.auctionAmount), 
        amount: parseFloat(paymentForm.amount), 
        date: paymentForm.date,
        serviceDate: paymentForm.serviceDate
      };
      const result = editingPayment ? await window.electron.harvestFestival.updatePayment(editingPayment.id, data) : await window.electron.harvestFestival.createPayment(data);
      if (result.success) { 
        toast.success(editingPayment ? 'Payment updated!' : `Payment added to ${paymentMonth}!`); 
        await Promise.all([loadBaseEntries(), loadPayments()]); 
        setIsPaymentModalOpen(false); 
        setSelectedPaymentBaseEntry(null);
        setAvailableServices([]);
      }
      else toast.error('Failed to save payment');
    } catch (error) { toast.error('Failed to save payment'); } finally { setIsLoading(false); }
  };

  const handleDeletePayment = async (payment) => {
    try {
      const result = await window.electron.harvestFestival.deletePayment(payment.id);
      if (result.success) { toast.success('Payment deleted!'); await Promise.all([loadBaseEntries(), loadPayments()]); }
    } catch (error) { toast.error('Failed to delete payment'); }
  };

  const openHistoryModal = (item) => { setHistoryItem(item); setIsHistoryModalOpen(true); };
  const formatHistoryDate = (ts) => new Date(ts).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const handleMemberSelect = (e, formType) => {
    const memberId = e.target.value;
    const member = members.find(m => m.id === parseInt(memberId));
    if (formType === 'entry') setEntryForm(p => ({ ...p, memberId, name: member?.displayName || '' }));
    else setPaymentForm(p => ({ ...p, name: member?.displayName || '' }));
  };

  const showMemberInfo = (entry) => {
    const member = members.find(m => m.id === entry.memberId);
    setSelectedMemberInfo(member || { name: entry.name, familyName: 'N/A', churchName: 'N/A', familyId: null });
    setIsMemberInfoModalOpen(true);
  };

  const openSummaryModal = async (entry) => {
    try {
      const result = await window.electron.harvestFestival.getPaymentsByBaseEntry(entry.id);
      if (result.success) {
        setSummaryData({ entry, payments: result.data || [] });
        setIsSummaryModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to load payment summary:', error);
      toast.error('Failed to load payment summary');
    }
  };

  const getMemberNameOnly = (fullName) => {
    if (!fullName) return '';
    return fullName.split(' - ')[0];
  };

  useEffect(() => {
    if (paymentsDataTableRef.current) paymentsDataTableRef.current.destroy();
    if (paymentsTableRef.current) {
      paymentsDataTableRef.current = $(paymentsTableRef.current).DataTable({
        data: payments, columns: [
          { data: 'name', title: 'Name', render: (d, t, row) => `<span class="hf-name-link" data-id="${row.id}">${d.split(' - ')[0]}</span>` },
          { data: 'amount', title: 'Amount', render: (d) => `₹${parseFloat(d).toFixed(2)}` },
          { data: null, title: 'Actions', orderable: false, render: (d, t, row) => `<div class="hf-action-icons"><button class="hf-icon-btn edit" data-id="${row.id}" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg></button><button class="hf-icon-btn delete" data-id="${row.id}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg></button><button class="hf-icon-btn history" data-id="${row.id}" title="History"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm-8-48A95.44,95.44,0,0,0,60.08,60.15C52.81,67.51,46.35,74.59,40,82V64a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H72a8,8,0,0,0,0-16H49c7.15-8.42,14.27-16.35,22.39-24.57a80,80,0,1,1,1.66,114.75,8,8,0,1,0-11,11.64A96,96,0,1,0,128,32Z"></path></svg></button></div>` }
        ], pageLength: 10, order: [[0, 'asc']], language: { emptyTable: 'No payments this month' }, destroy: true
      });
      $(paymentsTableRef.current).off('click')
        .on('click', '.hf-name-link', function() { const p = payments.find(x => x.id == $(this).data('id')); if (p) { const b = baseEntries.find(x => x.id === p.baseEntryId); if (b) showMemberInfo(b); } })
        .on('click', '.edit', function() { const p = payments.find(x => x.id == $(this).data('id')); const b = baseEntries.find(x => x.id === p?.baseEntryId); if (p) openPaymentModal(b, p); })
        .on('click', '.delete', function() { const p = payments.find(x => x.id == $(this).data('id')); if (p) handleDeletePayment(p); })
        .on('click', '.history', function() { const p = payments.find(x => x.id == $(this).data('id')); if (p) openHistoryModal(p); });
    }
  }, [payments, baseEntries, members]);

  useEffect(() => {
    if (baseEntriesDataTableRef.current) baseEntriesDataTableRef.current.destroy();
    if (baseEntriesTableRef.current) {
      baseEntriesDataTableRef.current = $(baseEntriesTableRef.current).DataTable({
        data: baseEntries, columns: [
          { data: 'name', title: 'Name', render: (d, t, row) => `<span class="hf-name-link" data-id="${row.id}">${d.split(' - ')[0]}</span>` },
          { data: 'auctionAmount', title: 'Amount', render: (d) => `₹${parseFloat(d).toFixed(2)}` },
          { data: 'totalPaid', title: 'Total Paid', render: (d) => `₹${parseFloat(d || 0).toFixed(2)}` },
          { data: null, title: 'Balance', render: (d, t, row) => `₹${(parseFloat(row.auctionAmount) - parseFloat(row.totalPaid || 0)).toFixed(2)}` },
          { data: null, title: 'Actions', orderable: false, render: (d, t, row) => `<div class="hf-action-icons"><button class="hf-icon-btn summary" data-id="${row.id}" title="Summary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM48,136a8,8,0,0,1,8-8H200a8,8,0,0,1,0,16H56A8,8,0,0,1,48,136Zm0-32a8,8,0,0,1,8-8H200a8,8,0,0,1,0,16H56A8,8,0,0,1,48,104Zm0,64a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H56A8,8,0,0,1,48,168Z"></path></svg></button><button class="hf-icon-btn payment" data-id="${row.id}" title="Pay"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM64,104a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H72A8,8,0,0,1,64,104Zm0,32a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H72A8,8,0,0,1,64,136Z"></path></svg></button><button class="hf-icon-btn edit" data-id="${row.id}" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg></button><button class="hf-icon-btn delete" data-id="${row.id}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg></button><button class="hf-icon-btn history" data-id="${row.id}" title="History"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm-8-48A95.44,95.44,0,0,0,60.08,60.15C52.81,67.51,46.35,74.59,40,82V64a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H72a8,8,0,0,0,0-16H49c7.15-8.42,14.27-16.35,22.39-24.57a80,80,0,1,1,1.66,114.75,8,8,0,1,0-11,11.64A96,96,0,1,0,128,32Z"></path></svg></button></div>` }
        ], pageLength: 10, order: [[0, 'asc']], language: { emptyTable: 'No base entries' }, destroy: true
      });
      $(baseEntriesTableRef.current).off('click')
        .on('click', '.hf-name-link', function() { const e = baseEntries.find(x => x.id == $(this).data('id')); if (e) showMemberInfo(e); })
        .on('click', '.summary', function() { const e = baseEntries.find(x => x.id == $(this).data('id')); if (e) openSummaryModal(e); })
        .on('click', '.payment', function() { const e = baseEntries.find(x => x.id == $(this).data('id')); if (e) openPaymentModal(e); })
        .on('click', '.edit', function() { const e = baseEntries.find(x => x.id == $(this).data('id')); if (e) openSingleEntryModal(e); })
        .on('click', '.delete', function() { const e = baseEntries.find(x => x.id == $(this).data('id')); if (e) handleDeleteBaseEntry(e); })
        .on('click', '.history', function() { const e = baseEntries.find(x => x.id == $(this).data('id')); if (e) openHistoryModal(e); });
    }
  }, [baseEntries, members]);

  if (!pastorate || !year) {
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
        <header className="book-page-header"><div className="header-content"><Breadcrumb items={breadcrumbItems} /><div className="header-actions"><button onClick={() => navigate('/dashboard')} className="back-btn">Back</button><button onClick={handleLogout} className="logout-btn">Logout</button></div></div></header>
        <main className="book-page-main">
          <div className="book-page-content">
            <h1 className="book-title">Harvest Festival Note - {pastorate?.pastorateShortName} ({year.year})</h1>
            <div className="hf-stats-section">
              <div className="hf-stat-card"><div className="hf-stat-icon"><Gavel size={28} weight="duotone" /></div><div className="hf-stat-content"><p className="hf-stat-label">Total Auctions</p><h3 className="hf-stat-value">{stats.totalAuctions}</h3></div></div>
              <div className="hf-stat-card"><div className="hf-stat-icon"><CurrencyDollar size={28} weight="duotone" /></div><div className="hf-stat-content"><p className="hf-stat-label">Total Amount</p><h3 className="hf-stat-value">₹{stats.totalAmount.toFixed(2)}</h3></div></div>
              <div className="hf-stat-card"><div className="hf-stat-icon"><Wallet size={28} weight="duotone" /></div><div className="hf-stat-content"><p className="hf-stat-label">Total Collection</p><h3 className="hf-stat-value">₹{stats.totalCollection.toFixed(2)}</h3></div></div>
              <div className="hf-stat-card"><div className="hf-stat-icon"><CalendarCheck size={28} weight="duotone" /></div><div className="hf-stat-content"><p className="hf-stat-label">This Month</p><h3 className="hf-stat-value">₹{stats.thisMonthCollection.toFixed(2)}</h3></div></div>
            </div>
            <div className="hf-tables-section">
              <div className="hf-table-container"><div className="hf-table-header"><h2 className="hf-table-title">This Month Entries</h2><div className="hf-table-actions"><button onClick={() => setIsAddPaymentModalOpen(true)} className="hf-action-btn"><Plus size={18} /> Add Entry</button></div></div><div className="table-wrapper"><table ref={paymentsTableRef} className="display" style={{ width: '100%' }}></table></div></div>
              <div className="hf-table-container"><div className="hf-table-header"><h2 className="hf-table-title">Base Entry</h2><div className="hf-table-actions"><button onClick={() => navigate('/books/harvest-festival-note/bulk-entry', { state: { pastorate, year, month, members, churches } })} className="hf-action-btn"><Plus size={18} /> Bulk Entry</button><button onClick={() => openSingleEntryModal()} className="hf-action-btn"><Plus size={18} /> Single Entry</button></div></div><div className="table-wrapper"><table ref={baseEntriesTableRef} className="display" style={{ width: '100%' }}></table></div></div>
            </div>
          </div>
        </main>
      </div>
      <Modal isOpen={isSingleEntryModalOpen} onRequestClose={() => setIsSingleEntryModalOpen(false)} className="hf-modal" overlayClassName="hf-modal-overlay">
        <div className="hf-modal-header">
          <h2>{editingEntry ? 'Edit Entry' : 'Single Entry'}</h2>
          <button onClick={() => setIsSingleEntryModalOpen(false)} className="hf-modal-close">&times;</button>
        </div>
        <form onSubmit={handleEntrySubmit} className="hf-modal-form">
          <div className="hf-form-group">
            <label>Name *</label>
            <div className="hf-searchable-dropdown" ref={entryDropdownRef}>
              <input 
                type="text" 
                value={entrySearchTerm || entryForm.name} 
                onChange={(e) => { setEntrySearchTerm(e.target.value); setShowEntryDropdown(true); }}
                onFocus={() => setShowEntryDropdown(true)}
                placeholder="Type to search member..."
                className="hf-search-input"
              />
              {showEntryDropdown && (
                <div className="hf-dropdown-list">
                  {filteredEntryMembers.length > 0 ? filteredEntryMembers.map(m => (
                    <div key={m.id} className="hf-dropdown-item" onClick={() => {
                      setEntryForm(p => ({ ...p, memberId: m.id, name: m.displayName }));
                      setEntrySearchTerm('');
                      setShowEntryDropdown(false);
                    }}>{m.displayName}</div>
                  )) : <div className="hf-dropdown-empty">No members found</div>}
                </div>
              )}
            </div>
            {entryForm.name && <div className="hf-selected-member">Selected: {entryForm.name}</div>}
          </div>
          <div className="hf-form-group">
            <label>ஏலத்தொகை *</label>
            <input type="number" value={entryForm.auctionAmount} onChange={(e) => setEntryForm(p => ({ ...p, auctionAmount: e.target.value }))} required step="0.01" min="0" />
          </div>
          <div className="hf-form-group">
            <label>உடன் வரவு</label>
            <input type="number" value={entryForm.initialPayment} onChange={(e) => setEntryForm(p => ({ ...p, initialPayment: e.target.value }))} step="0.01" min="0" />
          </div>
          <div className="hf-form-group">
            <label>HF Church *</label>
            <select value={entryForm.hfChurchId} onChange={(e) => setEntryForm(p => ({ ...p, hfChurchId: e.target.value }))} required>
              <option value="">Select HF Church</option>
              {churches.map(c => <option key={c.id} value={c.id}>{c.churchName}</option>)}
            </select>
          </div>
          <div className="hf-form-group">
            <label>Date *</label>
            <input type="date" value={entryForm.date} onChange={(e) => setEntryForm(p => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="hf-form-actions">
            <button type="button" onClick={() => setIsSingleEntryModalOpen(false)} className="hf-cancel-btn">Cancel</button>
            <button type="submit" className="hf-submit-btn">{editingEntry ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={isPaymentModalOpen} onRequestClose={() => { setIsPaymentModalOpen(false); setSelectedPaymentBaseEntry(null); }} className="hf-modal" overlayClassName="hf-modal-overlay">
        <div className="hf-modal-header">
          <h2>{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
          <button onClick={() => { setIsPaymentModalOpen(false); setSelectedPaymentBaseEntry(null); }} className="hf-modal-close">&times;</button>
        </div>
        <form onSubmit={handlePaymentSubmit} className="hf-modal-form">
          <div className="hf-form-group">
            <label>Name</label>
            <input type="text" value={paymentForm.name.split(' - ')[0]} readOnly disabled className="hf-readonly" />
          </div>
          {selectedPaymentBaseEntry && (
            <div className="hf-amount-info">
              <div className="hf-info-row"><span>Total Amount:</span><span>₹{parseFloat(selectedPaymentBaseEntry.auctionAmount).toFixed(2)}</span></div>
              <div className="hf-info-row"><span>Total Paid:</span><span>₹{parseFloat(selectedPaymentBaseEntry.totalPaid || 0).toFixed(2)}</span></div>
              <div className="hf-info-row highlight"><span>Balance:</span><span>₹{(parseFloat(selectedPaymentBaseEntry.auctionAmount) - parseFloat(selectedPaymentBaseEntry.totalPaid || 0)).toFixed(2)}</span></div>
            </div>
          )}
          <div className="hf-form-group">
            <label>Date *</label>
            <input 
              type="date" 
              value={paymentForm.date} 
              onChange={async (e) => {
                const newDate = e.target.value;
                setPaymentForm(p => ({ ...p, date: newDate }));
                if (selectedPaymentBaseEntry?.hfChurchId) {
                  await updateServiceDateFromDate(newDate, selectedPaymentBaseEntry.hfChurchId, setPaymentForm);
                } else {
                  setPaymentForm(p => ({ ...p, serviceDate: getNextSunday(newDate) }));
                }
              }} 
              required 
            />
          </div>
          <div className="hf-form-group">
            <label>Service Date *</label>
            {availableServices.length > 0 ? (
              <select value={paymentForm.serviceDate} onChange={(e) => setPaymentForm(p => ({ ...p, serviceDate: e.target.value }))} required>
                <option value="">Select Service</option>
                {availableServices.map(s => <option key={s} value={s}>{new Date(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}
              </select>
            ) : (
              <input type="date" value={paymentForm.serviceDate} onChange={(e) => setPaymentForm(p => ({ ...p, serviceDate: e.target.value }))} required />
            )}
          </div>
          <div className="hf-form-group">
            <label>வரவு *</label>
            <input 
              type="number" 
              value={paymentForm.amount} 
              onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))} 
              required 
              step="0.01" 
              min="0"
              max={selectedPaymentBaseEntry ? (parseFloat(selectedPaymentBaseEntry.auctionAmount) - parseFloat(selectedPaymentBaseEntry.totalPaid || 0) + (editingPayment ? parseFloat(editingPayment.amount) : 0)) : undefined}
            />
            {selectedPaymentBaseEntry && parseFloat(paymentForm.amount) > (parseFloat(selectedPaymentBaseEntry.auctionAmount) - parseFloat(selectedPaymentBaseEntry.totalPaid || 0) + (editingPayment ? parseFloat(editingPayment.amount) : 0)) && (
              <span className="hf-error-msg">Amount cannot exceed balance</span>
            )}
          </div>
          <div className="hf-form-actions">
            <button type="button" onClick={() => { setIsPaymentModalOpen(false); setSelectedPaymentBaseEntry(null); }} className="hf-cancel-btn">Cancel</button>
            <button type="submit" className="hf-submit-btn">{editingPayment ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={isHistoryModalOpen} onRequestClose={() => setIsHistoryModalOpen(false)} className="hf-modal hf-history-modal" overlayClassName="hf-modal-overlay"><div className="hf-modal-header"><h2>Edit History</h2><button onClick={() => setIsHistoryModalOpen(false)} className="hf-modal-close">&times;</button></div><div className="hf-history-content">{historyItem?.editHistory?.length > 0 ? <div className="hf-history-list">{[...historyItem.editHistory].reverse().map((c, i) => <div key={i} className="hf-history-item"><strong>{c.field}:</strong> <span className="old-val">{c.oldValue}</span> to <span className="new-val">{c.newValue}</span><div className="hf-history-time">{formatHistoryDate(c.timestamp)}</div></div>)}</div> : <p className="hf-no-history">No edit history.</p>}<div className="hf-form-actions"><button onClick={() => setIsHistoryModalOpen(false)} className="hf-cancel-btn">Close</button></div></div></Modal>
      
      <Modal isOpen={isAddPaymentModalOpen} onRequestClose={() => setIsAddPaymentModalOpen(false)} className="hf-modal" overlayClassName="hf-modal-overlay">
        <div className="hf-modal-header">
          <h2>Add Payment Entry</h2>
          <button onClick={() => setIsAddPaymentModalOpen(false)} className="hf-modal-close">&times;</button>
        </div>
        <form onSubmit={handleAddPaymentSubmit} className="hf-modal-form">
          <div className="hf-form-group">
            <label>Select Member (from Base Entries) *</label>
            <div className="hf-searchable-dropdown" ref={paymentDropdownRef}>
              <input 
                type="text" 
                value={paymentSearchTerm} 
                onChange={(e) => { setPaymentSearchTerm(e.target.value); setShowPaymentDropdown(true); }}
                onFocus={() => setShowPaymentDropdown(true)}
                placeholder="Type to search..."
                className="hf-search-input"
              />
              {showPaymentDropdown && (
                <div className="hf-dropdown-list">
                  {filteredBaseEntries.length > 0 ? filteredBaseEntries.map(e => (
                    <div key={e.id} className="hf-dropdown-item" onClick={async () => {
                      setAddPaymentForm(p => ({ ...p, baseEntryId: e.id, amount: '' }));
                      setSelectedBaseEntry(e);
                      setPaymentSearchTerm(e.name.split(' - ')[0]);
                      setShowPaymentDropdown(false);
                      // Load services for this entry's church
                      if (e.hfChurchId) {
                        await updateServiceDateFromDate(addPaymentForm.date, e.hfChurchId, setAddPaymentForm);
                      }
                    }}>{e.name.split(' - ')[0]} - Balance: ₹{(parseFloat(e.auctionAmount) - parseFloat(e.totalPaid || 0)).toFixed(2)}</div>
                  )) : <div className="hf-dropdown-empty">No base entries found</div>}
                </div>
              )}
            </div>
          </div>
          {selectedBaseEntry && (
            <div className="hf-amount-info">
              <div className="hf-info-row"><span>Total Amount:</span><span>₹{parseFloat(selectedBaseEntry.auctionAmount).toFixed(2)}</span></div>
              <div className="hf-info-row"><span>Total Paid:</span><span>₹{parseFloat(selectedBaseEntry.totalPaid || 0).toFixed(2)}</span></div>
              <div className="hf-info-row highlight"><span>Balance:</span><span>₹{(parseFloat(selectedBaseEntry.auctionAmount) - parseFloat(selectedBaseEntry.totalPaid || 0)).toFixed(2)}</span></div>
            </div>
          )}
          <div className="hf-form-group">
            <label>Date *</label>
            <input 
              type="date" 
              value={addPaymentForm.date} 
              onChange={async (e) => {
                const newDate = e.target.value;
                setAddPaymentForm(p => ({ ...p, date: newDate }));
                if (selectedBaseEntry?.hfChurchId) {
                  await updateServiceDateFromDate(newDate, selectedBaseEntry.hfChurchId, setAddPaymentForm);
                } else {
                  setAddPaymentForm(p => ({ ...p, serviceDate: getNextSunday(newDate) }));
                }
              }} 
              required 
            />
          </div>
          <div className="hf-form-group">
            <label>Service Date *</label>
            {availableServices.length > 0 ? (
              <select value={addPaymentForm.serviceDate} onChange={(e) => setAddPaymentForm(p => ({ ...p, serviceDate: e.target.value }))} required>
                <option value="">Select Service</option>
                {availableServices.map(s => <option key={s} value={s}>{new Date(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}
              </select>
            ) : (
              <input type="date" value={addPaymentForm.serviceDate} onChange={(e) => setAddPaymentForm(p => ({ ...p, serviceDate: e.target.value }))} required />
            )}
          </div>
          <div className="hf-form-group">
            <label>Amount *</label>
            <input 
              type="number" 
              value={addPaymentForm.amount} 
              onChange={(e) => setAddPaymentForm(p => ({ ...p, amount: e.target.value }))} 
              required 
              step="0.01" 
              min="0" 
              max={selectedBaseEntry ? (parseFloat(selectedBaseEntry.auctionAmount) - parseFloat(selectedBaseEntry.totalPaid || 0)) : undefined}
            />
            {selectedBaseEntry && parseFloat(addPaymentForm.amount) > (parseFloat(selectedBaseEntry.auctionAmount) - parseFloat(selectedBaseEntry.totalPaid || 0)) && (
              <span className="hf-error-msg">Amount cannot exceed balance</span>
            )}
          </div>
          <div className="hf-form-actions">
            <button type="button" onClick={() => { setIsAddPaymentModalOpen(false); setSelectedBaseEntry(null); setAvailableServices([]); }} className="hf-cancel-btn">Cancel</button>
            <button type="submit" className="hf-submit-btn" disabled={selectedBaseEntry && parseFloat(addPaymentForm.amount) > (parseFloat(selectedBaseEntry.auctionAmount) - parseFloat(selectedBaseEntry.totalPaid || 0))}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMemberInfoModalOpen} onRequestClose={() => setIsMemberInfoModalOpen(false)} className="hf-modal hf-member-modal" overlayClassName="hf-modal-overlay">
        <div className="hf-modal-header">
          <h2>Member Details</h2>
          <button onClick={() => setIsMemberInfoModalOpen(false)} className="hf-modal-close">&times;</button>
        </div>
        <div className="hf-member-info-content">
          <div className="hf-member-detail"><label>Name:</label><span>{selectedMemberInfo?.name}</span></div>
          <div className="hf-member-detail"><label>Family:</label><span>{selectedMemberInfo?.familyName || 'N/A'}</span></div>
          <div className="hf-member-detail"><label>Church:</label><span>{selectedMemberInfo?.churchName || 'N/A'}</span></div>
          {selectedMemberInfo?.familyId && (
            <button onClick={() => { setIsMemberInfoModalOpen(false); navigate('/family', { state: { familyId: selectedMemberInfo.familyId } }); }} className="hf-link-btn">View Family Page</button>
          )}
          <div className="hf-form-actions">
            <button onClick={() => setIsMemberInfoModalOpen(false)} className="hf-cancel-btn">Close</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSummaryModalOpen} onRequestClose={() => setIsSummaryModalOpen(false)} className="hf-modal hf-summary-modal" overlayClassName="hf-modal-overlay">
        <div className="hf-modal-header">
          <h2>Payment Summary</h2>
          <button onClick={() => setIsSummaryModalOpen(false)} className="hf-modal-close">&times;</button>
        </div>
        <div className="hf-summary-content">
          {summaryData.entry && (
            <>
              <div className="hf-summary-header">
                <div className="hf-summary-info">
                  <span className="hf-summary-name">{summaryData.entry.name?.split(' - ')[0]}</span>
                  <span className="hf-summary-amount">ஏலத்தொகை: ₹{parseFloat(summaryData.entry.auctionAmount).toFixed(2)}</span>
                </div>
                <div className="hf-summary-stats">
                  <span className="hf-summary-paid">Paid: ₹{parseFloat(summaryData.entry.totalPaid || 0).toFixed(2)}</span>
                  <span className="hf-summary-balance">Balance: ₹{(parseFloat(summaryData.entry.auctionAmount) - parseFloat(summaryData.entry.totalPaid || 0)).toFixed(2)}</span>
                </div>
              </div>
              <div className="hf-summary-table-wrapper">
                <table className="hf-summary-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.payments.length > 0 ? (
                      summaryData.payments.map((p, i) => (
                        <tr key={i}>
                          <td>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td>{new Date(p.serviceDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                          <td>₹{parseFloat(p.amount).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="hf-no-data">No payments yet</td></tr>
                    )}
                  </tbody>
                  {summaryData.payments.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="2"><strong>Total</strong></td>
                        <td><strong>₹{summaryData.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
          <div className="hf-form-actions">
            <button onClick={() => setIsSummaryModalOpen(false)} className="hf-cancel-btn">Close</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default HarvestFestivalNote;
