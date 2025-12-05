import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import TitleBar from '../../components/TitleBar';
import StatusBar from '../../components/StatusBar';
import Breadcrumb from '../../components/Breadcrumb';
import LoadingScreen from '../../components/LoadingScreen';
import { Plus, Trash } from '@phosphor-icons/react';
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
  const [services, setServices] = useState([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      categoryAmounts: {},
      total: 0
    }
  ]);

  useEffect(() => {
    if (!pastorate || !church) {
      navigate('/dashboard');
      return;
    }

    // If editing, load existing data
    if (editOffertory) {
      setServices(editOffertory.services || []);
    }
  }, [pastorate, church, editOffertory]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/dashboard' },
    { label: pastorate?.pastorateShortName || 'Pastorate', path: '/pastorate', state: { pastorate } },
    ...(year ? [{ label: year.year, path: '/year-books', state: { pastorate, year } }] : []),
    ...(month ? [{ label: month, path: '/month-books', state: { pastorate, year, month } }] : []),
    { label: 'Church Offertory', path: '/books/church-offertory', state: { pastorate, year, month } },
    { label: editOffertory ? 'Edit Entry' : 'Create Entry' }
  ];

  const calculateServiceTotal = (categoryAmounts) => {
    return Object.values(categoryAmounts).reduce((sum, amount) => {
      return sum + (parseFloat(amount) || 0);
    }, 0);
  };

  const handleServiceChange = (serviceId, field, value) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        if (field === 'date') {
          return { ...service, date: value };
        } else {
          // Category amount change
          const updatedAmounts = {
            ...service.categoryAmounts,
            [field]: value
          };
          const total = calculateServiceTotal(updatedAmounts);
          return {
            ...service,
            categoryAmounts: updatedAmounts,
            total
          };
        }
      }
      return service;
    }));
  };

  const addService = () => {
    const newService = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      categoryAmounts: {},
      total: 0
    };
    setServices(prev => [...prev, newService]);
  };

  const removeService = (serviceId) => {
    if (services.length <= 1) {
      toast.error('At least one service is required');
      return;
    }
    setServices(prev => prev.filter(service => service.id !== serviceId));
  };

  const handleSave = async () => {
    // Validate
    const validServices = services.filter(service => 
      service.date && Object.keys(service.categoryAmounts).length > 0
    );

    if (validServices.length === 0) {
      toast.error('Please fill at least one complete service');
      return;
    }

    try {
      setIsLoading(true);

      const totalAmount = validServices.reduce((sum, service) => sum + service.total, 0);

      const offertoryData = {
        pastorateName: pastorate.pastorateName,
        year: year?.year,
        month: month,
        churchId: church.id,
        churchName: church.churchName,
        date: validServices[0].date, // Use first service date as main date
        services: validServices,
        totalAmount
      };

      let result;
      if (editOffertory) {
        result = await window.electron.churchOffertory.update(editOffertory.id, offertoryData);
      } else {
        result = await window.electron.churchOffertory.create(offertoryData);
      }

      if (result.success) {
        toast.success(`Church offertory ${editOffertory ? 'updated' : 'created'} successfully!`);
        navigate('/books/church-offertory', { state: { pastorate, year, month } });
      } else {
        toast.error(`Failed to ${editOffertory ? 'update' : 'create'} church offertory`);
      }
    } catch (error) {
      toast.error(`Failed to ${editOffertory ? 'update' : 'save'} church offertory`);
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pastorate || !church) {
    return null;
  }

  // Split categories into rows of 5 (leaving 6th column for total)
  const categoriesPerRow = 5;

  return (
    <>
      <TitleBar />
      <StatusBar />
      {isLoading && <LoadingScreen message="Loading..." />}
      <div className="create-offertory-container">
        <header className="create-offertory-header">
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} />
            <div className="header-actions">
              <button onClick={() => navigate('/books/church-offertory', { state: { pastorate, year, month } })} className="back-btn">
                Back
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="create-offertory-main">
          <div className="create-offertory-content">
            <h1 className="page-title">
              {editOffertory ? 'Edit' : 'Create'} Church Offertory - {church.churchName}
              {month ? ` (${month} ${year?.year || ''})` : ''}
            </h1>

            {/* Services Section */}
            <div className="services-section">
              <div className="section-header">
                <h2 className="section-title">Services</h2>
                <button onClick={addService} className="add-service-btn">
                  <Plus size={20} weight="bold" />
                  Add Service
                </button>
              </div>

              {services.map((service, serviceIndex) => (
                <div key={service.id} className="service-card">
                  <div className="service-header">
                    <h3 className="service-title">Service {serviceIndex + 1}</h3>
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(service.id)}
                        className="remove-service-btn"
                        title="Remove service"
                      >
                        <Trash size={18} weight="bold" />
                      </button>
                    )}
                  </div>

                  <div className="service-content">
                    {/* Date Field */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`date-${service.id}`}>Date <span className="required">*</span></label>
                        <input
                          type="date"
                          id={`date-${service.id}`}
                          value={service.date}
                          onChange={(e) => handleServiceChange(service.id, 'date', e.target.value)}
                          className="service-input"
                          required
                        />
                      </div>
                    </div>

                    {/* Category Fields - 6 per row (5 categories + 1 total) */}
                    <div className="categories-grid">
                      {categories.map((category, index) => (
                        <div key={category.id} className="form-group">
                          <label htmlFor={`${service.id}-${category.id}`}>
                            {category.name}
                          </label>
                          <input
                            type="number"
                            id={`${service.id}-${category.id}`}
                            value={service.categoryAmounts[category.id] || ''}
                            onChange={(e) => handleServiceChange(service.id, category.id, e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="service-input"
                          />
                        </div>
                      ))}

                      {/* Total Field - Always at the end */}
                      <div className="form-group total-field">
                        <label htmlFor={`total-${service.id}`}>Total</label>
                        <input
                          type="text"
                          id={`total-${service.id}`}
                          value={`₹${service.total.toFixed(2)}`}
                          readOnly
                          disabled
                          className="service-input total-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="grand-total-section">
              <div className="grand-total-card">
                <span className="grand-total-label">Grand Total:</span>
                <span className="grand-total-value">
                  ₹{services.reduce((sum, service) => sum + service.total, 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="save-section">
              <button onClick={handleSave} className="save-btn">
                {editOffertory ? 'Update' : 'Save'} Church Offertory
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateChurchOffertory;
