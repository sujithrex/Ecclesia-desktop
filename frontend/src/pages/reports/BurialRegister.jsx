import React, { useState, useEffect, useRef } from 'react';
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
import './BurialRegister.css';
import './ReportPage.css';

Modal.setAppElement('#root');

function BurialRegister() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [registers, setRegisters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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

  const [editFormData, setEditFormData] = useState({
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
    certificate_place: ''
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Burial Register' }
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
      console.error('Error loading registers:', error);
      toast.error('Failed to load registers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextCertificateNumber = async () => {
    try {
      const result = await window.electron.burialRegister.getNextNumber(1);

      if (result.success) {
        setFormData(prev => ({ ...prev, certificate_number: result.data, church_id: 1 }));
      }
    } catch (error) {
      console.error('Error loading next certificate number:', error);
    }
  };

  const handleRefresh = () => {
    loadRegisters();
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
          handleEdit(id);
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
          setDeleteModalOpen(true);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSave = async () => {
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

  const handleViewPDF = async (id = null) => {
    if (!id) {
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
    } else {
      // View existing PDF
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

  const handleEdit = async (id) => {
    const register = registers.find(r => r.id === id);
    if (register) {
      setEditingRegister(register);
      setEditFormData({
        certificate_number: register.certificate_number || '',
        pastorate_name: register.pastorate_name || '',
        date_of_death: register.date_of_death || '',
        when_buried: register.when_buried || '',
        name_of_person_died: register.name_of_person_died || '',
        sex: register.sex || 'male',
        age: register.age || '',
        profession: register.profession || '',
        cause_of_death: register.cause_of_death || '',
        father_name: register.father_name || '',
        mother_name: register.mother_name || '',
        where_buried: register.where_buried || '',
        signature_who_buried: register.signature_who_buried || '',
        certified_rev_name: register.certified_rev_name || '',
        holding_office: register.holding_office || '',
        certificate_date: register.certificate_date || '',
        certificate_place: register.certificate_place || ''
      });
      setEditModalOpen(true);
    }
  };

  const handleUpdateRegister = async () => {
    const requiredFields = [
      'certificate_number', 'pastorate_name', 'date_of_death', 'when_buried',
      'name_of_person_died', 'sex', 'age', 'cause_of_death',
      'father_name', 'mother_name', 'where_buried', 'signature_who_buried',
      'certified_rev_name', 'holding_office', 'certificate_date', 'certificate_place'
    ];

    for (const field of requiredFields) {
      if (!editFormData[field]) {
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
        setEditModalOpen(false);
        setEditingRegister(null);
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

  const handleDelete = async (id) => {
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
              {/* Previous Records Section */}
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
                    type="number"
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
                <button onClick={handleSave} className="save-btn">
                  Save Register
                </button>
                <button onClick={() => handleViewPDF()} className="view-pdf-btn">
                  <Eye size={18} weight="bold" />
                  View PDF
                </button>
              </div>
            </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Register Modal */}
      <Modal
        isOpen={editModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Edit Register</h2>
          <button onClick={() => setEditModalOpen(false)} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {editingRegister && (
            <div className="form-grid">
              <div className="form-group">
                <label>Certificate Number *</label>
                <input
                  type="text"
                  name="certificate_number"
                  value={editFormData.certificate_number}
                  onChange={handleEditInputChange}
                  placeholder="Certificate Number"
                />
              </div>

              <div className="form-group">
                <label>Pastorate Name *</label>
                <input
                  type="text"
                  name="pastorate_name"
                  value={editFormData.pastorate_name}
                  onChange={handleEditInputChange}
                  placeholder="Pastorate Name"
                />
              </div>

              <div className="form-group">
                <label>Date of Death *</label>
                <input
                  type="date"
                  name="date_of_death"
                  value={editFormData.date_of_death}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>When Buried *</label>
                <input
                  type="date"
                  name="when_buried"
                  value={editFormData.when_buried}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Name of Person Died *</label>
                <input
                  type="text"
                  name="name_of_person_died"
                  value={editFormData.name_of_person_died}
                  onChange={handleEditInputChange}
                  placeholder="Name of Person Died"
                />
              </div>

              <div className="form-group">
                <label>Sex *</label>
                <select
                  name="sex"
                  value={editFormData.sex}
                  onChange={handleEditInputChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={editFormData.age}
                  onChange={handleEditInputChange}
                  placeholder="Age"
                />
              </div>

              <div className="form-group">
                <label>Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={editFormData.profession}
                  onChange={handleEditInputChange}
                  placeholder="Profession"
                />
              </div>

              <div className="form-group">
                <label>Cause of Death *</label>
                <input
                  type="text"
                  name="cause_of_death"
                  value={editFormData.cause_of_death}
                  onChange={handleEditInputChange}
                  placeholder="Cause of Death"
                />
              </div>

              <div className="form-group">
                <label>Father Name *</label>
                <input
                  type="text"
                  name="father_name"
                  value={editFormData.father_name}
                  onChange={handleEditInputChange}
                  placeholder="Father Name"
                />
              </div>

              <div className="form-group">
                <label>Mother Name *</label>
                <input
                  type="text"
                  name="mother_name"
                  value={editFormData.mother_name}
                  onChange={handleEditInputChange}
                  placeholder="Mother Name"
                />
              </div>

              <div className="form-group">
                <label>Where Buried *</label>
                <input
                  type="text"
                  name="where_buried"
                  value={editFormData.where_buried}
                  onChange={handleEditInputChange}
                  placeholder="Where Buried"
                />
              </div>

              <div className="form-group">
                <label>Signature of Who Buried *</label>
                <input
                  type="text"
                  name="signature_who_buried"
                  value={editFormData.signature_who_buried}
                  onChange={handleEditInputChange}
                  placeholder="Signature"
                />
              </div>

              <div className="form-group">
                <label>Certified Rev Name *</label>
                <input
                  type="text"
                  name="certified_rev_name"
                  value={editFormData.certified_rev_name}
                  onChange={handleEditInputChange}
                  placeholder="Rev Name"
                />
              </div>

              <div className="form-group">
                <label>Holding Office *</label>
                <input
                  type="text"
                  name="holding_office"
                  value={editFormData.holding_office}
                  onChange={handleEditInputChange}
                  placeholder="Holding Office"
                />
              </div>

              <div className="form-group">
                <label>Certificate Date *</label>
                <input
                  type="date"
                  name="certificate_date"
                  value={editFormData.certificate_date}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Certificate Place *</label>
                <input
                  type="text"
                  name="certificate_place"
                  value={editFormData.certificate_place}
                  onChange={handleEditInputChange}
                  placeholder="Certificate Place"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={() => setEditModalOpen(false)} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleUpdateRegister} className="save-btn">
            Update Register
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Confirm Delete</h2>
          <button onClick={() => setDeleteModalOpen(false)} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {registerToDelete && (
            <div className="delete-confirmation">
              <p>Are you sure you want to delete this register?</p>
              <div className="record-details">
                <strong>Register #{registerToDelete.certificate_number}</strong><br/>
                {registerToDelete.name_of_person_died}
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={() => setDeleteModalOpen(false)} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={() => {
              if (registerToDelete) {
                handleDelete(registerToDelete.id);
                setDeleteModalOpen(false);
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
}

export default BurialRegister;
