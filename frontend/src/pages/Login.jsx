import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import TitleBar from '../components/TitleBar';
import StatusBar from '../components/StatusBar';
import LoadingScreen from '../components/LoadingScreen';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, password, rememberMe);

    if (result.success) {
      toast.success('Login successful! Welcome back.');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <>
      {loading && <LoadingScreen message="Signing in..." />}
      <TitleBar />
      <StatusBar />
      <div className="login-container">
        <div className="login-box">
        <h1 className="login-title">Ecclesia - Desktop</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
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
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <div className="remember-me-group">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-link">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;

