import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import LoadingScreen from '../components/LoadingScreen';
import './Settings.css';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [currentPasswordForPin, setCurrentPasswordForPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    const result = await window.electron.auth.changePassword(
      user.username,
      currentPassword,
      newPassword
    );

    if (result.success) {
      toast.success(result.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.message || 'Failed to change password. Please try again.');
    }

    setPasswordLoading(false);
  };

  const handleChangePin = async (e) => {
    e.preventDefault();

    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    if (newPin.length !== 4) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    setPinLoading(true);

    const result = await window.electron.auth.changePin(
      user.username,
      currentPasswordForPin,
      newPin
    );

    if (result.success) {
      toast.success(result.message || 'Recovery PIN changed successfully!');
      setCurrentPasswordForPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      toast.error(result.message || 'Failed to change PIN. Please try again.');
    }

    setPinLoading(false);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const result = await window.electron.auth.getProfile(user.username);
          if (result.success) {
            setName(result.user.name || '');
            setEmail(result.user.email || '');
            setPhone(result.user.phone || '');
          }
        } catch (error) {
          console.error('Failed to load profile');
        }
      }
    };
    
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setProfileLoading(true);

    const result = await window.electron.auth.updateProfile(user.username, {
      name,
      email,
      phone
    });

    if (result.success) {
      toast.success('Profile updated successfully!');
      // Update user in context and session storage
      updateUser({ name, email, phone });
    } else {
      toast.error(result.message || 'Failed to update profile');
    }

    setProfileLoading(false);
  };

  return (
    <>
      {(profileLoading || passwordLoading || pinLoading) && (
        <LoadingScreen message={profileLoading ? 'Updating profile...' : passwordLoading ? 'Updating password...' : 'Updating PIN...'} />
      )}
      <TitleBar />
      <StatusBar />
      <div className="settings-container">
        <header className="settings-header">
        <div className="header-content">
          <h1 className="settings-title">Settings</h1>
          <div className="header-actions">
            <button onClick={handleBack} className="back-btn">
              Back to Dashboard
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-card">
          <div className="settings-tabs">
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </button>
            <button
              className={`tab-btn ${activeTab === 'pin' ? 'active' : ''}`}
              onClick={() => setActiveTab('pin')}
            >
              Change Recovery PIN
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'profile' && (
              <div className="tab-panel">
                <h2>Profile Information</h2>
                <p className="tab-description">
                  Update your personal information
                </p>

                <form onSubmit={handleUpdateProfile} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name (e.g., Rev. Samuel)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={profileLoading}>
                    Update Profile
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="tab-panel">
                <h2>Change Password</h2>
                <p className="tab-description">
                  Update your password to keep your account secure
                </p>

                <form onSubmit={handleChangePassword} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={passwordLoading}>
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'pin' && (
              <div className="tab-panel">
                <h2>Change Recovery PIN</h2>
                <p className="tab-description">
                  Update your recovery PIN for password reset
                </p>

                <form onSubmit={handleChangePin} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPasswordForPin">Current Password</label>
                    <input
                      type="password"
                      id="currentPasswordForPin"
                      value={currentPasswordForPin}
                      onChange={(e) => setCurrentPasswordForPin(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPin">New Recovery PIN</label>
                    <input
                      type="password"
                      id="newPin"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Enter new 4-digit PIN"
                      required
                      maxLength="4"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPin">Confirm New PIN</label>
                    <input
                      type="password"
                      id="confirmPin"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Confirm new PIN"
                      required
                      maxLength="4"
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={pinLoading}>
                    Update PIN
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default Settings;

