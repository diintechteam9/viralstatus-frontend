import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../config';

const getToken = () =>
  sessionStorage.getItem('clienttoken') ||
  localStorage.getItem('clienttoken') ||
  sessionStorage.getItem('usertoken') ||
  localStorage.getItem('usertoken') || '';

const UploadReels = ({ isAuthenticated }) => {
  const [file, setFile]         = useState(null);
  const [caption, setCaption]   = useState('');
  const [status, setStatus]     = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const fileRef = useRef();

  if (!isAuthenticated) return null;

  const handleUpload = async () => {
    if (!file) return setStatus('Please select a video file.');
    const token = getToken();
    if (!token) return setStatus('Not logged in. Please login again.');

    setLoading(true);
    setStatus('Uploading video...');
    setProgress(0);
    setResult(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('caption', caption);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/instagram/reels/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
      };

      xhr.onload = () => {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && data.success) {
            setResult({ success: true, url: data.url, message: data.message });
            setFile(null);
            setCaption('');
            setProgress(0);
            if (fileRef.current) fileRef.current.value = '';
          } else {
            setStatus(data.error || 'Upload failed. Please try again.');
          }
        } catch (_) {
          setStatus('Upload failed. Please try again.');
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        setStatus('Network error. Please try again.');
      };

      xhr.send(formData);
      setStatus('Processing video (this may take 2-3 minutes)...');
    } catch (err) {
      setLoading(false);
      setStatus('Upload failed. Please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Caption</label>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 resize-none"
        />
      </div>
      <div>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition"
        >
          {file ? (
            <p className="text-sm font-medium text-gray-700">📹 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
          ) : (
            <p className="text-sm text-gray-400">Click to select video (MP4/MOV, max 100MB)</p>
          )}
        </div>
        <input ref={fileRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={e => { setFile(e.target.files[0] || null); setStatus(''); setResult(null); }} />
      </div>

      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {status && !result && (
        <p className="text-sm text-gray-600">{status}</p>
      )}

      {result && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
          <p className="font-semibold text-green-700">{result.message}</p>
          {result.url && (
            <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
              View on Instagram
            </a>
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
      >
        {loading ? 'Processing...' : 'Upload Reel to Instagram'}
      </button>
    </div>
  );
};

export default UploadReels;
