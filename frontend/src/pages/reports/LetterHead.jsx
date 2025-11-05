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
    if (!window.confirm('Are you sure you want to delete this letterhead?')) return;

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
          { orderable: false, targets: 4 }
        ],
        language: {
          emptyTable: 'No letterheads found'
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

  // Update DataTable when letterheads change
  useEffect(() => {
    if (dataTableRef.current) {
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(
        letterheads.map(letterhead => [
          letterhead.letterhead_number,
          letterhead.letter_date,
          letterhead.rev_name?.replace(/<[^>]*>/g, '').substring(0, 50) || '',
          letterhead.pastorate_name || '',
          `<div class="action-buttons">
            <button class="view-btn" data-id="${letterhead.id}" title="View PDF">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path></svg>
            </button>
            <button class="edit-btn" data-id="${letterhead.id}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
            </button>
            <button class="delete-btn" data-id="${letterhead.id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
            </button>
          </div>`
        ])
      );
      dataTableRef.current.draw();
    }
  }, [letterheads]);

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
        const id = parseInt(btn.data('id'));
        await handleDeleteLetterhead(id);
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
                <h2>Previous Records</h2>
                <button onClick={handleRefresh} className="refresh-btn">
                  <ArrowClockwise size={18} weight="bold" />
                  Refresh
                </button>
              </div>

              <table ref={tableRef} className="display" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Letterhead No.</th>
                    <th>Date</th>
                    <th>Rev Name</th>
                    <th>Pastorate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* DataTable will populate this */}
                </tbody>
              </table>
            </div>

            {/* Generate Letterhead Form */}
            <div className="form-section">
              <h2>Generate Letterhead</h2>

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
    </>
  );
};

export default LetterHead;

