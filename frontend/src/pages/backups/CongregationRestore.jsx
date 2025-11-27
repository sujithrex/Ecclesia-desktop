import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { WarningCircle, CheckCircle, XCircle } from '@phosphor-icons/react';
import '../reports/ReportPage.css';
import './CongregationRestore.css';

const CongregationRestore = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoreMode, setRestoreMode] = useState('merge');
  const [previewData, setPreviewData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [step, setStep] = useState(1); // Step 1: Select file, Step 2: Preview & Restore
  
  // Full DB Restore states
  const [fullDbFile, setFullDbFile] = useState(null);
  const [fullDbPreview, setFullDbPreview] = useState(null);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showFullDbConfirm, setShowFullDbConfirm] = useState(false);
  const [fullDbConfirmText, setFullDbConfirmText] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Backups', path: '/dashboard' },
    { label: 'Congregation Restore' }
  ];

  useEffect(() => {
    loadChurches();
  }, []);

  const loadChurches = async () => {
    try {
      const result = await window.electron.church.getAll();
      if (result.success) {
        setChurches(result.data);
        if (result.data.length > 0) {
          setSelectedChurch(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load churches');
    }
  };

  const handleFileSelect = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church first');
      return;
    }

    try {
      console.log('Starting file selection...');
      
      // Use Electron dialog to select file
      const result = await window.electron.backup.selectRestoreFile();
      
      console.log('File selection result:', result);
      
      if (!result.success || !result.filePath) {
        if (result.message && result.message !== 'File selection canceled') {
          toast.error(result.message);
        }
        return; // User canceled
      }

      setSelectedFile({ name: result.fileName, path: result.filePath });
      toast.success('File selected! Click Next to preview.');
      
    } catch (error) {
      console.error('File select error:', error);
      toast.error('Failed to select file: ' + error.message);
      setSelectedFile(null);
    }
  };

  const handleNext = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setLoadingMessage('Analyzing CSV file...');
      setIsLoading(true);

      console.log('Previewing file:', selectedFile.path);

      const previewResult = await window.electron.backup.previewCongregationRestore({
        filePath: selectedFile.path,
        churchId: selectedChurch.id
      });

      console.log('Preview result:', previewResult);

      if (previewResult.success) {
        setPreviewData(previewResult.preview);
        setStep(2);
        if (previewResult.preview.errors.length > 0) {
          toast.error(`Found ${previewResult.preview.errors.length} validation errors`);
        } else {
          toast.success('File validated successfully!');
        }
      } else {
        toast.error(previewResult.message || 'Failed to preview file');
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview file: ' + error.message);
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile || !selectedChurch) {
      toast.error('Please select a file and church');
      return;
    }

    // If replace mode, show confirmation dialog
    if (restoreMode === 'replace') {
      setShowDeleteConfirm(true);
      return;
    }

    // Execute restore
    executeRestore();
  };

  const executeRestore = async () => {
    try {
      setLoadingMessage('Restoring congregation data...');
      setIsLoading(true);
      setShowDeleteConfirm(false);

      const result = await window.electron.backup.restoreCongregationBackup({
        filePath: selectedFile.path,
        churchId: selectedChurch.id,
        mode: restoreMode
      });

      if (result.success) {
        toast.success(
          `Restore completed!\n` +
          `${result.stats.imported} imported\n` +
          `${result.stats.updated} updated\n` +
          `${result.stats.skipped} skipped\n` +
          `${result.stats.failed} failed`,
          { duration: 6000 }
        );
        
        // Reset form
        setSelectedFile(null);
        setPreviewData(null);
        setDeleteConfirmText('');
      } else {
        toast.error(result.message || 'Failed to restore data');
      }
    } catch (error) {
      toast.error('Failed to restore data');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  // Full Database Restore handlers
  const handleFullDbFileSelect = async () => {
    try {
      const result = await window.electron.backup.selectFullDatabaseRestoreFile();
      
      if (!result.success || !result.filePath) {
        if (result.message && result.message !== 'File selection canceled') {
          toast.error(result.message);
        }
        return;
      }

      setFullDbFile({ name: result.fileName, path: result.filePath });
      toast.success('File selected! Click Preview to validate.');
      
    } catch (error) {
      console.error('File select error:', error);
      toast.error('Failed to select file: ' + error.message);
      setFullDbFile(null);
    }
  };

  const handleFullDbPreview = async () => {
    if (!fullDbFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setLoadingMessage('Validating database backup...');
      setIsLoading(true);

      const result = await window.electron.backup.previewFullDatabaseRestore({
        filePath: fullDbFile.path
      });

      if (result.success) {
        setFullDbPreview(result.stats);
        toast.success('Backup file validated successfully!');
      } else {
        toast.error(result.message || 'Failed to validate backup file');
        setFullDbPreview(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview backup: ' + error.message);
      setFullDbPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullDbRestore = () => {
    if (!fullDbFile) {
      toast.error('Please select a file first');
      return;
    }

    // Show confirmation modal
    setShowFullDbConfirm(true);
  };

  const executeFullDbRestore = async () => {
    try {
      setLoadingMessage('Restoring full database...');
      setIsLoading(true);
      setShowFullDbConfirm(false);

      const result = await window.electron.backup.restoreFullDatabase({
        filePath: fullDbFile.path
      });

      if (result.success) {
        toast.success('Database restored successfully!');
        setShowRestartModal(true);
      } else {
        toast.error(result.message || 'Failed to restore database');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore database: ' + error.message);
    } finally {
      setIsLoading(false);
      setFullDbConfirmText('');
    }
  };

  const cancelFullDbConfirm = () => {
    setShowFullDbConfirm(false);
    setFullDbConfirmText('');
  };

  const handleRestart = async () => {
    await window.electron.app.restart();
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
            <h1>Congregation Restore</h1>
            <p className="report-description">
              Import congregation data from a CSV backup file.
            </p>

            {/* Configuration Section */}
            <div className="filter-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Target Church <span className="required">*</span></label>
                  <select
                    value={selectedChurch?.id || ''}
                    onChange={(e) => {
                      const church = churches.find(c => c.id === parseInt(e.target.value));
                      setSelectedChurch(church);
                      setPreviewData(null);
                      setSelectedFile(null);
                    }}
                  >
                    <option value="">Select Church</option>
                    {churches.map(church => (
                      <option key={church.id} value={church.id}>
                        {church.churchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Restore Mode <span className="required">*</span></label>
                  <select
                    value={restoreMode}
                    onChange={(e) => setRestoreMode(e.target.value)}
                  >
                    <option value="merge">Merge (Update existing, add new)</option>
                    <option value="replace">Replace (Delete all, then import)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CSV File <span className="required">*</span></label>
                  <button
                    onClick={handleFileSelect}
                    className="file-select-btn"
                    disabled={!selectedChurch || step === 2}
                  >
                    {selectedFile ? 'Change File' : 'Select CSV File'}
                  </button>
                  {selectedFile && (
                    <p className="file-selected">Selected: {selectedFile.name}</p>
                  )}
                </div>

                {selectedFile && step === 1 && (
                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button
                      onClick={handleNext}
                      className="next-btn"
                    >
                      Next: Preview Data
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {step === 2 && previewData && (
              <div className="preview-section">
                <h2>Preview</h2>
                
                <div className="preview-stats">
                  <div className="stat-card">
                    <div className="stat-value">{previewData.totalRows}</div>
                    <div className="stat-label">Total Records</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{previewData.areas}</div>
                    <div className="stat-label">Areas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{previewData.families}</div>
                    <div className="stat-label">Families</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{previewData.members}</div>
                    <div className="stat-label">Members</div>
                  </div>
                </div>

                {/* Errors */}
                {previewData.errors.length > 0 && (
                  <div className="error-list">
                    <h3>
                      <XCircle size={24} weight="fill" />
                      Validation Errors ({previewData.errors.length})
                    </h3>
                    <div className="error-items">
                      {previewData.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          <span className="error-row">Row {error.row}:</span>
                          <span className="error-message">{error.message}</span>
                        </div>
                      ))}
                    </div>
                    <p className="error-note">
                      <WarningCircle size={20} weight="fill" />
                      Rows with errors will be skipped during import.
                    </p>
                  </div>
                )}

                {/* Warnings */}
                {previewData.warnings.length > 0 && (
                  <div className="warning-list">
                    <h3>
                      <WarningCircle size={24} weight="fill" />
                      Warnings ({previewData.warnings.length})
                    </h3>
                    <div className="warning-items">
                      {previewData.warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                          <span className="warning-row">Row {warning.row}:</span>
                          <span className="warning-message">{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {previewData.errors.length === 0 && (
                  <div className="success-message">
                    <CheckCircle size={24} weight="fill" />
                    File is valid and ready to import!
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {step === 2 && previewData && (
              <div className="action-buttons">
                <button
                  onClick={() => {
                    setStep(1);
                    setPreviewData(null);
                    setSelectedFile(null);
                  }}
                  className="back-btn"
                >
                  Back
                </button>
                <button
                  onClick={handleRestore}
                  className="pdf-btn"
                  disabled={!selectedFile || !selectedChurch}
                >
                  {restoreMode === 'replace' ? 'Replace Data' : 'Restore Data'}
                </button>
              </div>
            )}

            {/* Full Database Restore Section */}
            <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e0e0e0' }}>
        <h1>2. Full Database Restore (JSON)</h1>
        <p className="report-description">
          Restore the entire database from a JSON backup file. This will replace ALL current data.
        </p>

        <div className="filter-section">
          <div className="form-row">
            <div className="form-group">
              <label>JSON Backup File <span className="required">*</span></label>
              <button
                onClick={handleFullDbFileSelect}
                className="file-select-btn"
              >
                {fullDbFile ? 'Change File' : 'Select JSON File'}
              </button>
              {fullDbFile && (
                <p className="file-selected">Selected: {fullDbFile.name}</p>
              )}
            </div>

            {fullDbFile && !fullDbPreview && (
              <div className="form-group">
                <label>&nbsp;</label>
                <button
                  onClick={handleFullDbPreview}
                  className="next-btn"
                >
                  Preview Backup
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full DB Preview */}
        {fullDbPreview && (
          <div className="preview-section">
            <h2>Backup Contents</h2>
            
            <div className="preview-stats">
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.users}</div>
                <div className="stat-label">Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.churches}</div>
                <div className="stat-label">Churches</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.areas}</div>
                <div className="stat-label">Areas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.families}</div>
                <div className="stat-label">Families</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.members}</div>
                <div className="stat-label">Members</div>
              </div>
            </div>

            <div className="preview-stats" style={{ marginTop: '20px' }}>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.infantBaptismCertificates}</div>
                <div className="stat-label">Infant Baptisms</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.adultBaptismCertificates}</div>
                <div className="stat-label">Adult Baptisms</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.marriageRecords}</div>
                <div className="stat-label">Marriages</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.burialRegisters}</div>
                <div className="stat-label">Burials</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fullDbPreview.letterheads}</div>
                <div className="stat-label">Letterheads</div>
              </div>
            </div>

            <div className="action-buttons" style={{ marginTop: '30px' }}>
              <button
                onClick={() => {
                  setFullDbPreview(null);
                  setFullDbFile(null);
                }}
                className="back-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleFullDbRestore}
                className="pdf-btn"
              >
                Restore Full Database
              </button>
            </div>
          </div>
        )}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h2>Dangerous Operation</h2>
            <p className="warning-text">
              You are about to DELETE ALL existing congregation data for <strong>{selectedChurch?.churchName}</strong> and replace it with the CSV data.
            </p>
            <p className="warning-subtext">
              This action cannot be undone!
            </p>
            <div className="form-group">
              <label>Type <strong>DELETE</strong> to confirm:</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button onClick={cancelDeleteConfirm} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={executeRestore}
                className="delete-confirm-btn"
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Delete and Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Database Restore Confirmation Modal */}
      {showFullDbConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h2>Dangerous Operation</h2>
            <p className="warning-text">
              You are about to REPLACE YOUR ENTIRE DATABASE with the backup file.
            </p>
            <p className="warning-subtext">
              All current data (users, churches, members, certificates, etc.) will be replaced!
            </p>
            <p className="warning-subtext" style={{ marginTop: '10px' }}>
              This action cannot be undone!
            </p>
            <div className="form-group">
              <label>Type <strong>RESTORE</strong> to confirm:</label>
              <input
                type="text"
                value={fullDbConfirmText}
                onChange={(e) => setFullDbConfirmText(e.target.value)}
                placeholder="RESTORE"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button onClick={cancelFullDbConfirm} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={executeFullDbRestore}
                className="delete-confirm-btn"
                disabled={fullDbConfirmText !== 'RESTORE'}
              >
                Restore Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Required Modal */}
      {showRestartModal && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h2>Restore Complete!</h2>
            <p className="warning-text" style={{ color: '#B5316A' }}>
              The database has been restored successfully.
            </p>
            <p className="warning-subtext">
              The application needs to restart to apply the changes.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleRestart}
                className="pdf-btn"
                style={{ width: '100%' }}
              >
                Restart Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CongregationRestore;
