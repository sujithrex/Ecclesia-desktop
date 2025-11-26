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
    // Use Asia/Kolkata timezone (Chennai/Indian Standard Time)
    const options = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    const parts = formatter.formatToParts(date);
    
    const partsMap = {};
    parts.forEach(part => {
      partsMap[part.type] = part.value;
    });
    
    return `${partsMap.day} ${partsMap.month} ${partsMap.year} ${partsMap.hour}:${partsMap.minute}:${partsMap.second} ${partsMap.dayPeriod} IST`;
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {user && (
          <span className="status-name">{user.name || user.username}</span>
        )}
      </div>
      <div className="status-bar-center">
        <span className="status-datetime">{formatDateTime(currentTime)}</span>
      </div>
      <div className="status-bar-right">
        {version && (
          <span className="status-version">v{version}</span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;

