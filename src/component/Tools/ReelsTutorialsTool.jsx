import React, { useCallback, useEffect, useState } from 'react';
import { FaBook, FaPlus, FaTrash, FaVideo } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import { CAMPAIGN_TASK_TYPES } from '../../constants/campaignTaskTypes';

const getClientId = () =>
  localStorage.getItem('clientId') ||
  sessionStorage.getItem('clientId') ||
  JSON.parse(localStorage.getItem('clientData') || '{}').clientId ||
  '';

const EMPTY = { title: '', category: 'reels', description: '', videoUrl: '', stepsText: '' };

export default function ReelsTutorialsTool({ onBack }) {
  const clientId = getClientId();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchList = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reels-tutorials?clientId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (data.success) setTutorials(data.tutorials || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const steps = form.stepsText.split('\n').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE_URL}/api/reels-tutorials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: form.title.trim(),
          category: form.category,
          description: form.description,
          videoUrl: form.videoUrl,
          steps,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Save failed');
      setForm(EMPTY);
      setMsg('Tutorial saved — users will see it in task details.');
      fetchList();
    } catch (err) {
      setMsg(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tutorial?')) return;
    await fetch(`${API_BASE_URL}/api/reels-tutorials/${id}`, { method: 'DELETE' });
    fetchList();
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto w-full">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-indigo-700 text-sm hover:bg-indigo-50">
            ← Back to Tools
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FaBook size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reels & Task Tutorials</h1>
            <p className="text-sm text-gray-500">Create guides for users — Reels, UGC, Post, Reviews</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <FaPlus size={12} /> New Tutorial
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Title</label>
              <input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="How to upload a Reel" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Category</label>
              <select className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CAMPAIGN_TASK_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                ))}
                <option value="general">📖 General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Video URL (optional)</label>
              <input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <textarea rows={2} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Steps (one per line)</label>
              <textarea rows={4} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono text-xs resize-none" value={form.stepsText} onChange={(e) => setForm((p) => ({ ...p, stepsText: e.target.value }))} placeholder={'Download the reel\nUpload to Instagram\nPaste link here'} />
            </div>
          </div>
          <button type="submit" disabled={saving || !clientId} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Tutorial'}
          </button>
          {msg && <p className="text-sm text-gray-600">{msg}</p>}
        </form>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-gray-800">Your Tutorials ({tutorials.length})</div>
          {loading ? (
            <p className="p-8 text-center text-gray-400 text-sm">Loading…</p>
          ) : tutorials.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">No tutorials yet. Add your first guide above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tutorials.map((t) => (
                <li key={t._id} className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{t.category?.replace('_', ' ')}</p>
                    {t.videoUrl && (
                      <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-1">
                        <FaVideo size={10} /> Video link
                      </a>
                    )}
                  </div>
                  <button type="button" onClick={() => handleDelete(t._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                    <FaTrash size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
