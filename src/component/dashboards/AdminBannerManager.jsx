import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Image, Plus, Pencil, Trash2, Eye, EyeOff, Upload,
  CheckCircle, AlertCircle, X, Settings,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const inputCls = "w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white";

// ── Banner Form Modal ─────────────────────────────────────────────────────────
const BannerModal = ({ banner, clientId, token, onClose, onSaved }) => {
  const [form, setForm]       = useState({
    title:       banner?.title       || "",
    description: banner?.description || "",
    order:       banner?.order       ?? 0,
  });
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(banner?.imageUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("clientId",    clientId);
      fd.append("title",       form.title.trim());
      fd.append("description", form.description);
      fd.append("order",       form.order);
      if (file) fd.append("image", file);

      const headers = { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` };
      const res = banner?._id
        ? await axios.patch(`${API_BASE_URL}/api/banners/${banner._id}`, fd, { headers })
        : await axios.post(`${API_BASE_URL}/api/banners`, fd, { headers });
      if (res.data.success) onSaved(res.data.banner);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">{banner ? "Edit Banner" : "New Banner"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Banner Image</label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-orange-400 transition-all">
              {preview ? (
                <div className="relative h-28">
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                  <Image className="w-6 h-6" />
                  <p className="text-xs">Click to upload image</p>
                  <p className="text-xs text-gray-300">JPG, PNG, WebP — max 20MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Title <span className="text-red-400">*</span></label>
            <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Banner title" />
          </div>

          {/* Description + Order row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
              <input className={inputCls} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description (optional)" />
            </div>
            <div className="w-20">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Order</label>
              <input type="number" className={inputCls} value={form.order} onChange={e => set("order", Number(e.target.value))} placeholder="0" min={0} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
            {loading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><CheckCircle className="w-3.5 h-3.5" /> Save Banner</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Settings Dropdown ─────────────────────────────────────────────────────────
const CardMenu = ({ banner, onEdit, onDelete, deleting }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="p-1.5 hover:bg-white/80 rounded-lg transition-all bg-white/60 backdrop-blur-sm">
        <Settings className="w-3.5 h-3.5 text-gray-600" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 z-10 min-w-[110px] overflow-hidden">
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-all">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }} disabled={deleting}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
            {deleting
              ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminBannerManager = () => {
  const [banners, setBanners]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const token    = localStorage.getItem("admintoken") || localStorage.getItem("adminToken") || localStorage.getItem("clienttoken") || localStorage.getItem("token");
  const clientId = (() => {
    try {
      const adminData  = JSON.parse(localStorage.getItem("adminData")  || "{}");
      const clientData = JSON.parse(localStorage.getItem("clientData") || "{}");
      return adminData._id || clientData.clientId || clientData._id || "admin";
    } catch { return "admin"; }
  })();

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3000); };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setBanners(res.data.banners || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleSaved = (banner) => {
    setBanners(prev => {
      const exists = prev.find(b => b._id === banner._id);
      return exists ? prev.map(b => b._id === banner._id ? banner : b) : [banner, ...prev];
    });
    setModal(null);
    showToast("success", "Banner saved successfully!");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_BASE_URL}/api/banners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setBanners(prev => prev.filter(b => b._id !== id));
      showToast("success", "Banner deleted");
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (banner) => {
    try {
      const fd = new FormData();
      fd.append("isActive", !banner.isActive);
      const res = await axios.patch(`${API_BASE_URL}/api/banners/${banner._id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setBanners(prev => prev.map(b => b._id === banner._id ? res.data.banner : b));
      }
    } catch { showToast("error", "Update failed"); }
  };

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Home Banners</h2>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{banners.length}</span>
        </div>
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Add Banner
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-xs text-blue-700">
        Banners are displayed as a slider on the Android app home page. Active banners appear in order.
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-28 bg-gray-200" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-2.5 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <Image className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No banners yet. Add your first banner!</p>
          <button onClick={() => setModal("new")}
            className="mt-4 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all">
            Add Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {banners.map(b => (
            <div key={b._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              {/* Image */}
              <div className="relative h-28 bg-gray-100">
                {b.imageUrl
                  ? <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Image className="w-8 h-8 text-gray-300" /></div>}

                {/* Top overlay: status toggle + settings */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                  <button onClick={() => toggleActive(b)} title={b.isActive ? "Deactivate" : "Activate"}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all
                      ${b.isActive ? "bg-green-500/90 text-white" : "bg-gray-400/80 text-white"}`}>
                    {b.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {b.isActive ? "Active" : "Off"}
                  </button>
                  <CardMenu
                    banner={b}
                    onEdit={() => setModal(b)}
                    onDelete={() => handleDelete(b._id)}
                    deleting={deleting === b._id}
                  />
                </div>

                {/* Order badge */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                  #{b.order ?? 0}
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-bold text-gray-800 truncate">{b.title}</p>
                {b.description && <p className="text-xs text-gray-400 truncate mt-0.5">{b.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <BannerModal
          banner={modal === "new" ? null : modal}
          clientId={clientId}
          token={token}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminBannerManager;
