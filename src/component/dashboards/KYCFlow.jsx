import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  CheckCircle, Clock, XCircle, Upload, User, MapPin,
  CreditCard, Camera, ChevronRight, ChevronLeft, AlertCircle,
  Shield, FileText, Banknote,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const STEPS = [
  { id: 1, label: "Personal Info",  icon: User },
  { id: 2, label: "Address",        icon: MapPin },
  { id: 3, label: "Documents",      icon: FileText },
  { id: 4, label: "Bank / UPI",     icon: Banknote },
];

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white";

const Field = ({ label, required, children, error }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const DocUpload = ({ label, file, preview, onChange, required }) => {
  const ref = useRef();
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-24 object-contain rounded-lg" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400" />
            <p className="text-xs text-gray-400">Click to upload</p>
          </>
        )}
        {file && <p className="text-xs text-green-600 font-medium truncate max-w-full">{file.name}</p>}
      </div>
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={onChange} />
    </div>
  );
};

// ── Status Banner ─────────────────────────────────────────────────────────────
const StatusBanner = ({ kyc, onResubmit }) => {
  const cfg = {
    submitted:    { bg: "bg-blue-50 border-blue-200",   icon: <Clock className="w-5 h-5 text-blue-500" />,   title: "KYC Under Review",    text: "Your documents have been submitted and are being reviewed by our team." },
    under_review: { bg: "bg-yellow-50 border-yellow-200", icon: <Clock className="w-5 h-5 text-yellow-500" />, title: "KYC Under Review",    text: "Our team is verifying your documents. This usually takes 1-2 business days." },
    approved:     { bg: "bg-green-50 border-green-200",  icon: <CheckCircle className="w-5 h-5 text-green-500" />, title: "KYC Approved ✓",  text: "Your KYC is verified. You can now withdraw your earnings." },
    rejected:     { bg: "bg-red-50 border-red-200",     icon: <XCircle className="w-5 h-5 text-red-500" />,   title: "KYC Rejected",        text: kyc?.rejectionReason || "Your KYC was rejected. Please resubmit with correct documents." },
  };
  const c = cfg[kyc?.status] || cfg.submitted;
  return (
    <div className={`border rounded-2xl p-5 ${c.bg}`}>
      <div className="flex items-start gap-3">
        {c.icon}
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-sm">{c.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{c.text}</p>
          {kyc?.submittedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Submitted: {new Date(kyc.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
      {kyc?.status === "rejected" && (
        <button
          onClick={onResubmit}
          className="mt-4 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all"
        >
          Resubmit KYC
        </button>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const KYCFlow = () => {
  const [step, setStep]         = useState(1);
  const [kyc, setKyc]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast]       = useState(null);
  const [errors, setErrors]     = useState({});

  const [form, setForm] = useState({
    fullName: "", dateOfBirth: "", gender: "",
    address: "", city: "", state: "", pincode: "",
    panNumber: "", aadharNumber: "",
    bankName: "", accountNumber: "", ifscCode: "", accountHolder: "", upiId: "",
  });

  const [files, setFiles]     = useState({ panImage: null, aadharFront: null, aadharBack: null, selfie: null });
  const [previews, setPreviews] = useState({});

  const userId = (() => {
    try {
      const raw = localStorage.getItem("mobileUserData");
      if (raw) {
        const d = JSON.parse(raw);
        return d.googleId || d.userId || d._id || "";
      }
    } catch { }
    return "";
  })();

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch existing KYC ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    axios.get(`${API_BASE_URL}/api/kyc/${userId}`)
      .then(res => {
        if (res.data.kyc) {
          setKyc(res.data.kyc);
          if (res.data.kyc.status === "rejected") setShowForm(false);
        } else {
          setShowForm(true);
        }
      })
      .catch(() => setShowForm(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles(p => ({ ...p, [key]: file }));
    const reader = new FileReader();
    reader.onload = ev => setPreviews(p => ({ ...p, [key]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.fullName.trim())  e.fullName  = "Full name is required";
      if (!form.dateOfBirth)      e.dateOfBirth = "Date of birth is required";
      if (!form.gender)           e.gender    = "Gender is required";
    }
    if (step === 2) {
      if (!form.address.trim())   e.address   = "Address is required";
      if (!form.city.trim())      e.city      = "City is required";
      if (!form.state.trim())     e.state     = "State is required";
      if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) e.pincode = "Valid 6-digit pincode required";
    }
    if (step === 3) {
      if (!form.panNumber.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.toUpperCase()))
        e.panNumber = "Valid PAN number required (e.g. ABCDE1234F)";
      if (!form.aadharNumber.trim() || !/^\d{12}$/.test(form.aadharNumber))
        e.aadharNumber = "Valid 12-digit Aadhaar number required";
      if (!files.panImage && !kyc?.panImageUrl)     e.panImage    = "PAN card image required";
      if (!files.aadharFront && !kyc?.aadharFrontUrl) e.aadharFront = "Aadhaar front image required";
      if (!files.aadharBack && !kyc?.aadharBackUrl)   e.aadharBack  = "Aadhaar back image required";
      if (!files.selfie && !kyc?.selfieUrl)           e.selfie      = "Selfie required";
    }
    if (step === 4) {
      const hasBank = form.bankName.trim() && form.accountNumber.trim() && form.ifscCode.trim() && form.accountHolder.trim();
      const hasUpi  = form.upiId.trim();
      if (!hasBank && !hasUpi) e.payment = "Please fill Bank details OR UPI ID";
      if (form.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.toUpperCase()))
        e.ifscCode = "Valid IFSC code required (e.g. SBIN0001234)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
  const prev = () => { setStep(s => Math.max(s - 1, 1)); setErrors({}); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("userId", userId);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files.panImage)    fd.append("panImage",    files.panImage);
      if (files.aadharFront) fd.append("aadharFront", files.aadharFront);
      if (files.aadharBack)  fd.append("aadharBack",  files.aadharBack);
      if (files.selfie)      fd.append("selfie",      files.selfie);

      const res = await axios.post(`${API_BASE_URL}/api/kyc/submit`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setKyc(res.data.kyc);
        setShowForm(false);
        showToast("success", "KYC submitted successfully! Under review.");
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  // ── Status view (submitted / under_review / approved) ──────────────────────
  if (kyc && !showForm && kyc.status !== "rejected") {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">KYC Verification</h2>
        </div>
        <StatusBanner kyc={kyc} onResubmit={() => setShowForm(true)} />

        {/* Summary */}
        {kyc.status === "approved" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700">Verified Details</h3>
            {[
              ["Full Name", kyc.fullName],
              ["PAN Number", kyc.panNumber],
              ["Aadhaar", kyc.aadharNumber ? `XXXX XXXX ${kyc.aadharNumber.slice(-4)}` : ""],
              ["Bank / UPI", kyc.upiId || kyc.bankName],
            ].map(([l, v]) => v ? (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-gray-500">{l}</span>
                <span className="font-semibold text-gray-800">{v}</span>
              </div>
            ) : null)}
          </div>
        )}
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-800">KYC Verification</h2>
        <span className="ml-auto text-xs text-gray-400">Step {step} of 4</span>
      </div>

      {/* Rejected banner */}
      {kyc?.status === "rejected" && (
        <StatusBanner kyc={kyc} onResubmit={() => {}} />
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done    = step > s.id;
          const current = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${done    ? "bg-green-100 text-green-700" :
                  current ? "bg-orange-500 text-white shadow-sm" :
                            "bg-gray-100 text-gray-400"}`}>
                {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${step > s.id ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <>
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><User className="w-4 h-4 text-orange-500" /> Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.fullName}>
                <input className={inputCls} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="As per Aadhaar" />
              </Field>
              <Field label="Date of Birth" required error={errors.dateOfBirth}>
                <input type="date" className={inputCls} value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select className={inputCls} value={form.gender} onChange={e => set("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {/* Step 2 — Address */}
        {step === 2 && (
          <>
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Address Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full Address" required error={errors.address}>
                  <textarea className={inputCls} rows={2} value={form.address} onChange={e => set("address", e.target.value)} placeholder="House no, Street, Area" />
                </Field>
              </div>
              <Field label="City" required error={errors.city}>
                <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
              </Field>
              <Field label="State" required error={errors.state}>
                <input className={inputCls} value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" />
              </Field>
              <Field label="Pincode" required error={errors.pincode}>
                <input className={inputCls} value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="6-digit pincode" maxLength={6} />
              </Field>
            </div>
          </>
        )}

        {/* Step 3 — Documents */}
        {step === 3 && (
          <>
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Identity Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="PAN Number" required error={errors.panNumber}>
                <input className={`${inputCls} uppercase`} value={form.panNumber} onChange={e => set("panNumber", e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
              </Field>
              <Field label="Aadhaar Number" required error={errors.aadharNumber}>
                <input className={inputCls} value={form.aadharNumber} onChange={e => set("aadharNumber", e.target.value.replace(/\D/g, ""))} placeholder="12-digit Aadhaar" maxLength={12} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <DocUpload label="PAN Card" required file={files.panImage} preview={previews.panImage || kyc?.panImageUrl} onChange={e => handleFile("panImage", e)} />
              {errors.panImage && <p className="text-xs text-red-500 -mt-3">{errors.panImage}</p>}
              <DocUpload label="Aadhaar Front" required file={files.aadharFront} preview={previews.aadharFront || kyc?.aadharFrontUrl} onChange={e => handleFile("aadharFront", e)} />
              {errors.aadharFront && <p className="text-xs text-red-500 -mt-3">{errors.aadharFront}</p>}
              <DocUpload label="Aadhaar Back" required file={files.aadharBack} preview={previews.aadharBack || kyc?.aadharBackUrl} onChange={e => handleFile("aadharBack", e)} />
              {errors.aadharBack && <p className="text-xs text-red-500 -mt-3">{errors.aadharBack}</p>}
              <DocUpload label="Selfie with Aadhaar" required file={files.selfie} preview={previews.selfie || kyc?.selfieUrl} onChange={e => handleFile("selfie", e)} />
              {errors.selfie && <p className="text-xs text-red-500 -mt-3">{errors.selfie}</p>}
            </div>
          </>
        )}

        {/* Step 4 — Bank / UPI */}
        {step === 4 && (
          <>
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Banknote className="w-4 h-4 text-orange-500" /> Payment Details</h3>
            <p className="text-xs text-gray-400">Fill Bank details OR UPI ID (at least one required)</p>
            {errors.payment && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{errors.payment}</p>
              </div>
            )}

            {/* Bank */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Bank Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Bank Name">
                  <input className={inputCls} value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="e.g. State Bank of India" />
                </Field>
                <Field label="Account Holder Name">
                  <input className={inputCls} value={form.accountHolder} onChange={e => set("accountHolder", e.target.value)} placeholder="As per bank records" />
                </Field>
                <Field label="Account Number">
                  <input className={inputCls} value={form.accountNumber} onChange={e => set("accountNumber", e.target.value.replace(/\D/g, ""))} placeholder="Account number" />
                </Field>
                <Field label="IFSC Code" error={errors.ifscCode}>
                  <input className={`${inputCls} uppercase`} value={form.ifscCode} onChange={e => set("ifscCode", e.target.value.toUpperCase())} placeholder="SBIN0001234" maxLength={11} />
                </Field>
              </div>
            </div>

            {/* UPI */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide">UPI ID</p>
              <Field label="UPI ID">
                <input className={inputCls} value={form.upiId} onChange={e => set("upiId", e.target.value)} placeholder="yourname@upi" />
              </Field>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={prev} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < 4 ? (
          <button onClick={next} className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Submit KYC</>
            )}
          </button>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
        <Shield className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700">Your documents are encrypted and stored securely. KYC is required to withdraw earnings.</p>
      </div>
    </div>
  );
};

export default KYCFlow;
