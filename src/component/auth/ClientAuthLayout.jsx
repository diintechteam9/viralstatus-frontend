import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const ClientAuthLayout = ({ onLogin }) => {
  const [step, setStep] = useState("login");
  const navigate = useNavigate();

  const switchToLogin = () => setStep("login");
  const switchToRegister = () => setStep("register");

  const handleRegisterSuccess = () => {
    setStep("login");
  };

  const handleLoginSuccess = (loginData) => {
    onLogin(loginData);
    navigate('/login/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          {step === "login" && "Client Login"}
          {step === "register" && "Client Registration"}
        </h1>

        {step === "login" && (
          <LoginForm
            userType="client"
            onLogin={handleLoginSuccess}
            switchToRegister={switchToRegister}
          />
        )}

        {step === "register" && (
          <RegisterForm
            userType="client"
            onSuccess={handleRegisterSuccess}
            switchToLogin={switchToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default ClientAuthLayout;


