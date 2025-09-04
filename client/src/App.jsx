import React from 'react';
import { Routes, Route, Navigate,  } from 'react-router-dom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import EmailVerification from './pages/admin/EmailVerification';
import Dashboard from './pages/admin/Dashboard';
import './App.css';
import Home from './pages/Home';
import LearnMore from './pages/LearnMore';
import UserForm from './pages/UserForm';
import CaseDetailsPage from './pages/CaseDetailsPage';
import UserCaseTrackingPage from './pages/UserCaseTrackingPage';

// Simple auth check
const isAuthenticated = () => {
  return localStorage.getItem('token');
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<AdminRegister />} />
          
          {/* Email verification route - using query parameters */}
          <Route path="/verify-email" element={<EmailVerification />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default route without protection */}
          <Route 
            path="/" 
            element={
              <Home/>
            }
          />

          <Route 
            path="/learn-more" 
            element={
              <LearnMore/>
            }
          />

          <Route 
            path="/report-form" 
            element={
              <UserForm/>
            }
          />
          <Route 
            path="/admin/case/:caseId" 
            element={
              <CaseDetailsPage/>
            }
          />
          <Route 
            path="/userstatus/:caseId" 
            element={
              <UserCaseTrackingPage/>
            }
          />          
        </Routes>
      </div>
  
  );
}

export default App;