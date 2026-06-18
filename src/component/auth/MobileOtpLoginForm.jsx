import { useState } from "react";
import axios from "axios";
import { FaMobileAlt } from "react-icons/fa";
import { API_BASE_URL, DEFAULT_CLIENT_ID } from "../../config";

const MobileOtpLoginForm = ({ onLogin, switchToLogin }) => {
  const [step, setStep] = useState("send"); // "send" | "verify"
  const [mobile, setMobile] = useState("");
  const [otpMethod, setOtpMethod] = useState("sms");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const post = (url, body) =>
    axios.post(`${API_BASE_URL}${url}`, { ...body, clientId: DEFAULT_CLIENT_ID });

  const handleSend = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await post("/api/mobile/user/login/send-otp", { mobile, otpMethod });
      setMessage(res.data.message);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await post("/api/mobile/user/login/verify-otp", { mobile, otp });
      if (!res.data.success) throw new Error(res.data.message);
      const { user, token, clientId: cId } = res.data.data;
      localStorage.setItem("mobileUserToken", token);
      localStorage.setItem("mobileUserData", JSON.stringify({
        role: "mobileuser", name: user.name, email: user.email,
        clientId: cId, userId: user._id,
      }));
      onLogin({ token, role: "mobileuser", name: user.name, email: user.email, clientId: cId, userId: user._id });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setLoading(true);
    try {
      const res = await post("/api/mobile/user/login/send-otp", { mobile, otpMethod });
      setMessage(res.data.message || "OTP resent");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Login with Mobile OTP</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === "send" ? "Enter your registered mobile number" : `OTP sent to ${mobile}`}
        </p>
      </div>

      {message && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{message}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {step === "send" && (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
            <div className="relative">
              <FaMobileAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required autoFocus
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="+919876543210" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Send OTP via</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: "sms", label: "💬 SMS" }, { id: "whatsapp", label: "📱 WhatsApp" }].map(m => (
                <button key={m.id} type="button" onClick={() => setOtpMethod(m.id)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all
                    ${otpMethod === m.id ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            required maxLength={6} autoFocus
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-center text-3xl tracking-[0.6em] font-bold"
            placeholder="------" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
          <button type="button" onClick={handleResend} disabled={loading}
            className="w-full py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm disabled:opacity-60 transition-all">
            Resend OTP
          </button>
        </form>
      )}

      <div className="text-center">
        <button type="button" onClick={switchToLogin}
          className="text-sm text-orange-500 hover:text-orange-700 font-medium">
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default MobileOtpLoginForm;
