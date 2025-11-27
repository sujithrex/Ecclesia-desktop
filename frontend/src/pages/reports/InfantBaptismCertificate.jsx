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
import './InfantBaptismCertificate.css';

const InfantBaptismCertificate = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // State management
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState(null);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [formData, setFormData] = useState({
    certificate_number: '',
    pastorate_name: '',
    when_baptised: '',
    christian_name: '',
    date_of_birth: '',
    sex: 'male',
    abode: '',
    profession: '',
    father_name: '',
    mother_name: '',
    witness_name_1: '',
    witness_name_2: '',
    witness_name_3: '',
    where_baptised: '',
    signature_who_baptised: '',
    certified_rev_name: '',
    holding_office: '',
    certificate_date: '',
    certificate_place: '',
    church_id: null
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Infant Baptism Certificate' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Load certificates and next certificate number on mount
  useEffect(() => {
    loadCertificates();
    loadNextCertificateNumber();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoadingMessage('Loading certificates...');
      setIsLoading(true);

      const result = await window.electron.infantBaptism.getAll();

      if (result.success) {
        setCertificates(result.data);
      } else {
        toast.error('Failed to load certificates');
      }
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextCertificateNumber = async () => {
    try {
      // For now, use a default church ID of 1
      // In a full implementation, this would come from the selected church
      const result = await window.electron.infantBaptism.getNextNumber(1);

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
    loadCertificates();
  };

  const validateForm = () => {
    const requiredFields = [
      'certificate_number', 'pastorate_name', 'when_baptised', 'christian_name', 'date_of_birth',
      'sex', 'abode', 'father_name', 'mother_name', 'witness_name_1',
      'witness_name_2', 'witness_name_3', 'where_baptised', 'signature_who_baptised',
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

  const handleSaveCertificate = async () => {
    if (!validateForm()) return;

    try {
      setLoadingMessage('Saving certificate...');
      setIsLoading(true);

      const result = await window.electron.infantBaptism.create(formData);

      if (result.success) {
        toast.success('Certificate saved successfully!');
        resetForm();
        loadCertificates();
        loadNextCertificateNumber();
      } else {
        toast.error(result.message || 'Failed to save certificate');
      }
    } catch (error) {
      toast.error('Failed to save certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPDF = async () => {
    if (!validateForm()) return;

    try {
      setLoadingMessage('Generating PDF...');
      setIsLoading(true);

      // First save the certificate
      const saveResult = await window.electron.infantBaptism.create(formData);

      if (!saveResult.success) {
        toast.error(saveResult.message || 'Failed to save certificate');
        return;
      }

      // Generate and open PDF
      const pdfResult = await window.electron.infantBaptism.generatePDF(saveResult.data.id);

      if (pdfResult.success) {
        toast.success('PDF generated and opened successfully!');
        resetForm();
        loadCertificates();
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

  const handleDeleteCertificate = async (id) => {
    try {
      setLoadingMessage('Deleting certificate...');
      setIsLoading(true);

      const result = await window.electron.infantBaptism.delete(id);

      if (result.success) {
        toast.success('Certificate deleted successfully');
        loadCertificates();
      } else {
        toast.error(result.message || 'Failed to delete certificate');
      }
    } catch (error) {
      toast.error('Failed to delete certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      certificate_number: '',
      pastorate_name: '',
      when_baptised: '',
      christian_name: '',
      date_of_birth: '',
      sex: 'male',
      abode: '',
      profession: '',
      father_name: '',
      mother_name: '',
      witness_name_1: '',
      witness_name_2: '',
      witness_name_3: '',
      where_baptised: '',
      signature_who_baptised: '',
      certified_rev_name: '',
      holding_office: '',
      certificate_date: '',
      certificate_place: '',
      church_id: 1
    });
  };

  const openEditModal = (certificate) => {
    setEditingCertificate(certificate);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCertificate(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCertificate(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateCertificate = async () => {
    if (!editingCertificate) return;

    // Validate required fields
    const requiredFields = [
      'certificate_number', 'pastorate_name', 'when_baptised', 'christian_name', 'date_of_birth',
      'sex', 'abode', 'father_name', 'mother_name', 'witness_name_1',
      'witness_name_2', 'witness_name_3', 'where_baptised', 'signature_who_baptised',
      'certified_rev_name', 'holding_office', 'certificate_date', 'certificate_place'
    ];

    for (const field of requiredFields) {
      if (!editingCertificate[field]) {
        toast.error(`Please fill in ${field.replace(/_/g, ' ')}`);
        return;
      }
    }

    try {
      setLoadingMessage('Updating certificate...');
      setIsLoading(true);

      const { id, createdAt, updatedAt, ...updates } = editingCertificate;
      const result = await window.electron.infantBaptism.update(id, updates);

      if (result.success) {
        toast.success('Certificate updated successfully!');
        closeEditModal();
        loadCertificates();
      } else {
        toast.error(result.message || 'Failed to update certificate');
      }
    } catch (error) {
      toast.error('Failed to update certificate');
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
          search: 'Search certificates:',
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

  // Update DataTable when certificates change
  useEffect(() => {
    if (dataTableRef.current) {
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(
        certificates.map(cert => {
          const age = new Date().getFullYear() - new Date(cert.date_of_birth).getFullYear();
          return [
            cert.certificate_number,
            cert.christian_name,
            age,
            `<div class="action-buttons">
              <button class="view-btn" data-id="${cert.id}">PDF</button>
              <button class="edit-btn" data-id="${cert.id}">Edit</button>
              <button class="delete-btn" data-id="${cert.id}">Delete</button>
            </div>`
          ];
        })
      );
      dataTableRef.current.draw();
    }
  }, [certificates]);

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

          const pdfResult = await window.electron.infantBaptism.generatePDF(id);

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
        const certificate = certificates.find(c => c.id === id);
        if (certificate) {
          openEditModal(certificate);
        }
      }
    };

    const handleDeleteClick = (e) => {
      const btn = $(e.target).closest('.delete-btn');
      if (btn.length) {
        const id = parseInt(btn.data('id'));
        const cert = certificates.find(c => c.id === id);
        if (cert) {
          setCertificateToDelete(cert);
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
  }, [certificates]);

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
                  <h2>Infant Baptism Certificate</h2>
                  <button onClick={handleRefresh} className="refresh-btn">
                    <ArrowClockwise size={18} weight="bold" />
                    Refresh
                  </button>
                </div>

                <div className="table-wrapper infant-baptism-table">
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

              {/* Generate Certificate Form */}
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
                  <label>When Baptised *</label>
                  <input
                    type="date"
                    name="when_baptised"
                    value={formData.when_baptised}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Christian Name *</label>
                  <input
                    type="text"
                    name="christian_name"
                    value={formData.christian_name}
                    onChange={handleInputChange}
                    placeholder="Christian Name"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
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
                  <label>Abode *</label>
                  <input
                    type="text"
                    name="abode"
                    value={formData.abode}
                    onChange={handleInputChange}
                    placeholder="Abode"
                  />
                </div>

                <div className="form-group">
                  <label>Profession</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    placeholder="Profession (usually parents')"
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
                  <label>Witness 1 *</label>
                  <input
                    type="text"
                    name="witness_name_1"
                    value={formData.witness_name_1}
                    onChange={handleInputChange}
                    placeholder="Witness 1"
                  />
                </div>

                <div className="form-group">
                  <label>Witness 2 *</label>
                  <input
                    type="text"
                    name="witness_name_2"
                    value={formData.witness_name_2}
                    onChange={handleInputChange}
                    placeholder="Witness 2"
                  />
                </div>

                <div className="form-group">
                  <label>Witness 3 *</label>
                  <input
                    type="text"
                    name="witness_name_3"
                    value={formData.witness_name_3}
                    onChange={handleInputChange}
                    placeholder="Witness 3"
                  />
                </div>

                <div className="form-group">
                  <label>Where Baptised *</label>
                  <input
                    type="text"
                    name="where_baptised"
                    value={formData.where_baptised}
                    onChange={handleInputChange}
                    placeholder="Where Baptised"
                  />
                </div>

                <div className="form-group">
                  <label>Signature of Who Baptised *</label>
                  <input
                    type="text"
                    name="signature_who_baptised"
                    value={formData.signature_who_baptised}
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
                <button onClick={handleSaveCertificate} className="save-btn">
                  Save Certificate
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

      {/* Edit Certificate Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Edit Certificate</h2>
          <button onClick={closeEditModal} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {editingCertificate && (
            <div className="form-grid">
              <div className="form-group">
                <label>Certificate Number *</label>
                <input
                  type="text"
                  name="certificate_number"
                  value={editingCertificate.certificate_number}
                  onChange={handleEditInputChange}
                  placeholder="Certificate Number"
                />
              </div>

              <div className="form-group">
                <label>Pastorate Name *</label>
                <input
                  type="text"
                  name="pastorate_name"
                  value={editingCertificate.pastorate_name}
                  onChange={handleEditInputChange}
                  placeholder="Pastorate Name"
                />
              </div>

              <div className="form-group">
                <label>When Baptised *</label>
                <input
                  type="date"
                  name="when_baptised"
                  value={editingCertificate.when_baptised}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Christian Name *</label>
                <input
                  type="text"
                  name="christian_name"
                  value={editingCertificate.christian_name}
                  onChange={handleEditInputChange}
                  placeholder="Christian Name"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={editingCertificate.date_of_birth}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Sex *</label>
                <select
                  name="sex"
                  value={editingCertificate.sex}
                  onChange={handleEditInputChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Abode *</label>
                <input
                  type="text"
                  name="abode"
                  value={editingCertificate.abode}
                  onChange={handleEditInputChange}
                  placeholder="Abode"
                />
              </div>

              <div className="form-group">
                <label>Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={editingCertificate.profession}
                  onChange={handleEditInputChange}
                  placeholder="Profession"
                />
              </div>

              <div className="form-group">
                <label>Father Name *</label>
                <input
                  type="text"
                  name="father_name"
                  value={editingCertificate.father_name}
                  onChange={handleEditInputChange}
                  placeholder="Father Name"
                />
              </div>

              <div className="form-group">
                <label>Mother Name *</label>
                <input
                  type="text"
                  name="mother_name"
                  value={editingCertificate.mother_name}
                  onChange={handleEditInputChange}
                  placeholder="Mother Name"
                />
              </div>

              <div className="form-group">
                <label>Witness 1 *</label>
                <input
                  type="text"
                  name="witness_name_1"
                  value={editingCertificate.witness_name_1}
                  onChange={handleEditInputChange}
                  placeholder="Witness 1"
                />
              </div>

              <div className="form-group">
                <label>Witness 2 *</label>
                <input
                  type="text"
                  name="witness_name_2"
                  value={editingCertificate.witness_name_2}
                  onChange={handleEditInputChange}
                  placeholder="Witness 2"
                />
              </div>

              <div className="form-group">
                <label>Witness 3 *</label>
                <input
                  type="text"
                  name="witness_name_3"
                  value={editingCertificate.witness_name_3}
                  onChange={handleEditInputChange}
                  placeholder="Witness 3"
                />
              </div>

              <div className="form-group">
                <label>Where Baptised *</label>
                <input
                  type="text"
                  name="where_baptised"
                  value={editingCertificate.where_baptised}
                  onChange={handleEditInputChange}
                  placeholder="Where Baptised"
                />
              </div>

              <div className="form-group">
                <label>Signature of Who Baptised *</label>
                <input
                  type="text"
                  name="signature_who_baptised"
                  value={editingCertificate.signature_who_baptised}
                  onChange={handleEditInputChange}
                  placeholder="Signature"
                />
              </div>

              <div className="form-group">
                <label>Certified Rev Name *</label>
                <input
                  type="text"
                  name="certified_rev_name"
                  value={editingCertificate.certified_rev_name}
                  onChange={handleEditInputChange}
                  placeholder="Rev Name"
                />
              </div>

              <div className="form-group">
                <label>Holding Office *</label>
                <input
                  type="text"
                  name="holding_office"
                  value={editingCertificate.holding_office}
                  onChange={handleEditInputChange}
                  placeholder="Holding Office"
                />
              </div>

              <div className="form-group">
                <label>Certificate Date *</label>
                <input
                  type="date"
                  name="certificate_date"
                  value={editingCertificate.certificate_date}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label>Certificate Place *</label>
                <input
                  type="text"
                  name="certificate_place"
                  value={editingCertificate.certificate_place}
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
          <button onClick={handleUpdateCertificate} className="save-btn">
            Update Certificate
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
          {certificateToDelete && (
            <div className="delete-confirmation">
              <p>Are you sure you want to delete this certificate?</p>
              <div className="record-details">
                <strong>Certificate #{certificateToDelete.certificate_number}</strong><br/>
                {certificateToDelete.christian_name}
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
              if (certificateToDelete) {
                handleDeleteCertificate(certificateToDelete.id);
                setIsDeleteModalOpen(false);
              }
            }}
            className="delete-confirm-btn"
          >
            Delete Certificate
          </button>
        </div>
      </Modal>
    </>
  );
};

export default InfantBaptismCertificate;
