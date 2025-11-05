import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './BurialRegister.css';

Modal.setAppElement('#root');

function BurialRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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

  useEffect(() => {
    if (user?.church_id) {
      loadRegisters();
      loadNextCertificateNumber();
    }
  }, [user]);

  useEffect(() => {
    if (registers.length > 0 && tableRef.current && !dataTableRef.current) {
      initializeDataTable();
    }
  }, [registers]);

  const loadRegisters = async () => {
    try {
      const result = await window.electron.burialRegister.getByChurch(user.church_id);
      if (result.success) {
        setRegisters(result.data);
      }
    } catch (error) {
      console.error('Error loading registers:', error);
    }
  };

  const loadNextCertificateNumber = async () => {
    try {
      const result = await window.electron.burialRegister.getNextNumber(user.church_id);
      if (result.success) {
        setFormData(prev => ({ ...prev, certificate_number: result.data, church_id: user.church_id }));
      }
    } catch (error) {
      console.error('Error loading next certificate number:', error);
    }
  };

  const initializeDataTable = () => {
    if (dataTableRef.current) {
      dataTableRef.current.destroy();
    }

    dataTableRef.current = $(tableRef.current).DataTable({
      pageLength: 8,
      lengthChange: false,
      ordering: true,
      searching: true,
      data: registers,
      columns: [
        { data: 'certificate_number', title: 'Cert No.' },
        { data: 'name_of_person_died', title: 'Name' },
        { data: 'when_buried', title: 'Buried Date', render: (data) => data ? new Date(data).toLocaleDateString() : '' },
        { data: 'sex', title: 'Sex', render: (data) => data === 'male' ? 'Male' : 'Female' },
        { data: 'age', title: 'Age' },
        {
          data: null,
          title: 'Actions',
          orderable: false,
          render: (data, type, row) => {
            return `<div class="action-buttons">
              <button class="view-btn" data-id="${row.id}" title="View PDF">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
                </svg>
              </button>
              <button class="edit-btn" data-id="${row.id}" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                </svg>
              </button>
              <button class="delete-btn" data-id="${row.id}" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                </svg>
              </button>
            </div>`;
          }
        }
      ]
    });

    // Event handlers for action buttons
    $(tableRef.current).on('click', '.view-btn', function() {
      const id = parseInt($(this).data('id'));
      handleViewPDF(id);
    });

    $(tableRef.current).on('click', '.edit-btn', function() {
      const id = parseInt($(this).data('id'));
      handleEdit(id);
    });

    $(tableRef.current).on('click', '.delete-btn', function() {
      const id = parseInt($(this).data('id'));
      handleDelete(id);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (data) => {
    const requiredFields = [
      'certificate_number', 'pastorate_name', 'date_of_death', 'when_buried',
      'name_of_person_died', 'sex', 'age', 'cause_of_death',
      'father_name', 'mother_name', 'where_buried', 'signature_who_buried',
      'certified_rev_name', 'holding_office', 'certificate_date', 'certificate_place'
    ];

    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === '') {
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        toast.error(`${fieldName} is required`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm(formData)) return;

    setLoading(true);
    try {
      const result = await window.electron.burialRegister.create(formData);
      if (result.success) {
        toast.success('Burial register saved successfully!');
        await loadRegisters();
        await loadNextCertificateNumber();
        resetForm();
        
        if (dataTableRef.current) {
          dataTableRef.current.destroy();
          dataTableRef.current = null;
        }
      } else {
        toast.error(result.message || 'Failed to save register');
      }
    } catch (error) {
      toast.error('Error saving register');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = async (id = null) => {
    let registerToView = id;

    if (!id) {
      if (!validateForm(formData)) return;

      setLoading(true);
      try {
        const result = await window.electron.burialRegister.create(formData);
        if (result.success) {
          registerToView = result.data.id;
          await loadRegisters();
          await loadNextCertificateNumber();
          resetForm();
          
          if (dataTableRef.current) {
            dataTableRef.current.destroy();
            dataTableRef.current = null;
          }
        } else {
          toast.error(result.message || 'Failed to save register');
          setLoading(false);
          return;
        }
      } catch (error) {
        toast.error('Error saving register');
        console.error('Save error:', error);
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    try {
      const result = await window.electron.burialRegister.generatePDF(registerToView);
      if (result.success) {
        toast.success('PDF generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Error generating PDF');
      console.error('PDF generation error:', error);
    } finally {
      setLoading(false);
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
    if (!validateForm(editFormData)) return;

    setLoading(true);
    try {
      const result = await window.electron.burialRegister.update(editingRegister.id, editFormData);
      if (result.success) {
        toast.success('Register updated successfully!');
        setEditModalOpen(false);
        setEditingRegister(null);
        await loadRegisters();

        if (dataTableRef.current) {
          dataTableRef.current.destroy();
          dataTableRef.current = null;
        }
      } else {
        toast.error(result.message || 'Failed to update register');
      }
    } catch (error) {
      toast.error('Error updating register');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this burial register?')) {
      setLoading(true);
      try {
        const result = await window.electron.burialRegister.delete(id);
        if (result.success) {
          toast.success('Register deleted successfully!');
          await loadRegisters();

          if (dataTableRef.current) {
            dataTableRef.current.destroy();
            dataTableRef.current = null;
          }
        } else {
          toast.error(result.message || 'Failed to delete register');
        }
      } catch (error) {
        toast.error('Error deleting register');
        console.error('Delete error:', error);
      } finally {
        setLoading(false);
      }
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
      church_id: user?.church_id || null
    });
  };

  return (
    <div className="infant-baptism-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      <div className="page-header">
        <h1>Burial Register</h1>
      </div>

      <div className="form-section">
        <h2>Register Details</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Certificate Number *</label>
            <input
              type="text"
              name="certificate_number"
              value={formData.certificate_number}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Pastorate Name *</label>
            <input
              type="text"
              name="pastorate_name"
              value={formData.pastorate_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Death *</label>
            <input
              type="date"
              name="date_of_death"
              value={formData.date_of_death}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>When Buried *</label>
            <input
              type="date"
              name="when_buried"
              value={formData.when_buried}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Name of Person Died *</label>
            <input
              type="text"
              name="name_of_person_died"
              value={formData.name_of_person_died}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Sex *</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              required
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
              required
            />
          </div>

          <div className="form-group">
            <label>Profession</label>
            <input
              type="text"
              name="profession"
              value={formData.profession}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Cause of Death *</label>
            <input
              type="text"
              name="cause_of_death"
              value={formData.cause_of_death}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Father Name *</label>
            <input
              type="text"
              name="father_name"
              value={formData.father_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mother Name *</label>
            <input
              type="text"
              name="mother_name"
              value={formData.mother_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Where Buried *</label>
            <input
              type="text"
              name="where_buried"
              value={formData.where_buried}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Signature of Who Buried *</label>
            <input
              type="text"
              name="signature_who_buried"
              value={formData.signature_who_buried}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Certified Rev Name *</label>
            <input
              type="text"
              name="certified_rev_name"
              value={formData.certified_rev_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Holding Office *</label>
            <input
              type="text"
              name="holding_office"
              value={formData.holding_office}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Certificate Date *</label>
            <input
              type="date"
              name="certificate_date"
              value={formData.certificate_date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Certificate Place *</label>
            <input
              type="text"
              name="certificate_place"
              value={formData.certificate_place}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="save-btn" onClick={handleSave}>
            Save Register
          </button>
          <button className="view-pdf-btn" onClick={() => handleViewPDF()}>
            View PDF
          </button>
        </div>
      </div>

      <div className="table-section">
        <h2>Previous Records</h2>
        <table ref={tableRef} className="display" style={{ width: '100%' }}></table>
      </div>

      <Modal
        isOpen={editModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        className="edit-modal"
        overlayClassName="edit-modal-overlay"
      >
        <div className="modal-header">
          <h2>Edit Burial Register</h2>
          <button className="close-btn" onClick={() => setEditModalOpen(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Certificate Number *</label>
              <input
                type="text"
                name="certificate_number"
                value={editFormData.certificate_number}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Pastorate Name *</label>
              <input
                type="text"
                name="pastorate_name"
                value={editFormData.pastorate_name}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Death *</label>
              <input
                type="date"
                name="date_of_death"
                value={editFormData.date_of_death}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>When Buried *</label>
              <input
                type="date"
                name="when_buried"
                value={editFormData.when_buried}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Name of Person Died *</label>
              <input
                type="text"
                name="name_of_person_died"
                value={editFormData.name_of_person_died}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Sex *</label>
              <select
                name="sex"
                value={editFormData.sex}
                onChange={handleEditInputChange}
                required
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
                required
              />
            </div>

            <div className="form-group">
              <label>Profession</label>
              <input
                type="text"
                name="profession"
                value={editFormData.profession}
                onChange={handleEditInputChange}
              />
            </div>

            <div className="form-group">
              <label>Cause of Death *</label>
              <input
                type="text"
                name="cause_of_death"
                value={editFormData.cause_of_death}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Father Name *</label>
              <input
                type="text"
                name="father_name"
                value={editFormData.father_name}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Mother Name *</label>
              <input
                type="text"
                name="mother_name"
                value={editFormData.mother_name}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Where Buried *</label>
              <input
                type="text"
                name="where_buried"
                value={editFormData.where_buried}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Signature of Who Buried *</label>
              <input
                type="text"
                name="signature_who_buried"
                value={editFormData.signature_who_buried}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Certified Rev Name *</label>
              <input
                type="text"
                name="certified_rev_name"
                value={editFormData.certified_rev_name}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Holding Office *</label>
              <input
                type="text"
                name="holding_office"
                value={editFormData.holding_office}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Certificate Date *</label>
              <input
                type="date"
                name="certificate_date"
                value={editFormData.certificate_date}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Certificate Place *</label>
              <input
                type="text"
                name="certificate_place"
                value={editFormData.certificate_place}
                onChange={handleEditInputChange}
                required
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => setEditModalOpen(false)}>
            Cancel
          </button>
          <button className="update-btn" onClick={handleUpdateRegister}>
            Update Register
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default BurialRegister;

