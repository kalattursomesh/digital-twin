import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Layout from './components/Layout';
import ActivityLog from './pages/ActivityLog';
import TwinProfile from './pages/TwinProfile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('twin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);

    // Auto log out if request gets 401 Unauthorized or 403 Forbidden
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem('twin_token');
          localStorage.removeItem('twin_user');
          setIsAuthenticated(false);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />} 
      />
      
      {/* Protected Routes inside Layout */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Layout setAuth={setIsAuthenticated} /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="history" element={<ActivityLog />} />
        <Route path="profile" element={<TwinProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
