import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaVenusMars,
  FaBriefcase, FaGraduationCap, FaTools, FaInstagram, FaYoutube,
  FaEdit, FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaCamera,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

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

const OCCUPATIONS = [
  "Student", "Freelancer", "Content Creator (Full-Time)", "Actor/Performer",
  "Model", "Entrepreneur", "Corporate Professional",
  "Photographer/Videographer", "Journalist/Blogger", "Artist/Designer",
  "Public Speaker/Coach", "Fitness Trainer", "Healthcare Professional",
];

const QUALIFICATIONS = [
  "High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate",
];

const AGE_RANGES = ["18-24", "25-30", "31-35", "36-40", "41-45", "46-50", "51+"];

// ─── Tag Selector ─────────────────────────────────────────────────────────────
const TagSelector = ({ options, selected = [], onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const active = selected.includes(opt);
      return (
        <button key={opt} type="button"
          onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
            ${active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"}`}>
          {opt}
        </button>
      );
    })}
  </div>
);

// ─── Info Row (view mode) ─────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-orange-500 text-sm">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5 break-words">
        {value || <span className="text-gray-300 italic">Not set</span>}
      </p>
    </div>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-orange-500">{icon}</span>
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── Input Field ──────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white";

// ─── Main Component ───────────────────────────────────────────────────────────
const UserTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("mobileUserToken") || localStorage.getItem("clienttoken");

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load Profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${API_BASE_URL}/api/mobile/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.data.success) setProfile(res.data.data.user);
      })
      .catch(() => showToast("error", "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  // ─── Fetch Live Social Stats ───────────────────────────────────────────────────
  const fetchLiveStats = async () => {
    setFetchingStats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/mobile/user/profile/social-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLiveStats(res.data.stats);
        // Update profile with fresh data
        if (res.data.stats.youtube?.subscribers !== undefined) {
          setProfile(prev => ({
            ...prev,
            socialMedia: {
              ...prev.socialMedia,
              youtube: { ...prev.socialMedia?.youtube, subscribers: res.data.stats.youtube.subscribers },
            },
          }));
        }
        if (res.data.stats.instagram?.followers !== null && res.data.stats.instagram?.live) {
          setProfile(prev => ({
            ...prev,
            socialMedia: {
              ...prev.socialMedia,
              instagram: { ...prev.socialMedia?.instagram, followersCount: res.data.stats.instagram.followers },
            },
          }));
        }
        showToast("success", "Stats refreshed!");
      }
    } catch {
      showToast("error", "Failed to fetch live stats");
    } finally {
      setFetchingStats(false);
    }
  };

  // ─── Upload Profile Image ───────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(`${API_BASE_URL}/api/mobile/user/profile/image`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setProfile(prev => ({ ...prev, profileImageUrl: res.data.data.profileImageUrl, profileImageKey: res.data.data.profileImageKey }));
        showToast("success", "Profile image updated!");
      }
    } catch {
      showToast("error", "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEdit = () => {
    setForm({
      name: profile?.name || "",
      mobileNumber: profile?.mobileNumber || profile?.mobile || "",
      city: profile?.city || "",
      pincode: profile?.pincode || "",
      gender: profile?.gender || "",
      ageRange: profile?.ageRange || "",
      businessInterests: profile?.businessInterests || [],
      occupation: profile?.occupation || "",
      highestQualification: profile?.highestQualification || "",
      fieldOfStudy: profile?.fieldOfStudy || "",
      skills: profile?.skills || [],
      socialMedia: {
        instagram: {
          handle: profile?.socialMedia?.instagram?.handle || "",
          followersCount: profile?.socialMedia?.instagram?.followersCount || "",
        },
        youtube: {
          channelUrl: profile?.socialMedia?.youtube?.channelUrl || "",
          subscribers: profile?.socialMedia?.youtube?.subscribers || "",
        },
      },
    });
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); setForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/mobile/user/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setProfile(res.data.data.user);
        setIsEditing(false);
        showToast("success", "Profile updated successfully!");
      } else {
        showToast("error", res.data.message || "Failed to save");
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save profile");
    } finally { setSaving(false); }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setSocial = (platform, field, value) => setForm(prev => ({
    ...prev,
    socialMedia: { ...prev.socialMedia, [platform]: { ...prev.socialMedia[platform], [field]: value } },
  }));

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
    </div>
  );

  // ─── No Token ───────────────────────────────────────────────────────────────
  if (!token) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <FaExclamationCircle className="text-4xl text-orange-400" />
      <p className="text-gray-500 font-medium">Please login to access your profile</p>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Profile Image with upload */}
            <div className="relative w-14 h-14 flex-shrink-0">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                {profile?.profileImageUrl
                  ? <img src={profile.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                  : <FaUser className="text-2xl text-white" />}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-orange-50 transition-all"
                title="Change photo"
              >
                {uploadingImage
                  ? <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                  : <FaCamera className="text-orange-500 text-xs" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.name || "Your Profile"}</h2>
              <p className="text-orange-100 text-sm">{profile?.email || ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold flex items-center gap-1.5 transition-all">
                  <FaTimes /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white text-orange-500 hover:bg-orange-50 text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 transition-all">
                  <FaSave /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button onClick={handleEdit}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold flex items-center gap-1.5 transition-all">
                <FaEdit /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW MODE ── */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Personal */}
          <Section icon={<FaUser />} title="Personal Information">
            <InfoRow icon={<FaUser />} label="Name" value={profile?.name} />
            <InfoRow icon={<FaEnvelope />} label="Email" value={profile?.email} />
            <InfoRow icon={<FaPhone />} label="Mobile" value={profile?.mobileNumber || profile?.mobile} />
            <InfoRow icon={<FaMapMarkerAlt />} label="City" value={profile?.city} />
            <InfoRow icon={<FaVenusMars />} label="Gender" value={profile?.gender} />
            <InfoRow icon="🎂" label="Age Range" value={profile?.ageRange} />
          </Section>

          {/* Business */}
          <Section icon={<FaBriefcase />} title="Business & Professional">
            <InfoRow icon={<FaBriefcase />} label="Occupation" value={profile?.occupation} />
            <div className="py-2">
              <p className="text-xs text-gray-400 font-medium mb-2">Business Interests</p>
              {profile?.businessInterests?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.businessInterests.map(i => (
                    <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium border border-orange-100">{i}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-300 italic">Not set</p>}
            </div>
          </Section>

          {/* Education */}
          <Section icon={<FaGraduationCap />} title="Education">
            <InfoRow icon={<FaGraduationCap />} label="Highest Qualification" value={profile?.highestQualification} />
            <InfoRow icon="📚" label="Field of Study" value={profile?.fieldOfStudy} />
          </Section>

          {/* Skills */}
          <Section icon={<FaTools />} title="Skills">
            {profile?.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">{s}</span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-300 italic">No skills added</p>}
          </Section>

          {/* Social Media */}
          <div className="md:col-span-2">
            <Section icon={<FaInstagram />} title="Social Media Profiles">
              {/* Refresh Stats Button */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={fetchLiveStats}
                  disabled={fetchingStats}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold rounded-lg border border-orange-200 transition-all disabled:opacity-50"
                >
                  {fetchingStats ? (
                    <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : "🔄"}
                  {fetchingStats ? "Fetching..." : "Refresh Live Stats"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Instagram */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaInstagram className="text-pink-500 text-lg" />
                    <span className="font-semibold text-gray-700 text-sm">Instagram</span>
                    {liveStats?.instagram?.live
                      ? <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Live</span>
                      : <button
                          onClick={fetchLiveStats}
                          disabled={fetchingStats}
                          className="ml-auto text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium hover:bg-yellow-200 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {fetchingStats ? "Fetching..." : "🔄 Tap to refresh"}
                        </button>
                    }
                  </div>

                  {/* Profile pic + name if live */}
                  {liveStats?.instagram?.live && liveStats.instagram.fullName && (
                    <div className="flex items-center gap-2 mb-3">
                      {liveStats.instagram.profilePic && (
                        <img src={liveStats.instagram.profilePic} alt="ig" className="w-8 h-8 rounded-full object-cover border border-pink-200" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{liveStats.instagram.fullName}</p>
                        {liveStats.instagram.isVerified && <span className="text-xs text-blue-500">✓ Verified</span>}
                      </div>
                    </div>
                  )}

                  {/* Handle */}
                  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-500 text-sm">@</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Handle</p>
                      {profile?.socialMedia?.instagram?.handle ? (
                        <a
                          href={`https://instagram.com/${profile.socialMedia.instagram.handle.replace('@', '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-sm text-pink-500 font-medium hover:underline break-words"
                        >
                          {profile.socialMedia.instagram.handle}
                        </a>
                      ) : <p className="text-sm text-gray-300 italic">Not set</p>}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 bg-white rounded-lg p-2 text-center border border-pink-100">
                      <p className="text-xs text-gray-400">Followers</p>
                      <p className="text-sm font-bold text-pink-600">
                        {(liveStats?.instagram?.followers ?? profile?.socialMedia?.instagram?.followersCount)
                          ? Number(liveStats?.instagram?.followers ?? profile?.socialMedia?.instagram?.followersCount).toLocaleString()
                          : <span className="text-gray-300 text-xs font-normal">—</span>}
                      </p>
                    </div>
                    {liveStats?.instagram?.live && (
                      <>
                        <div className="flex-1 bg-white rounded-lg p-2 text-center border border-pink-100">
                          <p className="text-xs text-gray-400">Following</p>
                          <p className="text-sm font-bold text-pink-600">{Number(liveStats.instagram.following ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-2 text-center border border-pink-100">
                          <p className="text-xs text-gray-400">Posts</p>
                          <p className="text-sm font-bold text-pink-600">{Number(liveStats.instagram.posts ?? 0).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {!liveStats?.instagram?.live && (
                    <p className="text-xs text-gray-400 mt-2 italic">Click "Refresh Live Stats" to fetch real followers.</p>
                  )}
                </div>

                {/* YouTube */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaYoutube className="text-red-500 text-lg" />
                    <span className="font-semibold text-gray-700 text-sm">YouTube</span>
                    {liveStats?.youtube && (
                      <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Live</span>
                    )}
                  </div>
                  {liveStats?.youtube?.channelName && (
                    <p className="text-xs text-gray-500 mb-2 font-medium">{liveStats.youtube.channelName}</p>
                  )}
                  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-500 text-sm">🔗</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Channel URL</p>
                      {profile?.socialMedia?.youtube?.channelUrl ? (
                        <a
                          href={profile.socialMedia.youtube.channelUrl.startsWith('http') ? profile.socialMedia.youtube.channelUrl : `https://${profile.socialMedia.youtube.channelUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-sm text-red-500 font-medium hover:underline break-words"
                        >
                          {profile.socialMedia.youtube.channelUrl}
                        </a>
                      ) : <p className="text-sm text-gray-300 italic">Not set</p>}
                    </div>
                  </div>
                  {/* Subscribers */}
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1 bg-white rounded-lg p-2 text-center border border-red-100">
                      <p className="text-xs text-gray-400">Subscribers</p>
                      <p className="text-sm font-bold text-red-600">
                        {(liveStats?.youtube?.subscribers ?? profile?.socialMedia?.youtube?.subscribers)
                          ? Number(liveStats?.youtube?.subscribers ?? profile?.socialMedia?.youtube?.subscribers).toLocaleString()
                          : <span className="text-gray-300 italic font-normal text-xs">Not set</span>}
                      </p>
                    </div>
                    {liveStats?.youtube && (
                      <>
                        <div className="flex-1 bg-white rounded-lg p-2 text-center border border-red-100">
                          <p className="text-xs text-gray-400">Videos</p>
                          <p className="text-sm font-bold text-red-600">{Number(liveStats.youtube.videoCount).toLocaleString()}</p>
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-2 text-center border border-red-100">
                          <p className="text-xs text-gray-400">Total Views</p>
                          <p className="text-sm font-bold text-red-600">{Number(liveStats.youtube.viewCount).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Personal */}
          <Section icon={<FaUser />} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name">
                <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your full name" />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={form.mobileNumber} onChange={e => set("mobileNumber", e.target.value)} placeholder="+91..." />
              </Field>
              <Field label="City">
                <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Your city" />
              </Field>
              <Field label="Pincode">
                <input className={inputCls} value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="Pincode" />
              </Field>
              <Field label="Gender">
                <select className={inputCls} value={form.gender} onChange={e => set("gender", e.target.value)}>
                  <option value="">Select</option>
                  {["male", "female", "other"].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Age Range">
                <select className={inputCls} value={form.ageRange} onChange={e => set("ageRange", e.target.value)}>
                  <option value="">Select</option>
                  {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* Business */}
          <Section icon={<FaBriefcase />} title="Business & Professional">
            <div className="space-y-3">
              <Field label="Occupation">
                <select className={inputCls} value={form.occupation} onChange={e => set("occupation", e.target.value)}>
                  <option value="">Select occupation</option>
                  {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Business Interests">
                <TagSelector options={BUSINESS_INTERESTS} selected={form.businessInterests} onChange={v => set("businessInterests", v)} />
              </Field>
            </div>
          </Section>

          {/* Education */}
          <Section icon={<FaGraduationCap />} title="Education">
            <div className="space-y-3">
              <Field label="Highest Qualification">
                <select className={inputCls} value={form.highestQualification} onChange={e => set("highestQualification", e.target.value)}>
                  <option value="">Select</option>
                  {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </Field>
              <Field label="Field of Study">
                <input className={inputCls} value={form.fieldOfStudy} onChange={e => set("fieldOfStudy", e.target.value)} placeholder="e.g. Computer Science" />
              </Field>
            </div>
          </Section>

          {/* Skills */}
          <Section icon={<FaTools />} title="Skills">
            <Field label="Select your skills">
              <TagSelector options={SKILLS} selected={form.skills} onChange={v => set("skills", v)} />
            </Field>
          </Section>

          {/* Social Media */}
          <div className="md:col-span-2">
            <Section icon={<FaInstagram />} title="Social Media Profiles">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Instagram */}
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <FaInstagram className="text-pink-500" />
                    <span className="font-semibold text-sm text-gray-700">Instagram</span>
                  </div>
                  <Field label="Handle">
                    <input className={inputCls} value={form.socialMedia.instagram.handle}
                      onChange={e => setSocial("instagram", "handle", e.target.value)} placeholder="@yourhandle" />
                  </Field>
                  <Field label="Followers Count">
                    <input className={inputCls} value={form.socialMedia.instagram.followersCount}
                      onChange={e => setSocial("instagram", "followersCount", e.target.value)} placeholder="e.g. 10000" />
                  </Field>
                </div>
                {/* YouTube */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <FaYoutube className="text-red-500" />
                    <span className="font-semibold text-sm text-gray-700">YouTube</span>
                  </div>
                  <Field label="Channel URL">
                    <input className={inputCls} value={form.socialMedia.youtube.channelUrl}
                      onChange={e => setSocial("youtube", "channelUrl", e.target.value)} placeholder="youtube.com/@channel" />
                  </Field>
                  <Field label="Subscribers">
                    <input className={inputCls} value={form.socialMedia.youtube.subscribers}
                      onChange={e => setSocial("youtube", "subscribers", e.target.value)} placeholder="e.g. 5000" />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

        </div>
      )}
    </div>
  );
};

export default UserTab;
