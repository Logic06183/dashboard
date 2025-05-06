import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = apiService.isAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      apiService.connectSocket();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
