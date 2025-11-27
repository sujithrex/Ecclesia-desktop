import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { Eye, Trash, ArrowClockwise, PencilSimple } from '@phosphor-icons/react';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import './ReportPage.css';
import './BurialRegister.css';

const BurialCertificate = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // State management
  const [registers, setRegisters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [registerToDelete, setRegisterToDelete] = useState(null);
  const [editingRegister, setEditingRegister] = useState(null);
  const [formData, setFormData] = useState({
    certificate_number: '',
    pastorate_name: '',
    date_of_death: '',
    when_buried: '',
    name_of_person_died: '',
    sex: 'male',
    age: '',
    profession: '',
    cause_of_death: '',
    father_name: '',
    mother_name: '',
    where_buried: '',
    signature_who_buried: '',
    certified_rev_name: '',
    holding_office: '',
    certificate_date: '',
    certificate_place: '',
    church_id: null
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Burial Certificate' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Load registers and next certificate number on mount
  useEffect(() => {
    loadRegisters();
    loadNextCertificateNumber();
  }, []);

  const loadRegisters = async () => {
    try {
      setLoadingMessage('Loading registers...');
      setIsLoading(true);

      const result = await window.electron.burialRegister.getAll();

      if (result.success) {
        setRegisters(result.data);
      } else {
        toast.error('Failed to load registers');
      }
    } catch (error) {
      toast.error('Failed to load registers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextCertificateNumber = async () => {
    try {
      // For now, use a default church ID of 1
      // In a full implementation, this would come from the selected church
      const result = await window.electron.burialRegister.getNextNumber(1);

      if (result.success) {
        setFormData(prev => ({ ...prev, certificate_number: result.data, church_id: 1 }));
      }
    } catch (error) {
      console.error('Error loading next certificate number:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRefresh = () => {
    loadRegisters();
  };

  const validateForm = () => {
    const requiredFields = [
      'certificate_number', 'pastorate_name', 'date_of_death', 'when_buried',
      'name_of_person_died', 'sex', 'age', 'cause_of_death',
      'father_name', 'mother_name', 'where_buried', 'signature_who_buried',
      'certified_rev_name', 'holding_office', 'certificate_date', 'certificate_place'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in ${field.replace(/_/g, ' ')}`);
        return false;
      }
    }
    return true;
  };

  const handleSaveRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoadingMessage('Saving register...');
      setIsLoading(true);

      const result = await window.electron.burialRegister.create(formData);

      if (result.success) {
        toast.success('Register saved successfully!');
        resetForm();
        loadRegisters();
        loadNextCertificateNumber();
      } else {
        toast.error(result.message || 'Failed to save register');
      }
    } catch (error) {
      toast.error('Failed to save register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPDF = async () => {
    if (!validateForm()) return;

    try {
      setLoadingMessage('Generating PDF...');
      setIsLoading(true);

      // First save the register
      const saveResult = await window.electron.burialRegister.create(formData);

      if (!saveResult.success) {
        toast.error(saveResult.message || 'Failed to save register');
        return;
      }

      // Generate and open PDF
      const pdfResult = await window.electron.burialRegister.generatePDF(saveResult.data.id);

      if (pdfResult.success) {
        toast.success('PDF generated and opened successfully!');
        resetForm();
        loadRegisters();
        loadNextCertificateNumber();
      } else {
        toast.error(pdfResult.message || 'Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegister = async (id) => {
    try {
      setLoadingMessage('Deleting register...');
      setIsLoading(true);

      const result = await window.electron.burialRegister.delete(id);

      if (result.success) {
        toast.success('Register deleted successfully');
        loadRegisters();
      } else {
        toast.error(result.message || 'Failed to delete register');
      }
    } catch (error) {
      toast.error('Failed to delete register');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      certificate_number: '',
      pastorate_name: '',
      date_of_death: '',
      when_buried: '',
      name_of_person_died: '',
      sex: 'male',
      age: '',
      profession: '',
      cause_of_death: '',
      father_name: '',
      mother_name: '',
      where_buried: '',
      signature_who_buried: '',
      certified_rev_name: '',
      holding_office: '',
      certificate_date: '',
      certificate_place: '',
      church_id: 1
    });
  };

  const openEditModal = (register) => {
    setEditingRegister(register);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRegister(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingRegister(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateRegister = async () => {
    if (!editingRegister) return;

    // Validate required fields
    const requiredFields = [
      'certificate_number', 'pastorate_name', 'date_of_death', 'when_buried',
      'name_of_person_died', 'sex', 'age', 'cause_of_death',
      'father_name', 'mother_name', 'where_buried', 'signature_who_buried',
      'certified_rev_name', 'holding_office', 'certificate_date', 'certificate_place'
    ];

    for (const field of requiredFields) {
      if (!editingRegister[field]) {
        toast.error(`Please fill in ${field.replace(/_/g, ' ')}`);
        return;
      }
    }

    try {
      setLoadingMessage('Updating register...');
      setIsLoading(true);

      const { id, createdAt, updatedAt, ...updates } = editingRegister;
      const result = await window.electron.burialRegister.update(id, updates);

      if (result.success) {
        toast.success('Register updated successfully!');
        closeEditModal();
        loadRegisters();
      } else {
        toast.error(result.message || 'Failed to update register');
      }
    } catch (error) {
      toast.error('Failed to update register');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize DataTable
  useEffect(() => {
    if (tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        pageLength: 8,
        lengthChange: false,
        searching: true,
        ordering: true,
        info: true,
        autoWidth: false,
        columnDefs: [
          { width: '10%', targets: 0 },
          { width: '40%', targets: 1 },
          { width: '10%', targets: 2 },
          { width: '40%', targets: 3, orderable: false }
        ],
        language: {
          search: 'Search registers:',
          paginate: {
            previous: 'Previous',
            next: 'Next'
          }
        }
      });
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  // Update DataTable when registers change
  useEffect(() => {
    if (dataTableRef.current) {
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(
        registers.map(register => [
          register.certificate_number,
          register.name_of_person_died,
          register.age,
          `<div class="action-buttons">
            <button class="view-btn" data-id="${register.id}">PDF</button>
            <button class="edit-btn" data-id="${register.id}">Edit</button>
            <button class="delete-btn" data-id="${register.id}">Delete</button>
          </div>`
        ])
      );
      dataTableRef.current.draw();
    }
  }, [registers]);

  // Event handlers for DataTable buttons
  useEffect(() => {
    if (!tableRef.current) return;

    const handleViewClick = async (e) => {
      const btn = $(e.target).closest('.view-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));

        try {
          setLoadingMessage('Generating PDF...');
          setIsLoading(true);

          const pdfResult = await window.electron.burialRegister.generatePDF(id);

          if (pdfResult.success) {
            toast.success('PDF generated and opened successfully!');
          } else {
            toast.error(pdfResult.message || 'Failed to generate PDF');
          }
        } catch (error) {
          toast.error('Failed to generate PDF');
        } finally {
          setIsLoading(false);
        }
      }
    };

    const handleEditClick = (e) => {
      const btn = $(e.target).closest('.edit-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));
        const register = registers.find(r => r.id === id);
        if (register) {
          openEditModal(register);
        }
      }
    };

    const handleDeleteClick = (e) => {
      const btn = $(e.target).closest('.delete-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));
        const reg = registers.find(r => r.id === id);
        if (reg) {
          setRegisterToDelete(reg);
          setIsDeleteModalOpen(true);
        }
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
  }, [registers]);

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
            <div className="content-wrapper">
              {/* Burial Certificate Section */}
              <div className="table-section">
                <div className="section-header">
                  <h2>Burial Certificate</h2>
                  <button onClick={handleRefresh} className="refresh-btn">
                  <ArrowClockwise size={18} weight="bold" />
                  Refresh
                </button>
              </div>

              <div className="table-wrapper burial-register-table">
                <table ref={tableRef} className="display" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Cert No.</th>
                      <th style={{ width: '40%' }}>Name</th>
                      <th style={{ width: '10%' }}>Age</th>
                      <th style={{ width: '40%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* DataTable will populate this */}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate Register Form */}
            <div className="form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Certificate Number *</label>
                  <input
                    type="text"
                    name="certificate_number"
                    value={formData.certificate_number}
                    onChange={handleInputChange}
                    placeholder="Certificate Number"
                  />
                </div>

                <div className="form-group">
                  <label>Pastorate Name *</label>
                  <input
                    type="text"
                    name="pastorate_name"
                    value={formData.pastorate_name}
                    onChange={handleInputChange}
                    placeholder="Pastorate Name"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Death *</label>
                  <input
                    type="date"
                    name="date_of_death"
                    value={formData.date_of_death}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>When Buried *</label>
                  <input
                    type="date"
                    name="when_buried"
                    value={formData.when_buried}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Name of Person Died *</label>
                  <input
                    type="text"
                    name="name_of_person_died"
                    value={formData.name_of_person_died}
                    onChange={handleInputChange}
                    placeholder="Name of Person Died"
                  />
                </div>

                <div className="form-group">
                  <label>Sex *</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Age"
                  />
                </div>

                <div className="form-group">
                  <label>Profession</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    placeholder="Profession"
                  />
                </div>

                <div className="form-group">
                  <label>Cause of Death *</label>
                  <input
                    type="text"
                    name="cause_of_death"
                    value={formData.cause_of_death}
                    onChange={handleInputChange}
                    placeholder="Cause of Death"
                  />
                </div>

                <div className="form-group">
                  <label>Father Name *</label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                    placeholder="Father Name"
                  />
                </div>

                <div className="form-group">
                  <label>Mother Name *</label>
                  <input
                    type="text"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleInputChange}
                    placeholder="Mother Name"
                  />
                </div>

                <div className="form-group">
                  <label>Where Buried *</label>
                  <input
                    type="text"
                    name="where_buried"
                    value={formData.where_buried}
                    onChange={handleInputChange}
                    placeholder="Where Buried"
                  />
                </div>

                <div className="form-group">
                  <label>Signature of Who Buried *</label>
                  <input
                    type="text"
                    name="signature_who_buried"
                    value={formData.signature_who_buried}
                    onChange={handleInputChange}
                    placeholder="Signature"
                  />
                </div>

                <div className="form-group">
                  <label>Certified Rev Name *</label>
                  <input
                    type="text"
                    name="certified_rev_name"
                    value={formData.certified_rev_name}
                    onChange={handleInputChange}
                    placeholder="Rev Name"
                  />
                </div>

                <div className="form-group">
                  <label>Holding Office *</label>
                  <input
                    type="text"
                    name="holding_office"
                    value={formData.holding_office}
                    onChange={handleInputChange}
                    placeholder="Holding Office"
                  />
                </div>

                <div className="form-group">
                  <label>Certificate Date *</label>
                  <input
                    type="date"
                    name="certificate_date"
                    value={formData.certificate_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Certificate Place *</label>
                  <input
                    type="text"
                    name="certificate_place"
                    value={formData.certificate_place}
                    onChange={handleInputChange}
                    placeholder="Place"
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button onClick={handleSaveRegister} className="save-btn">
                  Save Register
                </button>
                <button onClick={handleViewPDF} className="view-pdf-btn">
                  <Eye size={18} weight="bold" />
                  View PDF
                </button>
              </div>
            </div>
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Edit Register</h2>
          <button onClick={closeEditModal} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {editingRegister && (
            <div className="form-grid">
              <div className="form-group">
                <label>Certificate Number *</label>
                <input
                  type="text"
                  name="certificate_number"
                  value={editingRegister.certificate_number}
                  onChange={handleEditInputChange}
                  placeholder="Certificate Number"
                />
              </div>

              <div className="form-group">
                <label>Pastorate Name *</label>
                <input
                  type="text"
                  name="pastorate_name"
                  value={editingRegister.pastorate_name}
                  onChange={handleEditInputChange}
                  placeholder="Pastorate Name"
                />
              </div>

              <div className="form-group">
                <label>Date of Death *</label>
                <input
                  type="date"
                  name="date_of_death"
                  value={editingRegister.date_of_death}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>When Buried *</label>
                <input
                  type="date"
                  name="when_buried"
                  value={editingRegister.when_buried}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Name of Person Died *</label>
                <input
                  type="text"
                  name="name_of_person_died"
                  value={editingRegister.name_of_person_died}
                  onChange={handleEditInputChange}
                  placeholder="Name of Person Died"
                />
              </div>

              <div className="form-group">
                <label>Sex *</label>
                <select
                  name="sex"
                  value={editingRegister.sex}
                  onChange={handleEditInputChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="text"
                  name="age"
                  value={editingRegister.age}
                  onChange={handleEditInputChange}
                  placeholder="Age"
                />
              </div>

              <div className="form-group">
                <label>Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={editingRegister.profession}
                  onChange={handleEditInputChange}
                  placeholder="Profession"
                />
              </div>

              <div className="form-group">
                <label>Cause of Death *</label>
                <input
                  type="text"
                  name="cause_of_death"
                  value={editingRegister.cause_of_death}
                  onChange={handleEditInputChange}
                  placeholder="Cause of Death"
                />
              </div>

              <div className="form-group">
                <label>Father Name *</label>
                <input
                  type="text"
                  name="father_name"
                  value={editingRegister.father_name}
                  onChange={handleEditInputChange}
                  placeholder="Father Name"
                />
              </div>

              <div className="form-group">
                <label>Mother Name *</label>
                <input
                  type="text"
                  name="mother_name"
                  value={editingRegister.mother_name}
                  onChange={handleEditInputChange}
                  placeholder="Mother Name"
                />
              </div>

              <div className="form-group">
                <label>Where Buried *</label>
                <input
                  type="text"
                  name="where_buried"
                  value={editingRegister.where_buried}
                  onChange={handleEditInputChange}
                  placeholder="Where Buried"
                />
              </div>

              <div className="form-group">
                <label>Signature of Who Buried *</label>
                <input
                  type="text"
                  name="signature_who_buried"
                  value={editingRegister.signature_who_buried}
                  onChange={handleEditInputChange}
                  placeholder="Signature"
                />
              </div>

              <div className="form-group">
                <label>Certified Rev Name *</label>
                <input
                  type="text"
                  name="certified_rev_name"
                  value={editingRegister.certified_rev_name}
                  onChange={handleEditInputChange}
                  placeholder="Rev Name"
                />
              </div>

              <div className="form-group">
                <label>Holding Office *</label>
                <input
                  type="text"
                  name="holding_office"
                  value={editingRegister.holding_office}
                  onChange={handleEditInputChange}
                  placeholder="Holding Office"
                />
              </div>

              <div className="form-group">
                <label>Certificate Date *</label>
                <input
                  type="date"
                  name="certificate_date"
                  value={editingRegister.certificate_date}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Certificate Place *</label>
                <input
                  type="text"
                  name="certificate_place"
                  value={editingRegister.certificate_place}
                  onChange={handleEditInputChange}
                  placeholder="Certificate Place"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={closeEditModal} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleUpdateRegister} className="save-btn">
            Update Register
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Confirm Delete</h2>
          <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {registerToDelete && (
            <div className="delete-confirmation">
              <p>Are you sure you want to delete this register?</p>
              <div className="record-details">
                <strong>Register #{registerToDelete.certificate_number}</strong><br/>
                {registerToDelete.deceased_name}
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={() => setIsDeleteModalOpen(false)} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={() => {
              if (registerToDelete) {
                handleDeleteRegister(registerToDelete.id);
                setIsDeleteModalOpen(false);
              }
            }}
            className="delete-confirm-btn"
          >
            Delete Register
          </button>
        </div>
      </Modal>
    </>
  );
};

export default BurialCertificate;

