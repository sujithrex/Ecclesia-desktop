import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import LoadingScreen from '../components/LoadingScreen';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyPin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    setLoading(true);

    const result = await window.electron.auth.verifyPin(username, pin);

    if (result.success) {
      toast.success('PIN verified successfully!');
      setStep(2);
    } else {
      toast.error(result.message || 'Invalid PIN. Please try again.');
    }

    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await window.electron.auth.resetPassword(username, newPassword);

    if (result.success) {
      toast.success('Password reset successfully! Please login with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      toast.error(result.message || 'Failed to reset password. Please try again.');
    }

    setLoading(false);
  };

  return (
    <>
      {loading && <LoadingScreen message={step === 1 ? 'Verifying PIN...' : 'Resetting password...'} />}
      <TitleBar />
      <StatusBar />
      <div className="forgot-container">
        <div className="forgot-box">
        <h1 className="forgot-title">Reset Password</h1>
        <p className="forgot-subtitle">
          {step === 1 ? 'Enter your recovery PIN' : 'Create a new password'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleVerifyPin} className="forgot-form">
            <div className="form-group">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Recovery PIN"
                required
                maxLength="4"
              />
            </div>

            <button type="submit" className="forgot-button" disabled={loading}>
              Verify PIN
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="form-group">
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
            </div>

            <button type="submit" className="forgot-button" disabled={loading}>
              Reset Password
            </button>
          </form>
        )}

        <div className="forgot-footer">
          <Link to="/login" className="back-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default ForgotPassword;

