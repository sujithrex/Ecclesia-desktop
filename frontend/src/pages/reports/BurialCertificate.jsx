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
          new Date(register.when_buried).toLocaleDateString(),
          register.sex === 'male' ? 'Male' : 'Female',
          register.age,
          `<div class="action-buttons">
            <button class="view-btn" data-id="${register.id}" title="View PDF">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path></svg>
            </button>
            <button class="edit-btn" data-id="${register.id}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
            </button>
            <button class="delete-btn" data-id="${register.id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
            </button>
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
        if (window.confirm('Are you sure you want to delete this register?')) {
          handleDeleteRegister(id);
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
            {/* Previous Records Section */}
            <div className="table-section">
              <div className="section-header">
                <h2>Previous Records</h2>
                <button onClick={handleRefresh} className="refresh-btn">
                  <ArrowClockwise size={18} weight="bold" />
                  Refresh
                </button>
              </div>

              <table ref={tableRef} className="display" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Name</th>
                    <th>Buried Date</th>
                    <th>Sex</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* DataTable will populate this */}
                </tbody>
              </table>
            </div>

            {/* Generate Register Form */}

            {/* Generate Register Form */}
            <div className="form-section">
              <h2>Generate Register</h2>

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
    </>
  );
};

export default BurialCertificate;

