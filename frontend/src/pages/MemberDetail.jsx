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
    baptismType: '',
    dateOfBaptism: '',
    infantRegisterNumber: '',
    infantChristianName: '',
    infantAbode: '',
    infantTradeProfession: '',
    infantSpiritualFather1: '',
    infantSpiritualMother1: '',
    infantSpiritualFather2: '',
    infantSpiritualMother2: '',
    infantSpiritualFather3: '',
    infantSpiritualMother3: '',
    infantBaptisedPlace: '',
    infantBaptisedBy: '',
    adultRegisterNumber: '',
    adultChristianName: '',
    adultFatherName: '',
    adultAbode: '',
    adultProfession: '',
    adultWitness1: '',
    adultWitness2: '',
    adultWitness3: '',
    adultBaptisedPlace: '',
    adultBaptisedBy: '',
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
      baptismType: member.baptismType || '',
      dateOfBaptism: member.dateOfBaptism || '',
      infantRegisterNumber: member.infantRegisterNumber || '',
      infantChristianName: member.infantChristianName || '',
      infantAbode: member.infantAbode || '',
      infantTradeProfession: member.infantTradeProfession || '',
      infantSpiritualFather1: member.infantSpiritualFather1 || '',
      infantSpiritualMother1: member.infantSpiritualMother1 || '',
      infantSpiritualFather2: member.infantSpiritualFather2 || '',
      infantSpiritualMother2: member.infantSpiritualMother2 || '',
      infantSpiritualFather3: member.infantSpiritualFather3 || '',
      infantSpiritualMother3: member.infantSpiritualMother3 || '',
      infantBaptisedPlace: member.infantBaptisedPlace || '',
      infantBaptisedBy: member.infantBaptisedBy || '',
      adultRegisterNumber: member.adultRegisterNumber || '',
      adultChristianName: member.adultChristianName || '',
      adultFatherName: member.adultFatherName || '',
      adultAbode: member.adultAbode || '',
      adultProfession: member.adultProfession || '',
      adultWitness1: member.adultWitness1 || '',
      adultWitness2: member.adultWitness2 || '',
      adultWitness3: member.adultWitness3 || '',
      adultBaptisedPlace: member.adultBaptisedPlace || '',
      adultBaptisedBy: member.adultBaptisedBy || '',
      isConfirmed: member.isConfirmed || false,
      dateOfConfirmation: member.dateOfConfirmation || '',
      congregationParticipation: member.congregationParticipation || false
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
    } else if (name === 'isAlive' || name === 'isMarried' || name === 'isBaptised' || name === 'isConfirmed' || name === 'congregationParticipation') {
      const boolValue = value === 'true';
      setFormData(prev => ({ ...prev, [name]: boolValue }));
      
      if (name === 'isBaptised' && !boolValue) {
        setFormData(prev => ({ ...prev, baptismType: '' }));
      }
    } else if (name === 'baptismType') {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        if (value === 'Infant') {
          newData.infantChristianName = prev.name;
          
          // Auto-fill Trade/Profession ONLY for Son and Daughter
          if (prev.relation === 'Son' || prev.relation === 'Daughter') {
            let father = members.find(m => m.relation === 'Father' && m.sex === 'Male');
            if (!father) {
              father = members.find(m => m.relation === 'Family Head' && m.sex === 'Male');
            }
            
            if (father && father.occupation) {
              newData.infantTradeProfession = father.occupation;
            }
          }
        } else if (value === 'Adult') {
          newData.adultChristianName = prev.name;
          newData.adultProfession = prev.occupation || '';
        }
        
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        if (name === 'name') {
          if (prev.baptismType === 'Infant' && prev.infantChristianName === prev.name) {
            newData.infantChristianName = value;
          }
          if (prev.baptismType === 'Adult' && prev.adultChristianName === prev.name) {
            newData.adultChristianName = value;
          }
        }
        
        if (name === 'occupation' && prev.baptismType === 'Adult' && prev.adultProfession === prev.occupation) {
          newData.adultProfession = value;
        }
        
        return newData;
      });
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
          <div className="member-page-header">
            <div className="member-title-section">
              <h1>{member.respect}. {member.name}</h1>
              <div className="member-id-badge">Member ID: {member.memberId}</div>
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
            </div>
            <button className="member-edit-btn-top" onClick={openEditModal}>
              <PencilLine size={16} weight="bold" />
              Edit Member
            </button>
          </div>

          <div className="member-info-grid">
            {/* Personal Information */}
            <div className="member-info-card">
              <h3>Personal Information</h3>
              <div className="member-info-item">
                <span className="detail-label">Member Number</span>
                <span className="detail-value">{member.memberNumber || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Relation</span>
                <span className="detail-value">{member.relation || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Sex</span>
                <span className="detail-value">{member.sex || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-value">{member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Age</span>
                <span className="detail-value">{member.age || 'N/A'}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="member-info-card">
              <h3>Contact Information</h3>
              <div className="member-info-item">
                <span className="detail-label">Mobile</span>
                <span className="detail-value">{member.mobile || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Aadhar Number</span>
                <span className="detail-value">{member.aadharNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Professional Information */}
            <div className="member-info-card">
              <h3>Professional Information</h3>
              <div className="member-info-item">
                <span className="detail-label">Occupation</span>
                <span className="detail-value">{member.occupation || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Working Place</span>
                <span className="detail-value">{member.workingPlace || 'N/A'}</span>
              </div>
            </div>

            {/* Marriage Information */}
            {member.isMarried && (
              <div className="member-info-card">
                <h3>Marriage Information</h3>
                <div className="member-info-item">
                  <span className="detail-label">Spouse</span>
                  <span className="detail-value">{spouse ? `${spouse.respect}. ${spouse.name}` : 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Date of Marriage</span>
                  <span className="detail-value">{member.dateOfMarriage ? new Date(member.dateOfMarriage).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Religious Information */}
            <div className="member-info-card">
              <h3>Religious Information</h3>
              <div className="member-info-item">
                <span className="detail-label">Baptised</span>
                <span className="detail-value">{member.isBaptised ? 'Yes' : 'No'}</span>
              </div>
              {member.isBaptised && member.baptismType && (
                <div className="member-info-item">
                  <span className="detail-label">Baptism Type</span>
                  <span className="detail-value">{member.baptismType} Baptism</span>
                </div>
              )}
              {member.isBaptised && (
                <div className="member-info-item">
                  <span className="detail-label">Date of Baptism</span>
                  <span className="detail-value">{member.dateOfBaptism ? new Date(member.dateOfBaptism).toLocaleDateString() : 'N/A'}</span>
                </div>
              )}
              <div className="member-info-item">
                <span className="detail-label">Confirmed</span>
                <span className="detail-value">{member.isConfirmed ? 'Yes' : 'No'}</span>
              </div>
              {member.isConfirmed && (
                <div className="member-info-item">
                  <span className="detail-label">Date of Confirmation</span>
                  <span className="detail-value">{member.dateOfConfirmation ? new Date(member.dateOfConfirmation).toLocaleDateString() : 'N/A'}</span>
                </div>
              )}
              <div className="member-info-item">
                <span className="detail-label">Congregation Participation</span>
                <span className="detail-value">{member.congregationParticipation ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Infant Baptism Details */}
            {member.isBaptised && member.baptismType === 'Infant' && (
              <div className="member-info-card">
                <h3>Infant Baptism Details</h3>
                <div className="member-info-item">
                  <span className="detail-label">Register Number</span>
                  <span className="detail-value">{member.infantRegisterNumber || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Christian Name</span>
                  <span className="detail-value">{member.infantChristianName || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Abode</span>
                  <span className="detail-value">{member.infantAbode || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Trade / Profession</span>
                  <span className="detail-value">{member.infantTradeProfession || 'N/A'}</span>
                </div>
                {(member.infantSpiritualFather1 || member.infantSpiritualMother1) && (
                  <div className="member-info-item">
                    <span className="detail-label">Spiritual Parents 1</span>
                    <span className="detail-value">
                      {[member.infantSpiritualFather1, member.infantSpiritualMother1].filter(Boolean).join(' & ') || 'N/A'}
                    </span>
                  </div>
                )}
                {(member.infantSpiritualFather2 || member.infantSpiritualMother2) && (
                  <div className="member-info-item">
                    <span className="detail-label">Spiritual Parents 2</span>
                    <span className="detail-value">
                      {[member.infantSpiritualFather2, member.infantSpiritualMother2].filter(Boolean).join(' & ') || 'N/A'}
                    </span>
                  </div>
                )}
                {(member.infantSpiritualFather3 || member.infantSpiritualMother3) && (
                  <div className="member-info-item">
                    <span className="detail-label">Spiritual Parents 3</span>
                    <span className="detail-value">
                      {[member.infantSpiritualFather3, member.infantSpiritualMother3].filter(Boolean).join(' & ') || 'N/A'}
                    </span>
                  </div>
                )}
                <div className="member-info-item">
                  <span className="detail-label">Baptised Place</span>
                  <span className="detail-value">{member.infantBaptisedPlace || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Baptised By</span>
                  <span className="detail-value">{member.infantBaptisedBy || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Adult Baptism Details */}
            {member.isBaptised && member.baptismType === 'Adult' && (
              <div className="member-info-card">
                <h3>Adult Baptism Details</h3>
                <div className="member-info-item">
                  <span className="detail-label">Register Number</span>
                  <span className="detail-value">{member.adultRegisterNumber || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Christian Name</span>
                  <span className="detail-value">{member.adultChristianName || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Father Name</span>
                  <span className="detail-value">{member.adultFatherName || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Abode</span>
                  <span className="detail-value">{member.adultAbode || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Profession</span>
                  <span className="detail-value">{member.adultProfession || 'N/A'}</span>
                </div>
                {member.adultWitness1 && (
                  <div className="member-info-item">
                    <span className="detail-label">Witness 1</span>
                    <span className="detail-value">{member.adultWitness1}</span>
                  </div>
                )}
                {member.adultWitness2 && (
                  <div className="member-info-item">
                    <span className="detail-label">Witness 2</span>
                    <span className="detail-value">{member.adultWitness2}</span>
                  </div>
                )}
                {member.adultWitness3 && (
                  <div className="member-info-item">
                    <span className="detail-label">Witness 3</span>
                    <span className="detail-value">{member.adultWitness3}</span>
                  </div>
                )}
                <div className="member-info-item">
                  <span className="detail-label">Baptised Place</span>
                  <span className="detail-value">{member.adultBaptisedPlace || 'N/A'}</span>
                </div>
                <div className="member-info-item">
                  <span className="detail-label">Baptised By</span>
                  <span className="detail-value">{member.adultBaptisedBy || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Family Information */}
            <div className="member-info-card">
              <h3>Family Information</h3>
              <div className="member-info-item">
                <span className="detail-label">Family Name</span>
                <span className="detail-value">{family?.familyName || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Family Number</span>
                <span className="detail-value">{family?.familyNumber || 'N/A'}</span>
              </div>
              <div className="member-info-item">
                <span className="detail-label">Layout Number</span>
                <span className="detail-value">{family?.layoutNumber || 'N/A'}</span>
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
                  <label>Baptism Type</label>
                  <select
                    name="baptismType"
                    value={formData.baptismType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    <option value="Infant">Infant Baptism</option>
                    <option value="Adult">Adult Baptism</option>
                  </select>
                </div>
              )}
            </div>

            {/* Infant Baptism Details */}
            {formData.isBaptised && formData.baptismType === 'Infant' && (
              <>
                <h4 style={{ marginTop: '20px' }}>Infant Baptism Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Register Number</label>
                    <input
                      type="text"
                      name="infantRegisterNumber"
                      value={formData.infantRegisterNumber}
                      onChange={handleInputChange}
                      placeholder="Enter register number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Baptised Date</label>
                    <input
                      type="date"
                      name="dateOfBaptism"
                      value={formData.dateOfBaptism}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Christian Name</label>
                    <input
                      type="text"
                      name="infantChristianName"
                      value={formData.infantChristianName}
                      onChange={handleInputChange}
                      placeholder="Auto-filled from name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Abode</label>
                    <input
                      type="text"
                      name="infantAbode"
                      value={formData.infantAbode}
                      onChange={handleInputChange}
                      placeholder="Enter abode"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Trade / Profession</label>
                  <input
                    type="text"
                    name="infantTradeProfession"
                    value={formData.infantTradeProfession}
                    onChange={handleInputChange}
                    placeholder="Father's profession"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Spiritual Father 1</label>
                    <input
                      type="text"
                      name="infantSpiritualFather1"
                      value={formData.infantSpiritualFather1}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Spiritual Mother 1</label>
                    <input
                      type="text"
                      name="infantSpiritualMother1"
                      value={formData.infantSpiritualMother1}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Spiritual Father 2</label>
                    <input
                      type="text"
                      name="infantSpiritualFather2"
                      value={formData.infantSpiritualFather2}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Spiritual Mother 2</label>
                    <input
                      type="text"
                      name="infantSpiritualMother2"
                      value={formData.infantSpiritualMother2}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Spiritual Father 3</label>
                    <input
                      type="text"
                      name="infantSpiritualFather3"
                      value={formData.infantSpiritualFather3}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Spiritual Mother 3</label>
                    <input
                      type="text"
                      name="infantSpiritualMother3"
                      value={formData.infantSpiritualMother3}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Baptised Place</label>
                    <input
                      type="text"
                      name="infantBaptisedPlace"
                      value={formData.infantBaptisedPlace}
                      onChange={handleInputChange}
                      placeholder="Enter place of baptism"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name of Who Baptised</label>
                    <input
                      type="text"
                      name="infantBaptisedBy"
                      value={formData.infantBaptisedBy}
                      onChange={handleInputChange}
                      placeholder="Enter name"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Adult Baptism Details */}
            {formData.isBaptised && formData.baptismType === 'Adult' && (
              <>
                <h4 style={{ marginTop: '20px' }}>Adult Baptism Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Register Number</label>
                    <input
                      type="text"
                      name="adultRegisterNumber"
                      value={formData.adultRegisterNumber}
                      onChange={handleInputChange}
                      placeholder="Enter register number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Baptised Date</label>
                    <input
                      type="date"
                      name="dateOfBaptism"
                      value={formData.dateOfBaptism}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Christian Name</label>
                    <input
                      type="text"
                      name="adultChristianName"
                      value={formData.adultChristianName}
                      onChange={handleInputChange}
                      placeholder="Auto-filled from name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Father Name</label>
                    <input
                      type="text"
                      name="adultFatherName"
                      value={formData.adultFatherName}
                      onChange={handleInputChange}
                      placeholder="Enter father's name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Abode</label>
                    <input
                      type="text"
                      name="adultAbode"
                      value={formData.adultAbode}
                      onChange={handleInputChange}
                      placeholder="Enter abode"
                    />
                  </div>
                  <div className="form-group">
                    <label>Profession</label>
                    <input
                      type="text"
                      name="adultProfession"
                      value={formData.adultProfession}
                      onChange={handleInputChange}
                      placeholder="Auto-filled from occupation"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Witness 1</label>
                    <input
                      type="text"
                      name="adultWitness1"
                      value={formData.adultWitness1}
                      onChange={handleInputChange}
                      placeholder="Enter witness name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Witness 2</label>
                    <input
                      type="text"
                      name="adultWitness2"
                      value={formData.adultWitness2}
                      onChange={handleInputChange}
                      placeholder="Enter witness name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Witness 3</label>
                    <input
                      type="text"
                      name="adultWitness3"
                      value={formData.adultWitness3}
                      onChange={handleInputChange}
                      placeholder="Enter witness name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Where Baptised</label>
                    <input
                      type="text"
                      name="adultBaptisedPlace"
                      value={formData.adultBaptisedPlace}
                      onChange={handleInputChange}
                      placeholder="Enter place of baptism"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Name of Person by Whom Baptised</label>
                  <input
                    type="text"
                    name="adultBaptisedBy"
                    value={formData.adultBaptisedBy}
                    onChange={handleInputChange}
                    placeholder="Enter name"
                  />
                </div>
              </>
            )}

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

