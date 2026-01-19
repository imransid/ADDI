import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Admin Protected Route Component
 * Redirects to login if user is not authenticated or not an admin
 */
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is admin (user.role === 'admin' or user.isAdmin === true)
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  if (!isAdmin) {
    // Redirect to home if not admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;