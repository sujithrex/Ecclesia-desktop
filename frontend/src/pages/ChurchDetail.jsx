import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import LoadingScreen from '../components/LoadingScreen';
import { Plus } from '@phosphor-icons/react';
import './ChurchDetail.css';

Modal.setAppElement('#root');

const ChurchDetail = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const church = location.state?.church;
  const [areas, setAreas] = useState([]);
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalMembers: 0,
    totalCommunicants: 0,
    totalBaptised: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentArea, setCurrentArea] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formData, setFormData] = useState({
    areaName: '',
    areaId: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Congregation', path: '/dashboard' },
    { label: church?.churchName || 'Church Details' }
  ];

  const loadAreas = async () => {
    if (!church) return;

    try {
      setLoadingMessage('Loading areas...');
      setIsLoading(true);

      const result = await window.electron.area.getByChurch(church.id);

      if (result.success) {
        setAreas(result.data);
      } else {
        toast.error('Failed to load areas');
      }
    } catch (error) {
      toast.error('Failed to load areas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!church) return;

    try {
      // Get all families for this church
      const familiesResult = await window.electron.family.getAll();
      const churchFamilies = familiesResult.success 
        ? familiesResult.data.filter(f => f.churchId === church.id)
        : [];

      // Get all members for this church
      const membersResult = await window.electron.member.getAll();
      const churchMembers = membersResult.success
        ? membersResult.data.filter(m => {
            const family = churchFamilies.find(f => f.id === m.familyId);
            return family !== undefined;
          })
        : [];

      // Calculate statistics
      const totalCommunicants = churchMembers.filter(m => m.communicant === 'Yes').length;
      const totalBaptised = churchMembers.filter(m => m.baptised === 'Yes').length;

      setStats({
        totalFamilies: churchFamilies.length,
        totalMembers: churchMembers.length,
        totalCommunicants,
        totalBaptised
      });
    } catch (error) {
      console.error('Failed to load statistics');
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentArea(null);
    setFormData({
      areaName: '',
      areaId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (area) => {
    setIsEditMode(true);
    setCurrentArea(area);
    setFormData({
      areaName: area.areaName,
      areaId: area.areaId
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentArea(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For areaId, limit to 3 characters and allow only alphanumeric
    if (name === 'areaId') {
      const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, '');
      const limited = alphanumeric.slice(0, 3);
      setFormData(prev => ({
        ...prev,
        [name]: limited
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode && currentArea) {
        // Update existing area
        setLoadingMessage('Updating area...');
        setIsLoading(true);

        const result = await window.electron.area.update(currentArea.id, formData);

        if (result.success) {
          setAreas(prev => prev.map(area =>
            area.id === currentArea.id
              ? result.data
              : area
          ));
          toast.success('Area updated successfully!');
          closeModal();
        } else {
          toast.error(result.message || 'Failed to update area');
        }
      } else {
        // Create new area
        setLoadingMessage('Creating area...');
        setIsLoading(true);

        const areaData = {
          ...formData,
          churchId: church.id
        };

        const result = await window.electron.area.create(areaData);

        if (result.success) {
          setAreas(prev => [...prev, result.data]);
          toast.success('Area created successfully!');
          closeModal();
        } else {
          toast.error(result.message || 'Failed to create area');
        }
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} area. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (area) => {
    setAreaToDelete(area);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAreaToDelete(null);
  };

  const confirmDelete = async () => {
    if (!areaToDelete) return;

    try {
      setLoadingMessage('Deleting area...');
      setIsLoading(true);
      closeDeleteModal();

      const result = await window.electron.area.delete(areaToDelete.id);

      if (result.success) {
        setAreas(prev => prev.filter(area => area.id !== areaToDelete.id));
        toast.success('Area deleted successfully!');
      } else {
        toast.error(result.message || 'Failed to delete area');
      }
    } catch (error) {
      toast.error('Failed to delete area. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load areas and stats on component mount
  useEffect(() => {
    loadAreas();
    loadStats();
  }, [church]);

  if (!church) {
    return (
      <>
        <TitleBar />
        <StatusBar />
        <div className="church-detail-container">
          <header className="church-detail-header">
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

          <main className="church-detail-main">
            <div className="church-detail-content">
              <h1>Church Not Found</h1>
              <p>The requested church details could not be found.</p>
              <button onClick={() => navigate('/dashboard')} className="back-link-btn">
                Return to Dashboard
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <div className="church-detail-container">
        <header className="church-detail-header">
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

        <main className="church-detail-main">
          <div className="church-detail-content">
            <div className="church-header-info">
              <h1>{church.churchName}</h1>
              <span className="pastorate-short-name">{church.pastorateShortName}</span>
            </div>

            <div className="stats-section">
              <h2 className="section-title">Church Information</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalFamilies}</div>
                  <div className="stat-label">Total Families</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalMembers}</div>
                  <div className="stat-label">Total Members</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalCommunicants}</div>
                  <div className="stat-label">Total Communicants</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalBaptised}</div>
                  <div className="stat-label">Total Baptised</div>
                </div>
              </div>
            </div>

            <div className="areas-section">
              <div className="section-header">
                <h2 className="section-title">Areas</h2>
                <button onClick={openCreateModal} className="create-area-btn">
                  <Plus size={20} weight="bold" />
                  Create Area
                </button>
              </div>
              {areas.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">No areas found. Create your first area to get started.</p>
                </div>
              ) : (
                <div className="area-cards-grid">
                  {areas.map((area) => (
                    <div key={area.id} className="area-card">
                      <div className="area-card-content">
                        <h3 className="area-card-title">{area.areaName}</h3>
                        <p className="area-card-subtitle">Area ID: {area.areaId}</p>
                      </div>
                      <div className="area-card-actions">
                        <button 
                          onClick={() => navigate(`/area/${area.id}`, { state: { area, church } })} 
                          className="area-action-btn view-btn"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => openEditModal(area)} 
                          className="area-action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => openDeleteModal(area)} 
                          className="area-action-btn delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="church-modal"
        overlayClassName="church-modal-overlay"
        contentLabel={isEditMode ? "Edit Area" : "Create Area"}
      >
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Area' : 'Create Area'}</h2>
          <button onClick={closeModal} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="church-form">
          <div className="form-group">
            <label htmlFor="areaName">Area Name</label>
            <input
              type="text"
              id="areaName"
              name="areaName"
              value={formData.areaName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="areaId">Area ID (1-3 alphanumeric characters)</label>
            <input
              type="text"
              id="areaId"
              name="areaId"
              value={formData.areaId}
              onChange={handleInputChange}
              placeholder="e.g., A1, B2, C3"
              maxLength={3}
              required
            />
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
        contentLabel="Delete Area Confirmation"
      >
        <div className="modal-header">
          <h2>Delete Area</h2>
          <button onClick={closeDeleteModal} className="modal-close-btn">&times;</button>
        </div>
        <div className="delete-modal-content">
          <p className="delete-warning">
            Are you sure you want to delete <strong>{areaToDelete?.areaName}</strong>?
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

export default ChurchDetail;

