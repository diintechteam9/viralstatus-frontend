import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaPlus, FaTimes, FaBuilding, FaGlobe, FaIdCard, FaAddressCard,
  FaImage, FaUser, FaEnvelope, FaMobileAlt, FaMapMarkerAlt,
  FaHashtag, FaLock, FaEye, FaEyeSlash, FaHome, FaChevronDown, FaCheck,
  FaCog, FaEdit, FaTrash,
} from 'react-icons/fa';
import { MdApps } from 'react-icons/md';
import { API_BASE_URL } from '../../config';

const EMPTY_FORM = {
  businessName: '', websiteUrl: '', gstNumber: '', panNumber: '',
  businessLogo: null, businessLogoPreview: null,
  fullName: '', email: '', mobile: '', city: '', address: '', pincode: '',
  app: '', password: '', confirmPassword: '',
};

function InputField({ icon, label, required, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#7c3aed' }}>*</span>}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#a78bfa', fontSize: 13, pointerEvents: 'none', zIndex: 1,
          }}>
            {icon}
          </span>
        )}
        {children}
      </div>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasIcon = true, extraRight = false) => ({
  width: '100%',
  paddingLeft: hasIcon ? 36 : 12,
  paddingRight: extraRight ? 40 : 12,
  paddingTop: 10,
  paddingBottom: 10,
  fontSize: 13,
  border: '1.5px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  background: '#fff',
  color: '#111827',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

function TextInput({ icon, value, onChange, placeholder, type = 'text', autoComplete, extraRight }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      style={inputStyle(!!icon, extraRight)}
      onFocus={e => (e.target.style.borderColor = '#7c3aed')}
      onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
    />
  );
}

function SectionHeading({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6d28d9', fontSize: 12, flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#4c1d95', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: '#ede9fe', marginLeft: 4 }} />
    </div>
  );
}

// ── App Dropdown Component ──
function AppDropdown({ apps, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = apps.find(a => a.name === value);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
          fontSize: 13, border: `1.5px solid ${error ? '#ef4444' : open ? '#7c3aed' : '#e5e7eb'}`,
          borderRadius: 8, background: '#fff', color: value ? '#111827' : '#9ca3af',
          cursor: 'pointer', boxSizing: 'border-box', textAlign: 'left',
        }}
      >
        <span style={{ position: 'absolute', left: 12, color: '#a78bfa', fontSize: 13, pointerEvents: 'none' }}>
          <MdApps />
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : apps.length === 0 ? 'No apps yet — create one first' : 'Select an app...'}
        </span>
        <FaChevronDown size={11} style={{ color: '#9ca3af', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: '#fff', borderRadius: 10, border: '1.5px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
        }}>
          {apps.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
              No apps created yet
            </div>
          ) : (
            apps.map((app) => (
              <button
                key={app.name}
                type="button"
                onClick={() => { onChange(app.name); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', border: 'none', background: value === app.name ? '#f5f3ff' : '#fff',
                  cursor: 'pointer', fontSize: 13, color: '#111827', textAlign: 'left',
                  borderBottom: '1px solid #f9fafb',
                }}
                onMouseEnter={e => { if (value !== app.name) e.currentTarget.style.background = '#faf5ff'; }}
                onMouseLeave={e => { if (value !== app.name) e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {app.logoPreview ? (
                    <img src={app.logoPreview} alt={app.name}
                      style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MdApps style={{ color: '#7c3aed', fontSize: 13 }} />
                    </div>
                  )}
                  <span>{app.name}</span>
                </div>
                {value === app.name && <FaCheck size={11} style={{ color: '#7c3aed', flexShrink: 0 }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AppsTab() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});

  // Action dropdown
  const [openActionIdx, setOpenActionIdx] = useState(null);
  const actionRefs = useRef({});

  // Edit modal
  const [editApp, setEditApp] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // View modal
  const [viewApp, setViewApp] = useState(null);

  // Delete modal
  const [deleteApp, setDeleteApp] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const getToken = () => localStorage.getItem('admintoken') || localStorage.getItem('superadmintoken') || '';

  const apiFetch = (url, options = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, ...(options.headers || {}) },
    });
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/api/apps`);
      const json = await res.json();
      if (json.success) setApps(json.data);
    } catch (err) {
      console.error('[fetchApps]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (openActionIdx !== null) {
        const ref = actionRefs.current[openActionIdx];
        if (ref && !ref.contains(e.target)) setOpenActionIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openActionIdx]);

  const handleEditOpen = (app) => {
    setEditApp(app);
    setEditForm({
      businessName: app.businessName || '',
      websiteUrl: app.websiteUrl || '',
      gstNumber: app.gstNumber || '',
      panNumber: app.panNumber || '',
      fullName: app.fullName || '',
      email: app.email || '',
      mobile: app.mobile || '',
      city: app.city || '',
      address: app.address || '',
      pincode: app.pincode || '',
    });
    setEditErrors({});
    setOpenActionIdx(null);
  };

  const handleEditSave = async () => {
    const e = {};
    if (!editForm.businessName?.trim()) e.businessName = 'Required';
    if (!editForm.email?.trim()) e.email = 'Required';
    if (!editForm.mobile?.trim()) e.mobile = 'Required';
    if (Object.keys(e).length) { setEditErrors(e); return; }
    setEditLoading(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/api/apps/${editApp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) { setEditApp(null); fetchApps(); }
      else alert(json.message || 'Update failed');
    } catch (err) {
      alert('Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/api/apps/${deleteApp._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setDeleteApp(null); fetchApps(); }
      else alert(json.message || 'Delete failed');
    } catch (err) {
      alert('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('businessLogo', file);
    const reader = new FileReader();
    reader.onload = (ev) => set('businessLogoPreview', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setShowPass(false);
    setShowConfirmPass(false);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.businessName.trim()) e.businessName = 'Business Name is required';
    if (!form.fullName.trim()) e.fullName = 'Full Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile Number is required';
    if (!form.password.trim()) e.password = 'Password is required';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      const fields = ['businessName','websiteUrl','gstNumber','panNumber','fullName','email','mobile','city','address','pincode','password','confirmPassword'];
      fields.forEach(k => formData.append(k, form[k] || ''));
      if (form.businessLogo) formData.append('businessLogo', form.businessLogo);
      const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/api/apps`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) { handleClose(); fetchApps(); }
      else alert(json.message || 'Failed to create app');
    } catch (err) {
      alert('Failed to create app');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogin = async (app) => {
    const newTab = window.open('about:blank', '_blank');

    try {
      const adminToken = getToken();
      if (!adminToken) {
        if (newTab && !newTab.closed) newTab.close();
        alert('Admin session expired. Please login again.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/apps/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ appId: app._id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to open app dashboard');
      }

      const token = json.data.token;
      const rawApp = json.data.app || json.data;
      const appData = {
        role: 'appclient',
        name: rawApp.businessName || rawApp.name || '',
        email: rawApp.email || '',
        businessName: rawApp.businessName || rawApp.name || '',
        _id: String(rawApp._id || rawApp.appId || ''),
        appId: String(rawApp._id || rawApp.appId || ''),
        logoUrl: rawApp.logoUrl || null,
      };
      const dashboardPath = `${window.location.origin}/appclient/dashboard`;

      if (!newTab || newTab.closed) {
        localStorage.setItem('appClientToken', token);
        localStorage.setItem('appClientData', JSON.stringify(appData));
        window.location.href = dashboardPath;
        return;
      }

      const html = `
        <html>
          <head><script>
            localStorage.setItem('appClientToken', ${JSON.stringify(token)});
            localStorage.setItem('appClientData', ${JSON.stringify(JSON.stringify(appData))});
            window.location.href = ${JSON.stringify(dashboardPath)};
          <\/script></head>
          <body>Loading...</body>
        </html>
      `;
      newTab.document.write(html);
      newTab.document.close();
    } catch (err) {
      if (newTab && !newTab.closed) newTab.close();
      alert(err.message || 'Failed to open app dashboard');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Apps</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Manage all registered apps</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(109,40,217,0.25)',
          }}
        >
          <FaPlus size={11} /> Add New App
        </button>
      </div>

      {/* Apps Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Loading apps...</p>
        </div>
      ) : apps.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MdApps style={{ color: '#7c3aed', fontSize: 28 }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>No apps added yet.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Click "Add New App" to get started.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f3ff' }}>
                {['#', 'Logo', 'Business Name', 'Email', 'Mobile', 'City', 'Login', 'Actions'].map(col => (
                  <th key={col} style={{
                    padding: '11px 14px', textAlign: 'left', fontWeight: 700,
                    color: '#4c1d95', fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '0.05em', borderBottom: '1.5px solid #ede9fe',
                    whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => (
                <tr key={app._id || i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                >
                  <td style={{ padding: '10px 14px', color: '#9ca3af', fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {app.logoUrl || app.logoPreview ? (
                      <img src={app.logoUrl || app.logoPreview} alt={app.businessName} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MdApps style={{ color: '#7c3aed', fontSize: 16 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{app.businessName}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{app.email}</td>
                  <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{app.mobile}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{app.city || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      type="button"
                      onClick={() => handleLogin(app)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, border: 'none',
                        background: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
                        color: '#fff', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Login
                    </button>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '10px 14px' }}>
                    <div ref={el => actionRefs.current[i] = el} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        onClick={() => setOpenActionIdx(openActionIdx === i ? null : i)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb',
                          background: openActionIdx === i ? '#f5f3ff' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#6d28d9',
                        }}
                      >
                        <FaCog size={13} />
                      </button>
                      {openActionIdx === i && (
                        <div style={{
                          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 9999,
                          background: '#fff', borderRadius: 10, border: '1.5px solid #e5e7eb',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140, overflow: 'hidden',
                        }}>
                          {[
                            { label: 'Edit', icon: <FaEdit size={12} />, color: '#6d28d9', action: () => handleEditOpen(app) },
                            { label: 'View', icon: <FaEye size={12} />, color: '#0891b2', action: () => { setViewApp(app); setOpenActionIdx(null); } },
                            { label: 'Delete', icon: <FaTrash size={12} />, color: '#ef4444', action: () => { setDeleteApp(app); setOpenActionIdx(null); } },
                          ].map(({ label, icon, color, action }) => (
                            <button key={label} type="button" onClick={action}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', border: 'none', background: '#fff',
                                cursor: 'pointer', fontSize: 13, color, textAlign: 'left',
                                borderBottom: label !== 'Delete' ? '1px solid #f3f4f6' : 'none',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                              {icon} {label}
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

      {/* ── Edit Modal ── */}
      {typeof document !== 'undefined' && createPortal(
        editApp !== null && (
          <div role="dialog" aria-modal="true"
            style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15,10,30,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}
            onClick={e => { if (e.target === e.currentTarget) setEditApp(null); }}
          >
            <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'linear-gradient(135deg, #5b21b6, #4c1d95)', borderRadius: '14px 14px 0 0', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaEdit style={{ color: '#fff', fontSize: 16 }} />
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>Edit App</p>
                </div>
                <button type="button" onClick={() => setEditApp(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <FaTimes size={14} />
                </button>
              </div>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                  {[
                    { key: 'businessName', label: 'Business Name', required: true },
                    { key: 'websiteUrl', label: 'Website URL' },
                    { key: 'gstNumber', label: 'GST Number' },
                    { key: 'panNumber', label: 'PAN Number' },
                    { key: 'fullName', label: 'Full Name' },
                    { key: 'email', label: 'Email', required: true },
                    { key: 'mobile', label: 'Mobile', required: true },
                    { key: 'city', label: 'City' },
                    { key: 'address', label: 'Address' },
                    { key: 'pincode', label: 'Pincode' },
                  ].map(({ key, label, required }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        {label} {required && <span style={{ color: '#7c3aed' }}>*</span>}
                      </label>
                      <input
                        value={editForm[key] || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{ ...inputStyle(false), borderColor: editErrors[key] ? '#ef4444' : '#e5e7eb' }}
                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                        onBlur={e => e.target.style.borderColor = editErrors[key] ? '#ef4444' : '#e5e7eb'}
                      />
                      {editErrors[key] && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{editErrors[key]}</p>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                  <button type="button" onClick={() => setEditApp(null)}
                    style={{ padding: '10px 22px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleEditSave} disabled={editLoading}
                    style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6d28d9, #5b21b6)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: editLoading ? 0.7 : 1 }}>
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ), document.body
      )}

      {/* ── View Modal ── */}
      {typeof document !== 'undefined' && createPortal(
        viewApp && (
          <div role="dialog" aria-modal="true"
            style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15,10,30,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}
            onClick={e => { if (e.target === e.currentTarget) setViewApp(null); }}
          >
            <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', borderRadius: '14px 14px 0 0', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaEye style={{ color: '#fff', fontSize: 16 }} />
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>View App Details</p>
                </div>
                <button type="button" onClick={() => setViewApp(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <FaTimes size={14} />
                </button>
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                  {viewApp.logoUrl || viewApp.logoPreview ? (
                    <img src={viewApp.logoUrl || viewApp.logoPreview} alt={viewApp.businessName} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MdApps style={{ color: '#7c3aed', fontSize: 24 }} />
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{viewApp.businessName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{viewApp.email}</p>
                    <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: viewApp.status === 'inactive' ? '#fee2e2' : '#dcfce7', color: viewApp.status === 'inactive' ? '#dc2626' : '#16a34a' }}>
                      {viewApp.status || 'active'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                  {[
                    { label: 'Full Name', value: viewApp.fullName },
                    { label: 'Mobile', value: viewApp.mobile },
                    { label: 'City', value: viewApp.city },
                    { label: 'Pincode', value: viewApp.pincode },
                    { label: 'Address', value: viewApp.address },
                    { label: 'Website', value: viewApp.websiteUrl },
                    { label: 'GST Number', value: viewApp.gstNumber },
                    { label: 'PAN Number', value: viewApp.panNumber },
                    { label: 'Last Login', value: viewApp.lastLoginAt ? new Date(viewApp.lastLoginAt).toLocaleString() : null },
                    { label: 'Created At', value: viewApp.createdAt ? new Date(viewApp.createdAt).toLocaleDateString() : null },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#111827', fontWeight: 500 }}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="button" onClick={() => setViewApp(null)}
                    style={{ padding: '10px 24px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ), document.body
      )}

      {/* ── Delete Confirm Modal ── */}
      {typeof document !== 'undefined' && createPortal(
        deleteApp !== null && (
          <div role="dialog" aria-modal="true"
            style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15,10,30,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}
            onClick={e => { if (e.target === e.currentTarget) setDeleteApp(null); }}
          >
            <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderRadius: '14px 14px 0 0', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaTrash style={{ color: '#fff', fontSize: 14 }} />
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>Delete App</p>
                </div>
                <button type="button" onClick={() => setDeleteApp(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <FaTimes size={14} />
                </button>
              </div>
              <div style={{ padding: '28px 28px 24px' }}>
                <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                  Are you sure you want to delete <strong>{deleteApp?.businessName}</strong>? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button type="button" onClick={() => setDeleteApp(null)}
                    style={{ padding: '10px 22px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleDelete} disabled={deleteLoading}
                    style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleteLoading ? 0.7 : 1 }}>
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ), document.body
      )}

      {/* Modal Portal */}
      {typeof document !== 'undefined' && createPortal(
        showModal && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(15,10,30,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, boxSizing: 'border-box', overflowY: 'auto',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <div style={{
              background: '#fff', borderRadius: 14, width: '100%', maxWidth: 680,
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
              margin: 'auto', display: 'flex', flexDirection: 'column',
            }}>

              {/* ── Modal Header ── */}
              <div style={{
                background: 'linear-gradient(135deg, #5b21b6, #4c1d95)',
                borderRadius: '14px 14px 0 0',
                padding: '18px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MdApps style={{ color: '#fff', fontSize: 20 }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>Add New App</p>
                    <p style={{ margin: 0, color: '#c4b5fd', fontSize: 12 }}>Fill in the details below</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* ── Form Body ── */}
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Section 1 — Business Info */}
                <div>
                  <SectionHeading icon={<FaBuilding />} title="Business Information" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

                    <InputField icon={<FaBuilding />} label="Business Name" required error={errors.businessName}>
                      <TextInput icon value={form.businessName} placeholder="e.g. Acme Corp"
                        onChange={e => set('businessName', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaGlobe />} label="Website URL">
                      <TextInput icon value={form.websiteUrl} placeholder="https://example.com" type="url"
                        onChange={e => set('websiteUrl', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaIdCard />} label="GST Number">
                      <TextInput icon value={form.gstNumber} placeholder="22AAAAA0000A1Z5"
                        onChange={e => set('gstNumber', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaAddressCard />} label="PAN Number">
                      <TextInput icon value={form.panNumber} placeholder="AAAAA0000A"
                        onChange={e => set('panNumber', e.target.value)} />
                    </InputField>

                    {/* Logo — full width */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        Business Logo
                      </label>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        border: '1.5px dashed #d8b4fe', borderRadius: 10,
                        padding: '12px 16px', background: '#faf5ff',
                      }}>
                        {form.businessLogoPreview ? (
                          <img src={form.businessLogoPreview} alt="logo preview"
                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: 8, background: '#ede9fe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <FaImage style={{ color: '#a78bfa', fontSize: 18 }} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <input type="file" accept="image/*" onChange={handleLogoChange}
                            style={{ fontSize: 12, color: '#374151', cursor: 'pointer', width: '100%' }} />
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>JPEG, PNG, WebP — max 5MB</p>
                        </div>
                        {form.businessLogoPreview && (
                          <button type="button"
                            onClick={() => { set('businessLogo', null); set('businessLogoPreview', null); }}
                            style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', fontSize: 11, flexShrink: 0 }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6' }} />

                {/* Section 2 — Contact Info */}
                <div>
                  <SectionHeading icon={<FaUser />} title="Contact Information" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

                    <InputField icon={<FaUser />} label="Full Name" required error={errors.fullName}>
                      <TextInput icon value={form.fullName} placeholder="Enter full name"
                        onChange={e => set('fullName', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaEnvelope />} label="Email Address" required error={errors.email}>
                      <TextInput icon value={form.email} placeholder="app@example.com" type="email" autoComplete="new-password"
                        onChange={e => set('email', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaMobileAlt />} label="Mobile Number" required error={errors.mobile}>
                      <TextInput icon value={form.mobile} placeholder="+91 98765 43210" type="tel"
                        onChange={e => set('mobile', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaMapMarkerAlt />} label="City">
                      <TextInput icon value={form.city} placeholder="e.g. Mumbai"
                        onChange={e => set('city', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaHome />} label="Address">
                      <TextInput icon value={form.address} placeholder="Street / Area / Locality"
                        onChange={e => set('address', e.target.value)} />
                    </InputField>

                    <InputField icon={<FaHashtag />} label="Pincode">
                      <TextInput icon value={form.pincode} placeholder="e.g. 110001"
                        onChange={e => set('pincode', e.target.value)} />
                    </InputField>

                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6' }} />

                {/* Section 3 — App & Credentials */}
                <div>
                  <SectionHeading icon={<MdApps />} title="App & Credentials" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

                    {/* App Dropdown — full width */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        App <span style={{ color: '#7c3aed' }}>*</span>
                      </label>
                      <AppDropdown
                        apps={apps}
                        value={form.app}
                        onChange={val => set('app', val)}
                        error={errors.app}
                      />
                      {errors.app && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.app}</p>}
                      {apps.length === 0 && (
                        <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                          No apps available yet. Submit this form to create your first app — it will appear here in future forms.
                        </p>
                      )}
                    </div>

                    <InputField icon={<FaLock />} label="Password" required error={errors.password}>
                      <TextInput icon value={form.password} placeholder="Min 8 characters"
                        type={showPass ? 'text' : 'password'} autoComplete="new-password"
                        extraRight onChange={e => set('password', e.target.value)} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                        }}>
                        {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      </button>
                    </InputField>

                    <InputField icon={<FaLock />} label="Confirm Password" required error={errors.confirmPassword}>
                      <TextInput icon value={form.confirmPassword} placeholder="Re-enter password"
                        type={showConfirmPass ? 'text' : 'password'} autoComplete="new-password"
                        extraRight onChange={e => set('confirmPassword', e.target.value)} />
                      <button type="button" onClick={() => setShowConfirmPass(p => !p)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                        }}>
                        {showConfirmPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      </button>
                    </InputField>

                  </div>
                </div>

                {/* Required note */}
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                  <span style={{ color: '#7c3aed' }}>*</span> Required fields
                </p>

                {/* ── Footer Buttons ── */}
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', gap: 12,
                  paddingTop: 16, borderTop: '1px solid #f3f4f6',
                }}>
                  <button type="button" onClick={handleClose}
                    style={{
                      padding: '10px 22px', borderRadius: 8,
                      border: '1.5px solid #e5e7eb', background: '#fff',
                      color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitLoading}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: submitLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(109,40,217,0.3)',
                      opacity: submitLoading ? 0.8 : 1,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                    {submitLoading && (
                      <span style={{
                        width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    )}
                    {submitLoading ? 'Adding...' : 'Add App'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
}
