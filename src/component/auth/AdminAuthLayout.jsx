import { useState } from 'react';
import { Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import AdminLoginForm from './AdminLoginForm';
import AdminRegisterForm from './AdminRegisterForm';
import SuperAdminLoginForm from './SuperAdminLoginForm';

const AdminAuthLayout = ({ onLogin, role = "admin" }) => {
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  
  const basePath = role === "superadmin" ? "/superadmin" : "/admin";
  const portalTitle = role === "superadmin" ? "Super Admin Portal" : "Admin Portal";
  const portalSubtitle = role === "superadmin" ? "Secured access for super administrators" : "Secured access for administrators";

  const switchToRegister = () => {
    setAuthMode('register');
    navigate(`${basePath}/register`);
  };

  const switchToLogin = () => {
    setAuthMode('login');
    navigate(`${basePath}/login`);
  };

  const handleRegisterSuccess = () => {
    setAuthMode('login');
    navigate(`${basePath}/login`);
  };

  const handleLoginSuccess = (loginData) => {
    onLogin(loginData);
    navigate(`${basePath}/dashboard`);
  };

  const LoginFormComponent = role === "superadmin" ? SuperAdminLoginForm : AdminLoginForm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">{portalTitle}</h1>
          <p className="text-gray-600 mt-2">{portalSubtitle}</p>
        </div>

        <Routes>
          <Route path="/login" element={
            <LoginFormComponent 
              onLogin={handleLoginSuccess} 
              switchToRegister={switchToRegister} 
            />
          } />
          {role !== "superadmin" && (
            <Route path="/register" element={
              <AdminRegisterForm 
                onSuccess={handleRegisterSuccess} 
                switchToLogin={switchToLogin} 
              />
            } />
          )}
          <Route path="/" element={<Navigate to={`${basePath}/login`} replace />} />
        </Routes>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="text-center">
            {authMode === 'login' && role !== "superadmin" ? (
              <div className="mt-4">
                <p className="text-gray-600">Need to create an account?</p>
                <Link 
                  to={`${basePath}/register`}
                  className="mt-2 inline-block text-blue-600 hover:underline"
                  onClick={switchToRegister}
                >
                  Register as Admin
                </Link>
              </div>
            ) : null}
            {authMode === 'register' && role !== "superadmin" ? (
              <div className="mt-4">
                <p className="text-gray-600">Already have an account?</p>
                <Link 
                  to={`${basePath}/login`}
                  className="mt-2 inline-block text-blue-600 hover:underline"
                  onClick={switchToLogin}
                >
                  Log in as Admin
                </Link>
              </div>
            ) : null}
          </div>
          <div className="mt-6 text-center">
            <Link to="/auth" className="text-gray-500 hover:text-gray-700">
              Return to main login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthLayout;
