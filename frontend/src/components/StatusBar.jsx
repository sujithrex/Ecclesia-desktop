import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './StatusBar.css';

const StatusBar = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [version, setVersion] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Get app version
    if (window.electron?.app?.getVersion) {
      window.electron.app.getVersion().then(v => setVersion(v));
    }

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istDate = new Date(date.getTime() + istOffset - (date.getTimezoneOffset() * 60 * 1000));
    
    const day = istDate.getUTCDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[istDate.getUTCMonth()];
    const year = istDate.getUTCFullYear();
    
    let hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
    const seconds = istDate.getUTCSeconds().toString().padStart(2, '0');
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hoursStr}:${minutes}:${seconds} ${ampm} IST`;
  };

  return (
    <div className="status-bar">
      <div className="status-bar-content">
        {version && (
          <>
            <span className="status-version">v{version}</span>
            <span className="status-separator">|</span>
          </>
        )}
        {user && (
          <>
            <span className="status-username">{user.username}</span>
            <span className="status-separator">|</span>
          </>
        )}
        <span className="status-datetime">{formatDateTime(currentTime)}</span>
      </div>
    </div>
  );
};

export default StatusBar;

