import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Eye } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './ReportPage.css';

const BirthdayList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [birthdays, setBirthdays] = useState([]);
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Birthday List' }
  ];

  // Load churches on mount
  useEffect(() => {
    loadChurches();
    setDefaultDateRange();
  }, []);

  const setDefaultDateRange = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}-${month}`;
    };

    setFromDate(formatDate(today));
    setToDate(formatDate(nextWeek));
  };

  const loadChurches = async () => {
    try {
      const result = await window.electron.church.getAll();
      if (result.success) {
        setChurches(result.data);
        if (result.data.length > 0) {
          setSelectedChurch(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load churches');
    }
  };

  const loadBirthdays = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    if (!fromDate || !toDate) {
      toast.error('Please select date range');
      return;
    }

    try {
      setLoadingMessage('Loading birthdays...');
      setIsLoading(true);

      const result = await window.electron.member.getBirthdaysByDateRange({
        churchId: selectedChurch.id,
        fromDate,
        toDate
      });

      if (result.success) {
        setBirthdays(result.data);
        toast.success(`Found ${result.data.length} birthdays`);
      } else {
        toast.error(result.message || 'Failed to load birthdays');
      }
    } catch (error) {
      toast.error('Failed to load birthdays');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    loadBirthdays();
  };

  // Initialize DataTable
  useEffect(() => {
    if (!tableRef.current || birthdays.length === 0) return;

    // Destroy existing DataTable if it exists
    if (dataTableRef.current) {
      dataTableRef.current.destroy();
    }

    // Initialize new DataTable
    dataTableRef.current = $(tableRef.current).DataTable({
      data: birthdays,
      columns: [
        {
          data: 'dob',
          title: 'Birthday',
          render: (data) => {
            if (!data) return 'N/A';
            const date = new Date(data);
            const day = String(date.getDate()).padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            return `${day}-${month}`;
          }
        },
        {
          data: null,
          title: 'Name',
          render: (data) => `${data.respect || 'Mr'}. ${data.name}`
        },
        {
          data: 'age',
          title: 'Age',
          render: (data) => data || 'N/A'
        },
        {
          data: 'familyName',
          title: 'Family Head',
          render: (data) => data || 'N/A'
        },
        {
          data: 'areaName',
          title: 'Area',
          render: (data) => data || 'N/A'
        },
        {
          data: 'mobile',
          title: 'Phone',
          render: (data) => data || 'N/A'
        },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data, type, row) => {
            return `
              <div class="action-buttons">
                <button class="action-btn view-btn" data-id="${row.id}" title="View PDF">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
                  </svg>
                </button>
              </div>
            `;
          }
        }
      ],
      pageLength: 10,
      order: [[0, 'asc']],
      language: {
        emptyTable: 'No birthdays found for the selected date range'
      }
    });

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [birthdays]);

  const handleGeneratePDF = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    if (!fromDate || !toDate) {
      toast.error('Please select date range');
      return;
    }

    if (birthdays.length === 0) {
      toast.error('No birthdays to generate PDF. Please filter first.');
      return;
    }

    try {
      setLoadingMessage('Generating PDF...');
      setIsLoading(true);

      const result = await window.electron.birthday.generatePDF({
        churchId: selectedChurch.id,
        fromDate,
        toDate
      });

      if (result.success) {
        toast.success('PDF generated and opened successfully!');
      } else {
        toast.error(result.message || 'Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers for DataTable buttons
  useEffect(() => {
    if (!tableRef.current) return;

    const handleViewClick = async (e) => {
      const btn = $(e.target).closest('.view-btn');
      if (btn.length) {
        handleGeneratePDF();
      }
    };

    $(tableRef.current).on('click', '.view-btn', handleViewClick);

    return () => {
      $(tableRef.current).off('click', '.view-btn', handleViewClick);
    };
  }, [birthdays, selectedChurch, fromDate, toDate]);

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <div className="report-container">
        <header className="report-header">
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

        <main className="report-main">
          <div className="report-content">
            <h1>Birthday List</h1>

            {/* Filter Section */}
            <div className="filter-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Church</label>
                  <select
                    value={selectedChurch?.id || ''}
                    onChange={(e) => {
                      const church = churches.find(c => c.id === parseInt(e.target.value));
                      setSelectedChurch(church);
                    }}
                  >
                    <option value="">Select Church</option>
                    {churches.map(church => (
                      <option key={church.id} value={church.id}>
                        {church.churchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>From Date (DD-MM)</label>
                  <input
                    type="text"
                    placeholder="DD-MM"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    maxLength="5"
                  />
                </div>

                <div className="form-group">
                  <label>To Date (DD-MM)</label>
                  <input
                    type="text"
                    placeholder="DD-MM"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    maxLength="5"
                  />
                </div>

                <div className="form-group">
                  <label>&nbsp;</label>
                  <button onClick={handleFilter} className="filter-btn">
                    Filter
                  </button>
                </div>

                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    onClick={handleGeneratePDF}
                    className="pdf-btn"
                    disabled={birthdays.length === 0}
                  >
                    Generate PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="table-section">
              <div className="table-container">
                <table ref={tableRef} className="display" style={{ width: '100%' }}></table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BirthdayList;

