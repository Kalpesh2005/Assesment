import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChangePassword from './pages/ChangePassword';

// Dashboards and Screens
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import UserDetails from './pages/UserDetails';
import StoreManagement from './pages/StoreManagement';

import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

// Toast notifications container
import { Toaster } from 'react-hot-toast';

// Catch-all redirection helper
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'STORE_OWNER') {
    return <Navigate to="/owner" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Dashboard Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/:id" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/stores" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <StoreManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/change-password" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />

          {/* Normal User Dashboard Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/change-password" 
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />

          {/* Store Owner Dashboard Protected Routes */}
          <Route 
            path="/owner" 
            element={
              <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/change-password" 
            element={
              <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
      
      {/* Premium Dark Toast notifications theme */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            borderRadius: '12px'
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
