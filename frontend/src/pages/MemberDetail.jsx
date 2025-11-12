import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import Breadcrumb from '../components/Breadcrumb';
import LoadingScreen from '../components/LoadingScreen';
import { PencilLine, User } from '@phosphor-icons/react';
import './MemberDetail.css';

Modal.setAppElement('#root');

const RESPECT_VALUES = ['Mr', 'Mrs', 'Ms', 'Master', 'Rev', 'Dr', 'Er', 'Sis', 'Bishop'];

const MemberDetail = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const member = location.state?.member;
  const family = location.state?.family;
  const area = location.state?.area;
  const church = location.state?.church;
  const [members, setMembers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
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
    dateOfConfirmation: ''
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
    { label: family?.familyName || 'Family', path: `/area/${area?.id}/family/${family?.id}`, state: { family, area, church } },
    { label: member?.name || 'Member Details' }
  ];

  const loadFamilyMembers = async () => {
    if (!family) return;

    try {
      const result = await window.electron.member.getByFamily(family.id);
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Failed to load family members');
    }
  };

  const openEditModal = () => {
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
      dateOfConfirmation: member.dateOfConfirmation || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'memberNumber') {
      if (value.length <= 2 && /^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'isAlive' || name === 'isMarried' || name === 'isBaptised' || name === 'isConfirmed') {
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
      setLoadingMessage('Updating member...');
      setIsLoading(true);

      const memberData = {
        ...formData,
        familyId: family.id,
        spouseId: formData.spouseId || null
      };

      const result = await window.electron.member.update(member.id, memberData);

      if (result.success) {
        toast.success('Member updated successfully');
        closeEditModal();
        // Update local member state
        Object.assign(member, formData);
      } else {
        toast.error(result.message || 'Failed to update member');
      }
    } catch (error) {
      toast.error('Failed to update member');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!church || !area || !family || !member) {
      navigate('/dashboard');
      return;
    }

    loadFamilyMembers();
  }, []);

  if (!church || !area || !family || !member) {
    return null;
  }

  const spouse = members.find(m => m.id === member.spouseId);

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
          <h1>{member.respect}. {member.name}</h1>

          <div className="member-header-section">
            <div className="member-avatar">
              <User size={80} weight="light" />
            </div>
            <div className="member-badges">
              {member.isAlive ? (
                <span className="badge badge-alive">Alive</span>
              ) : (
                <span className="badge badge-deceased">Deceased</span>
              )}
              {member.isMarried && <span className="badge badge-married">Married</span>}
              {member.isBaptised && <span className="badge badge-baptised">Baptised</span>}
              {member.isConfirmed && <span className="badge badge-confirmed">Confirmed</span>}
            </div>
            <div className="member-id-display">
              <strong>Member ID:</strong> {member.memberId}
            </div>
          </div>

          <div className="detail-grid">
            {/* Personal Information */}
            <div className="detail-card">
              <h3>Personal Information</h3>
              <div className="detail-row">
                <span className="detail-label">Member Number:</span>
                <span className="detail-value">{member.memberNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Relation:</span>
                <span className="detail-value">{member.relation || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sex:</span>
                <span className="detail-value">{member.sex || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age:</span>
                <span className="detail-value">{member.age || 'N/A'}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="detail-card">
              <h3>Contact Information</h3>
              <div className="detail-row">
                <span className="detail-label">Mobile:</span>
                <span className="detail-value">{member.mobile || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Aadhar Number:</span>
                <span className="detail-value">{member.aadharNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Professional Information */}
            <div className="detail-card">
              <h3>Professional Information</h3>
              <div className="detail-row">
                <span className="detail-label">Occupation:</span>
                <span className="detail-value">{member.occupation || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Working Place:</span>
                <span className="detail-value">{member.workingPlace || 'N/A'}</span>
              </div>
            </div>

            {/* Marriage Information */}
            {member.isMarried && (
              <div className="detail-card">
                <h3>Marriage Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Spouse:</span>
                  <span className="detail-value">{spouse ? `${spouse.respect}. ${spouse.name}` : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date of Marriage:</span>
                  <span className="detail-value">{member.dateOfMarriage ? new Date(member.dateOfMarriage).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Religious Information */}
            <div className="detail-card">
              <h3>Religious Information</h3>
              <div className="detail-row">
                <span className="detail-label">Baptised:</span>
                <span className="detail-value">{member.isBaptised ? 'Yes' : 'No'}</span>
              </div>
              {member.isBaptised && (
                <div className="detail-row">
                  <span className="detail-label">Date of Baptism:</span>
                  <span className="detail-value">{member.dateOfBaptism ? new Date(member.dateOfBaptism).toLocaleDateString() : 'N/A'}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Confirmed:</span>
                <span className="detail-value">{member.isConfirmed ? 'Yes' : 'No'}</span>
              </div>
              {member.isConfirmed && (
                <div className="detail-row">
                  <span className="detail-label">Date of Confirmation:</span>
                  <span className="detail-value">{member.dateOfConfirmation ? new Date(member.dateOfConfirmation).toLocaleDateString() : 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Family Information */}
            <div className="detail-card">
              <div className="detail-row">
                <span className="detail-label">Family Name:</span>
                <span className="detail-value">{family?.familyName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Family Number:</span>
                <span className="detail-value">{family?.familyNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Layout Number:</span>
                <span className="detail-value">{family?.layoutNumber || 'N/A'}</span>
              </div>
              <div className="detail-row" style={{ borderBottom: 'none', paddingTop: '20px' }}>
                <button className="create-area-btn" onClick={openEditModal} style={{ width: '100%' }}>
                  <PencilLine size={20} weight="bold" />
                  Edit Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        className="church-modal modal-large"
        overlayClassName="church-modal-overlay"
      >
        <div className="modal-header">
          <h2>Edit Member</h2>
          <button className="modal-close-btn" onClick={closeEditModal}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="church-form">
          <div>
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
                <input
                  type="text"
                  name="relation"
                  value={formData.relation}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sex <span className="required">*</span></label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="sex"
                      value="Male"
                      checked={formData.sex === 'Male'}
                      onChange={handleInputChange}
                    />
                    Male
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="sex"
                      value="Female"
                      checked={formData.sex === 'Female'}
                      onChange={handleInputChange}
                    />
                    Female
                  </label>
                </div>
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
                  maxLength="2"
                />
              </div>
              <div className="form-group">
                <label>Member ID</label>
                <input
                  type="text"
                  name="memberId"
                  value={formData.memberId}
                  readOnly
                  disabled
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
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="isAlive"
                      value="true"
                      checked={formData.isAlive === true}
                      onChange={handleInputChange}
                    />
                    Alive
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="isAlive"
                      value="false"
                      checked={formData.isAlive === false}
                      onChange={handleInputChange}
                    />
                    Deceased
                  </label>
                </div>
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
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="isMarried"
                    value="false"
                    checked={formData.isMarried === false}
                    onChange={handleInputChange}
                  />
                  Single
                </label>
                <label>
                  <input
                    type="radio"
                    name="isMarried"
                    value="true"
                    checked={formData.isMarried === true}
                    onChange={handleInputChange}
                  />
                  Married
                </label>
              </div>
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
                      .filter(m => m.id !== member.id)
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
            <div className="form-group">
              <label>Baptised</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="isBaptised"
                    value="false"
                    checked={formData.isBaptised === false}
                    onChange={handleInputChange}
                  />
                  No
                </label>
                <label>
                  <input
                    type="radio"
                    name="isBaptised"
                    value="true"
                    checked={formData.isBaptised === true}
                    onChange={handleInputChange}
                  />
                  Yes
                </label>
              </div>
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

            <div className="form-group">
              <label>Confirmed</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="isConfirmed"
                    value="false"
                    checked={formData.isConfirmed === false}
                    onChange={handleInputChange}
                  />
                  No
                </label>
                <label>
                  <input
                    type="radio"
                    name="isConfirmed"
                    value="true"
                    checked={formData.isConfirmed === true}
                    onChange={handleInputChange}
                  />
                  Yes
                </label>
              </div>
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
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={closeEditModal}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Update
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MemberDetail;

