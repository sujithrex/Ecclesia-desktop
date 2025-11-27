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
import TinyMCEEditor from '../../components/TinyMCEEditor';
import './ReportPage.css';
import './Letterhead.css';

const LetterHead = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // State management
  const [letterheads, setLetterheads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [letterheadToDelete, setLetterheadToDelete] = useState(null);
  const [editingLetterhead, setEditingLetterhead] = useState(null);
  const [formData, setFormData] = useState({
    letterhead_number: '',
    letter_date: '',
    verse: 'Fear of the Lord is the beginning of wisdom',
    diocese_name: 'CHURCH OF SOUTH INDIA - TIRUNELVELI DIOCESE',
    pastorate_name: '',
    rev_name: '',
    parsonage_address: '',
    content: '',
    line_color: '#000000',
    church_id: null
  });

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Letterhead' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  // Load letterheads and next letterhead number on mount
  useEffect(() => {
    loadLetterheads();
    loadNextLetterheadNumber();
    loadLastLetterheadData();
  }, []);

  const loadLetterheads = async () => {
    try {
      setLoadingMessage('Loading letterheads...');
      setIsLoading(true);

      const result = await window.electron.letterhead.getAll();

      if (result.success) {
        setLetterheads(result.data);
      } else {
        toast.error('Failed to load letterheads');
      }
    } catch (error) {
      toast.error('Failed to load letterheads');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextLetterheadNumber = async () => {
    try {
      const result = await window.electron.letterhead.getNextNumber(1);

      if (result.success) {
        setFormData(prev => ({ ...prev, letterhead_number: result.data, church_id: 1 }));
      }
    } catch (error) {
      console.error('Error loading next letterhead number:', error);
    }
  };

  const loadLastLetterheadData = async () => {
    try {
      const result = await window.electron.letterhead.getAll();

      if (result.success && result.data.length > 0) {
        const lastLetterhead = result.data[result.data.length - 1];
        setFormData(prev => ({
          ...prev,
          verse: lastLetterhead.verse || prev.verse,
          diocese_name: lastLetterhead.diocese_name || prev.diocese_name,
          pastorate_name: lastLetterhead.pastorate_name || prev.pastorate_name,
          rev_name: lastLetterhead.rev_name || prev.rev_name,
          parsonage_address: lastLetterhead.parsonage_address || prev.parsonage_address,
          line_color: lastLetterhead.line_color || prev.line_color
        }));
      }
    } catch (error) {
      console.error('Error loading last letterhead data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    loadLetterheads();
    loadNextLetterheadNumber();
  };

  const validateForm = () => {
    if (!formData.letterhead_number?.trim()) {
      toast.error('Letterhead number is required');
      return false;
    }
    if (!formData.letter_date) {
      toast.error('Letter date is required');
      return false;
    }
    if (!formData.verse?.trim()) {
      toast.error('Verse is required');
      return false;
    }
    if (!formData.diocese_name?.trim()) {
      toast.error('Diocese name is required');
      return false;
    }
    if (!formData.pastorate_name?.trim()) {
      toast.error('Pastorate name is required');
      return false;
    }
    if (!formData.rev_name?.trim()) {
      toast.error('Reverend name is required');
      return false;
    }
    if (!formData.parsonage_address?.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!formData.content?.trim()) {
      toast.error('Content is required');
      return false;
    }
    return true;
  };


  const handleSaveLetterhead = async () => {
    if (!validateForm()) return;

    try {
      setLoadingMessage('Saving letterhead...');
      setIsLoading(true);

      const result = await window.electron.letterhead.create(formData);

      if (result.success) {
        toast.success('Letterhead saved successfully');
        resetForm();
        loadLetterheads();
        loadNextLetterheadNumber();
      } else {
        toast.error(result.message || 'Failed to save letterhead');
      }
    } catch (error) {
      toast.error('Failed to save letterhead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPDF = async () => {
    if (!validateForm()) return;

    try {
      setLoadingMessage('Generating PDF...');
      setIsLoading(true);

      const saveResult = await window.electron.letterhead.create(formData);

      if (saveResult.success) {
        const pdfResult = await window.electron.letterhead.generatePDF(saveResult.data.id);

        if (pdfResult.success) {
          toast.success('PDF generated successfully');
          resetForm();
          loadLetterheads();
          loadNextLetterheadNumber();
        } else {
          toast.error(pdfResult.message || 'Failed to generate PDF');
        }
      } else {
        toast.error(saveResult.message || 'Failed to save letterhead');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLetterhead = async (id) => {
    try {
      setLoadingMessage('Deleting letterhead...');
      setIsLoading(true);

      const result = await window.electron.letterhead.delete(id);

      if (result.success) {
        toast.success('Letterhead deleted successfully');
        loadLetterheads();
      } else {
        toast.error(result.message || 'Failed to delete letterhead');
      }
    } catch (error) {
      toast.error('Failed to delete letterhead');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = async () => {
    // Load last letterhead data for defaults
    try {
      const result = await window.electron.letterhead.getAll();
      let lastData = {
        verse: 'Fear of the Lord is the beginning of wisdom',
        diocese_name: 'CHURCH OF SOUTH INDIA - TIRUNELVELI DIOCESE',
        pastorate_name: '',
        rev_name: '',
        parsonage_address: '',
        line_color: '#000000'
      };

      if (result.success && result.data.length > 0) {
        const lastLetterhead = result.data[result.data.length - 1];
        lastData = {
          verse: lastLetterhead.verse || lastData.verse,
          diocese_name: lastLetterhead.diocese_name || lastData.diocese_name,
          pastorate_name: lastLetterhead.pastorate_name || lastData.pastorate_name,
          rev_name: lastLetterhead.rev_name || lastData.rev_name,
          parsonage_address: lastLetterhead.parsonage_address || lastData.parsonage_address,
          line_color: lastLetterhead.line_color || lastData.line_color
        };
      }

      setFormData({
        letterhead_number: '',
        letter_date: '',
        ...lastData,
        content: '',
        church_id: 1
      });
    } catch (error) {
      setFormData({
        letterhead_number: '',
        letter_date: '',
        verse: 'Fear of the Lord is the beginning of wisdom',
        diocese_name: 'CHURCH OF SOUTH INDIA - TIRUNELVELI DIOCESE',
        pastorate_name: '',
        rev_name: '',
        parsonage_address: '',
        content: '',
        line_color: '#000000',
        church_id: 1
      });
    }
    loadNextLetterheadNumber();
  };

  const openEditModal = (letterhead) => {
    setEditingLetterhead({
      ...letterhead,
      verse: letterhead.verse || '',
      diocese_name: letterhead.diocese_name || '',
      pastorate_name: letterhead.pastorate_name || '',
      rev_name: letterhead.rev_name || '',
      parsonage_address: letterhead.parsonage_address || '',
      content: letterhead.content || '',
      line_color: letterhead.line_color || '#000000'
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingLetterhead(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingLetterhead(prev => ({ ...prev, [name]: value }));
  };

  const handleEditEditorChange = (field, value) => {
    setEditingLetterhead(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateLetterhead = async () => {
    if (!editingLetterhead) return;

    try {
      setLoadingMessage('Updating letterhead...');
      setIsLoading(true);

      const { id, created_at, updated_at, ...updates } = editingLetterhead;
      const result = await window.electron.letterhead.update(id, updates);

      if (result.success) {
        toast.success('Letterhead updated successfully');
        closeEditModal();
        loadLetterheads();
      } else {
        toast.error(result.message || 'Failed to update letterhead');
      }
    } catch (error) {
      toast.error('Failed to update letterhead');
    } finally {
      setIsLoading(false);
    }
  };

  // DataTable initialization
  useEffect(() => {
    if (tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        order: [[1, 'desc']],
        pageLength: 10,
        columnDefs: [
          { width: '10%', targets: 0 }, // No
          { width: '10%', targets: 1 }, // Date
          { width: '25%', targets: 2 }, // Name (only)
          { width: '20%', targets: 3 }, // Pastorate
          { width: '35%', targets: 4, orderable: false } // Actions
        ],
        language: {
          emptyTable: 'No letterheads found'
        }
      });
    }

    return () => {
      if (dataTableRef.current) {
        try {
          dataTableRef.current.destroy(false); // false = keep table in DOM
          dataTableRef.current = null;
        } catch (error) {
          // Ignore cleanup errors
          dataTableRef.current = null;
        }
      }
    };
  }, []);

  // Update DataTable when letterheads change
  useEffect(() => {
    if (dataTableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
      try {
        dataTableRef.current.clear();

        letterheads.forEach(letterhead => {
          // Extract only the name (first line) from rev_name, strip HTML
          const revNameText = letterhead.rev_name?.replace(/<[^>]*>/g, '').trim() || '';
          const nameOnly = revNameText.split('\n')[0].trim(); // Get first line only
          
          // Format date as dd-mm-yyyy
          let formattedDate = '';
          if (letterhead.letter_date) {
            const date = new Date(letterhead.letter_date);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
          }
          
          dataTableRef.current.row.add([
            letterhead.letterhead_number,
            formattedDate,
            nameOnly,
            letterhead.pastorate_name || '',
            `<div class="action-buttons">
              <button class="view-btn" data-id="${letterhead.id}">PDF</button>
              <button class="edit-btn" data-id="${letterhead.id}">Edit</button>
              <button class="delete-btn" data-id="${letterhead.id}">Delete</button>
            </div>`
          ]);
        });

        dataTableRef.current.draw();
      } catch (error) {
        console.error('Error updating DataTable:', error);
      }
    }
  }, [letterheads]);

  // Event handlers for DataTable buttons
  useEffect(() => {
    if (!tableRef.current) return;

    const handleViewClick = async (e) => {
      const btn = $(e.target).closest('.view-btn');
      if (btn.length) {
        e.preventDefault();
        e.stopPropagation();
        
        const id = parseInt(btn.data('id'));

        try {
          setLoadingMessage('Generating PDF...');
          setIsLoading(true);

          const pdfResult = await window.electron.letterhead.generatePDF(id);

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
        e.preventDefault();
        e.stopPropagation();
        
        const id = parseInt(btn.data('id'));
        const letterhead = letterheads.find(l => l.id === id);
        if (letterhead) {
          openEditModal(letterhead);
        }
      }
    };

    const handleDeleteClick = async (e) => {
      const btn = $(e.target).closest('.delete-btn');
      if (btn.length) {
        e.preventDefault();
        e.stopPropagation();
        
        const id = parseInt(btn.data('id'));
        const letterhead = letterheads.find(l => l.id === id);
        if (letterhead) {
          setLetterheadToDelete(letterhead);
          setIsDeleteModalOpen(true);
        }
      }
    };

    // Remove any existing handlers first
    $(tableRef.current).off('click', '.view-btn');
    $(tableRef.current).off('click', '.edit-btn');
    $(tableRef.current).off('click', '.delete-btn');

    // Attach new handlers
    $(tableRef.current).on('click', '.view-btn', handleViewClick);
    $(tableRef.current).on('click', '.edit-btn', handleEditClick);
    $(tableRef.current).on('click', '.delete-btn', handleDeleteClick);

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off('click', '.view-btn');
        $(tableRef.current).off('click', '.edit-btn');
        $(tableRef.current).off('click', '.delete-btn');
      }
    };
  }, [letterheads]);

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
                <h2>{user?.name || user?.username}'s Letters</h2>
                <button onClick={handleRefresh} className="refresh-btn">
                  <ArrowClockwise size={18} weight="bold" />
                  Refresh
                </button>
              </div>

              <div className="table-wrapper letterhead-table">
                <table ref={tableRef} className="display" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Pastorate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* DataTable will populate this */}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate Letterhead Form */}
            <div className="form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Letterhead Number *</label>
                  <input
                    type="text"
                    name="letterhead_number"
                    value={formData.letterhead_number}
                    onChange={handleInputChange}
                    placeholder="Letterhead Number"
                  />
                </div>

                <div className="form-group">
                  <label>Letter Date *</label>
                  <input
                    type="date"
                    name="letter_date"
                    value={formData.letter_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Verse *</label>
                  <input
                    type="text"
                    name="verse"
                    value={formData.verse}
                    onChange={handleInputChange}
                    placeholder="Verse"
                  />
                </div>

                <div className="form-group">
                  <label>Diocese Name *</label>
                  <input
                    type="text"
                    name="diocese_name"
                    value={formData.diocese_name}
                    onChange={handleInputChange}
                    placeholder="Diocese Name"
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
                  <label>Line Color *</label>
                  <input
                    type="color"
                    name="line_color"
                    value={formData.line_color}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Reverend Details and Address Grid */}
              <div className="letterhead-details-grid">
                {/* Left Side - Reverend Details */}
                <div className="letterhead-details-section">
                  <h3>Reverend Details</h3>

                  <div className="form-group">
                    <label>Name & Designation *</label>
                    <TinyMCEEditor
                      content={formData.rev_name}
                      onChange={(value) => handleEditorChange('rev_name', value)}
                      placeholder="Enter reverend's name and designation..."
                    />
                  </div>
                </div>

                {/* Right Side - Address */}
                <div className="letterhead-details-section">
                  <h3>Parsonage Address</h3>

                  <div className="form-group">
                    <label>Address *</label>
                    <TinyMCEEditor
                      content={formData.parsonage_address}
                      onChange={(value) => handleEditorChange('parsonage_address', value)}
                      placeholder="Enter parsonage address..."
                    />
                  </div>
                </div>
              </div>

              {/* Main Content Section */}
              <div className="main-content-section">
                <h3>Letter Content</h3>

                <div className="form-group">
                  <label>Content *</label>
                  <TinyMCEEditor
                    content={formData.content}
                    onChange={(value) => handleEditorChange('content', value)}
                    placeholder="Enter letter content..."
                    className="tinymce-main"
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button onClick={handleSaveLetterhead} className="save-btn">
                  Save Letterhead
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

      {/* Edit Letterhead Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Edit Letterhead</h2>
          <button onClick={closeEditModal} className="modal-close-btn">×</button>
        </div>

        <div className="modal-body">
          {editingLetterhead && (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label>Letterhead Number *</label>
                  <input
                    type="text"
                    name="letterhead_number"
                    value={editingLetterhead.letterhead_number}
                    onChange={handleEditInputChange}
                    placeholder="Letterhead Number"
                  />
                </div>

                <div className="form-group">
                  <label>Letter Date *</label>
                  <input
                    type="date"
                    name="letter_date"
                    value={editingLetterhead.letter_date}
                    onChange={handleEditInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Verse *</label>
                  <input
                    type="text"
                    name="verse"
                    value={editingLetterhead.verse}
                    onChange={handleEditInputChange}
                    placeholder="Verse"
                  />
                </div>

                <div className="form-group">
                  <label>Diocese Name *</label>
                  <input
                    type="text"
                    name="diocese_name"
                    value={editingLetterhead.diocese_name}
                    onChange={handleEditInputChange}
                    placeholder="Diocese Name"
                  />
                </div>

                <div className="form-group">
                  <label>Pastorate Name *</label>
                  <input
                    type="text"
                    name="pastorate_name"
                    value={editingLetterhead.pastorate_name}
                    onChange={handleEditInputChange}
                    placeholder="Pastorate Name"
                  />
                </div>

                <div className="form-group">
                  <label>Line Color *</label>
                  <input
                    type="color"
                    name="line_color"
                    value={editingLetterhead.line_color}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>

              {/* Reverend Details and Address Grid */}
              <div className="letterhead-details-grid">
                {/* Left Side - Reverend Details */}
                <div className="letterhead-details-section">
                  <h3>Reverend Details</h3>

                  <div className="form-group">
                    <label>Name & Designation *</label>
                    <TinyMCEEditor
                      content={editingLetterhead.rev_name}
                      onChange={(value) => handleEditEditorChange('rev_name', value)}
                      placeholder="Enter reverend's name and designation..."
                    />
                  </div>
                </div>

                {/* Right Side - Address */}
                <div className="letterhead-details-section">
                  <h3>Parsonage Address</h3>

                  <div className="form-group">
                    <label>Address *</label>
                    <TinyMCEEditor
                      content={editingLetterhead.parsonage_address}
                      onChange={(value) => handleEditEditorChange('parsonage_address', value)}
                      placeholder="Enter parsonage address..."
                    />
                  </div>
                </div>
              </div>

              {/* Main Content Section */}
              <div className="main-content-section">
                <h3>Letter Content</h3>

                <div className="form-group">
                  <label>Content *</label>
                  <TinyMCEEditor
                    content={editingLetterhead.content}
                    onChange={(value) => handleEditEditorChange('content', value)}
                    placeholder="Enter letter content..."
                    className="tinymce-main"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={closeEditModal} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleUpdateLetterhead} className="save-btn">
            Update Letterhead
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
          {letterheadToDelete && (
            <div className="delete-confirmation">
              <p>Are you sure you want to delete this letterhead?</p>
              <div className="record-details">
                <strong>Letterhead #{letterheadToDelete.letterhead_number}</strong><br/>
                {new Date(letterheadToDelete.letter_date).toLocaleDateString()}
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
              if (letterheadToDelete) {
                handleDeleteLetterhead(letterheadToDelete.id);
                setIsDeleteModalOpen(false);
              }
            }}
            className="delete-confirm-btn"
          >
            Delete Letterhead
          </button>
        </div>
      </Modal>
    </>
  );
};

export default LetterHead;

