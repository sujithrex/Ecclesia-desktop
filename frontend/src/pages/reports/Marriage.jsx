import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Bell, FileText, CalendarPlus } from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './ReportPage.css';

const Marriage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [marriageData, setMarriageData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Marriage Records' }
  ];

  const loadMarriageRecords = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading marriage records...');

      const result = await window.electron.marriage.getAll();

      if (result.success) {
        // Transform data for table display
        const transformedData = result.data.map(record => ({
          id: record.id,
          marriageDate: record.marriageDate,
          coupleNames: `${record.groomName || ''} & ${record.brideName || ''}`,
          phone: record.groomMobile || record.brideMobile || '',
          serialNumber: record.serialNumber || '',
          congregation: record.congregation || '',
          groomName: record.groomName || '',
          brideName: record.brideName || '',
          createdAt: record.createdAt
        }));

        setMarriageData(transformedData);
        toast.success(`Found ${result.data.length} marriage records`);
      } else {
        toast.error(result.message || 'Failed to load marriage records');
        setMarriageData([]);
      }
    } catch (error) {
      toast.error('Failed to load marriage records');
      setMarriageData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load churches on mount
  useEffect(() => {
    loadMarriageRecords();
  }, []);

  // Initialize DataTable - matching BirthdayList pattern
  useEffect(() => {
    if (!tableRef.current || marriageData.length === 0) return;

    // Destroy existing DataTable if it exists
    if (dataTableRef.current) {
      dataTableRef.current.destroy();
    }

    // Initialize new DataTable
    dataTableRef.current = $(tableRef.current).DataTable({
      data: marriageData,
      columns: [
        {
          data: 'marriageDate',
          title: 'Marriage Date',
          render: (data) => {
            if (!data) return '';
            const date = new Date(data);
            return date.toLocaleDateString('en-GB');
          }
        },
        {
          data: 'coupleNames',
          title: 'Couple Names',
          render: (data) => data || ''
        },
        {
          data: 'phone',
          title: 'Phone',
          render: (data) => data || ''
        },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data, type, row) => {
            return `
              <div class="action-buttons">
                <button class="action-btn notification-btn" data-id="${row.id}" title="Send Notification">
                  <i class="ph-bell"></i>
                </button>
                <button class="action-btn certificate-btn" data-id="${row.id}" title="Generate Certificate">
                  <i class="ph-file-text"></i>
                </button>
                <button class="action-btn schedule-btn" data-id="${row.id}" title="Schedule IV">
                  <i class="ph-calendar-plus"></i>
                </button>
              </div>
            `;
          }
        }
      ],
      pageLength: 10,
      order: [[0, 'asc']],
      language: {
        emptyTable: "No marriage records found"
      }
    });

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [marriageData]);

  // Event handlers for DataTable buttons - matching BirthdayList pattern
  useEffect(() => {
    if (!tableRef.current) return;

    const handleNotificationClick = (e) => {
      const btn = $(e.target).closest('.notification-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          toast.success(`Notification sent for ${record.coupleNames}`);
        }
      }
    };

    const handleCertificateClick = (e) => {
      const btn = $(e.target).closest('.certificate-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          toast.success(`Certificate generated for ${record.coupleNames}`);
        }
      }
    };

    const handleScheduleClick = (e) => {
      const btn = $(e.target).closest('.schedule-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          toast.success(`Schedule IV created for ${record.coupleNames}`);
        }
      }
    };

    $(tableRef.current).on('click', '.notification-btn', handleNotificationClick);
    $(tableRef.current).on('click', '.certificate-btn', handleCertificateClick);
    $(tableRef.current).on('click', '.schedule-btn', handleScheduleClick);

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off('click', '.notification-btn', handleNotificationClick);
        $(tableRef.current).off('click', '.certificate-btn', handleCertificateClick);
        $(tableRef.current).off('click', '.schedule-btn', handleScheduleClick);
      }
    };
  }, [marriageData]);

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
            <div className="section-header">
              <h1>Marriage Records</h1>
              <button onClick={() => navigate('/reports/marriage/create')} className="create-btn">
                <CalendarPlus size={20} weight="bold" />
                Create Marriage Record
              </button>
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

export default Marriage;