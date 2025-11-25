import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
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
  const [isBansModalOpen, setIsBansModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMarriage, setSelectedMarriage] = useState(null);
  const [marriageToDelete, setMarriageToDelete] = useState(null);
  const [bansFormData, setBansFormData] = useState({
    place: '',
    date: ''
  });
  const [certificateFormData, setCertificateFormData] = useState({
    place: '',
    date: ''
  });

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
        // Removed toast notification on load - only show errors
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
                <button class="action-btn notification-btn" data-id="${row.id}" title="Generate Marriage Bans Notice">
                  Notice
                </button>
                <button class="action-btn certificate-btn" data-id="${row.id}" title="Generate Marriage Certificate">
                  Certificate
                </button>
                <button class="action-btn edit-btn" data-id="${row.id}" title="Edit Marriage Record">
                  Edit
                </button>
                <button class="action-btn delete-btn" data-id="${row.id}" title="Delete Marriage Record">
                  Delete
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

  // Event handlers for DataTable buttons
  useEffect(() => {
    if (!tableRef.current) return;

    const handleNotificationClick = (e) => {
      const btn = $(e.target).closest('.notification-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          openMarriageBansModal(record);
        }
      }
    };

    const handleEditClick = (e) => {
      const btn = $(e.target).closest('.edit-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          // Navigate to create marriage record page with edit mode
          navigate(`/reports/marriage/create?id=${id}`);
        }
      }
    };

    const handleDeleteClick = (e) => {
      const btn = $(e.target).closest('.delete-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          setMarriageToDelete(record);
          setIsDeleteModalOpen(true);
        }
      }
    };

    const handleCertificateClick = (e) => {
      const btn = $(e.target).closest('.certificate-btn');
      if (btn.length) {
        const id = btn.data('id');
        const record = marriageData.find(r => r.id === id);
        if (record) {
          openMarriageCertificateModal(record);
        }
      }
    };

    $(tableRef.current).on('click', '.notification-btn', handleNotificationClick);
    $(tableRef.current).on('click', '.certificate-btn', handleCertificateClick);
    $(tableRef.current).on('click', '.edit-btn', handleEditClick);
    $(tableRef.current).on('click', '.delete-btn', handleDeleteClick);

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off('click', '.notification-btn', handleNotificationClick);
        $(tableRef.current).off('click', '.certificate-btn', handleCertificateClick);
        $(tableRef.current).off('click', '.edit-btn', handleEditClick);
        $(tableRef.current).off('click', '.delete-btn', handleDeleteClick);
      }
    };
  }, [marriageData, navigate]);
    
      // Marriage Bans functionality
      const openMarriageBansModal = (marriageRecord) => {
        setSelectedMarriage(marriageRecord);
        
        // Pre-fill form with existing marriage data
        setBansFormData({
          place: '',
          date: new Date().toISOString().split('T')[0] // Today's date
        });
        
        setIsBansModalOpen(true);
      };
    
      const closeMarriageBansModal = () => {
        setIsBansModalOpen(false);
        setSelectedMarriage(null);
        setBansFormData({
          place: '',
          date: ''
        });
      };
    
      const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setMarriageToDelete(null);
      };
    
      const handleDeleteMarriageRecord = async (id) => {
        try {
          setLoadingMessage('Deleting marriage record...');
          setIsLoading(true);
    
          const result = await window.electron.marriage.delete(id);
    
          if (result.success) {
            toast.success('Marriage record deleted successfully!');
            loadMarriageRecords(); // Refresh the table
          } else {
            toast.error(result.message || 'Failed to delete marriage record');
          }
        } catch (error) {
          toast.error('Failed to delete marriage record');
          console.error('Delete error:', error);
        } finally {
          setIsLoading(false);
        }
      };
    
      const handleBansInputChange = (e) => {
        const { name, value } = e.target;
        setBansFormData(prev => ({ ...prev, [name]: value }));
      };
    
      // Marriage Certificate functionality
      const openMarriageCertificateModal = (marriageRecord) => {
        setSelectedMarriage(marriageRecord);
        
        // Pre-fill form with today's date
        setCertificateFormData({
          place: '',
          date: new Date().toISOString().split('T')[0]
        });
        
        setIsCertificateModalOpen(true);
      };

      const closeMarriageCertificateModal = () => {
        setIsCertificateModalOpen(false);
        setSelectedMarriage(null);
        setCertificateFormData({
          place: '',
          date: ''
        });
      };

      const handleCertificateInputChange = (e) => {
        const { name, value } = e.target;
        setCertificateFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleGenerateMarriageCertificate = async () => {
        if (!selectedMarriage) return;

        try {
          setLoadingMessage('Generating Marriage Certificate PDF...');
          setIsLoading(true);

          const pdfResult = await window.electron.marriage.generateCertificate(selectedMarriage.id, {
            church_id: 1, // Default church ID (same as Notice)
            place: certificateFormData.place,
            date: certificateFormData.date
          });

          if (pdfResult.success) {
            toast.success('Marriage Certificate PDF generated and opened successfully!');
            closeMarriageCertificateModal();
          } else {
            toast.error(pdfResult.message || 'Failed to generate certificate');
          }
        } catch (error) {
          toast.error('Failed to generate Marriage Certificate PDF');
          console.error('Marriage Certificate generation error:', error);
        } finally {
          setIsLoading(false);
        }
      };

      const handleGenerateMarriageBans = async () => {
        if (!selectedMarriage) return;
    
        try {
          setLoadingMessage('Generating Marriage Bans PDF...');
          setIsLoading(true);
    
          // Get the full marriage record from database
          const recordResult = await window.electron.marriage.getById(selectedMarriage.id);
          
          if (!recordResult.success) {
            toast.error('Failed to load marriage record details');
            return;
          }

          const fullRecord = recordResult.data;

          // Use the marriage record data directly (it now contains all the fields)
          const bansData = {
            church_id: 1, // Default church ID
            // Use data from the marriage record
            groomName: fullRecord.groomName,
            brideName: fullRecord.brideName,
            groomDOB: fullRecord.groomDOB,
            brideDOB: fullRecord.brideDOB,
            groomProfession: fullRecord.groomProfession,
            brideProfession: fullRecord.brideProfession,
            groomFatherName: fullRecord.groomFatherName,
            groomMotherName: fullRecord.groomMotherName,
            brideFatherName: fullRecord.brideFatherName,
            brideMotherName: fullRecord.brideMotherName,
            isGroomBachelor: fullRecord.isGroomBachelor,
            isBrideSpinster: fullRecord.isBrideSpinster,
            groomChurchName: fullRecord.groomChurchName,
            groomPastorateName: fullRecord.groomPastorateName,
            brideChurchName: fullRecord.brideChurchName,
            bridePastorateName: fullRecord.bridePastorateName,
            firstBansDate: fullRecord.firstBansDate,
            secondBansDate: fullRecord.secondBansDate,
            thirdBansDate: fullRecord.thirdBansDate,
            marriageDate: fullRecord.marriageDate,
            congregation: fullRecord.congregation, // Add congregation field
            // Additional data from modal
            date: bansFormData.date,
            place: bansFormData.place
          };
    
          // First create the marriage bans record
          const createResult = await window.electron.marriageBans.create(bansData);
    
          if (!createResult.success) {
            toast.error(createResult.message || 'Failed to create marriage bans record');
            return;
          }
    
          // Generate PDF with additional data (place and date from modal)
          const pdfResult = await window.electron.marriageBans.generatePDF(createResult.data.id, {
            place: bansFormData.place,
            date: bansFormData.date
          });
    
          if (pdfResult.success) {
            toast.success('Marriage Bans PDF generated and opened successfully!');
            closeMarriageBansModal();
          } else {
            toast.error(pdfResult.message || 'Failed to generate PDF');
          }
        } catch (error) {
          toast.error('Failed to generate Marriage Bans PDF');
          console.error('Marriage Bans generation error:', error);
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
            <div className="section-header">
              <h1>Marriage Records</h1>
              <button onClick={() => navigate('/reports/marriage/create')} className="create-btn">
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

      {/* Marriage Bans Modal */}
      <Modal
        isOpen={isBansModalOpen}
        onRequestClose={closeMarriageBansModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Generate Marriage Bans Notice</h2>
          <button onClick={closeMarriageBansModal} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {selectedMarriage && (
            <>
              <div className="form-group">
                <label>Marriage Record:</label>
                <div className="readonly-field">
                  {selectedMarriage.coupleNames} - {new Date(selectedMarriage.marriageDate).toLocaleDateString()}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Place *</label>
                  <input
                    type="text"
                    name="place"
                    value={bansFormData.place}
                    onChange={handleBansInputChange}
                    placeholder="Enter place"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={bansFormData.date}
                    onChange={handleBansInputChange}
                    required
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={closeMarriageBansModal} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleGenerateMarriageBans} className="save-btn">
            Generate PDF
          </button>
        </div>
      </Modal>

      {/* Marriage Certificate Modal */}
      <Modal
        isOpen={isCertificateModalOpen}
        onRequestClose={closeMarriageCertificateModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Generate Marriage Certificate</h2>
          <button onClick={closeMarriageCertificateModal} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {selectedMarriage && (
            <>
              <div className="form-group">
                <label>Marriage Record:</label>
                <div className="readonly-field">
                  {selectedMarriage.coupleNames} - {new Date(selectedMarriage.marriageDate).toLocaleDateString()}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Place *</label>
                  <input
                    type="text"
                    name="place"
                    value={certificateFormData.place}
                    onChange={handleCertificateInputChange}
                    placeholder="Enter place"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={certificateFormData.date}
                    onChange={handleCertificateInputChange}
                    required
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={closeMarriageCertificateModal} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleGenerateMarriageCertificate} className="save-btn">
            Generate PDF
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Confirm Delete</h2>
          <button onClick={closeDeleteModal} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {marriageToDelete && (
            <div className="delete-confirmation">
              <p>Are you sure you want to delete the marriage record for:</p>
              <div className="record-details">
                <strong>{marriageToDelete.coupleNames}</strong><br/>
                Marriage Date: {new Date(marriageToDelete.marriageDate).toLocaleDateString()}
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={closeDeleteModal} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={() => {
              if (marriageToDelete) {
                handleDeleteMarriageRecord(marriageToDelete.id);
                closeDeleteModal();
              }
            }}
            className="delete-confirm-btn"
          >
            Delete Record
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Marriage;