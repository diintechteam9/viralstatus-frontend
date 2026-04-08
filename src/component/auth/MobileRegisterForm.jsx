import { useState } from "react";
import axios from "axios";
import { FaEnvelope, FaLock, FaMobileAlt, FaUser, FaMapMarkerAlt, FaBuilding, FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE_URL, DEFAULT_CLIENT_ID } from "../../config";

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => {
  const steps = ["Email OTP", "Mobile OTP", "Profile"];
  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((label, i) => {
        const no = i + 1;
        const done = current > no;
        const active = current === no;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${done ? "bg-green-500 border-green-500 text-white" : active ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-300 text-gray-400"}`}>
                {done ? "✓" : no}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? "text-orange-600" : done ? "text-green-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 mx-1 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MobileRegisterForm = ({ switchToLogin, prefill = {}, onLogin }) => {
  const [step, setStep] = useState(prefill.step || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState(prefill.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [otpMethod, setOtpMethod] = useState("whatsapp");
  const [profile, setProfile] = useState({
    name: "", city: "", pincode: "", businessName: "",
    gender: "", ageRange: "", occupation: "", highestQualification: "", fieldOfStudy: "",
    businessInterests: [],
    skills: [],
    socialMedia: {
      instagram: { handle: "", followersCount: "" },
      youtube: { channelUrl: "", subscribers: "" },
    },
  });

  const clear = () => { setError(""); setMessage(""); };
  const stepNo = step === 1 || step === 1.5 ? 1 : step === 2 || step === 2.5 ? 2 : 3;

  // ─── Step 1: Send Email OTP ───────────────────────────────────────────────
  const sendEmailOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/step1`, {
        email, password, clientId: DEFAULT_CLIENT_ID,
      });
      if (res.data.success) { setMessage(res.data.message); setStep(1.5); }
      else setError(res.data.message || "Failed to send OTP");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const resendEmailOtp = async () => {
    clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/resend-email-otp`, {
        email, clientId: DEFAULT_CLIENT_ID,
      });
      setMessage(res.data.message || "OTP resent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally { setLoading(false); }
  };

  // ─── Step 1 Verify ────────────────────────────────────────────────────────
  const verifyEmailOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/step1/verify`, {
        email, otp: emailOtp, clientId: DEFAULT_CLIENT_ID,
      });
      if (res.data.success) { setMessage("✅ Email verified! Now verify your mobile number."); setStep(2); }
      else setError(res.data.message || "Invalid OTP");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  // ─── Step 2: Send Mobile OTP ──────────────────────────────────────────────
  const sendMobileOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/step2`, {
        email, mobile, otpMethod, clientId: DEFAULT_CLIENT_ID,
      });
      if (res.data.success) { setMessage(res.data.message); setStep(2.5); }
      else setError(res.data.message || "Failed to send mobile OTP");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send mobile OTP");
    } finally { setLoading(false); }
  };

  const resendMobileOtp = async () => {
    clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/resend-mobile-otp`, {
        email, mobile, otpMethod, clientId: DEFAULT_CLIENT_ID,
      });
      setMessage(res.data.message || "OTP resent to your mobile");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally { setLoading(false); }
  };

  // ─── Step 2 Verify ────────────────────────────────────────────────────────
  const verifyMobileOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/step2/verify`, {
        email, mobile, otp: mobileOtp, clientId: DEFAULT_CLIENT_ID,
      });
      if (res.data.success) { setMessage("✅ Mobile verified! Complete your profile."); setStep(3); }
      else setError(res.data.message || "Invalid OTP");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  // ─── Step 3: Complete Profile ─────────────────────────────────────────────
  const completeProfile = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/register/step3`, {
        email, clientId: DEFAULT_CLIENT_ID, ...profile,
      });
      if (res.data.success) {
        // Backend token return karta hai — directly dashboard pe bhejo
        const { user, token, clientId: cId } = res.data.data;
        localStorage.setItem("mobileUserToken", token);
        const mobilePayload = {
          role: "mobileuser",
          name: user.name,
          email: user.email,
          clientId: cId,
          userId: user._id,
          ...(user.googleId ? { googleId: user.googleId } : {}),
        };
        localStorage.setItem("mobileUserData", JSON.stringify(mobilePayload));
        if (user.googleId) localStorage.setItem("googleId", user.googleId);
        onLogin({
          token,
          role: "mobileuser",
          name: user.name,
          email: user.email,
          clientId: cId,
          userId: user._id,
          googleId: user.googleId,
        });
      } else setError(res.data.message || "Failed to complete profile");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete profile");
    } finally { setLoading(false); }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [platform, field] = name.split(".");
      setProfile(prev => ({
        ...prev,
        socialMedia: { ...prev.socialMedia, [platform]: { ...prev.socialMedia[platform], [field]: value } },
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleTag = (field, value) => {
    setProfile(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const BUSINESS_INTERESTS = [
    "Fashion & Lifestyle", "Beauty & Cosmetics", "Health & Wellness",
    "Travel & Tourism", "Food & Beverages", "Tech & Gadgets",
    "Finance & Investing", "Parenting & Family", "Education & EdTech",
    "Gaming & eSports", "Fitness & Sports", "Music & Entertainment",
    "Luxury & Automobiles", "Environment & Sustainability",
    "Startups & Entrepreneurship", "Books & Literature",
    "Home Decor & Interiors", "Pet Care", "Non-Profit & Social Causes",
  ];

  const SKILLS = [
    "Content Creation", "Video Editing", "Photography", "Public Speaking",
    "Graphic Design", "Social Media Strategy", "Writing/Copywriting",
    "Brand Promotion", "SEO/Hashtag Strategy", "Storytelling",
    "Live Streaming", "Voice Over", "Community Engagement",
  ];

  const OtpInput = ({ value, onChange }) => (
    <input type="text" value={value} onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
      required maxLength={6} autoFocus
      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-center text-3xl tracking-[0.6em] font-bold"
      placeholder="------" />
  );

  const ResendBtn = ({ onClick }) => (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm disabled:opacity-60 transition-all">
      Resend OTP
    </button>
  );

  return (
    <div className="space-y-4 w-full">
      <StepIndicator current={stepNo} />

      {message && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{message}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {/* ── Step 1: Email + Password ── */}
      {step === 1 && (
        <form onSubmit={sendEmailOtp} className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Step 1 — Verify Email</p>
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
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-9 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Create a password (min 6 chars)" />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Sending OTP..." : "Send Email OTP →"}
          </button>
        </form>
      )}

      {/* ── Step 1.5: Verify Email OTP ── */}
      {step === 1.5 && (
        <form onSubmit={verifyEmailOtp} className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Step 1 — Enter Email OTP</p>
          <p className="text-sm text-gray-500">OTP sent to <span className="font-semibold text-gray-800">{email}</span></p>
          <OtpInput value={emailOtp} onChange={setEmailOtp} />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Verifying..." : "Verify OTP →"}
          </button>
          <ResendBtn onClick={resendEmailOtp} />
        </form>
      )}

      {/* ── Step 2: Mobile Number ── */}
      {step === 2 && (
        <form onSubmit={sendMobileOtp} className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Step 2 — Verify Mobile</p>
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
              {[{ id: "whatsapp", label: "📱 WhatsApp" }, { id: "gupshup", label: "💬 SMS" }].map(m => (
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
            {loading ? "Sending OTP..." : "Send Mobile OTP →"}
          </button>
        </form>
      )}

      {/* ── Step 2.5: Verify Mobile OTP ── */}
      {step === 2.5 && (
        <form onSubmit={verifyMobileOtp} className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Step 2 — Enter Mobile OTP</p>
          <p className="text-sm text-gray-500">OTP sent to <span className="font-semibold text-gray-800">{mobile}</span> via {otpMethod === "whatsapp" ? "WhatsApp" : "SMS"}</p>
          <OtpInput value={mobileOtp} onChange={setMobileOtp} />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Verifying..." : "Verify OTP →"}
          </button>
          <ResendBtn onClick={resendMobileOtp} />
        </form>
      )}

      {/* ── Step 3: Complete Profile ── */}
      {step === 3 && (
        <form onSubmit={completeProfile} className="space-y-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Step 3 — Complete Profile</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><FaUser className="text-[10px]" /> Full Name *</label>
              <input type="text" name="name" value={profile.name} onChange={handleProfileChange} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><FaBuilding className="text-[10px]" /> Business Name</label>
              <input type="text" name="businessName" value={profile.businessName} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><FaMapMarkerAlt className="text-[10px]" /> City</label>
              <input type="text" name="city" value={profile.city} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Your city" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
              <input type="text" name="pincode" value={profile.pincode} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Pincode" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
              <select name="gender" value={profile.gender} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm bg-white">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Age Range</label>
              <select name="ageRange" value={profile.ageRange} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm bg-white">
                <option value="">Select age range</option>
                {["18-24", "25-30", "31-40", "41-50", "51+"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Occupation</label>
              <input type="text" name="occupation" value={profile.occupation} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="e.g. Content Creator" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Highest Qualification</label>
              <input type="text" name="highestQualification" value={profile.highestQualification} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="e.g. B.Tech" />
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Social Media (Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" name="instagram.handle" value={profile.socialMedia.instagram.handle} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Instagram @handle" />
              <input type="text" name="instagram.followersCount" value={profile.socialMedia.instagram.followersCount} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="Instagram followers" />
              <input type="text" name="youtube.channelUrl" value={profile.socialMedia.youtube.channelUrl} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="e.g. youtube.com/@YourChannel" />
              <input type="text" name="youtube.subscribers" value={profile.socialMedia.youtube.subscribers} onChange={handleProfileChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                placeholder="YouTube subscribers" />
            </div>
          </div>

          {/* Business Interests */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Business Interests</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_INTERESTS.map(opt => {
                const active = profile.businessInterests.includes(opt);
                return (
                  <button key={opt} type="button" onClick={() => toggleTag("businessInterests", opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(opt => {
                const active = profile.skills.includes(opt);
                return (
                  <button key={opt} type="button" onClick={() => toggleTag("skills", opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${active ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl disabled:opacity-60 transition-all">
            {loading ? "Completing Registration..." : "Complete Registration 🎉"}
          </button>
        </form>
      )}

      <div className="text-center pt-1">
        <button type="button" onClick={switchToLogin}
          className="text-sm text-orange-500 hover:text-orange-700 font-medium">
          Already have an account? Login
        </button>
      </div>
    </div>
  );
};

export default MobileRegisterForm;
