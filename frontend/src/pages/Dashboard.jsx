import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import LoadingScreen from '../components/LoadingScreen';
import {
  Certificate,
  Baby,
  Cross,
  BookOpen,
  Heart,
  Cake,
  FileText,
  Users,
  Eye,
  PencilSimple,
  Trash,
  Plus,
  Database,
  CloudArrowUp,
  CloudArrowDown
} from '@phosphor-icons/react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './Dashboard.css';

Modal.setAppElement('#root');

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentChurch, setCurrentChurch] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [churchToDelete, setChurchToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formData, setFormData] = useState({
    churchName: '',
    pastorateName: '',
    churchShortName: '',
    pastorateShortName: '',
    churchNameTamil: '',
    pastorateNameTamil: ''
  });

  const [churches, setChurches] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentChurch(null);
    setFormData({
      churchName: '',
      pastorateName: '',
      churchShortName: '',
      pastorateShortName: '',
      churchNameTamil: '',
      pastorateNameTamil: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (church) => {
    setIsEditMode(true);
    setCurrentChurch(church);
    setFormData({
      churchName: church.churchName,
      pastorateName: church.pastorateName,
      churchShortName: church.churchShortName,
      pastorateShortName: church.pastorateShortName,
      churchNameTamil: church.churchNameTamil,
      pastorateNameTamil: church.pastorateNameTamil
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentChurch(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadChurches = async () => {
    try {
      setLoadingMessage('Loading churches...');
      setIsLoading(true);

      const result = await window.electron.church.getAll();

      if (result.success) {
        setChurches(result.data);
      } else {
        toast.error('Failed to load churches');
      }
    } catch (error) {
      toast.error('Failed to load churches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode && currentChurch) {
        // Update existing church
        setLoadingMessage('Updating church...');
        setIsLoading(true);

        const result = await window.electron.church.update(currentChurch.id, formData);

        if (result.success) {
          setChurches(prev => prev.map(church =>
            church.id === currentChurch.id
              ? result.data
              : church
          ));
          toast.success('Church updated successfully!');
          closeModal();
        } else {
          toast.error(result.message || 'Failed to update church');
        }
      } else {
        // Create new church
        setLoadingMessage('Creating church...');
        setIsLoading(true);

        const result = await window.electron.church.create(formData);

        if (result.success) {
          setChurches(prev => [...prev, result.data]);
          toast.success('Church created successfully!');
          closeModal();
        } else {
          toast.error(result.message || 'Failed to create church');
        }
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} church. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (church) => {
    setChurchToDelete(church);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setChurchToDelete(null);
  };

  const confirmDelete = async () => {
    if (!churchToDelete) return;

    try {
      setLoadingMessage('Deleting church...');
      setIsLoading(true);
      closeDeleteModal();

      const result = await window.electron.church.delete(churchToDelete.id);

      if (result.success) {
        setChurches(prev => prev.filter(church => church.id !== churchToDelete.id));
        toast.success('Church deleted successfully!');
      } else {
        toast.error(result.message || 'Failed to delete church');
      }
    } catch (error) {
      toast.error('Failed to delete church. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (church) => {
    navigate(`/congregation/${church.id}`, { state: { church } });
  };

  // Load churches on component mount
  useEffect(() => {
    loadChurches();
  }, []);

  useEffect(() => {
    if (tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        data: churches,
        columns: [
          { data: 'churchName', title: 'Church Name' },
          { data: 'pastorateName', title: 'Pastorate Name' },
          { data: 'churchShortName', title: 'Church Short Name' },
          { data: 'pastorateShortName', title: 'Pastorate Short Name' },
          {
            data: null,
            title: 'Actions',
            orderable: false,
            render: function(data, type, row) {
              return `
                <div class="action-buttons">
                  <button class="action-btn view-btn" data-id="${row.id}" title="View">
                    <i class="ph-eye"></i>
                  </button>
                  <button class="action-btn edit-btn" data-id="${row.id}" title="Edit">
                    <i class="ph-pencil"></i>
                  </button>
                  <button class="action-btn delete-btn" data-id="${row.id}" title="Delete">
                    <i class="ph-trash"></i>
                  </button>
                </div>
              `;
            }
          }
        ],
        pageLength: 10,
        destroy: true
      });
    }

    return () => {
      if (dataTableRef.current) {
        $(tableRef.current).off('click');
      }
    };
  }, []);

  // Separate useEffect for event handlers to avoid stale closure
  useEffect(() => {
    if (!tableRef.current) return;

    const handleViewClick = (e) => {
      const btn = $(e.target).closest('.view-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));
        const church = churches.find(c => c.id === id);
        if (church) handleView(church);
      }
    };

    const handleEditClick = (e) => {
      const btn = $(e.target).closest('.edit-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));
        const church = churches.find(c => c.id === id);
        if (church) openEditModal(church);
      }
    };

    const handleDeleteClick = (e) => {
      const btn = $(e.target).closest('.delete-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));
        const church = churches.find(c => c.id === id);
        if (church) openDeleteModal(church);
      }
    };

    $(tableRef.current).on('click', '.view-btn', handleViewClick);
    $(tableRef.current).on('click', '.edit-btn', handleEditClick);
    $(tableRef.current).on('click', '.delete-btn', handleDeleteClick);

    return () => {
      $(tableRef.current).off('click', '.view-btn', handleViewClick);
      $(tableRef.current).off('click', '.edit-btn', handleEditClick);
      $(tableRef.current).off('click', '.delete-btn', handleDeleteClick);
    };
  }, [churches]);

  useEffect(() => {
    if (dataTableRef.current) {
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(churches);
      dataTableRef.current.draw();
    }
  }, [churches]);

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <div className="dashboard-container">
        <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="header-actions">
            <button onClick={handleSettings} className="settings-btn">
              Settings
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="congregation-section">
          <div className="section-header">
            <h2 className="section-title">Congregation</h2>
            <button onClick={openCreateModal} className="create-church-btn">
              <Plus size={20} weight="bold" />
              Create Church
            </button>
          </div>
          <div className="table-container">
            <table ref={tableRef} className="display" style={{ width: '100%' }}></table>
          </div>
        </div>

        <div className="reports-section">
          <h2 className="section-title">Reports</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card" onClick={() => navigate('/reports/adult-baptism-certificate')}>
              <div className="card-icon">
                <Certificate size={40} weight="duotone" />
              </div>
              <h3>Adult Baptism Certificate</h3>
              <p>Generate adult baptism certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/infant-baptism-certificate')}>
              <div className="card-icon">
                <Baby size={40} weight="duotone" />
              </div>
              <h3>Infant Baptism Certificate</h3>
              <p>Generate infant baptism certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/burial-certificate')}>
              <div className="card-icon">
                <Cross size={40} weight="duotone" />
              </div>
              <h3>Burial Certificate</h3>
              <p>Generate burial certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/sabai-jabitha')}>
              <div className="card-icon">
                <BookOpen size={40} weight="duotone" />
              </div>
              <h3>Sabai Jabitha</h3>
              <p>View Sabai Jabitha records</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/wedding-list')}>
              <div className="card-icon">
                <Heart size={40} weight="duotone" />
              </div>
              <h3>Wedding List</h3>
              <p>View wedding records</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/marriage')}>
              <div className="card-icon">
                <Users size={40} weight="duotone" />
              </div>
              <h3>Marriage</h3>
              <p>Generate marriage certificates</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/birthday-list')}>
              <div className="card-icon">
                <Cake size={40} weight="duotone" />
              </div>
              <h3>Birthday List</h3>
              <p>View birthday records</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/reports/letter-head')}>
              <div className="card-icon">
                <FileText size={40} weight="duotone" />
              </div>
              <h3>Letter Head</h3>
              <p>Generate letter head documents</p>
            </div>
          </div>
        </div>

        <div className="backups-section">
          <h2 className="section-title">Backups</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card" onClick={() => navigate('/backups/congregation-backup')}>
              <div className="card-icon">
                <CloudArrowUp size={40} weight="duotone" />
              </div>
              <h3>Congregation Backup</h3>
              <p>Backup congregation data</p>
            </div>

            <div className="dashboard-card" onClick={() => navigate('/backups/congregation-restore')}>
              <div className="card-icon">
                <CloudArrowDown size={40} weight="duotone" />
              </div>
              <h3>Congregation Restore</h3>
              <p>Restore congregation data</p>
            </div>

            <div className="dashboard-card" onClick={() => {
              toast('Reports Backup feature will be implemented soon!', {
                duration: 4000,
                icon: '🔄',
                style: {
                  background: '#3b82f6',
                  color: '#fff',
                }
              });
            }}>
              <div className="card-icon">
                <Database size={40} weight="duotone" />
              </div>
              <h3>Reports Backup</h3>
              <p>Backup reports data</p>
            </div>

            <div className="dashboard-card" onClick={() => {
              toast('Reports Restore feature will be implemented soon!', {
                duration: 4000,
                icon: '🔄',
                style: {
                  background: '#3b82f6',
                  color: '#fff',
                }
              });
            }}>
              <div className="card-icon">
                <Database size={40} weight="duotone" />
              </div>
              <h3>Reports Restore</h3>
              <p>Restore reports data</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Modal
      isOpen={isModalOpen}
      onRequestClose={closeModal}
      className="church-modal"
      overlayClassName="church-modal-overlay"
      contentLabel={isEditMode ? "Edit Church" : "Create Church"}
    >
      <div className="modal-header">
        <h2>{isEditMode ? 'Edit Church' : 'Create Church'}</h2>
        <button onClick={closeModal} className="modal-close-btn">&times;</button>
      </div>
      <form onSubmit={handleSubmit} className="church-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="churchName">Church Name</label>
            <input
              type="text"
              id="churchName"
              name="churchName"
              value={formData.churchName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pastorateName">Pastorate Name</label>
            <input
              type="text"
              id="pastorateName"
              name="pastorateName"
              value={formData.pastorateName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="churchShortName">Church Short Name</label>
            <input
              type="text"
              id="churchShortName"
              name="churchShortName"
              value={formData.churchShortName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pastorateShortName">Pastorate Short Name</label>
            <input
              type="text"
              id="pastorateShortName"
              name="pastorateShortName"
              value={formData.pastorateShortName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="churchNameTamil">Church Name In Tamil</label>
            <input
              type="text"
              id="churchNameTamil"
              name="churchNameTamil"
              value={formData.churchNameTamil}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pastorateNameTamil">Pastorate Name In Tamil</label>
            <input
              type="text"
              id="pastorateNameTamil"
              name="pastorateNameTamil"
              value={formData.pastorateNameTamil}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={closeModal} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {isEditMode ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>

    <Modal
      isOpen={isDeleteModalOpen}
      onRequestClose={closeDeleteModal}
      className="church-modal delete-modal"
      overlayClassName="church-modal-overlay"
      contentLabel="Delete Church Confirmation"
    >
      <div className="modal-header">
        <h2>Delete Church</h2>
        <button onClick={closeDeleteModal} className="modal-close-btn">&times;</button>
      </div>
      <div className="delete-modal-content">
        <p className="delete-warning">
          Are you sure you want to delete <strong>{churchToDelete?.churchName}</strong>?
        </p>
        <p className="delete-subtext">
          This action cannot be undone.
        </p>
        <div className="form-actions">
          <button type="button" onClick={closeDeleteModal} className="cancel-btn">
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} className="delete-confirm-btn">
            Delete
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default Dashboard;

