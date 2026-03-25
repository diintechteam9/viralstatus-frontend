import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const token = () =>
  sessionStorage.getItem('clienttoken') ||
  localStorage.getItem('clienttoken') ||
  sessionStorage.getItem('usertoken') ||
  localStorage.getItem('usertoken') || '';

const getUserId = () => {
  try {
    const d = JSON.parse(sessionStorage.getItem('userData') || '{}');
    return d.clientId || d._id || d.id || '';
  } catch (_) { return ''; }
};

const IcIG     = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const IcUpload = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v11"/></svg>;
const IcCheck  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const IcX      = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IcLink   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const Spinner  = () => <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>;

export default function InstagramPublish({ defaultCaption = '' }) {
  const [open, setOpen]           = useState(false);
  const [connected, setConnected] = useState(false);
  const [igInfo, setIgInfo]       = useState(null);
  const [checking, setChecking]   = useState(false);
  const [caption, setCaption]     = useState(defaultCaption);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const fileRef = useRef();

  useEffect(() => { setCaption(defaultCaption); }, [defaultCaption]);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/instagram/status`, {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: 'include',
      });
      const d = await r.json();
      setConnected(!!d.connected);
      setIgInfo(d.connected ? { username: d.username, picture: d.picture } : null);
    } catch (_) { setConnected(false); }
    setChecking(false);
  };

  useEffect(() => { if (open) checkConnection(); }, [open]);

  const connectInstagram = () => {
    const uid = getUserId();
    window.location.href = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${import.meta.env.VITE_FB_APP_ID}&redirect_uri=${import.meta.env.VITE_FB_REDIRECT_URI}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code&state=${uid}`;
  };

  const handleSubmit = async () => {
    if (!videoFile) return setResult({ error: 'Please select a video file' });
    if (!token()) return setResult({ error: 'Not logged in. Please login and try again.' });

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('caption', caption);

    try {
      const r = await fetch(`${API_BASE_URL}/api/instagram/reels/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        credentials: 'include',
        body: formData,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      setResult({ success: true, url: d.url, username: d.username, message: d.message || 'Reel uploaded successfully!' });
      setVideoFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setResult({ error: e.message || 'Something went wrong. Please try again.' });
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-semibold transition shadow-sm"
      >
        <IcIG /> Publish to Instagram
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-pink-100 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <IcIG /> Publish to Instagram
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
                {checking ? 'Checking...' : connected ? 'Instagram Connected' : 'Instagram Not Connected'}
              </p>
              {connected && igInfo && (
                <p className="text-[11px] text-gray-400">@{igInfo.username}</p>
              )}
            </div>
          </div>
          {!connected && (
            <button
              onClick={connectInstagram}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition"
            >
              Connect Account
            </button>
          )}
        </div>

        {connected && (
          <>
            {/* Caption */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={3}
                placeholder="Write a caption..."
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 focus:bg-white transition resize-none"
              />
            </div>

            {/* Video file */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Video File (Reel) *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition"
              >
                {videoFile ? (
                  <p className="text-sm font-medium text-gray-700">📹 {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                ) : (
                  <p className="text-sm text-gray-400">Click to select video file (MP4/MOV, max 100MB)</p>
                )}
              </div>
              <input ref={fileRef} type="file" accept="video/mp4,video/quicktime" className="hidden"
                onChange={e => setVideoFile(e.target.files[0] || null)} />
            </div>

            {/* Result */}
            {result && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {result.success ? <IcCheck /> : <IcX />}
                <div className="text-sm">
                  <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success ? result.message : result.error}
                  </p>
                  {result.success && result.username && (
                    <p className="text-[11px] text-gray-500 mt-0.5">📸 Uploaded to: <span className="font-semibold">@{result.username}</span></p>
                  )}
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                      <IcLink /> View on Instagram
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !videoFile}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? <><Spinner /> Uploading...</> : <><IcUpload /> Publish Reel</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
