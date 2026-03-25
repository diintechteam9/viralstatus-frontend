import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';

const token = () =>
  sessionStorage.getItem('clienttoken') ||
  localStorage.getItem('clienttoken') ||
  sessionStorage.getItem('usertoken') ||
  localStorage.getItem('usertoken') || '';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcYT      = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>;
const IcClock   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>;
const IcUpload  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v11"/></svg>;
const IcCheck   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const IcX       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IcLink    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const Spinner   = () => <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>;

export default function YouTubePublish({ defaultTitle = '', defaultDescription = '' }) {
  const [open, setOpen]           = useState(false);
  const [connected, setConnected] = useState(false);
  const [channelInfo, setChannelInfo] = useState(null);
  const [checkingConn, setCheckingConn] = useState(false);

  // form fields
  const [title, setTitle]         = useState(defaultTitle);
  const [description, setDesc]    = useState(defaultDescription);
  const [tags, setTags]           = useState('');
  const [privacy, setPrivacy]     = useState('public');
  const [isShort, setIsShort]     = useState(false);
  const [mode, setMode]           = useState('now');       // 'now' | 'schedule'
  const [scheduleAt, setScheduleAt] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  // status
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);  // { success, url, message, error }
  const [scheduled, setScheduled] = useState([]);
  const [showScheduled, setShowScheduled] = useState(false);

  const fileRef = useRef();

  // sync props → state when parent updates
  useEffect(() => { setTitle(defaultTitle); },       [defaultTitle]);
  useEffect(() => { setDesc(defaultDescription); },  [defaultDescription]);

  // check YouTube connection status + fetch channel info
  const checkConnection = async () => {
    setCheckingConn(true);
    try {
      const userId = getUserId();
      const r = await fetch(`${API_BASE_URL}/auth/youtube/profile?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: 'include',
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setConnected(true);
      setChannelInfo({ name: d.name, id: d.id });
    } catch (_) {
      try {
        const r = await fetch(`${API_BASE_URL}/api/youtube/status`, {
          headers: { Authorization: `Bearer ${token()}` },
          credentials: 'include',
        });
        const d = await r.json();
        setConnected(!!d.connected);
        if (!d.connected) setChannelInfo(null);
      } catch (_) { setConnected(false); setChannelInfo(null); }
    }
    setCheckingConn(false);
  };

  useEffect(() => { if (open) checkConnection(); }, [open]);

  const getUserId = () => {
    try {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        const id = parsed.clientId || parsed._id || parsed.id || '';
        if (id) return id;
      }
    } catch (_) {}
    // Fallback: check all common storage keys
    return (
      localStorage.getItem('mongoId') ||
      localStorage.getItem('clientId') ||
      sessionStorage.getItem('mongoId') ||
      ''
    );
  };

  const connectYouTube = () => {
    console.log('[YouTube] Opening OAuth popup...');
    const userId = getUserId();
    const popup = window.open(`${API_BASE_URL}/auth/youtube?userId=${userId}`, '_blank', 'width=600,height=700');
    if (!popup) {
      setResult({ error: 'Popup blocked! Please allow popups for this site and try again.' });
      return;
    }
    // poll for connection after popup
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/youtube/status`, {
          headers: { Authorization: `Bearer ${token()}` },
          credentials: 'include',
        });
        const d = await r.json();
        if (d.connected) {
          setConnected(true);
          setResult(null);
          clearInterval(interval);
          checkConnection();
        }
      } catch (e) {
        console.error('[YouTube] Polling error:', e.message);
      }
    }, 2000);
    setTimeout(() => {
      clearInterval(interval);
      console.warn('[YouTube] OAuth polling timed out after 60s');
    }, 60000);
  };

  const fetchScheduled = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/youtube/scheduled`, {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: 'include',
      });
      if (!r.ok) throw new Error(`Failed to fetch scheduled: ${r.status}`);
      const d = await r.json();
      console.log('[YouTube] Scheduled posts fetched:', d.posts?.length || 0);
      setScheduled(d.posts || []);
    } catch (e) {
      console.error('[YouTube] Fetch scheduled error:', e.message);
      setScheduled([]);
    }
  };

  const deleteScheduled = async (id) => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/youtube/scheduled/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
        credentials: 'include',
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Delete failed: ${r.status}`);
      }
      console.log('[YouTube] Scheduled post deleted:', id);
      fetchScheduled();
    } catch (e) {
      console.error('[YouTube] Delete scheduled error:', e.message);
      setResult({ error: e.message });
    }
  };

  const handleSubmit = async () => {
    if (!videoFile) return setResult({ error: 'Please select a video file' });
    if (!title.trim()) return setResult({ error: 'Title is required' });
    if (mode === 'schedule' && !scheduleAt) return setResult({ error: 'Please select schedule date & time' });
    if (!token()) return setResult({ error: 'You are not logged in. Please login and try again.' });

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
    formData.append('privacy', privacy);
    formData.append('isShort', isShort ? 'true' : 'false');
    if (mode === 'schedule') formData.append('scheduledAt', new Date(scheduleAt).toISOString());

    const endpoint = mode === 'now' ? '/api/youtube/upload' : '/api/youtube/schedule';
    console.log(`[YouTube] ${mode === 'now' ? 'Uploading' : 'Scheduling'} video:`, title);

    try {
      const r = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        credentials: 'include',
        body: formData,
      });
      const d = await r.json();

      if (d.code === 'NOT_CONNECTED') {
        console.warn('[YouTube] Not connected — prompting reconnect');
        setConnected(false);
        setResult({ error: 'YouTube account disconnected. Please reconnect your account.' });
        setLoading(false);
        return;
      }

      if (!r.ok) throw new Error(d.error || 'Upload failed');

      console.log('[YouTube] Success ✅', d);
      setResult({ success: true, url: d.url, channelName: d.channelName, message: d.message || (mode === 'now' ? 'Video uploaded successfully!' : 'Video scheduled successfully!') });
      setVideoFile(null);
      if (fileRef.current) fileRef.current.value = '';
      if (mode === 'schedule') fetchScheduled();
    } catch (e) {
      console.error('[YouTube] Submit error:', e.message);
      setResult({ error: e.message || 'Something went wrong. Please try again.' });
    }
    setLoading(false);
  };

  // ── Collapsed button ──────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition shadow-sm"
      >
        <IcYT /> Publish to YouTube
      </button>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div className="mt-4 rounded-2xl border-2 border-red-100 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-red-600 to-red-500">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <IcYT /> Publish to YouTube
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><IcX /></button>
      </div>

      <div className="p-5 space-y-4">

        {/* Connection status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <p className="font-medium text-gray-700">
                {checkingConn ? 'Checking...' : connected ? 'YouTube Connected' : 'YouTube Not Connected'}
              </p>
              {connected && channelInfo && (
                <p className="text-[11px] text-gray-400">📺 {channelInfo.name} · <span className="font-mono">{channelInfo.id}</span></p>
              )}
            </div>
          </div>
          {!connected && (
            <button
              onClick={connectYouTube}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Connect Account
            </button>
          )}
        </div>

        {connected && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2">
              {['now', 'schedule'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-2 transition ${
                    mode === m ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {m === 'now' ? <><IcUpload /> Publish Now</> : <><IcClock /> Schedule</>}
                </button>
              ))}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Video title..."
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                rows={3}
                placeholder="Video description..."
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition resize-none"
              />
            </div>

            {/* Tags + Privacy + Short row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tags</label>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Privacy</label>
                <select
                  value={privacy}
                  onChange={e => setPrivacy(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-gray-50 transition"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => setIsShort(!isShort)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${isShort ? 'bg-red-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isShort ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">YouTube Short</span>
                </label>
              </div>
            </div>

            {/* Schedule time */}
            {mode === 'schedule' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Schedule Date & Time *</label>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={e => setScheduleAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-gray-50 focus:bg-white transition"
                />
              </div>
            )}

            {/* Video file */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Video File *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-red-300 hover:bg-red-50 transition"
              >
                {videoFile ? (
                  <p className="text-sm font-medium text-gray-700">📹 {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                ) : (
                  <p className="text-sm text-gray-400">Click to select video file (max 256MB)</p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => setVideoFile(e.target.files[0] || null)}
              />
            </div>

            {/* Result */}
            {result && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {result.success ? <IcCheck /> : <IcX />}
                <div className="text-sm">
                  <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success ? result.message : result.error}
                  </p>
                  {result.success && result.channelName && (
                    <p className="text-[11px] text-gray-500 mt-0.5">📺 Uploaded to: <span className="font-semibold">{result.channelName}</span></p>
                  )}
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                      <IcLink /> View on YouTube
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !videoFile || !title.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? <><Spinner /> {mode === 'now' ? 'Uploading...' : 'Scheduling...'}</> : mode === 'now' ? <><IcUpload /> Publish Now</> : <><IcClock /> Schedule Post</>}
            </button>

            {/* Scheduled posts list */}
            <div>
              <button
                onClick={() => { setShowScheduled(!showScheduled); if (!showScheduled) fetchScheduled(); }}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition"
              >
                {showScheduled ? '▲ Hide' : '▼ Show'} Scheduled Posts
              </button>
              {showScheduled && (
                <div className="mt-2 space-y-2">
                  {scheduled.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No scheduled posts</p>
                  ) : scheduled.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-400">{new Date(p.scheduledAt).toLocaleString('en-IN')} · <span className={`font-semibold ${p.status === 'published' ? 'text-green-600' : p.status === 'failed' ? 'text-red-500' : 'text-yellow-600'}`}>{p.status}</span></p>
                        {p.youtubeUrl && <a href={p.youtubeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">View on YouTube</a>}
                      </div>
                      {p.status === 'pending' && (
                        <button onClick={() => deleteScheduled(p._id)} className="text-red-400 hover:text-red-600 ml-2 shrink-0"><IcX /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
