import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import './ReportPage.css';

const SabaiJabitha = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [year, setYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [stats, setStats] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports', path: '/dashboard' },
    { label: 'Sabai Jabitha' }
  ];

  // Load churches on mount
  useEffect(() => {
    loadChurches();
    setDefaultYear();
  }, []);

  // Load stats when church is selected
  useEffect(() => {
    if (selectedChurch) {
      loadStats(selectedChurch.id);
    }
  }, [selectedChurch]);

  const setDefaultYear = () => {
    const currentYear = new Date().getFullYear();
    setYear(`${currentYear}-${currentYear + 1}`);
  };

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

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const loadStats = async (churchId) => {
    if (!churchId) {
      setStats(null);
      return;
    }

    try {
      // Get all areas for this church
      const areasResult = await window.electron.area.getByChurch(churchId);
      const churchAreas = areasResult.success ? areasResult.data : [];
      const areaIds = churchAreas.map(a => a.id);

      // Get all families for this church
      const familiesResult = await window.electron.family.getAll();
      const churchFamilies = familiesResult.success 
        ? familiesResult.data.filter(f => areaIds.includes(f.areaId))
        : [];

      // Get all members for this church
      const membersResult = await window.electron.member.getAll();
      const familyIds = churchFamilies.map(f => f.id);
      const churchMembers = membersResult.success
        ? membersResult.data.filter(m => familyIds.includes(m.familyId) && m.isAlive)
        : [];

      // Calculate statistics
      const statistics = {
        // Baptised Members
        baptisedMaleUpTo15: churchMembers.filter(m => m.isBaptised && m.sex === 'Male' && calculateAge(m.dob) <= 15).length,
        baptisedMale16To35: churchMembers.filter(m => m.isBaptised && m.sex === 'Male' && calculateAge(m.dob) >= 16 && calculateAge(m.dob) <= 35).length,
        baptisedMaleAbove35: churchMembers.filter(m => m.isBaptised && m.sex === 'Male' && calculateAge(m.dob) > 35).length,
        
        baptisedFemaleUpTo15: churchMembers.filter(m => m.isBaptised && m.sex === 'Female' && calculateAge(m.dob) <= 15).length,
        baptisedFemale16To35: churchMembers.filter(m => m.isBaptised && m.sex === 'Female' && calculateAge(m.dob) >= 16 && calculateAge(m.dob) <= 35).length,
        baptisedFemaleAbove35: churchMembers.filter(m => m.isBaptised && m.sex === 'Female' && calculateAge(m.dob) > 35).length,

        // Communicant Members (Confirmed)
        communicantMaleBelow35: churchMembers.filter(m => m.isConfirmed && m.sex === 'Male' && calculateAge(m.dob) < 35).length,
        communicantMaleAbove35: churchMembers.filter(m => m.isConfirmed && m.sex === 'Male' && calculateAge(m.dob) >= 35).length,
        
        communicantFemaleBelow35: churchMembers.filter(m => m.isConfirmed && m.sex === 'Female' && calculateAge(m.dob) < 35).length,
        communicantFemaleAbove35: churchMembers.filter(m => m.isConfirmed && m.sex === 'Female' && calculateAge(m.dob) >= 35).length,

        // Youth (16-30, unmarried)
        youthMale: churchMembers.filter(m => {
          const age = calculateAge(m.dob);
          return m.sex === 'Male' && age >= 16 && age <= 30 && !m.isMarried;
        }).length,
        youthFemale: churchMembers.filter(m => {
          const age = calculateAge(m.dob);
          return m.sex === 'Female' && age >= 16 && age <= 30 && !m.isMarried;
        }).length,

        // Children (below 15)
        childrenMale: churchMembers.filter(m => m.sex === 'Male' && calculateAge(m.dob) < 15).length,
        childrenFemale: churchMembers.filter(m => m.sex === 'Female' && calculateAge(m.dob) < 15).length,

        // Married
        marriedMale: churchMembers.filter(m => m.sex === 'Male' && m.isMarried).length,
        marriedFemale: churchMembers.filter(m => m.sex === 'Female' && m.isMarried).length,
      };

      // Calculate horizontal totals (row totals)
      statistics.baptisedTotalUpTo15 = statistics.baptisedMaleUpTo15 + statistics.baptisedFemaleUpTo15;
      statistics.baptisedTotal16To35 = statistics.baptisedMale16To35 + statistics.baptisedFemale16To35;
      statistics.baptisedTotalAbove35 = statistics.baptisedMaleAbove35 + statistics.baptisedFemaleAbove35;

      statistics.communicantTotalBelow35 = statistics.communicantMaleBelow35 + statistics.communicantFemaleBelow35;
      statistics.communicantTotalAbove35 = statistics.communicantMaleAbove35 + statistics.communicantFemaleAbove35;

      statistics.youthTotal = statistics.youthMale + statistics.youthFemale;
      statistics.childrenTotal = statistics.childrenMale + statistics.childrenFemale;
      statistics.marriedTotal = statistics.marriedMale + statistics.marriedFemale;

      // Calculate vertical totals (column totals) for Baptised Members
      statistics.baptisedMaleTotal = statistics.baptisedMaleUpTo15 + statistics.baptisedMale16To35 + statistics.baptisedMaleAbove35;
      statistics.baptisedFemaleTotal = statistics.baptisedFemaleUpTo15 + statistics.baptisedFemale16To35 + statistics.baptisedFemaleAbove35;
      statistics.baptisedGrandTotal = statistics.baptisedMaleTotal + statistics.baptisedFemaleTotal;

      // Calculate vertical totals (column totals) for Communicant Members
      statistics.communicantMaleTotal = statistics.communicantMaleBelow35 + statistics.communicantMaleAbove35;
      statistics.communicantFemaleTotal = statistics.communicantFemaleBelow35 + statistics.communicantFemaleAbove35;
      statistics.communicantGrandTotal = statistics.communicantMaleTotal + statistics.communicantFemaleTotal;

      setStats(statistics);
    } catch (error) {
      console.error('Failed to load statistics', error);
      setStats(null);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedChurch) {
      toast.error('Please select a church');
      return;
    }

    if (!year) {
      toast.error('Please enter year');
      return;
    }

    try {
      setLoadingMessage('Generating Sabai Jabitha PDF...');
      setIsLoading(true);

      const result = await window.electron.sabaiJabitha.generatePDF({
        churchId: selectedChurch.id,
        year
      });

      if (result.success) {
        toast.success('Sabai Jabitha PDF generated and opened successfully!');
      } else {
        toast.error(result.message || 'Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
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
            <h1>Sabai Jabitha</h1>

            {/* Filter Section */}
            <div className="filter-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Church <span className="required">*</span></label>
                  <select
                    value={selectedChurch?.id || ''}
                    onChange={(e) => {
                      const church = churches.find(c => c.id === parseInt(e.target.value));
                      setSelectedChurch(church);
                      loadStats(church?.id);
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
                  <label>Year <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="2025-2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    maxLength="9"
                  />
                </div>

                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    onClick={handleGeneratePDF}
                    className="pdf-btn"
                    disabled={!selectedChurch || !year}
                  >
                    Generate PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Panel */}
            {stats && selectedChurch && (
              <div className="stats-panel">
                <h2>Church Statistics - {selectedChurch.churchName}</h2>
                
                {/* Row 1: 2 Reports */}
                <div className="stats-row stats-row-2">
                  {/* Baptised Members */}
                  <div className="stats-section">
                    <h3>Baptised Members</h3>
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Male</th>
                          <th>Female</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Age up to 15</td>
                          <td>{stats.baptisedMaleUpTo15}</td>
                          <td>{stats.baptisedFemaleUpTo15}</td>
                          <td><strong>{stats.baptisedTotalUpTo15}</strong></td>
                        </tr>
                        <tr>
                          <td>Age 16-35</td>
                          <td>{stats.baptisedMale16To35}</td>
                          <td>{stats.baptisedFemale16To35}</td>
                          <td><strong>{stats.baptisedTotal16To35}</strong></td>
                        </tr>
                        <tr>
                          <td>Age above 35</td>
                          <td>{stats.baptisedMaleAbove35}</td>
                          <td>{stats.baptisedFemaleAbove35}</td>
                          <td><strong>{stats.baptisedTotalAbove35}</strong></td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="total-row">
                          <td><strong>Total</strong></td>
                          <td><strong>{stats.baptisedMaleTotal}</strong></td>
                          <td><strong>{stats.baptisedFemaleTotal}</strong></td>
                          <td><strong>{stats.baptisedGrandTotal}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Communicant Members */}
                  <div className="stats-section">
                    <h3>Communicant Members (Confirmed)</h3>
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Male</th>
                          <th>Female</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Age below 35</td>
                          <td>{stats.communicantMaleBelow35}</td>
                          <td>{stats.communicantFemaleBelow35}</td>
                          <td><strong>{stats.communicantTotalBelow35}</strong></td>
                        </tr>
                        <tr>
                          <td>Age above 35</td>
                          <td>{stats.communicantMaleAbove35}</td>
                          <td>{stats.communicantFemaleAbove35}</td>
                          <td><strong>{stats.communicantTotalAbove35}</strong></td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="total-row">
                          <td><strong>Total</strong></td>
                          <td><strong>{stats.communicantMaleTotal}</strong></td>
                          <td><strong>{stats.communicantFemaleTotal}</strong></td>
                          <td><strong>{stats.communicantGrandTotal}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Row 2: 3 Reports */}
                <div className="stats-row stats-row-3">
                  {/* Youth Count */}
                  <div className="stats-section">
                    <h3>Youth Count (Age 16-30, Unmarried)</h3>
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Male</th>
                          <th>Female</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{stats.youthMale}</td>
                          <td>{stats.youthFemale}</td>
                          <td><strong>{stats.youthTotal}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Children Count */}
                  <div className="stats-section">
                    <h3>Children Count (Age below 15)</h3>
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Male</th>
                          <th>Female</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{stats.childrenMale}</td>
                          <td>{stats.childrenFemale}</td>
                          <td><strong>{stats.childrenTotal}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Married Count */}
                  <div className="stats-section">
                    <h3>Married Members</h3>
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Male</th>
                          <th>Female</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{stats.marriedMale}</td>
                          <td>{stats.marriedFemale}</td>
                          <td><strong>{stats.marriedTotal}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default SabaiJabitha;

