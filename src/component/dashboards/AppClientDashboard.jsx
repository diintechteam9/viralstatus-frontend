import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaChartBar, FaUsers, FaBars, FaTimes, FaSignOutAlt, FaPlus, FaCog,
  FaEdit, FaEye, FaTrash, FaBuilding, FaGlobe, FaEnvelope, FaMobileAlt,
  FaMapMarkerAlt, FaHashtag, FaLock, FaEyeSlash, FaIdCard, FaImage,
  FaQuestionCircle, FaUserCircle, FaShieldAlt, FaBell, FaPalette,
  FaChevronRight, FaCheckCircle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import UGCPrompterTab from "./UGCPrompterTab.jsx";
import ClientUGCPrompterPage from "./ClientUGCPrompterPage.jsx";

const EMPTY_FORM = {
  name: "", company: "", websiteUrl: "",
  businessLogo: null, businessLogoPreview: null,
  email: "", password: "", mobile: "",
  gstNumber: "", panNumber: "",
  address: "", city: "", state: "", pincode: "", country: "",
};

function InputField({ icon, label, required, error, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#7c3aed" }}>*</span>}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && (
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#a78bfa", fontSize: 13, pointerEvents: "none", zIndex: 1 }}>
            {icon}
          </span>
        )}
        {children}
      </div>
      {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasIcon = true, extraRight = false) => ({
  width: "100%",
  paddingLeft: hasIcon ? 36 : 12,
  paddingRight: extraRight ? 40 : 12,
  paddingTop: 10,
  paddingBottom: 10,
  fontSize: 13,
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  outline: "none",
  background: "#fff",
  color: "#111827",
  boxSizing: "border-box",
});

function TextInput({ icon, value, onChange, placeholder, type = "text", readOnly, extraRight }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      style={{ ...inputStyle(!!icon, extraRight), ...(readOnly ? { background: "#f9fafb", color: "#6b7280" } : {}) }}
      onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#7c3aed"; }}
      onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
    />
  );
}

function SectionHeading({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6d28d9", fontSize: 12, flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#4c1d95", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "#ede9fe", marginLeft: 4 }} />
    </div>
  );
}

function AppClientFormModal({ mode, form, setForm, errors, showPass, setShowPass, onClose, onSubmit, loading, readOnly }) {
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, businessLogo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setForm((prev) => ({ ...prev, businessLogoPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const title = mode === "view" ? "View AppClient" : mode === "edit" ? "Edit AppClient" : "Add AppClient";

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(17,24,39,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#6b7280" }}>
            <FaTimes />
          </button>
        </div>

        <div style={{ padding: "20px 22px" }}>
          <SectionHeading icon={<FaBuilding />} title="Business Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <InputField icon={<FaBuilding size={12} />} label="Name" required error={errors.name}>
              <TextInput icon readOnly={readOnly} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Client name" />
            </InputField>
            <InputField icon={<FaBuilding size={12} />} label="Company" error={errors.company}>
              <TextInput icon readOnly={readOnly} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" />
            </InputField>
            <InputField icon={<FaGlobe size={12} />} label="Website URL" error={errors.websiteUrl}>
              <TextInput icon readOnly={readOnly} value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://..." />
            </InputField>
            <InputField icon={<FaImage size={12} />} label="Business Logo">
              {readOnly ? (
                form.businessLogoPreview ? (
                  <img src={form.businessLogoPreview} alt="Logo" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }} />
                ) : (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>No logo</span>
                )
              ) : (
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: 12 }} />
                  {form.businessLogoPreview && (
                    <img src={form.businessLogoPreview} alt="Preview" style={{ marginTop: 8, width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }} />
                  )}
                </div>
              )}
            </InputField>
          </div>

          <SectionHeading icon={<FaEnvelope />} title="Contact Details" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <InputField icon={<FaEnvelope size={12} />} label="Email" required error={errors.email}>
              <TextInput icon readOnly={readOnly} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" />
            </InputField>
            <InputField icon={<FaMobileAlt size={12} />} label="Mobile" error={errors.mobile}>
              <TextInput icon readOnly={readOnly} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+91..." />
            </InputField>
            {mode !== "view" && (
              <InputField icon={<FaLock size={12} />} label={mode === "edit" ? "Password (leave blank to keep)" : "Password"} required={mode === "add"} error={errors.password}>
                <TextInput
                  icon
                  type={showPass ? "text" : "password"}
                  extraRight
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={mode === "edit" ? "••••••••" : "Password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#7c3aed" }}
                >
                  {showPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </InputField>
            )}
          </div>

          <SectionHeading icon={<FaIdCard />} title="Documents" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <InputField icon={<FaHashtag size={12} />} label="GST Number">
              <TextInput icon readOnly={readOnly} value={form.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} placeholder="GSTIN" />
            </InputField>
            <InputField icon={<FaHashtag size={12} />} label="PAN Number">
              <TextInput icon readOnly={readOnly} value={form.panNumber} onChange={(e) => set("panNumber", e.target.value)} placeholder="PAN" />
            </InputField>
          </div>

          <SectionHeading icon={<FaMapMarkerAlt />} title="Location" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <InputField icon={<FaMapMarkerAlt size={12} />} label="Address">
                <TextInput icon readOnly={readOnly} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" />
              </InputField>
            </div>
            <InputField icon={<FaMapMarkerAlt size={12} />} label="City">
              <TextInput icon readOnly={readOnly} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
            </InputField>
            <InputField icon={<FaMapMarkerAlt size={12} />} label="State">
              <TextInput icon readOnly={readOnly} value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State" />
            </InputField>
            <InputField icon={<FaHashtag size={12} />} label="Pincode">
              <TextInput icon readOnly={readOnly} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="Pincode" />
            </InputField>
            <InputField icon={<FaGlobe size={12} />} label="Country">
              <TextInput icon readOnly={readOnly} value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" />
            </InputField>
          </div>
        </div>

        {!readOnly && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid #f3f4f6" }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: loading ? "#a78bfa" : "linear-gradient(135deg, #6d28d9, #5b21b6)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create AppClient"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function AppClientsTab({ user, getToken, apiFetch }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeClient, setActiveClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openActionIdx, setOpenActionIdx] = useState(null);
  const actionRefs = useRef({});

  const appId = user?.appId || user?._id;

  const fetchClients = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/appclient?appId=${appId}`);
      const json = await res.json();
      if (json.success) setClients(json.data || []);
    } catch (err) {
      console.error("[fetchClients]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [appId]);

  useEffect(() => {
    const handler = (e) => {
      if (openActionIdx !== null) {
        const ref = actionRefs.current[openActionIdx];
        if (ref && !ref.contains(e.target)) setOpenActionIdx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openActionIdx]);

  const clientToForm = (c) => ({
    name: c.name || "",
    company: c.company || "",
    websiteUrl: c.websiteUrl || "",
    businessLogo: null,
    businessLogoPreview: c.logoUrl || c.logoPreview || null,
    email: c.email || "",
    password: "",
    mobile: c.mobile || "",
    gstNumber: c.gstNumber || "",
    panNumber: c.panNumber || "",
    address: c.address || "",
    city: c.city || "",
    state: c.state || "",
    pincode: c.pincode || "",
    country: c.country || "",
  });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPass(false);
    setActiveClient(null);
    setModalMode("add");
  };

  const openEdit = (c) => {
    setActiveClient(c);
    setForm(clientToForm(c));
    setErrors({});
    setShowPass(false);
    setModalMode("edit");
    setOpenActionIdx(null);
  };

  const openView = (c) => {
    setActiveClient(c);
    setForm(clientToForm(c));
    setModalMode("view");
    setOpenActionIdx(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveClient(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (modalMode === "add" && !form.password.trim()) e.password = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("appId", appId);
    const fields = ["name", "company", "websiteUrl", "email", "mobile", "gstNumber", "panNumber", "address", "city", "state", "pincode", "country"];
    fields.forEach((k) => fd.append(k, form[k] || ""));
    if (form.password.trim()) fd.append("password", form.password);
    if (form.businessLogo) fd.append("businessLogo", form.businessLogo);
    return fd;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitLoading(true);
    try {
      const url = modalMode === "edit"
        ? `${API_BASE_URL}/api/appclient/${activeClient._id}`
        : `${API_BASE_URL}/api/appclient`;
      const res = await apiFetch(url, { method: modalMode === "edit" ? "PUT" : "POST", body: buildFormData() });
      const json = await res.json();
      if (json.success) {
        closeModal();
        fetchClients();
      } else {
        alert(json.message || "Save failed");
      }
    } catch {
      alert("Save failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/appclient/${deleteClient._id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteClient(null);
        fetchClients();
      } else {
        alert(json.message || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>AppClients</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Manage clients under your app</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6d28d9, #5b21b6)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(109,40,217,0.25)" }}
        >
          <FaPlus size={11} /> Add AppClient
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", background: "#faf5ff", borderRadius: 10, border: "1px dashed #ddd6fe" }}>
          No AppClients yet. Click &quot;Add AppClient&quot; to create one.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#f5f3ff", borderBottom: "1px solid #ede9fe" }}>
                {["#", "Logo", "Name", "Company", "Email", "Mobile", "City", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b7280" }}>{i + 1}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {c.logoUrl || c.logoPreview ? (
                      <img src={c.logoUrl || c.logoPreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontSize: 14, fontWeight: 700 }}>
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{c.company || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{c.email}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{c.mobile || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{c.city || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.status === "inactive" ? "#fef2f2" : "#ecfdf5", color: c.status === "inactive" ? "#ef4444" : "#059669" }}>
                      {c.status || "active"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div ref={(el) => { actionRefs.current[i] = el; }} style={{ position: "relative", display: "inline-block" }}>
                      <button
                        type="button"
                        onClick={() => setOpenActionIdx(openActionIdx === i ? null : i)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e5e7eb", background: openActionIdx === i ? "#f5f3ff" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6d28d9" }}
                      >
                        <FaCog size={13} />
                      </button>
                      {openActionIdx === i && (
                        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 9999, background: "#fff", borderRadius: 10, border: "1.5px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 140, overflow: "hidden" }}>
                          {[
                            { label: "Edit", icon: <FaEdit size={12} />, color: "#6d28d9", action: () => openEdit(c) },
                            { label: "View", icon: <FaEye size={12} />, color: "#0891b2", action: () => openView(c) },
                            { label: "Delete", icon: <FaTrash size={12} />, color: "#ef4444", action: () => { setDeleteClient(c); setOpenActionIdx(null); } },
                          ].map(({ label, icon, color, action }) => (
                            <button key={label} type="button" onClick={action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "none", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", textAlign: "left" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#faf5ff"; e.currentTarget.style.color = color; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#374151"; }}
                            >
                              <span style={{ color }}>{icon}</span> {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalMode && (
        <AppClientFormModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          errors={errors}
          showPass={showPass}
          setShowPass={setShowPass}
          onClose={closeModal}
          onSubmit={handleSubmit}
          loading={submitLoading}
          readOnly={modalMode === "view"}
        />
      )}

      {deleteClient && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(17,24,39,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Delete AppClient?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>This will permanently delete <strong>{deleteClient.name}</strong>.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setDeleteClient(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleteLoading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: deleteLoading ? "not-allowed" : "pointer" }}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function OverviewTab({ user, clientCount }) {
  const userName  = user?.name || user?.businessName || "App";
  const userEmail = user?.email || "";
  const initials  = userName.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase() || "A";

  const stats = [
    {
      label: "Total AppClients",
      value: clientCount,
      sub: "Registered clients",
      icon: <FaUsers size={18} />,
      color: "border-orange-200",
      iconBg: "bg-yellow-50 text-orange-600",
    },
    {
      label: "Active Clients",
      value: clientCount,
      sub: "Currently active",
      icon: <FaCheckCircle size={18} />,
      color: "border-orange-200",
      iconBg: "bg-green-50 text-green-600",
    },
    {
      label: "App Status",
      value: "Active",
      sub: "Platform running",
      icon: <FaShieldAlt size={18} />,
      color: "border-orange-200",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      label: "App",
      value: userName.length > 12 ? userName.slice(0, 12) + "…" : userName,
      sub: userEmail,
      icon: <FaBuilding size={18} />,
      color: "border-orange-200",
      iconBg: "bg-yellow-50 text-orange-600",
    },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden rounded-2xl border ${s.color} bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/40 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 truncate">{s.value}</p>
              </div>
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconBg} ml-3`}>
                {s.icon}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Add a new AppClient",   icon: <FaPlus size={11} />,       color: "text-orange-600 bg-orange-50"  },
              { label: "Manage AppClients",     icon: <FaUsers size={11} />,      color: "text-blue-600 bg-blue-50"      },
              { label: "View Settings",         icon: <FaCog size={11} />,        color: "text-gray-600 bg-gray-100"     },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg ${a.color}`}>{a.icon}</span>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{a.label}</span>
                <FaChevronRight size={10} className="text-gray-300 group-hover:text-gray-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">App Information</h3>
          <div className="space-y-3">
            {[
              { label: "App Name",   value: userName  },
              { label: "Email",      value: userEmail || "—" },
              { label: "App ID",     value: user?._id ? user._id.slice(-8).toUpperCase() : "—" },
              { label: "Plan",       value: user?.plan || "Standard" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-medium">{row.label}</span>
                <span className="text-xs text-gray-700 font-semibold truncate max-w-[160px]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function HelpTab() {
  const faqs = [
    { q: "How do I add a new AppClient?",         a: "Go to the AppClients tab and click the 'Add AppClient' button. Fill in the required details and save." },
    { q: "How do I edit an existing AppClient?",  a: "In the AppClients tab, click the \u2699\ufe0f action button on the client row and select 'Edit'." },
    { q: "Can I delete an AppClient?",            a: "Yes. Click the \u2699\ufe0f action button and select 'Delete'. This action is permanent." },
    { q: "How do I view client details?",         a: "Click the \u2699\ufe0f action button on any client row and select 'View' to see full details." },
    { q: "How do I change my password?",          a: "Go to the Settings tab and use the Account section to update your password." },
    { q: "What is the AppClient ID used for?",    a: "The AppClient ID is a unique identifier used for API integrations and referencing clients." },
  ];
  const [openIdx, setOpenIdx] = React.useState(null);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 p-6 mb-6 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <FaQuestionCircle size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Help & Support</h2>
            <p className="text-white/80 text-sm mt-0.5">Frequently asked questions and guides</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-orange-50/50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 pr-4">{faq.q}</span>
                <span className={`shrink-0 transition-transform duration-200 ${openIdx === i ? "rotate-90" : ""}`}>
                  <FaChevronRight size={12} className="text-orange-400" />
                </span>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed bg-orange-50 rounded-xl p-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <FaEnvelope size={14} className="text-orange-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Email Support</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">For any queries, reach out to our support team.</p>
          <a href="mailto:support@yovoai.com" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700">
            support@yovoai.com <FaChevronRight size={10} />
          </a>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FaGlobe size={14} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Documentation</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Read our complete docs and API references.</p>
          <a href="https://yovoai.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
            yovoai.com <FaChevronRight size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ user, onLogout }) {
  const [notif, setNotif]           = React.useState(true);
  const [emailAlert, setEmailAlert] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const userName  = user?.name || user?.businessName || "App";
  const userEmail = user?.email || "";
  const initials  = userName.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase() || "A";

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 p-6 mb-6 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <FaCog size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Settings</h2>
            <p className="text-white/80 text-sm mt-0.5">Manage your account preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <FaUserCircle size={13} className="text-orange-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Account Profile</h3>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-100 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-200 text-orange-900 flex items-center justify-center font-bold text-lg shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Display Name", value: userName },
              { label: "Email",        value: userEmail || "\u2014" },
              { label: "Role",         value: user?.role || "App Admin" },
              { label: "App ID",       value: user?._id ? user._id.slice(-8).toUpperCase() : "\u2014" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{row.label}</span>
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <FaBell size={13} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Push Notifications", sub: "Get notified about new clients", val: notif,      set: setNotif      },
              { label: "Email Alerts",        sub: "Receive email updates",          val: emailAlert, set: setEmailAlert },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                </div>
                <button onClick={() => item.set(!item.val)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${item.val ? "bg-orange-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${item.val ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center">
              <FaPalette size={13} className="text-yellow-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Appearance</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Choose your theme preference</p>
          <div className="flex gap-3">
            {["Light", "Dark", "System"].map((t) => (
              <button key={t} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${t === "Light" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-500 hover:border-orange-200"}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <FaShieldAlt size={13} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Account Actions</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Manage your session and account security.</p>
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
            <FaSignOutAlt size={13} /> Sign Out
          </button>
          {showLogoutConfirm && createPortal(
            <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <FaSignOutAlt size={20} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-2">Sign Out?</h3>
                <p className="text-sm text-gray-500 text-center mb-5">You will be logged out of your account.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Sign Out</button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppClientDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen]           = React.useState(true);
  const [activeTab, setActiveTab]               = React.useState("AppClients");
  const [clientCount, setClientCount]           = React.useState(0);
  const [isMobile, setIsMobile]                 = React.useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const getToken = () =>
    localStorage.getItem("appClientToken") ||
    localStorage.getItem("admintoken")     ||
    localStorage.getItem("superadmintoken") || "";

  const apiFetch = (url, options = {}) => {
    const token = getToken();
    return fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  };

  const appId = user?.appId || user?._id;

  useEffect(() => {
    if (!appId) return;
    apiFetch(`${API_BASE_URL}/api/appclient?appId=${appId}`)
      .then(r => r.json())
      .then(json => { if (json.success) setClientCount((json.data || []).length); })
      .catch(() => {});
  }, [appId]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) setSidebarOpen(false);
  };

  const navItems = [
    { name: "Overview",   icon: <FaChartBar /> },
    { name: "UGC Prompter", icon: <FaRobot /> },
    { name: "AppClients", icon: <FaUsers />    },
  ];

  const bottomNavItems = [
    { name: "Help",     icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />           },
  ];

  const userName     = user?.name || user?.businessName || "App";
  const userEmail    = user?.email || "";
  const userInitials = userName.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase() || "A";

  const NavBtn = ({ item }) => (
    <button
      type="button"
      onClick={() => handleTabClick(item.name)}
      title={!sidebarOpen && !isMobile ? item.name : undefined}
      className={`flex items-center w-full py-3 px-3 text-left transition-colors duration-200 ${
        activeTab === item.name
          ? "bg-gradient-to-r from-yellow-50 to-orange-100 text-orange-900 border-r-4 border-orange-600"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className={`mr-2 text-lg ${activeTab === item.name ? "text-orange-700" : "text-gray-700"}`}>{item.icon}</span>
      {(sidebarOpen || isMobile) && (
        <span className={`text-sm font-medium ${activeTab === item.name ? "text-orange-900" : "text-gray-700"}`}>{item.name}</span>
      )}
    </button>
  );

  return (
    <div className="flex flex-row w-full h-dvh overflow-hidden bg-gray-50 text-gray-900">

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-[45]" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-dvh bg-white shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isMobile ? (sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full w-64") : (sidebarOpen ? "w-64" : "w-20")}`}>
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-orange-600 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3 overflow-hidden shrink-0">
              <img src="/New logo yovo.jpeg" alt="YovoAI" className="w-full h-full object-cover" />
            </div>
            {(sidebarOpen || isMobile) && <span className="text-white font-semibold text-xl">YovoAI</span>}
          </div>
          {!isMobile && (
            <button className="text-white hover:text-gray-200 focus:outline-none" onClick={() => setSidebarOpen(s => !s)}>
              <svg className={`w-5 h-5 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* User card */}
        {(sidebarOpen || isMobile) && (
          <div className="flex-shrink-0 px-3 py-3 border-b border-gray-100">
            <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 p-3 shadow-sm border border-orange-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-900 flex items-center justify-center font-semibold shrink-0 text-sm">{userInitials}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{userName}</div>
                {userEmail && <div className="text-xs text-gray-600 truncate">{userEmail}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Main nav */}
        <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: "none" }}>
          {navItems.map(item => <NavBtn key={item.name} item={item} />)}
        </div>

        {/* Bottom nav — Help & Settings */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white">
          {bottomNavItems.map(item => <NavBtn key={item.name} item={item} />)}
        </div>
      </div>

      {/* Spacer */}
      {!isMobile && <div aria-hidden className="shrink-0 h-dvh transition-all duration-300 ease-in-out" style={{ width: sidebarOpen ? 256 : 80 }} />}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden transition-all duration-300 ease-in-out">

        {/* Mobile topbar */}
        {isMobile && (
          <div className="shrink-0 flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm z-40">
            <button className="p-2 bg-gray-900 text-white rounded-md hover:bg-black" onClick={() => setSidebarOpen(true)}><FaBars /></button>
            <div className="flex items-center gap-2">
              <img src="/New logo yovo.jpeg" alt="YovoAI" className="h-6 w-6 rounded object-cover" />
              <span className="font-bold tracking-tight text-gray-900">YovoAI</span>
            </div>
            <div className="relative">
              <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-orange-50">
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">{userInitials}</div>
              </button>
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                    <button onClick={() => { setShowUserDropdown(false); onLogout(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><FaSignOutAlt className="text-red-500" /> Logout</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Desktop topbar */}
        {!isMobile && (
          <div className="shrink-0 flex w-full items-center justify-between px-5 py-3 min-h-[56px] bg-white border-b border-gray-200 shadow-sm z-40">
            <h1 className="text-lg font-bold text-gray-900">{activeTab}</h1>
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all">
              <FaSignOutAlt size={13} /> Logout
            </button>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          {activeTab === "Overview"   && <OverviewTab   user={user} clientCount={clientCount} />}
          {activeTab === "UGC Prompter" && <ClientUGCPrompterPage />}
          {activeTab === "AppClients" && <AppClientsTab user={user} getToken={getToken} apiFetch={apiFetch} />}
          {activeTab === "Help"       && <HelpTab />}
          {activeTab === "Settings"   && <SettingsTab user={user} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  );
}
