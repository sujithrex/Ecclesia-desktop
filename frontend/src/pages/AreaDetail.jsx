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
import './AreaDetail.css';

Modal.setAppElement('#root');

const RESPECT_VALUES = ['Mr', 'Mrs', 'Ms', 'Master', 'Rev', 'Dr', 'Er', 'Sis', 'Bishop'];

const AreaDetail = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const area = location.state?.area;
  const church = location.state?.church;
  const [families, setFamilies] = useState([]);
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalMembers: 0,
    totalCommunicants: 0,
    totalBaptised: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentFamily, setCurrentFamily] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [familyToDelete, setFamilyToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const [formData, setFormData] = useState({
    respect: 'Mr',
    familyName: '',
    familyNumber: '',
    layoutNumber: '',
    familyPhone: '',
    familyEmail: '',
    familyAddress: '',
    notes: '',
    prayerPoints: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Congregation', path: '/dashboard' },
    { label: church?.churchName || 'Church', path: `/church/${church?.id}`, state: { church } },
    { label: area?.areaName || 'Area Details' }
  ];

  const loadFamilies = async () => {
    if (!area) return;

    try {
      setLoadingMessage('Loading families...');
      setIsLoading(true);

      const result = await window.electron.family.getByArea(area.id);

      if (result.success) {
        setFamilies(result.data);
      } else {
        toast.error('Failed to load families');
      }
    } catch (error) {
      toast.error('Failed to load families');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!area) return;

    try {
      // Get all families for this area
      const familiesResult = await window.electron.family.getByArea(area.id);
      const areaFamilies = familiesResult.success ? familiesResult.data : [];

      // Get all members for this area
      const membersResult = await window.electron.member.getAll();
      const areaMembers = membersResult.success
        ? membersResult.data.filter(m => {
            const family = areaFamilies.find(f => f.id === m.familyId);
            return family !== undefined;
          })
        : [];

      // Calculate statistics
      const totalCommunicants = areaMembers.filter(m => m.communicant === 'Yes').length;
      const totalBaptised = areaMembers.filter(m => m.baptised === 'Yes').length;

      setStats({
        totalFamilies: areaFamilies.length,
        totalMembers: areaMembers.length,
        totalCommunicants,
        totalBaptised
      });
    } catch (error) {
      console.error('Failed to load statistics');
    }
  };

  const openCreateModal = async () => {
    setIsEditMode(false);
    setCurrentFamily(null);
    
    // Get auto-generated numbers
    try {
      const result = await window.electron.family.getAutoNumbers(area.id);
      if (result.success) {
        setFormData({
          respect: 'Mr',
          familyName: '',
          familyNumber: result.data.familyNumber,
          layoutNumber: result.data.layoutNumber,
          familyPhone: '',
          familyEmail: '',
          familyAddress: '',
          notes: '',
          prayerPoints: ''
        });
      }
    } catch (error) {
      setFormData({
        respect: 'Mr',
        familyName: '',
        familyNumber: '',
        layoutNumber: '',
        familyPhone: '',
        familyEmail: '',
        familyAddress: '',
        notes: '',
        prayerPoints: ''
      });
    }
    
    setIsModalOpen(true);
  };

  const openEditModal = (family) => {
    setIsEditMode(true);
    setCurrentFamily(family);
    setFormData({
      respect: family.respect || 'Mr',
      familyName: family.familyName,
      familyNumber: family.familyNumber,
      layoutNumber: family.layoutNumber,
      familyPhone: family.familyPhone,
      familyEmail: family.familyEmail || '',
      familyAddress: family.familyAddress || '',
      notes: family.notes || '',
      prayerPoints: family.prayerPoints || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentFamily(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For familyNumber and layoutNumber, limit to 3 digits
    if (name === 'familyNumber' || name === 'layoutNumber') {
      if (value.length <= 3 && /^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.familyName.trim()) {
      toast.error('Family name is required');
      return;
    }

    if (!formData.familyPhone.trim()) {
      toast.error('Family phone is required');
      return;
    }

    if (formData.familyNumber && formData.familyNumber.length !== 3) {
      toast.error('Family number must be exactly 3 digits');
      return;
    }

    if (formData.layoutNumber && formData.layoutNumber.length !== 3) {
      toast.error('Layout number must be exactly 3 digits');
      return;
    }

    try {
      setLoadingMessage(isEditMode ? 'Updating family...' : 'Creating family...');
      setIsLoading(true);

      const familyData = {
        ...formData,
        areaId: area.id
      };

      let result;
      if (isEditMode) {
        result = await window.electron.family.update(currentFamily.id, familyData);
      } else {
        result = await window.electron.family.create(familyData);
      }

      if (result.success) {
        toast.success(isEditMode ? 'Family updated successfully' : 'Family created successfully');
        closeModal();
        
        if (isEditMode) {
          // If editing, just reload the families list
          await loadFamilies();
        } else {
          // If creating new family, redirect to the family detail page
          navigate(`/area/${area.id}/family/${result.data.id}`, { 
            state: { 
              family: result.data, 
              area: area,
              church: church 
            } 
          });
        }
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (family) => {
    setFamilyToDelete(family);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setFamilyToDelete(null);
  };

  const handleDelete = async () => {
    if (!familyToDelete) return;

    try {
      setLoadingMessage('Deleting family...');
      setIsLoading(true);
      closeDeleteModal();

      const result = await window.electron.family.delete(familyToDelete.id);

      if (result.success) {
        toast.success('Family deleted successfully');
        await loadFamilies();
      } else {
        toast.error('Failed to delete family');
      }
    } catch (error) {
      toast.error('Failed to delete family');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFamily = (family) => {
    navigate(`/area/${area.id}/family/${family.id}`, { 
      state: { family, area, church } 
    });
  };

  useEffect(() => {
    if (!church || !area) {
      navigate('/dashboard');
      return;
    }

    loadFamilies();
    loadStats();
  }, []);

  // Filter families based on search term
  const filteredFamilies = families.filter(family => {
    const searchLower = searchTerm.toLowerCase();
    const familyName = `${family.respect || ''} ${family.familyName || ''}`.toLowerCase();
    const familyNumber = (family.familyNumber || '').toString().toLowerCase();
    const phone = (family.familyPhone || '').toLowerCase();
    
    return familyName.includes(searchLower) || 
           familyNumber.includes(searchLower) || 
           phone.includes(searchLower);
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredFamilies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFamilies = filteredFamilies.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!church || !area) {
    return null;
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
          <div className="area-header-row">
            <h1>{area.areaName}</h1>
            <h2 className="section-title">Area Information</h2>
          </div>

          <div className="stats-section">
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
              <h2 className="section-title">Families</h2>
              <button className="create-area-btn" onClick={openCreateModal}>
                <Plus size={20} weight="bold" />
                Create Family
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search families by name, number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Family Cards */}
            {currentFamilies.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">
                  {searchTerm ? 'No families found matching your search.' : 'No families found. Create your first family to get started.'}
                </p>
              </div>
            ) : (
              <>
                <div className="family-cards-grid">
                  {currentFamilies.map((family) => (
                    <div key={family.id} className="family-card">
                      <div className="family-card-header">
                        <div className="family-card-title">
                          {family.respect}. {family.familyName}
                        </div>
                        <div className="family-card-number">
                          {family.familyNumber || 'N/A'}
                        </div>
                      </div>
                      <div className="family-card-info">
                        <p className="family-card-phone">{family.familyPhone || 'No phone'}</p>
                        {family.layoutNumber && (
                          <p className="family-card-layout">Layout: {family.layoutNumber}</p>
                        )}
                      </div>
                      <div className="family-card-actions">
                        <button 
                          onClick={() => handleViewFamily(family)} 
                          className="family-action-btn view-btn"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => openEditModal(family)} 
                          className="family-action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => openDeleteModal(family)} 
                          className="family-action-btn delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <div className="pagination-info">
                      Page {currentPage} of {totalPages} ({filteredFamilies.length} families)
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>

    {/* Create/Edit Family Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="church-modal"
        overlayClassName="church-modal-overlay"
      >
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Family' : 'Create Family'}</h2>
          <button className="modal-close-btn" onClick={closeModal}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="church-form">
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>Respect <span className="required">*</span></label>
                <select
                  name="respect"
                  value={formData.respect}
                  onChange={handleInputChange}
                  required
                >
                  {RESPECT_VALUES.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Family Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="familyName"
                  value={formData.familyName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Family Number (3 digits)</label>
                <input
                  type="text"
                  name="familyNumber"
                  value={formData.familyNumber}
                  onChange={handleInputChange}
                  placeholder="Auto-generated"
                  maxLength="3"
                />
              </div>
              <div className="form-group">
                <label>Layout Number (3 digits)</label>
                <input
                  type="text"
                  name="layoutNumber"
                  value={formData.layoutNumber}
                  onChange={handleInputChange}
                  placeholder="Auto-generated"
                  maxLength="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone <span className="required">*</span></label>
                <input
                  type="text"
                  name="familyPhone"
                  value={formData.familyPhone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="familyEmail"
                  value={formData.familyEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="familyAddress"
                value={formData.familyAddress}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Prayer Points</label>
              <textarea
                name="prayerPoints"
                value={formData.prayerPoints}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        className="church-modal"
        overlayClassName="church-modal-overlay"
      >
        <div className="modal-header">
          <h2>Confirm Delete</h2>
          <button className="modal-close-btn" onClick={closeDeleteModal}>&times;</button>
        </div>
        <div className="delete-modal-content">
          <p className="delete-warning">
            Are you sure you want to delete the family <strong>{familyToDelete?.familyName}</strong>?
          </p>
          <p className="delete-subtext">This will also delete all members associated with this family. This action cannot be undone.</p>
          <div className="form-actions">
            <button className="cancel-btn" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button className="delete-confirm-btn" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AreaDetail;

