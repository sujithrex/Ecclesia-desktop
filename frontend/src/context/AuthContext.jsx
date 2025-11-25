import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check sessionStorage first
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }

      // Check localStorage for remember token
      const rememberToken = localStorage.getItem('rememberToken');
      if (rememberToken) {
        try {
          // Validate token with backend
          const result = await window.electron.auth.loginWithToken(rememberToken);
          
          if (result.success) {
            setUser(result.user);
            sessionStorage.setItem('user', JSON.stringify(result.user));
            // Keep the token in localStorage
            if (result.rememberToken) {
              localStorage.setItem('rememberToken', result.rememberToken);
            }
          } else {
            // Token invalid or expired, remove it
            localStorage.removeItem('rememberToken');
          }
        } catch (error) {
          localStorage.removeItem('rememberToken');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const result = await window.electron.auth.login(username, password, rememberMe);
      
      if (result.success) {
        setUser(result.user);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        
        // Handle remember me token
        if (rememberMe && result.rememberToken) {
          localStorage.setItem('rememberToken', result.rememberToken);
        } else {
          // Clear remember token if unchecked
          localStorage.removeItem('rememberToken');
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = async () => {
    const rememberToken = localStorage.getItem('rememberToken');
    
    // Notify backend to invalidate token
    if (rememberToken) {
      try {
        await window.electron.auth.logout(rememberToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
      localStorage.removeItem('rememberToken');
    }
    
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

