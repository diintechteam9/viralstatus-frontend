import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FaPlus, FaTimes, FaBuilding, FaGlobe, FaIdCard, FaAddressCard,
  FaImage, FaUser, FaEnvelope, FaMobileAlt, FaMapMarkerAlt,
  FaHashtag, FaLock, FaEye, FaEyeSlash, FaHome, FaMobile,
} from 'react-icons/fa';
import { MdApps } from 'react-icons/md';

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

export default function AppsTab() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (!form.app.trim()) e.app = 'App name is required';
    if (!form.password.trim()) e.password = 'Password is required';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    alert('App added successfully!');
    handleClose();
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24 }}>
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

      {/* Empty State */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <MdApps style={{ color: '#7c3aed', fontSize: 28 }} />
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>No apps added yet.</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Click "Add New App" to get started.</p>
      </div>

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

                    {/* App — full width */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <InputField icon={<MdApps />} label="App" required error={errors.app}>
                        <TextInput icon value={form.app} placeholder="App name or bundle ID (e.g. com.example.app)"
                          onChange={e => set('app', e.target.value)} />
                      </InputField>
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
                  <button type="button" onClick={handleSubmit}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
                      color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(109,40,217,0.3)',
                    }}>
                    Add App
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
