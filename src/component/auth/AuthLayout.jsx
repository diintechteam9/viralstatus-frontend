import { useState } from "react";
import { Link } from "react-router-dom";
import LoginForm from "./LoginForm";
import MobileRegisterForm from "./MobileRegisterForm";

const AuthLayout = ({ onLogin }) => {
  // view: 'login' | 'register'
  const [view, setView] = useState("login");
  const [registerPrefill, setRegisterPrefill] = useState({});

  const switchToRegister = (prefill = {}) => {
    setRegisterPrefill(prefill);
    setView("register");
  };

  const switchToLogin = () => {
    setRegisterPrefill({});
    setView("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100 py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Logo / Title */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📱</div>
          <h1 className="text-2xl font-bold text-gray-900">YovoAI</h1>
          <p className="text-sm text-gray-500 mt-1">
            {view === "login" ? "Login to your account" : "Create your account"}
          </p>
        </div>

        {view === "login" && (
          <LoginForm
            onLogin={onLogin}
            switchToRegister={switchToRegister}
          />
        )}

        {view === "register" && (
          <MobileRegisterForm
            switchToLogin={switchToLogin}
            prefill={registerPrefill}
            onLogin={onLogin}
          />
        )}

        {/* Admin / Superadmin links */}
        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-between text-xs text-gray-400">
          <Link to="/admin" className="hover:text-blue-500 transition-colors">Admin Portal</Link>
          <Link to="/superadmin" className="hover:text-purple-500 transition-colors">Super Admin Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
