import React from 'react';
import { Navigate,useNavigate } from 'react-router-dom';

const AdminProtected = ({ children }) => {

    const navigate = useNavigate();
  const adminToken = localStorage.getItem('token');

  if (!adminToken) {
    navigate('/admin-login', { replace: true });
  }

  return children;
};

export default AdminProtected;
