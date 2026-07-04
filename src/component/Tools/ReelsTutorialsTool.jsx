import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FaBook, FaPlus, FaTrash, FaVideo, FaTimes, FaEdit,
  FaArrowLeft, FaPlay, FaUpload, FaCheckCircle,
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

// ── Auth ──────────────────────────────────────────────────────────────────────
const getToken = () =>
  sessionStorage.getItem('clienttoken') ||
  localStorage.getItem('clienttoken')   ||
  sessionStorage.getItem('admintoken')  ||
  localStorage.getItem('admintoken');

const getClientId = () => {
  try {
    const d = JSON.parse(localStorage.getItem('clientData') || sessionStorage.getItem('clientData') || '{}');
    if (d._id) return d._id;
    if (d.id)  return d.id;
  } catch {}
  const token = getToken();
  if (!token) return '';
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    return p.id || p.clientObjectId || '';
  } catch { return ''; }
};

const authH = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY = { title: '', description: '', videoFile: null };

// ── Tutorial Card ─────────────────────────────────────────────────────────────
function TutorialCard({ t, onDelete, onEdit }) {
  const [playing, setPlaying] = useState(false);
  const vidRef = useRef(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Video / Thumbnail */}
      <div className="relative bg-gray-900 aspect-video">
        {t.videoUrl ? (
          <>
            <video
              ref={vidRef}
              src={t.videoUrl}
              className="w-full h-full object-cover"
              controls={playing}
              onEnded={() => setPlaying(false)}
            />
            {!playing && (
              <button
                onClick={() => { setPlaying(true); vidRef.current?.play(); }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <FaPlay className="text-gray-900 ml-1" size={16} />
                </div>
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <FaVideo size={28} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{t.title}</p>
        {t.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{t.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(t)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Edit"
          >
            <FaEdit size={12} />
          </button>
          <button
            onClick={() => onDelete(t._id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            title="Delete"
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Centered Modal ────────────────────────────────────────────────────────────
function TutorialFormDrawer({ editItem, onClose, onSaved, clientId }) {
  const [form,     setForm]    = useState({ title: editItem?.title || '', description: editItem?.description || '' });
  const [videoFile,setVideoFile]= useState(null);
  const [preview,  setPreview] = useState(editItem?.videoUrl || '');
  const [saving,   setSaving]  = useState(false);
  const [msg,      setMsg]     = useState('');
  const [progress, setProgress]= useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setVideoFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setMsg('Title is required'); return; }
    setSaving(true); setMsg(''); setProgress(0);

    const fd = new FormData();
    fd.append('clientId', clientId);
    fd.append('title', form.title.trim());
    fd.append('description', form.description);
    if (videoFile) fd.append('video', videoFile);

    try {
      const url    = editItem?._id
        ? `${API_BASE_URL}/api/reels-tutorials/${editItem._id}`
        : `${API_BASE_URL}/api/reels-tutorials`;
      const method = editItem?._id ? 'PATCH' : 'POST';

      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText);
        if (data.success) { onSaved(); onClose(); }
        else { setMsg(data.message || 'Save failed'); setSaving(false); }
      };
      xhr.onerror = () => { setMsg('Network error'); setSaving(false); };
      xhr.send(fd);
    } catch (err) {
      setMsg(err.message || 'Failed'); setSaving(false);
    }
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder:text-gray-400';
  const lbl = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: '480px', maxHeight: 'calc(100vh - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <FaBook className="text-orange-500" size={14} />
            </div>
            <span className="font-bold text-gray-900 text-base">
              {editItem ? 'Edit Tutorial' : 'New Tutorial'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <label className={lbl}>Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. How to upload a Reel to Instagram"
              className={inp}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={lbl}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of what this tutorial covers…"
              className={`${inp} resize-none leading-relaxed`}
            />
          </div>

          {/* Video */}
          <div>
            <label className={lbl}>Video</label>
            <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />

            {preview ? (
              <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                <video src={preview} controls className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setPreview(editItem?.videoUrl || ''); fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition"
                >
                  <FaTimes size={11} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50 rounded-xl py-7 flex flex-col items-center gap-2 text-gray-400 hover:text-orange-500 transition"
              >
                <FaUpload size={20} />
                <span className="text-sm font-semibold">Click to upload video</span>
                <span className="text-xs text-gray-400">MP4, MOV, AVI — max 500MB</span>
              </button>
            )}

            {videoFile && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <FaVideo size={10} className="text-orange-400" /> {videoFile.name}
              </p>
            )}
          </div>

          {/* Progress */}
          {saving && progress > 0 && progress < 100 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error */}
          {msg && (
            <p className="text-sm px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">{msg}</p>
          )}
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="flex-2 flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition disabled:opacity-60"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {progress > 0 ? `${progress}%` : 'Saving…'}</>
              : <><FaCheckCircle size={13} /> {editItem ? 'Update Tutorial' : 'Save Tutorial'}</>
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReelsTutorialsTool({ onBack }) {
  const clientId = getClientId();
  const [tutorials,  setTutorials]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem,   setEditItem]   = useState(null);

  const fetchList = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/reels-tutorials?clientId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (data.success) setTutorials(data.tutorials || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tutorial?')) return;
    await fetch(`${API_BASE_URL}/api/reels-tutorials/${id}`, {
      method: 'DELETE',
      headers: authH(),
    });
    fetchList();
  };

  const openCreate = () => { setEditItem(null); setDrawerOpen(true); };
  const openEdit   = (t)  => { setEditItem(t);   setDrawerOpen(true); };
  const closeDrawer= ()   => setDrawerOpen(false);

  return (
    <div className="w-full min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6">

      {/* Drawer */}
      {drawerOpen && (
        <TutorialFormDrawer
          editItem={editItem}
          clientId={clientId}
          onClose={closeDrawer}
          onSaved={fetchList}
        />
      )}

      <div className="max-w-5xl mx-auto">

        {/* Back */}
        {onBack && (
          <button type="button" onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition font-medium">
            <FaArrowLeft size={12} /> Back to Tools
          </button>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <FaBook className="text-orange-500" size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reels Tutorials</h1>
              <p className="text-xs text-gray-500 mt-0.5">User guides — visible to creators in task details</p>
            </div>
          </div>

          {/* Upload button */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold shadow-sm hover:bg-orange-600 transition"
          >
            <FaUpload size={13} /> Upload Reel Tutorial
          </button>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <span className="text-lg font-bold text-orange-500">{tutorials.length}</span>
              <span className="text-xs text-gray-500 font-medium">Total Tutorials</span>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <span className="text-lg font-bold text-green-500">{tutorials.filter(t => t.videoUrl).length}</span>
              <span className="text-xs text-gray-500 font-medium">With Video</span>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : tutorials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
              <FaBook className="text-orange-300" size={28} />
            </div>
            <p className="font-bold text-gray-700 text-base mb-1">No tutorials yet</p>
            <p className="text-sm text-gray-400 mb-5">Upload your first guide for creators</p>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition">
              <FaUpload size={13} /> Upload Tutorial
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map(t => (
              <TutorialCard
                key={t._id}
                t={t}
                onDelete={handleDelete}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
