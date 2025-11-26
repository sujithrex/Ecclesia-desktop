import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import LoadingScreen from '../components/LoadingScreen';
import { Plus, PencilLine } from '@phosphor-icons/react';
import './FamilyDetail.css';

Modal.setAppElement('#root');

const RESPECT_VALUES = ['Mr', 'Mrs', 'Ms', 'Master', 'Rev', 'Dr', 'Er', 'Sis', 'Bishop'];
const RELATION_VALUES = ['Family Head', 'Wife', 'Husband', 'Mother', 'Father', 'Son', 'Daughter', 'Mother in Law', 'Father in Law', 'Son in Law', 'Daughter in Law', 'Grandson', 'Grand daughter', 'Others'];

const FamilyDetail = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const family = location.state?.family;
  const area = location.state?.area;
  const church = location.state?.church;
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isFamilyEditModalOpen, setIsFamilyEditModalOpen] = useState(false);
  const [familyFormData, setFamilyFormData] = useState({
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
  const [formData, setFormData] = useState({
    respect: 'Mr',
    name: '',
    relation: '',
    sex: 'Male',
    memberNumber: '',
    memberId: '',
    dob: '',
    mobile: '',
    aadharNumber: '',
    occupation: '',
    workingPlace: '',
    isAlive: true,
    isMarried: false,
    spouseId: null,
    dateOfMarriage: '',
    isBaptised: false,
    dateOfBaptism: '',
    isConfirmed: false,
    dateOfConfirmation: '',
    congregationParticipation: false
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Congregation', path: '/dashboard' },
    { label: church?.churchName || 'Church', path: `/church/${church?.id}`, state: { church } },
    { label: area?.areaName || 'Area', path: `/area/${area?.id}`, state: { area, church } },
    { label: family?.familyName || 'Family Details' }
  ];

  const loadMembers = async () => {
    if (!family) return;

    try {
      setLoadingMessage('Loading members...');
      setIsLoading(true);

      const result = await window.electron.member.getByFamily(family.id);

      if (result.success) {
        setMembers(result.data);
      } else {
        toast.error('Failed to load members');
      }
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const openFamilyEditModal = () => {
    setFamilyFormData({
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
    setIsFamilyEditModalOpen(true);
  };

  const closeFamilyEditModal = () => {
    setIsFamilyEditModalOpen(false);
  };

  const handleFamilyInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'familyNumber' || name === 'layoutNumber') {
      if (value.length <= 3 && /^\d*$/.test(value)) {
        setFamilyFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFamilyFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFamilySubmit = async (e) => {
    e.preventDefault();

    if (!familyFormData.familyName.trim()) {
      toast.error('Family name is required');
      return;
    }

    if (!familyFormData.familyPhone.trim()) {
      toast.error('Family phone is required');
      return;
    }

    if (familyFormData.familyNumber && familyFormData.familyNumber.length !== 3) {
      toast.error('Family number must be exactly 3 digits');
      return;
    }

    if (familyFormData.layoutNumber && familyFormData.layoutNumber.length !== 3) {
      toast.error('Layout number must be exactly 3 digits');
      return;
    }

    try {
      setLoadingMessage('Updating family...');
      setIsLoading(true);

      const result = await window.electron.family.update(family.id, familyFormData);

      if (result.success) {
        toast.success('Family updated successfully');
        closeFamilyEditModal();
        // Update local family state
        Object.assign(family, familyFormData);
      } else {
        toast.error(result.message || 'Failed to update family');
      }
    } catch (error) {
      toast.error('Failed to update family');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = async () => {
    setIsEditMode(false);
    setCurrentMember(null);
    
    try {
      const result = await window.electron.member.getAutoNumbers(family.id);
      if (result.success) {
        setFormData({
          respect: 'Mr',
          name: '',
          relation: '',
          sex: 'Male',
          memberNumber: result.data.memberNumber,
          memberId: result.data.memberId,
          dob: '',
          mobile: '',
          aadharNumber: '',
          occupation: '',
          workingPlace: '',
          isAlive: true,
          isMarried: false,
          spouseId: null,
          dateOfMarriage: '',
          isBaptised: false,
          dateOfBaptism: '',
          isConfirmed: false,
          dateOfConfirmation: '',
          congregationParticipation: false
        });
      }
    } catch (error) {
      setFormData({
        respect: 'Mr',
        name: '',
        relation: '',
        sex: 'Male',
        memberNumber: '',
        memberId: '',
        dob: '',
        mobile: '',
        aadharNumber: '',
        occupation: '',
        workingPlace: '',
        isAlive: true,
        isMarried: false,
        spouseId: null,
        dateOfMarriage: '',
        isBaptised: false,
        dateOfBaptism: '',
        isConfirmed: false,
        dateOfConfirmation: '',
        congregationParticipation: false
      });
    }
    
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setIsEditMode(true);
    setCurrentMember(member);
    setFormData({
      respect: member.respect || 'Mr',
      name: member.name,
      relation: member.relation,
      sex: member.sex || 'Male',
      memberNumber: member.memberNumber,
      memberId: member.memberId,
      dob: member.dob || '',
      mobile: member.mobile || '',
      aadharNumber: member.aadharNumber || '',
      occupation: member.occupation || '',
      workingPlace: member.workingPlace || '',
      isAlive: member.isAlive !== undefined ? member.isAlive : true,
      isMarried: member.isMarried || false,
      spouseId: member.spouseId || null,
      dateOfMarriage: member.dateOfMarriage || '',
      isBaptised: member.isBaptised || false,
      dateOfBaptism: member.dateOfBaptism || '',
      isConfirmed: member.isConfirmed || false,
      dateOfConfirmation: member.dateOfConfirmation || '',
      congregationParticipation: member.congregationParticipation || false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMember(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'memberNumber' || name === 'memberId') {
      if (value.length <= 2 && /^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'isAlive' || name === 'isMarried' || name === 'isBaptised' || name === 'isConfirmed' || name === 'congregationParticipation') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.relation.trim()) {
      toast.error('Relation is required');
      return;
    }

    if (formData.memberNumber && formData.memberNumber.length !== 2) {
      toast.error('Member number must be exactly 2 digits');
      return;
    }

    try {
      setLoadingMessage(isEditMode ? 'Updating member...' : 'Creating member...');
      setIsLoading(true);

      const memberData = {
        ...formData,
        familyId: family.id,
        spouseId: formData.spouseId || null
      };

      let result;
      if (isEditMode) {
        result = await window.electron.member.update(currentMember.id, memberData);
      } else {
        result = await window.electron.member.create(memberData);
      }

      if (result.success) {
        // Update spouse if spouse is selected
        if (formData.spouseId) {
          const spouseId = parseInt(formData.spouseId);
          const spouse = members.find(m => m.id === spouseId);

          if (spouse) {
            const updatedMemberId = isEditMode ? currentMember.id : result.data.id;

            // Update spouse to be married with same marriage date
            await window.electron.member.update(spouseId, {
              ...spouse,
              isMarried: true,
              spouseId: updatedMemberId,
              dateOfMarriage: formData.dateOfMarriage || ''
            });
          }
        }

        // If previously had a spouse but now changed or removed
        if (isEditMode && currentMember.spouseId && currentMember.spouseId !== formData.spouseId) {
          const oldSpouse = members.find(m => m.id === currentMember.spouseId);
          if (oldSpouse) {
            // Clear old spouse's marriage info
            await window.electron.member.update(currentMember.spouseId, {
              ...oldSpouse,
              isMarried: false,
              spouseId: null,
              dateOfMarriage: ''
            });
          }
        }

        toast.success(isEditMode ? 'Member updated successfully' : 'Member created successfully');
        closeModal();
        await loadMembers();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      setLoadingMessage('Deleting member...');
      setIsLoading(true);
      closeDeleteModal();

      const result = await window.electron.member.delete(memberToDelete.id);

      if (result.success) {
        toast.success('Member deleted successfully');
        await loadMembers();
      } else {
        toast.error('Failed to delete member');
      }
    } catch (error) {
      toast.error('Failed to delete member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMember = (member) => {
    navigate(`/area/${area.id}/family/${family.id}/member/${member.id}`, {
      state: { member, family, area, church }
    });
  };

  useEffect(() => {
    if (!church || !area || !family) {
      navigate('/dashboard');
      return;
    }

    loadMembers();
  }, []);

  if (!church || !area || !family) {
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
          <div className="family-header">
            <h1>{family.respect}. {family.familyName}</h1>
            <button className="family-edit-btn-top" onClick={openFamilyEditModal}>
              <PencilLine size={16} weight="bold" />
              Edit Family
            </button>
          </div>

          <div className="family-info-section">
            <div className="family-info-grid-4col">
              <div className="family-info-item">
                <span className="detail-label">Family Number</span>
                <span className="detail-value">{family.familyNumber || 'N/A'}</span>
              </div>
              <div className="family-info-item">
                <span className="detail-label">Layout Number</span>
                <span className="detail-value">{family.layoutNumber || 'N/A'}</span>
              </div>
              <div className="family-info-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{family.familyPhone || 'N/A'}</span>
              </div>
              <div className="family-info-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{family.familyEmail || 'N/A'}</span>
              </div>
              <div className="family-info-item family-info-item-span-2">
                <span className="detail-label">Prayer Points</span>
                <span className="detail-value">{family.prayerPoints || 'N/A'}</span>
              </div>
              <div className="family-info-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">{family.familyAddress || 'N/A'}</span>
              </div>
              <div className="family-info-item">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{family.notes || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="areas-section">
            <div className="section-header">
              <h2 className="section-title">Members</h2>
              <button className="create-area-btn" onClick={openCreateModal}>
                <Plus size={20} weight="bold" />
                Create Member
              </button>
            </div>

            {members.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No members found. Create your first member to get started.</p>
              </div>
            ) : (
              <div className="member-cards-grid">
                {members.map((member) => (
                  <div key={member.id} className="member-card">
                    <div className="member-card-header">
                      <div className="member-card-title">
                        {member.respect}. {member.name}
                      </div>
                    </div>
                    <div className="member-card-info">
                      <p className="member-card-relation">{member.relation || 'N/A'}</p>
                      <div className="member-card-badges">
                        {member.isBaptised && <span className="member-badge baptised">Baptised</span>}
                        {member.isConfirmed && <span className="member-badge confirmed">Confirmed</span>}
                      </div>
                    </div>
                    <div className="member-card-actions">
                      <button 
                        onClick={() => handleViewMember(member)} 
                        className="member-action-btn view-btn"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => openEditModal(member)} 
                        className="member-action-btn edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openDeleteModal(member)} 
                        className="member-action-btn delete-btn"
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

    {/* Edit Family Modal */}
      <Modal
        isOpen={isFamilyEditModalOpen}
        onRequestClose={closeFamilyEditModal}
        className="church-modal"
        overlayClassName="church-modal-overlay"
      >
        <div className="modal-header">
          <h2>Edit Family</h2>
          <button className="modal-close-btn" onClick={closeFamilyEditModal}>&times;</button>
        </div>
        <form onSubmit={handleFamilySubmit} className="church-form">
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>Respect <span className="required">*</span></label>
                <select
                  name="respect"
                  value={familyFormData.respect}
                  onChange={handleFamilyInputChange}
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
                  value={familyFormData.familyName}
                  onChange={handleFamilyInputChange}
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
                  value={familyFormData.familyNumber}
                  onChange={handleFamilyInputChange}
                  maxLength="3"
                />
              </div>
              <div className="form-group">
                <label>Layout Number (3 digits)</label>
                <input
                  type="text"
                  name="layoutNumber"
                  value={familyFormData.layoutNumber}
                  onChange={handleFamilyInputChange}
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
                  value={familyFormData.familyPhone}
                  onChange={handleFamilyInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="familyEmail"
                  value={familyFormData.familyEmail}
                  onChange={handleFamilyInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="familyAddress"
                value={familyFormData.familyAddress}
                onChange={handleFamilyInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={familyFormData.notes}
                onChange={handleFamilyInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Prayer Points</label>
              <textarea
                name="prayerPoints"
                value={familyFormData.prayerPoints}
                onChange={handleFamilyInputChange}
                rows="3"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={closeFamilyEditModal}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="church-modal modal-large"
        overlayClassName="church-modal-overlay"
      >
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Member' : 'Create Member'}</h2>
          <button className="modal-close-btn" onClick={closeModal}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="church-form">
          <div className="modal-body">
            {/* Basic Information */}
            <h4>Basic Information</h4>
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
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Relation <span className="required">*</span></label>
                <select
                  name="relation"
                  value={formData.relation}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Relation</option>
                  {RELATION_VALUES.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sex <span className="required">*</span></label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Member Number (2 digits)</label>
                <input
                  type="text"
                  name="memberNumber"
                  value={formData.memberNumber}
                  onChange={handleInputChange}
                  placeholder="Auto-generated"
                  maxLength="2"
                />
              </div>
              <div className="form-group">
                <label>Member ID (2 digits)</label>
                <input
                  type="text"
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleInputChange}
                  placeholder="Auto-generated"
                  maxLength="2"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Aadhar Number</label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="isAlive"
                  value={formData.isAlive ? 'true' : 'false'}
                  onChange={handleInputChange}
                >
                  <option value="true">Alive</option>
                  <option value="false">Deceased</option>
                </select>
              </div>
            </div>

            {/* Professional Information */}
            <h4>Professional Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Working Place</label>
                <input
                  type="text"
                  name="workingPlace"
                  value={formData.workingPlace}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Marriage Information */}
            <h4>Marriage Information</h4>
            <div className="form-group">
              <label>Marital Status</label>
              <select
                name="isMarried"
                value={formData.isMarried ? 'true' : 'false'}
                onChange={handleInputChange}
              >
                <option value="false">Single</option>
                <option value="true">Married</option>
              </select>
            </div>

            {formData.isMarried && (
              <div className="form-row">
                <div className="form-group">
                  <label>Spouse</label>
                  <select
                    name="spouseId"
                    value={formData.spouseId || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Spouse</option>
                    {members
                      .filter(m => m.id !== currentMember?.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.respect}. {m.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Marriage</label>
                  <input
                    type="date"
                    name="dateOfMarriage"
                    value={formData.dateOfMarriage}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Religious Information */}
            <h4>Religious Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Baptised</label>
                <select
                  name="isBaptised"
                  value={formData.isBaptised ? 'true' : 'false'}
                  onChange={handleInputChange}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              {formData.isBaptised && (
                <div className="form-group">
                  <label>Date of Baptism</label>
                  <input
                    type="date"
                    name="dateOfBaptism"
                    value={formData.dateOfBaptism}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Confirmed</label>
                <select
                  name="isConfirmed"
                  value={formData.isConfirmed ? 'true' : 'false'}
                  onChange={handleInputChange}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              {formData.isConfirmed && (
                <div className="form-group">
                  <label>Date of Confirmation</label>
                  <input
                    type="date"
                    name="dateOfConfirmation"
                    value={formData.dateOfConfirmation}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            {/* Congregation Participation */}
            <h4>Congregation Participation</h4>
            <div className="form-group">
              <label>Congregation Participation (அயலிடம்)</label>
              <select
                name="congregationParticipation"
                value={formData.congregationParticipation ? 'true' : 'false'}
                onChange={handleInputChange}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {isEditMode ? 'Update' : 'Create'}
              </button>
            </div>
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
            Are you sure you want to delete the member <strong>{memberToDelete?.name}</strong>?
          </p>
          <p className="delete-subtext">This action cannot be undone.</p>
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

export default FamilyDetail;

