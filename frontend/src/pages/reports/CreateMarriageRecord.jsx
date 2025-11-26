import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import toast from 'react-hot-toast';
import './ReportPage.css';

const CreateMarriageRecord = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    groomName: '',
    groomNameTamil: '',
    brideName: '',
    brideNameTamil: '',
    congregation: '',
    groomFatherName: '',
    groomMotherName: '',
    brideFatherName: '',
    brideMotherName: '',
    groomDOB: '',
    brideDOB: '',
    isGroomBachelor: '',
    isBrideSpinster: '',
    groomProfession: '',
    brideProfession: '',
    groomMobile: '',
    brideMobile: '',
    groomChurchName: '',
    groomPastorateName: '',
    brideChurchName: '',
    bridePastorateName: '',
    marriageDate: '',
    weddingPlace: '',
    firstBansDate: '',
    secondBansDate: '',
    thirdBansDate: '',
    serialNumber: '',
    solemnizedBy: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check for edit mode on component mount
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setIsEditMode(true);
      setEditId(parseInt(id));
      loadMarriageRecordForEdit(parseInt(id));
    }
  }, [searchParams]);

  const loadMarriageRecordForEdit = async (id) => {
    try {
      setLoadingMessage('Loading marriage record...');
      setIsLoading(true);

      const result = await window.electron.marriage.getById(id);

      if (result.success) {
        const record = result.data;
        setFormData({
          groomName: record.groomName || '',
          groomNameTamil: record.groomNameTamil || '',
          brideName: record.brideName || '',
          brideNameTamil: record.brideNameTamil || '',
          congregation: record.congregation || '',
          groomFatherName: record.groomFatherName || '',
          groomMotherName: record.groomMotherName || '',
          brideFatherName: record.brideFatherName || '',
          brideMotherName: record.brideMotherName || '',
          groomDOB: record.groomDOB || '',
          brideDOB: record.brideDOB || '',
          isGroomBachelor: record.isGroomBachelor || '',
          isBrideSpinster: record.isBrideSpinster || '',
          groomProfession: record.groomProfession || '',
          brideProfession: record.brideProfession || '',
          groomMobile: record.groomMobile || '',
          brideMobile: record.brideMobile || '',
          groomChurchName: record.groomChurchName || '',
          groomPastorateName: record.groomPastorateName || '',
          brideChurchName: record.brideChurchName || '',
          bridePastorateName: record.bridePastorateName || '',
          marriageDate: record.marriageDate || '',
          weddingPlace: record.weddingPlace || '',
          firstBansDate: record.firstBansDate || '',
          secondBansDate: record.secondBansDate || '',
          thirdBansDate: record.thirdBansDate || '',
          serialNumber: record.serialNumber || '',
          solemnizedBy: record.solemnizedBy || ''
        });
      } else {
        toast.error('Failed to load marriage record for editing');
        navigate('/reports/marriage');
      }
    } catch (error) {
      toast.error('Failed to load marriage record');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Marriage Records', path: '/reports/marriage' },
    { label: isEditMode ? 'Edit Marriage Record' : 'Create Marriage Record' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoadingMessage(isEditMode ? 'Updating marriage record...' : 'Saving marriage record...');
      setIsLoading(true);

      let result;
      if (isEditMode) {
        result = await window.electron.marriage.update(editId, formData);
      } else {
        result = await window.electron.marriage.create(formData);
      }

      if (result.success) {
        toast.success(`Marriage record ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate('/reports/marriage');
      } else {
        toast.error(result.message || `Failed to ${isEditMode ? 'update' : 'create'} marriage record`);
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} marriage record. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/reports/marriage');
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
              <button onClick={() => navigate('/reports/marriage')} className="back-btn">
                Back to Marriage Records
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="report-main">
          <div className="report-content wide-form">
            <h1>{isEditMode ? 'Edit Marriage Record' : 'Create Marriage Record'}</h1>

            <form onSubmit={handleSubmit} className="marriage-form">
              {/* Row 1: Groom Name, Groom Name in Tamil, Bride Name */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groomName">Groom Name</label>
                  <input
                    type="text"
                    id="groomName"
                    name="groomName"
                    value={formData.groomName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="groomNameTamil">Groom Name in Tamil</label>
                  <input
                    type="text"
                    id="groomNameTamil"
                    name="groomNameTamil"
                    value={formData.groomNameTamil}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideName">Bride Name</label>
                  <input
                    type="text"
                    id="brideName"
                    name="brideName"
                    value={formData.brideName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 2: Bride Name in Tamil, Congregation, Groom Father's Name */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="brideNameTamil">Bride Name in Tamil</label>
                  <input
                    type="text"
                    id="brideNameTamil"
                    name="brideNameTamil"
                    value={formData.brideNameTamil}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="congregation">Congregation</label>
                  <select
                    id="congregation"
                    name="congregation"
                    value={formData.congregation}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Congregation</option>
                    <option value="Bride">Bride</option>
                    <option value="Groom">Groom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="groomFatherName">Groom Father's Name</label>
                  <input
                    type="text"
                    id="groomFatherName"
                    name="groomFatherName"
                    value={formData.groomFatherName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 3: Groom Mother's Name, Bride Father's Name, Bride Mother's Name */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groomMotherName">Groom Mother's Name</label>
                  <input
                    type="text"
                    id="groomMotherName"
                    name="groomMotherName"
                    value={formData.groomMotherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideFatherName">Bride Father's Name</label>
                  <input
                    type="text"
                    id="brideFatherName"
                    name="brideFatherName"
                    value={formData.brideFatherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideMotherName">Bride Mother's Name</label>
                  <input
                    type="text"
                    id="brideMotherName"
                    name="brideMotherName"
                    value={formData.brideMotherName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 4: Groom DOB, Bride DOB, Is Groom Bachelor */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groomDOB">Groom DOB</label>
                  <input
                    type="date"
                    id="groomDOB"
                    name="groomDOB"
                    value={formData.groomDOB}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideDOB">Bride DOB</label>
                  <input
                    type="date"
                    id="brideDOB"
                    name="brideDOB"
                    value={formData.brideDOB}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="isGroomBachelor">Is Groom Bachelor</label>
                  <select
                    id="isGroomBachelor"
                    name="isGroomBachelor"
                    value={formData.isGroomBachelor}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Is Bride Spinster, Groom Profession, Bride Profession */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="isBrideSpinster">Is Bride Spinster</label>
                  <select
                    id="isBrideSpinster"
                    name="isBrideSpinster"
                    value={formData.isBrideSpinster}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="groomProfession">Groom Profession</label>
                  <input
                    type="text"
                    id="groomProfession"
                    name="groomProfession"
                    value={formData.groomProfession}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideProfession">Bride Profession</label>
                  <input
                    type="text"
                    id="brideProfession"
                    name="brideProfession"
                    value={formData.brideProfession}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 6: Groom Mobile number, Bride Mobile number, Groom Church Name */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groomMobile">Groom Mobile number</label>
                  <input
                    type="tel"
                    id="groomMobile"
                    name="groomMobile"
                    value={formData.groomMobile}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideMobile">Bride Mobile number</label>
                  <input
                    type="tel"
                    id="brideMobile"
                    name="brideMobile"
                    value={formData.brideMobile}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="groomChurchName">Groom Church Name</label>
                  <input
                    type="text"
                    id="groomChurchName"
                    name="groomChurchName"
                    value={formData.groomChurchName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 7: Groom pastorate Name, Bride Church Name, Bride pastorate Name */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groomPastorateName">Groom pastorate Name</label>
                  <input
                    type="text"
                    id="groomPastorateName"
                    name="groomPastorateName"
                    value={formData.groomPastorateName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brideChurchName">Bride Church Name</label>
                  <input
                    type="text"
                    id="brideChurchName"
                    name="brideChurchName"
                    value={formData.brideChurchName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bridePastorateName">Bride pastorate Name</label>
                  <input
                    type="text"
                    id="bridePastorateName"
                    name="bridePastorateName"
                    value={formData.bridePastorateName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 8: Marriage Date, Wedding Place (Church), 1st bans Date */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="marriageDate">Marriage Date</label>
                  <input
                    type="date"
                    id="marriageDate"
                    name="marriageDate"
                    value={formData.marriageDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="weddingPlace">Wedding Place (Church)</label>
                  <input
                    type="text"
                    id="weddingPlace"
                    name="weddingPlace"
                    value={formData.weddingPlace}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="firstBansDate">1st bans Date</label>
                  <input
                    type="date"
                    id="firstBansDate"
                    name="firstBansDate"
                    value={formData.firstBansDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 9: 2nd bans Date, 3rd bans Date, Serial Number */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="secondBansDate">2nd bans Date</label>
                  <input
                    type="date"
                    id="secondBansDate"
                    name="secondBansDate"
                    value={formData.secondBansDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="thirdBansDate">3rd bans Date</label>
                  <input
                    type="date"
                    id="thirdBansDate"
                    name="thirdBansDate"
                    value={formData.thirdBansDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="serialNumber">Serial Number</label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 10: Solemnized By */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="solemnizedBy">Solemnized By</label>
                  <input
                    type="text"
                    id="solemnizedBy"
                    name="solemnizedBy"
                    value={formData.solemnizedBy}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  {/* Empty space for 3-field layout */}
                </div>
                <div className="form-group">
                  {/* Empty space for 3-field layout */}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Marriage Record' : 'Save Marriage Record'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateMarriageRecord;