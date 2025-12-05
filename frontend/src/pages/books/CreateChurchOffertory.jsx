import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, Trash } from '@phosphor-icons/react';
import { eachDayOfInterval, startOfMonth, endOfMonth, isSunday, format, parse } from 'date-fns';
import './CreateChurchOffertory.css';

const CreateChurchOffertory = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pastorate = location.state?.pastorate;
  const year = location.state?.year;
  const month = location.state?.month;
  const church = location.state?.church;
  const categories = location.state?.categories || [];
  const editOffertory = location.state?.editOffertory;

  const [isLoading, setIsLoading] = useState(false);
  const [harvestFestivalByService, setHarvestFestivalByService] = useState({});
  const [services, setServices] = useState([]);

  // Find the Harvest Festival category
  const harvestFestivalCategory = categories.find(c => c.name === 'அறுப்பின் பண்டிகை');

  // Simple function to get all Sundays in a month using date-fns
  const getSundaysInMonth = () => {
    if (!month || !year?.year) return [];
    try {
      const monthDate = parse(`${month} ${year.year}`, 'MMMM yyyy', new Date());
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const allDays = eachDayOfInterval({ start, end });
      return allDays.filter(day => isSunday(day));
    } catch (e) {
      console.error('Date parsing error:', e);
      return [];
    }
  };

  // Create default services for all Sundays
  const createDefaultServices = () => {
    const sundays = getSundaysInMonth();
    if (sundays.length === 0) {
      return [{ id: 1, date: format(new Date(), 'yyyy-MM-dd'), categoryAmounts: {}, total: 0 }];
    }
    return sundays.map((sunday, i) => ({
      id: i + 1,
      date: format(sunday, 'yyyy-MM-dd'),
      categoryAmounts: {},
      total: 0
    }));
  };

  // Load HF amounts per service date
  const loadHarvestFestivalByService = async () => {
    if (!pastorate || !year || !month || !church) return;
    try {
      const result = await window.electron.harvestFestival.getPayments(pastorate.pastorateName, year.year, month);
      if (result.success && result.data) {
        const baseEntriesResult = await window.electron.harvestFestival.getBaseEntries(pastorate.pastorateName, year.year);
        if (baseEntriesResult.success && baseEntriesResult.data) {
          const churchBaseEntryIds = baseEntriesResult.data.filter(e => e.hfChurchId === church.id).map(e => e.id);
          const byService = {};
          result.data.filter(p => churchBaseEntryIds.includes(p.baseEntryId)).forEach(p => {
            const serviceDate = p.serviceDate || p.date;
            if (!byService[serviceDate]) byService[serviceDate] = 0;
            byService[serviceDate] += parseFloat(p.amount) || 0;
          });
          setHarvestFestivalByService(byService);
        }
      }
    } catch (error) {
      console.error('Failed to load harvest festival:', error);
    }
  };

  useEffect(() => {
    if (!pastorate || !church) {
      navigate('/dashboard');
      return;
    }
    loadHarvestFestivalByService();
    if (editOffertory) {
      setServices([...(editOffertory.services || [])].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } else {
      setServices(createDefaultServices());
    }
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    ...(year ? [{ label: year.year, path: '/year-books', state: { pastorate, year } }] : []),
    ...(month ? [{ label: month, path: '/month-books', state: { pastorate, year, month } }] : []),
    { label: 'Church Offertory', path: '/books/church-offertory', state: { pastorate, year, month } },
    { label: editOffertory ? 'Edit' : 'Create' }
  ];

  const getHfAmount = (serviceDate) => harvestFestivalByService[serviceDate] || 0;

  const calculateTotal = (categoryAmounts, serviceDate) => {
    let total = Object.values(categoryAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
    if (harvestFestivalCategory && !categoryAmounts[harvestFestivalCategory.id]) {
      total += getHfAmount(serviceDate);
    }
    return total;
  };

  const handleServiceChange = (serviceId, field, value) => {
    setServices(prev => {
      const updated = prev.map(s => {
        if (s.id !== serviceId) return s;
        if (field === 'date') return { ...s, date: value, total: calculateTotal(s.categoryAmounts, value) };
        const newAmounts = { ...s.categoryAmounts, [field]: value };
        return { ...s, categoryAmounts: newAmounts, total: calculateTotal(newAmounts, s.date) };
      });
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  };

  const addService = () => {
    setServices(prev => [...prev, { id: Date.now(), date: format(new Date(), 'yyyy-MM-dd'), categoryAmounts: {}, total: 0 }]
      .sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  const removeService = (id) => {
    if (services.length <= 1) { toast.error('At least one service required'); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  };


  const handleSave = async () => {
    const validServices = services.filter(s => s.date);
    if (validServices.length === 0) { toast.error('Add at least one service'); return; }

    try {
      setIsLoading(true);
      const servicesWithHF = validServices.map(s => {
        const hfAmount = getHfAmount(s.date);
        const amounts = harvestFestivalCategory && hfAmount > 0 
          ? { ...s.categoryAmounts, [harvestFestivalCategory.id]: hfAmount } 
          : s.categoryAmounts;
        return { ...s, categoryAmounts: amounts, total: calculateTotal(amounts, s.date) };
      });

      const offertoryData = {
        pastorateName: pastorate.pastorateName,
        year: year?.year,
        month,
        churchId: church.id,
        churchName: church.churchName,
        date: servicesWithHF[0].date,
        services: servicesWithHF,
        totalAmount: servicesWithHF.reduce((sum, s) => sum + s.total, 0)
      };

      const result = editOffertory 
        ? await window.electron.churchOffertory.update(editOffertory.id, offertoryData)
        : await window.electron.churchOffertory.create(offertoryData);

      if (result.success) {
        toast.success(`Offertory ${editOffertory ? 'updated' : 'created'}!`);
        navigate('/books/church-offertory', { state: { pastorate, year, month } });
      } else {
        toast.error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  if (!pastorate || !church) return null;

  return (
    <>
      <TitleBar /><StatusBar />
      {isLoading && <LoadingScreen message="Saving..." />}
      <div className="create-offertory-container">
        <header className="create-offertory-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/books/church-offertory', { state: { pastorate, year, month } })} className="back-btn">Back</button>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </header>

        <main className="create-offertory-main">
          <div className="create-offertory-content">
            <h1 className="page-title">{editOffertory ? 'Edit' : 'Create'} Offertory - {church.churchName} ({month} {year?.year})</h1>

            <div className="services-section">
              <div className="section-header">
                <h2 className="section-title">Services</h2>
                <button onClick={addService} className="add-service-btn"><Plus size={20} /> Add Service</button>
              </div>

              {services.map((service, idx) => (
                <div key={service.id} className="service-card">
                  <div className="service-header">
                    <h3 className="service-title">Service {idx + 1}</h3>
                    {services.length > 1 && (
                      <button onClick={() => removeService(service.id)} className="remove-service-btn"><Trash size={18} /></button>
                    )}
                  </div>
                  <div className="service-content">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date *</label>
                        <input type="date" value={service.date} onChange={(e) => handleServiceChange(service.id, 'date', e.target.value)} className="service-input" required />
                      </div>
                    </div>
                    <div className="categories-grid">
                      {categories.map((cat) => {
                        const isHF = cat.name === 'அறுப்பின் பண்டிகை';
                        const hfAmt = getHfAmount(service.date);
                        const val = isHF ? hfAmt : (service.categoryAmounts[cat.id] || '');
                        return (
                          <div key={cat.id} className={`form-group ${isHF && hfAmt > 0 ? 'hf-auto-field' : ''}`}>
                            <label>{cat.name}{isHF && hfAmt > 0 && <span className="auto-label">(Auto)</span>}</label>
                            <input
                              type="number"
                              value={val || ''}
                              onChange={(e) => !isHF && handleServiceChange(service.id, cat.id, e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className={`service-input ${isHF ? 'readonly-input' : ''}`}
                              readOnly={isHF}
                              disabled={isHF}
                            />
                          </div>
                        );
                      })}
                      <div className="form-group total-field">
                        <label>Total</label>
                        <input type="text" value={`₹${(service.total || 0).toFixed(2)}`} readOnly disabled className="service-input total-input" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grand-total-section">
              <div className="grand-total-card">
                <span className="grand-total-label">Grand Total:</span>
                <span className="grand-total-value">₹{services.reduce((sum, s) => sum + (s.total || 0), 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="save-section">
              <button onClick={handleSave} className="save-btn">{editOffertory ? 'Update' : 'Save'} Offertory</button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateChurchOffertory;
