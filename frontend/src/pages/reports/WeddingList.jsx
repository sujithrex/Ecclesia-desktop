import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import toast from 'react-hot-toast';
import $ from 'jquery';
import 'datatables.net';
import './ReportPage.css';

const WeddingList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [weddings, setWeddings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Wedding List' }
  ];

  const handleFilter = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    if (!fromDate || !toDate) {
      toast.error('Please enter both from and to dates');
      return;
    }

    try {
      setLoadingMessage('Loading wedding anniversaries...');
      setIsLoading(true);

      const result = await window.electron.member.getWeddingsByDateRange({
        churchId: selectedChurch.id,
        fromDate,
        toDate
      });

      if (result.success) {
        setWeddings(result.data);
        toast.success(`Found ${result.data.length} wedding anniversaries`);
      } else {
        toast.error('Failed to load wedding anniversaries');
      }
    } catch (error) {
      toast.error('Failed to load wedding anniversaries');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnniversaryYears = (dateOfMarriage) => {
    if (!dateOfMarriage) return '';
    const marriageDate = new Date(dateOfMarriage);
    const today = new Date();
    let years = today.getFullYear() - marriageDate.getFullYear();
    const monthDiff = today.getMonth() - marriageDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < marriageDate.getDate())) {
      years--;
    }
    return years;
  };

  const formatAnniversaryDate = (dateOfMarriage) => {
    if (!dateOfMarriage) return '';
    const date = new Date(dateOfMarriage);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  const getSpouseName = async (member) => {
    if (!member.spouseId) return '';

    try {
      const result = await window.electron.member.getById(member.spouseId);
      if (result.success && result.data) {
        const spouse = result.data;
        const respect = spouse.respect ? spouse.respect.charAt(0).toUpperCase() + spouse.respect.slice(1) + '.' : '';
        return `${respect} ${spouse.name}`;
      }
    } catch (error) {
      console.error('Failed to get spouse:', error);
    }
    return '';
  };

  // Initialize/Update DataTable
  useEffect(() => {
    const initTable = async () => {
      if (tableRef.current) {
        // Get spouse names for all members
        const weddingsWithSpouses = await Promise.all(
          weddings.map(async (wedding) => {
            const spouseName = await getSpouseName(wedding);
            return { ...wedding, spouseName };
          })
        );

        if (dataTableRef.current) {
          dataTableRef.current.clear();
          dataTableRef.current.rows.add(weddingsWithSpouses);
          dataTableRef.current.draw();
        } else {
          dataTableRef.current = $(tableRef.current).DataTable({
            data: weddingsWithSpouses,
            columns: [
              {
                data: 'dateOfMarriage',
                title: 'Anniversary',
                render: (data) => formatAnniversaryDate(data)
              },
              {
                data: null,
                title: 'Couple Names',
                render: (data) => {
                  const respect1 = data.respect ? data.respect.charAt(0).toUpperCase() + data.respect.slice(1) + '.' : '';
                  const name1 = `${respect1} ${data.name}`;

                  if (data.spouseName) {
                    return `${name1} & ${data.spouseName}`;
                  }
                  return name1;
                }
              },
              {
                data: 'dateOfMarriage',
                title: 'Years',
                render: (data) => calculateAnniversaryYears(data)
              },
              { data: 'familyName', title: 'Family Head' },
              { data: 'areaName', title: 'Area' },
              { data: 'familyPhone', title: 'Phone' }
            ],
            pageLength: 10,
            destroy: true,
            order: [[0, 'asc']]
          });
        }
      }
    };

    initTable();

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [weddings]);

  const handleGeneratePDF = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    if (!fromDate || !toDate) {
      toast.error('Please enter both from and to dates');
      return;
    }

    try {
      setLoadingMessage('Generating PDF...');
      setIsLoading(true);

      const result = await window.electron.wedding.generatePDF({
        churchId: selectedChurch.id,
        fromDate,
        toDate
      });

      if (result.success) {
        toast.success('PDF generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1>Wedding Anniversary List</h1>

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
                    disabled={weddings.length === 0}
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

export default WeddingList;

