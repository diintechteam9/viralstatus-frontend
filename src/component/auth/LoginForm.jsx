import { useState, useEffect } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { FaGoogle, FaEnvelope, FaLock } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const LoginForm = ({ userType, onLogin, switchToRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for stored client email when the component mounts
  useEffect(() => {
    // If this is a client login and we have a stored email, use it
    if (userType === "client") {
      const storedEmail = sessionStorage.getItem("tempClientEmail");
      if (storedEmail) {
        setFormData((prev) => ({ ...prev, email: storedEmail }));
        // Remove from storage after using it
        sessionStorage.removeItem("tempClientEmail");
      }
    }
  }, [userType]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      console.log("Google ID token:", credentialResponse.credential);
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google login success:", decoded);

      // Use the unified Google verify endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/google/verify`,
        {
          googleToken: credentialResponse.credential,
          role: userType, // 'user' or 'client'
        }
      );

      console.log("Server response:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Login failed");
      }

      // Structure the data for the app to consume
      const userOrClient = response.data.user || response.data.client || {};
      const loginData = {
        token: response.data.authToken,
        role: userType,
        name: userOrClient.name || response.data.name || decoded.name,
        email: userOrClient.email || response.data.email || decoded.email,
        businessName: userOrClient.businessName || "",
        gstNo: userOrClient.gstNo || "",
        panNo: userOrClient.panNo || "",
        city: userOrClient.city || "",
        pincode: userOrClient.pincode || "",
        websiteUrl: userOrClient.websiteUrl || "",
        clientId:
          userOrClient._id || response.data._id || response.data.googleId,
      };

      // Save googleId to localStorage for later use
      const googleId = response.data.googleId || decoded.sub;
      localStorage.setItem("googleId", googleId);

      // Call the onLogin function with the properly structured data
      onLogin(loginData);
    } catch (err) {
      console.error("Google login error:", err);
      setError(
        err.response?.data?.message || "Google login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign In failed");
    setError("Google Sign In was unsuccessful. Please try again.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let endpoint = "";

      switch (userType) {
        case "user":
          endpoint = "api/user/login";
          break;
        case "client":
          endpoint = "api/client/login";
          break;
        default:
          throw new Error("Invalid user type");
      }

      const response = await axios.post(
        `${API_BASE_URL}/${endpoint}`,
        formData
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Login failed");
      }

      // Structure the data properly before calling onLogin
      const userOrClient = response.data.user || response.data.client || {};
      const loginData = {
        token: response.data.token,
        role: userType,
        name: userOrClient.name,
        email: userOrClient.email,
        businessName: userOrClient.businessName || "",
        gstNo: userOrClient.gstNo || "",
        panNo: userOrClient.panNo || "",
        city: userOrClient.city || "",
        pincode: userOrClient.pincode || "",
        websiteUrl: userOrClient.websiteUrl || "",
        clientId: userOrClient._id || response.data._id,
      };

      // Call the onLogin function with the properly structured data
      onLogin(loginData);
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials.";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Sign In Button */}
      {(userType === "client" || userType === "user") && (
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 w-full">
            <p className="text-center text-gray-600 mb-4">
              Sign in with Google
            </p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                text="signin_with"
                theme="filled_blue"
                shape="rectangular"
                size="large"
                logo_alignment="center"
              />
            </div>
          </div>
          <div className="w-full flex items-center justify-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
        </div>
      )}

      {/* Regular Login Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
            <FaEnvelope className="mr-2" /> Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
            <FaLock className="mr-2" /> Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>
          <button
            type="button"
            onClick={switchToRegister}
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Don't have an account? Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
