import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../config";
import ManageCampaign from "./ManageCampaign";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes,
  FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaStar, FaImage,
  FaRobot, FaChevronRight, FaChevronLeft, FaCheck
} from "react-icons/fa";
import ReactDOM from "react-dom";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getClientData = () => {
  try {
    return JSON.parse(
      localStorage.getItem("clientData") ||
      sessionStorage.getItem("clientData") || "{}"
    );
  } catch { return {}; }
};
const getClientToken = () =>
  localStorage.getItem("clienttoken") || sessionStorage.getItem("clienttoken") || "";

/** MongoDB Client document _id (hex string) for campaign APIs — never use CLI-XXXXXX here. */
const resolveClientMongoId = () => {
  const data = getClientData();
  const fromStorage = data._id || data.id;
  if (fromStorage && /^[a-f0-9]{24}$/i.test(String(fromStorage).trim())) {
    return String(fromStorage).trim();
  }
  const token = getClientToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === "client" && payload.id) return String(payload.id);
    if (payload.role === "mobileuser" && payload.clientObjectId) return String(payload.clientObjectId);
  } catch {
    return null;
  }
  return null;
};

const statusColor = (c) => {
  const now = new Date();
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  if (end < now) return { bg: "bg-gray-100", text: "text-gray-600", label: "Expired" };
  if (!c.isActive && start > now) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Draft" };
  if (c.isActive && start > now) return { bg: "bg-blue-100", text: "text-blue-700", label: "Scheduled" };
  if (!c.isActive) return { bg: "bg-red-100", text: "text-red-700", label: "Inactive" };
  return { bg: "bg-green-100", text: "text-green-700", label: "Active" };
};

const EMPTY_FORM = {
  campaignName: "", brandName: "", goal: "", description: "",
  tags: "", credits: "", location: "", tNc: "", category: "",
  startDate: "", startTime: "", endDate: "", endTime: "",
  limit: "", views: "", cutoff: "", status: "Active",
};

// ─── Step Form ────────────────────────────────────────────────────────────────
const STEPS = ["Basic Info", "Schedule", "Rules", "Image"];

const CreateModal = ({ onClose, onCreated, clientId, token }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const fileRef = useRef();

  const todayStr = new Date().toISOString().split("T")[0];

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const DEFAULT_CATEGORIES = [
    "Fashion & Lifestyle", "Beauty & Cosmetics", "Health & Wellness",
    "Travel & Tourism", "Food & Beverages", "Tech & Gadgets",
    "Finance & Investing", "Education & EdTech", "Gaming & eSports",
    "Fitness & Sports", "Music & Entertainment", "Startups & Entrepreneurship",
    "Home Decor & Interiors", "Non-Profit & Social Causes",
  ];

  const handleAiFill = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/campaign-fill`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForm(p => ({ ...p, ...data.data }));
        // Auto-handle category
        if (data.data.category) {
          const cat = data.data.category.trim();
          const allCats = [...DEFAULT_CATEGORIES, ...customCategories];
          if (!allCats.includes(cat)) {
            setCustomCategories(p => [...p, cat]);
          }
        }
        // Auto-set campaign image from AI generated base64
        if (data.data.imageBase64) {
          try {
            const base64 = data.data.imageBase64;
            const mime = base64.split(';')[0].split(':')[1];
            const byteStr = atob(base64.split(',')[1]);
            const ab = new ArrayBuffer(byteStr.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
            const file = new File([ab], 'ai-campaign-image.jpg', { type: mime });
            setImageFile(file);
            setImagePreview(base64);
          } catch { }
        }
      }
      else setError(data.message || "AI fill failed");
    } catch { setError("AI fill failed"); }
    finally { setAiLoading(false); }
  };

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }
    setError("");
    setUploadProgress(0);
    setImageFile(file);
    // Simulate progress while reading file
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 80);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.campaignName.trim()) return "Campaign name required";
      if (!form.brandName.trim()) return "Brand name required";
      if (!form.goal.trim()) return "Goal required";
      if (!form.description.trim()) return "Description required";
    }
    if (step === 1) {
      if (!form.startDate || !form.startTime) return "Start date & time required";
      if (!form.endDate || !form.endTime) return "End date & time required";
      const start = new Date(`${form.startDate}T${form.startTime}`);
      const end = new Date(`${form.endDate}T${form.endTime}`);
      if (end <= start) return "End must be after start";
    }
    if (step === 2) {
      if (!form.credits) return "Credits required";
      if (!form.limit) return "Target channels required";
      if (!form.views) return "Target views required";
      if (!form.location.trim()) return "Location required";
    }
    if (step === 3 && !imageFile) return "Campaign image required";
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    const effectiveClientId = clientId && String(clientId) !== "undefined" ? String(clientId) : null;
    if (!effectiveClientId || !/^[a-f0-9]{24}$/i.test(effectiveClientId)) {
      setError("Missing client account id. Please log out and log in again.");
      return;
    }
    setLoading(true); setError("");
    try {
      const start = new Date(`${form.startDate}T${form.startTime}`).toISOString();
      const end = new Date(`${form.endDate}T${form.endTime}`).toISOString();
      const fd = new FormData();
      Object.entries({ ...form, startDate: start, endDate: end, clientId: effectiveClientId }).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });
      fd.append("image", imageFile);
      const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) { onCreated(); onClose(); }
      else setError(data.message || "Failed to create campaign");
    } catch { setError("Failed to create campaign"); }
    finally { setLoading(false); }
  };

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><FaTimes className="text-gray-500" /></button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < step ? "bg-green-500 text-white" : i === step ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i < step ? <FaCheck size={10} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? "text-orange-600" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 py-5">
          {/* AI Fill */}
          {step === 0 && (
            <div className="flex gap-2 mb-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <input
                className="flex-1 border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="✨ AI Fill — describe your campaign topic..."
                value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAiFill()}
              />
              <button onClick={handleAiFill} disabled={aiLoading || !aiTopic.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1">
                <FaRobot size={12} /> {aiLoading ? "..." : "Fill"}
              </button>
            </div>
          )}

          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Campaign Name *</label><input className={inp} value={form.campaignName} onChange={e => set("campaignName", e.target.value)} placeholder="e.g. Summer Brand Awareness" /></div>
              <div>
                <label className={lbl}>Brand Name *</label>
                <input className={inp} value={form.brandName} onChange={e => set("brandName", e.target.value)} placeholder="e.g. Nike" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Category</label>
                <select className={inp} value={form.category || ""} onChange={e => {
                  if (e.target.value === "__add_new__") {
                    setShowAddCategory(true);
                  } else {
                    set("category", e.target.value);
                  }
                }}>
                  <option value="">Select category</option>
                  {[...DEFAULT_CATEGORIES, ...customCategories].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="__add_new__">➕ Add New Category...</option>
                </select>
                {showAddCategory && (
                  <div className="flex gap-2 mt-2">
                    <input
                      className={inp}
                      placeholder="Enter new category name"
                      value={newCategoryInput}
                      onChange={e => setNewCategoryInput(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newCategoryInput.trim()) {
                          setCustomCategories(p => [...p, newCategoryInput.trim()]);
                          set("category", newCategoryInput.trim());
                          setNewCategoryInput("");
                          setShowAddCategory(false);
                        }
                      }}
                    />
                    <button type="button" onClick={() => {
                      if (newCategoryInput.trim()) {
                        setCustomCategories(p => [...p, newCategoryInput.trim()]);
                        set("category", newCategoryInput.trim());
                        setNewCategoryInput("");
                        setShowAddCategory(false);
                      }
                    }} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">Add</button>
                    <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryInput(""); }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
                  </div>
                )}
              </div>
              <div className="col-span-2"><label className={lbl}>Goal *</label><input className={inp} value={form.goal} onChange={e => set("goal", e.target.value)} placeholder="e.g. Increase brand visibility" /></div>
              <div className="col-span-2"><label className={lbl}>Description *</label><textarea className={inp} rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the campaign..." /></div>
              <div className="col-span-2"><label className={lbl}>Tags (comma separated)</label><input className={inp} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="fitness, health, lifestyle" /></div>
              <div className="col-span-2"><label className={lbl}>Terms & Conditions</label><textarea className={inp} rows={2} value={form.tNc} onChange={e => set("tNc", e.target.value)} placeholder="Campaign T&C..." /></div>
            </div>
          )}

          {/* Step 1 — Schedule */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Start Date *</label><input type="date" className={inp} value={form.startDate} min={todayStr} onChange={e => set("startDate", e.target.value)} /></div>
              <div><label className={lbl}>Start Time *</label><input type="time" className={inp} value={form.startTime} onChange={e => set("startTime", e.target.value)} /></div>
              <div><label className={lbl}>End Date *</label><input type="date" className={inp} value={form.endDate} min={form.startDate || todayStr} onChange={e => set("endDate", e.target.value)} /></div>
              <div><label className={lbl}>End Time *</label><input type="time" className={inp} value={form.endTime} onChange={e => set("endTime", e.target.value)} /></div>
              <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-700">
                Campaign will be automatically activated when start time is reached and deactivated after end time.
              </div>
            </div>
          )}

          {/* Step 2 — Rules */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Credits Per Task *</label><input type="number" className={inp} value={form.credits} onChange={e => set("credits", e.target.value)} placeholder="e.g. 10" min={1} /></div>
              <div><label className={lbl}>Location *</label><input className={inp} value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Delhi, India" /></div>
              <div><label className={lbl}>Target Channels *</label><input type="number" className={inp} value={form.limit} onChange={e => set("limit", e.target.value)} placeholder="Max participants" min={1} /></div>
              <div><label className={lbl}>Minimum Target Views *</label><input type="number" className={inp} value={form.views} onChange={e => set("views", e.target.value)} placeholder="e.g. 1000" min={1} /></div>
              <div><label className={lbl}>Cutoff Views (MVR)</label><input type="number" className={inp} value={form.cutoff} onChange={e => set("cutoff", e.target.value)} placeholder="Min views to earn credits" min={0} /></div>
              <div>
                <label className={lbl}>Status</label>
                <select className={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3 — Image */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4">
              <div
                onClick={() => fileRef.current.click()}
                className="w-full h-48 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors overflow-hidden"
              >
                {imagePreview
                  ? <img src={imagePreview} alt="preview" className="h-full w-full object-cover rounded-xl" />
                  : <><FaImage size={32} className="text-orange-300 mb-2" /><p className="text-sm text-gray-500">Click to upload campaign image</p><p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p></>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

              {/* Progress Bar */}
              {imageFile && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading image...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {imagePreview && (
                <button onClick={() => { setImageFile(null); setImagePreview(""); setUploadProgress(0); }} className="text-sm text-red-500 hover:text-red-700">Remove image</button>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={step === 0 ? onClose : () => { setError(""); setStep(s => s - 1); }}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">
            <FaChevronLeft size={10} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1
            ? <button onClick={next} className="flex items-center gap-1 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
                Next <FaChevronRight size={10} />
              </button>
            : <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                ) : "Create Campaign"}
              </button>
          }
        </div>
      </div>
    </div>
  );
};

// ─── Edit Modal ──────────────────────────────────────────────────────────────
const EditModal = ({ campaign, onClose, onUpdated, token }) => {
  const toDateStr = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
  const toTimeStr = (d) => d ? new Date(d).toTimeString().slice(0, 5) : '';

  const DEFAULT_CATEGORIES = [
    "Fashion & Lifestyle", "Beauty & Cosmetics", "Health & Wellness",
    "Travel & Tourism", "Food & Beverages", "Tech & Gadgets",
    "Finance & Investing", "Education & EdTech", "Gaming & eSports",
    "Fitness & Sports", "Music & Entertainment", "Startups & Entrepreneurship",
    "Home Decor & Interiors", "Non-Profit & Social Causes",
  ];

  const [form, setForm] = useState({
    campaignName: campaign.campaignName || '',
    brandName: campaign.brandName || '',
    goal: campaign.goal || '',
    description: campaign.description || '',
    tags: Array.isArray(campaign.tags) ? campaign.tags.join(',') : campaign.tags || '',
    credits: campaign.credits || '',
    location: campaign.location || '',
    tNc: campaign.tNc || '',
    category: campaign.category || '',
    startDate: toDateStr(campaign.startDate),
    startTime: toTimeStr(campaign.startDate),
    endDate: toDateStr(campaign.endDate),
    endTime: toTimeStr(campaign.endDate),
    limit: campaign.limit || '',
    views: campaign.views || '',
    cutoff: campaign.cutoff || '',
    status: campaign.status || 'Active',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(campaign.image?.url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customCategories, setCustomCategories] = useState(
    campaign.category && !DEFAULT_CATEGORIES.includes(campaign.category) ? [campaign.category] : []
  );
  const fileRef = useRef();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be 5MB or smaller.'); return; }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.campaignName.trim()) return setError('Campaign name required');
    if (!form.brandName.trim()) return setError('Brand name required');
    if (!form.startDate || !form.endDate) return setError('Start and end date required');
    setLoading(true); setError('');
    try {
      const start = new Date(`${form.startDate}T${form.startTime || '00:00'}`).toISOString();
      const end = new Date(`${form.endDate}T${form.endTime || '23:59'}`).toISOString();
      const fd = new FormData();
      Object.entries({ ...form, startDate: start, endDate: end }).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);
      const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign/${campaign._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) { onUpdated(); onClose(); }
      else setError(data.message || 'Update failed');
    } catch { setError('Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">✏️ Edit Campaign</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><FaTimes className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div><label className={lbl}>Campaign Name *</label><input className={inp} value={form.campaignName} onChange={e => set('campaignName', e.target.value)} /></div>
          <div><label className={lbl}>Brand Name *</label><input className={inp} value={form.brandName} onChange={e => set('brandName', e.target.value)} /></div>
          <div className="col-span-2">
            <label className={lbl}>Category</label>
            <select className={inp} value={form.category || ''} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {[...DEFAULT_CATEGORIES, ...customCategories].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className={lbl}>Goal *</label><input className={inp} value={form.goal} onChange={e => set('goal', e.target.value)} /></div>
          <div className="col-span-2"><label className={lbl}>Description *</label><textarea className={inp} rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="col-span-2"><label className={lbl}>Tags (comma separated)</label><input className={inp} value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
          <div><label className={lbl}>Start Date *</label><input type="date" className={inp} value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
          <div><label className={lbl}>Start Time</label><input type="time" className={inp} value={form.startTime} onChange={e => set('startTime', e.target.value)} /></div>
          <div><label className={lbl}>End Date *</label><input type="date" className={inp} value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
          <div><label className={lbl}>End Time</label><input type="time" className={inp} value={form.endTime} onChange={e => set('endTime', e.target.value)} /></div>
          <div><label className={lbl}>Credits Per Task</label><input type="number" className={inp} value={form.credits} onChange={e => set('credits', e.target.value)} min={1} /></div>
          <div><label className={lbl}>Location</label><input className={inp} value={form.location} onChange={e => set('location', e.target.value)} /></div>
          <div><label className={lbl}>Target Channels</label><input type="number" className={inp} value={form.limit} onChange={e => set('limit', e.target.value)} min={1} /></div>
          <div><label className={lbl}>Target Views</label><input type="number" className={inp} value={form.views} onChange={e => set('views', e.target.value)} min={1} /></div>
          <div><label className={lbl}>Cutoff Views</label><input type="number" className={inp} value={form.cutoff} onChange={e => set('cutoff', e.target.value)} min={0} /></div>
          <div>
            <label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="col-span-2"><label className={lbl}>Terms & Conditions</label><textarea className={inp} rows={2} value={form.tNc} onChange={e => set('tNc', e.target.value)} /></div>
          <div className="col-span-2">
            <label className={lbl}>Campaign Image <span className="text-gray-400 font-normal">(leave empty to keep current)</span></label>
            <div onClick={() => fileRef.current.click()} className="w-full h-36 border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-orange-50 overflow-hidden">
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="h-full w-full object-cover rounded-xl" />
                : <><FaImage size={24} className="text-orange-300 mr-2" /><span className="text-sm text-gray-400">Click to change image</span></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          {error && <p className="col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main CampaignTab ─────────────────────────────────────────────────────────
const CampaignTab = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [campaignStats, setCampaignStats] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [editCampaign, setEditCampaign] = useState(null);

  const clientId = resolveClientMongoId();
  const token = getClientToken();

  const fetchCampaigns = async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign/client/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns(data.campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, [clientId]);

  // Fetch stats per campaign
  useEffect(() => {
    campaigns.forEach(async (c) => {
      if (campaignStats[c._id]) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign/activeparticipants/${c._id}`);
        const data = await res.json();
        setCampaignStats(p => ({ ...p, [c._id]: { participants: data.userIds?.length || 0 } }));
      } catch { }
    });
  }, [campaigns]);

  if (selected) return <ManageCampaign campaign={selected} onBack={() => { setSelected(null); fetchCampaigns(); }} />;

  const now = new Date();
  const filtered = campaigns.filter(c => {
    const matchSearch = c.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      c.brandName.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "active") return c.isActive && new Date(c.endDate) >= now;
    if (filter === "inactive") return !c.isActive && new Date(c.startDate) <= now;
    if (filter === "expired") return new Date(c.endDate) < now;
    if (filter === "scheduled") return new Date(c.startDate) > now && c.isActive;
    if (filter === "draft") return !c.isActive && new Date(c.startDate) > now;
    return true;
  });

  const counts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.isActive && new Date(c.endDate) >= now).length,
    inactive: campaigns.filter(c => !c.isActive && new Date(c.startDate) <= now).length,
    expired: campaigns.filter(c => new Date(c.endDate) < now).length,
    scheduled: campaigns.filter(c => new Date(c.startDate) > now && c.isActive).length,
    draft: campaigns.filter(c => !c.isActive && new Date(c.startDate) > now).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Campaigns</h2>
          <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} total campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:brightness-110 shadow-sm">
          <FaPlus size={12} /> Create Campaign
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {[
            { key: "all", label: "All", color: "text-gray-600" },
            { key: "active", label: "Active", color: "text-green-600" },
            { key: "scheduled", label: "Scheduled", color: "text-blue-600" },
            { key: "inactive", label: "Inactive", color: "text-red-600" },
            { key: "expired", label: "Expired", color: "text-gray-500" },
            { key: "draft", label: "Draft", color: "text-yellow-600" },
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
                ${filter === key ? `bg-white shadow-sm ${color}` : "text-gray-500 hover:text-gray-700"}`}>
              {label} ({counts[key]})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FaStar size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No campaigns found</p>
          <p className="text-sm mt-1">Create your first campaign to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
          {/* Header */}
          <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
            <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Campaign</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Brand</div>
            <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Participants</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</div>
            <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Credits</div>
            <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</div>
          </div>

          {filtered.map((c) => {
            const st = statusColor(c);
            const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—";
            return (
              <div key={c._id}
                className="grid grid-cols-12 items-center px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-orange-50/30 cursor-pointer transition-colors group"
                onClick={() => setSelected(c)}>

                {/* Campaign */}
                <div className="col-span-3 flex items-center gap-3 min-w-0 pr-2">
                  {c.image?.url
                    ? <img src={c.image.url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100 shadow-sm" />
                    : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                        <FaImage className="text-orange-400" size={14} />
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{c.campaignName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(c.tags) ? c.tags : []).slice(0, 2).map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[10px] font-medium">#{t.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brand */}
                <div className="col-span-2 pr-2">
                  <p className="text-sm text-gray-700 font-medium truncate">{c.brandName}</p>
                  {c.category && <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.category}</p>}
                </div>

                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.text === 'text-green-700' ? 'bg-green-500' : st.text === 'text-red-700' ? 'bg-red-400' : 'bg-gray-400'}`} />
                    {st.label}
                  </span>
                </div>

                {/* Participants */}
                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <FaUsers size={11} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{campaignStats[c._id]?.participants ?? "—"}</span>
                    <span className="text-xs text-gray-400">/ {c.limit ?? "—"}</span>
                  </div>
                </div>

                {/* Duration + Credits */}
                <div className="col-span-2 pr-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                    <FaCalendarAlt size={9} className="text-gray-400 flex-shrink-0" />
                    <span>{fmt(c.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5 whitespace-nowrap">
                    <FaCalendarAlt size={9} className="text-gray-400 flex-shrink-0" />
                    <span>{fmt(c.endDate)}</span>
                  </div>
                </div>

                {/* Credits */}
                <div className="col-span-1 flex justify-end pr-1">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-400">Credits</span>
                    <span className="text-sm font-bold text-orange-500">{c.credits}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (openMenuId === c._id) { setOpenMenuId(null); return; }
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                      setOpenMenuId(c._id);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchCampaigns}
          clientId={clientId}
          token={token}
        />
      )}

      {editCampaign && (
        <EditModal
          campaign={editCampaign}
          onClose={() => setEditCampaign(null)}
          onUpdated={() => { setEditCampaign(null); fetchCampaigns(); }}
          token={token}
        />
      )}

      {/* Portal Dropdown */}
      {openMenuId && (() => {
        const c = campaigns.find(x => x._id === openMenuId);
        if (!c) return null;
        return ReactDOM.createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
            <div
              className="fixed z-50 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button onClick={e => { e.stopPropagation(); setSelected(c); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">👁 Manage</button>
              <button onClick={e => { e.stopPropagation(); setEditCampaign(c); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">✏️ Edit</button>
              <button onClick={async e => {
                e.stopPropagation();
                const newIsActive = !c.isActive;
                const newStatus = newIsActive ? 'Active' : 'Inactive';
                await fetch(`${API_BASE_URL}/api/auth/user/campaign/${c._id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ status: newStatus, isActive: newIsActive }),
                });
                setOpenMenuId(null);
                fetchCampaigns();
              }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                {c.isActive ? '⏸ Deactivate' : '▶ Activate'}
              </button>
              <div className="border-t border-gray-100" />
              <button onClick={async e => {
                e.stopPropagation();
                if (!window.confirm('Delete this campaign?')) return;
                await fetch(`${API_BASE_URL}/api/auth/user/campaign/${c._id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                setOpenMenuId(null);
                fetchCampaigns();
              }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">🗑 Delete</button>
            </div>
          </>,
          document.body
        );
      })()}
    </div>
  );
};

export default CampaignTab;
