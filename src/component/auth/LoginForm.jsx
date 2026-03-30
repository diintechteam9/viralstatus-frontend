import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE_URL, DEFAULT_CLIENT_ID } from "../../config";

// ─── Forgot Password Flow ─────────────────────────────────────────────────────
const ForgotPasswordFlow = ({ onBack }) => {
  const [step, setStep] = useState("send");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const post = async (url, body) => {
    const res = await axios.post(`${API_BASE_URL}${url}`, { ...body, clientId: DEFAULT_CLIENT_ID });
    return res.data;
  };

  const handleSend = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await post("/api/mobile/user/forgot-password", { email });
      setMessage(data.message); setStep("verify");
    } catch (err) { setError(err.response?.data?.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await post("/api/mobile/user/forgot-password/verify-otp", { email, otp });
      setMessage(data.message); setStep("reset");
    } catch (err) { setError(err.response?.data?.message || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setLoading(true);
    try {
      const data = await post("/api/mobile/user/forgot-password/resend-otp", { email });
      setMessage(data.message || "OTP resent");
    } catch (err) { setError(err.response?.data?.message || "Failed to resend"); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Minimum 6 characters required"); return; }
    setError(""); setLoading(true);
    try {
      const data = await post("/api/mobile/user/forgot-password/reset", { email, newPassword });
      setMessage(data.message); setStep("done");
    } catch (err) { setError(err.response?.data?.message || "Failed to reset password"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-700 font-medium">
        ← Back to Login
      </button>
      <div>
        <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === "send" && "Enter your email to receive a reset OTP"}
          {step === "verify" && `OTP sent to ${email}`}
          {step === "reset" && "Set your new password"}
        </p>
      </div>

      {message && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{message}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {step === "send" && (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
              placeholder="your@email.com" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Enter OTP</label>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} required maxLength={6} autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-center text-3xl tracking-[0.5em] font-bold"
              placeholder="------" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button type="button" onClick={handleResend} disabled={loading}
            className="w-full py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm disabled:opacity-60 transition-all">
            Resend OTP
          </button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm pr-11"
                placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
              placeholder="Re-enter password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="text-center space-y-4 py-6">
          <div className="text-6xl">✅</div>
          <p className="text-green-700 font-bold text-lg">Password reset successfully!</p>
          <p className="text-gray-500 text-sm">You can now login with your new password.</p>
          <button onClick={onBack}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Login Form ──────────────────────────────────────────────────────────
const LoginForm = ({ onLogin, switchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  if (showForgot) return <ForgotPasswordFlow onBack={() => setShowForgot(false)} />;

  // ─── Google Login ─────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/google`, {
        credential: credentialResponse.credential,
        clientId: DEFAULT_CLIENT_ID,
      });
      if (!res.data.success) throw new Error(res.data.message || "Google login failed");

      if (res.data.registrationComplete) {
        const { user, token, clientId: cId } = res.data.data;
        _saveAndLogin({ token, name: user.name, email: user.email, clientId: cId, userId: user._id });
      } else {
        // Email verified but mobile not done — go to register step 2
        switchToRegister({ email: res.data.data?.email, step: 2 });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed. Please try again.");
    } finally { setLoading(false); }
  };

  // ─── Email/Password Login ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/login`, {
        email, password, clientId: DEFAULT_CLIENT_ID,
      });
      if (!res.data.success) throw new Error(res.data.message || "Login failed");
      const { user, token, clientId: cId } = res.data.data;
      _saveAndLogin({ token, name: user.name, email: user.email, clientId: cId, userId: user._id });
    } catch (err) {
      const data = err.response?.data;
      if (data?.data?.registrationStep !== undefined) {
        setError(`Registration incomplete (Step ${data.data.registrationStep}/3). Please register first.`);
      } else {
        setError(data?.message || "Invalid email or password.");
      }
    } finally { setLoading(false); }
  };

  const _saveAndLogin = ({ token, name, email: e, clientId: cId, userId }) => {
    localStorage.setItem("mobileUserToken", token);
    localStorage.setItem("mobileUserData", JSON.stringify({ role: "mobileuser", name, email: e, clientId: cId, userId }));
    onLogin({ token, role: "mobileuser", name, email: e, clientId: cId, userId });
  };

  return (
    <div className="space-y-5">

      {/* Google Login */}
      <div className="flex flex-col items-center gap-3">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google Sign In failed. Please try again.")}
          text="signin_with"
          theme="outline"
          shape="rectangular"
          size="large"
          width="100%"
          logo_alignment="center"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Email / Password */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
              placeholder="your@email.com" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full pl-9 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
              placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Forgot Password link */}
        <div className="text-right">
          <button type="button" onClick={() => setShowForgot(true)}
            className="text-xs text-orange-500 hover:text-orange-700 font-medium">
            Forgot Password?
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging in...
            </>
          ) : "Login"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <button type="button" onClick={() => switchToRegister({})}
            className="text-orange-500 hover:text-orange-700 font-semibold">
            Register
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
