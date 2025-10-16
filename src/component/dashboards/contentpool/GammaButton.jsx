import React, { useState, useEffect } from "react";
import { FaUpload, FaTrash, FaPlay, FaVolumeUp } from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../../config";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GammaButton = ({ pool, onBack }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [srtText, setSrtText] = useState("");
  const [isGeneratingSrt, setIsGeneratingSrt] = useState(false);
  const [wordSrtText, setWordSrtText] = useState("");
  // Important paragraphs configuration
  const [importantLoading, setImportantLoading] = useState(false);
  const [importantSentences, setImportantSentences] = useState([]);
  const [reelCount, setReelCount] = useState(3); // 1–5 paragraphs
  const [minSeconds, setMinSeconds] = useState(20); // 20–40
  const [maxSeconds, setMaxSeconds] = useState(40); // 20–40
  const clampSnap = (val, min = 20, max = 40, step = 5) => {
    const n = parseInt(val, 10);
    if (!Number.isFinite(n)) return min;
    const clamped = Math.max(min, Math.min(max, n));
    const snapped = Math.round((clamped - min) / step) * step + min;
    return Math.max(min, Math.min(max, snapped));
  };
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [reelUrl, setReelUrl] = useState(null);
  const [reelUrls, setReelUrls] = useState([]);
  const [segmentUrls, setSegmentUrls] = useState([]);
  const [isGeneratingSegments, setIsGeneratingSegments] = useState(false);
  const [vtsJobId, setVtsJobId] = useState(null);
  const [vtsJobProgress, setVtsJobProgress] = useState(0);
  const [vtsJobStatus, setVtsJobStatus] = useState(null);
  const [statusMessages, setStatusMessages] = useState([]);
  const lastProgressRef = React.useRef(0);
  const lastVideoCountRef = React.useRef(0);
  const lastPhaseRef = React.useRef('');
  const [outroFile, setOutroFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [textOverlayFont, setTextOverlayFont] = useState('notosans');
  const [videoLoadErrors, setVideoLoadErrors] = useState({});
  const [cropPosition, setCropPosition] = useState('middle'); // 'left' | 'middle' | 'right'
  // Removed image prompt and text overlay states
  const [timers, setTimers] = useState({
    extractAudioMs: null,
    sentenceSrtMs: null,
    wordSrtMs: null,
    importantMs: null,
  });
  const reelStartRef = React.useRef(null);

  const formatDuration = (ms) => {
    if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return null;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };
  
  // Video job tracking (same as ManualVideoGeneration)
  const [videoJobId, setVideoJobId] = useState(null);
  const [videoJobProgress, setVideoJobProgress] = useState(0);
  const [videoJobStatus, setVideoJobStatus] = useState(null);
  const retriedUrlsRef = React.useRef(new Set());
  const [telegramSending, setTelegramSending] = useState({}); // { [videoUrl]: bool }
  const [isSavingToPool, setIsSavingToPool] = useState({}); // { [videoUrl]: bool }
  // Removed segment generation flags

  // Audio extraction job tracking
  const [audioExtractionJobId, setAudioExtractionJobId] = useState(null);
  const [audioExtractionProgress, setAudioExtractionProgress] = useState(0);
  const [audioExtractionStatus, setAudioExtractionStatus] = useState(null);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file.");
      return;
    }
    setVideoFile(file);
  };

  const handleRemove = () => {
    setVideoFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const extractAudio = async () => {
    if (!videoFile) return;
      const t0 = performance.now();
    try {
      setIsExtracting(true);
      setAudioUrl(null);
      setAudioExtractionStatus('processing');
      setAudioExtractionProgress(0);
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('video', videoFile);

      // Start async audio extraction
      const response = await fetch(`${API_BASE_URL}/api/audio/extract-async`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start audio extraction: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.jobId) {
        // Start polling for job status
        pollAudioExtractionStatus(data.jobId, t0);
        // Toast will be shown when extraction completes
      } else {
        throw new Error('No job ID returned from server');
      }
      
    } catch (error) {
      console.error('Error starting audio extraction:', error);
      toast.error(`Failed to start audio extraction: ${error.message}`);
      setIsExtracting(false);
      setAudioExtractionStatus(null);
    }
  };

  // Poll audio extraction job status
  const pollAudioExtractionStatus = async (jobId, startTime) => {
    setAudioExtractionJobId(jobId);
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/audio/job-status/${jobId}`);
        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.job) {
          const { status, progress, audioUrl, error } = data.job;
          
          setAudioExtractionStatus(status);
          setAudioExtractionProgress(progress);
          
          if (status === 'completed' && audioUrl) {
            // Audio extraction completed successfully
            setExtractedAudioUrl(audioUrl);
            // Convert S3 URL to blob URL for compatibility with existing audio handling
            try {
              const audioResponse = await fetch(audioUrl);
              const audioBlob = await audioResponse.blob();
              const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setSrtText("");
      const t1 = performance.now();
              setTimers(prev => ({ ...prev, extractAudioMs: Math.max(0, t1 - startTime) }));
            } catch (conversionError) {
              console.warn('Failed to convert audio URL to blob:', conversionError);
            }
            clearInterval(pollInterval);
      setIsExtracting(false);
            toast.success('Audio extracted successfully!');
          } else if (status === 'failed') {
            // Audio extraction failed
            clearInterval(pollInterval);
            setIsExtracting(false);
            toast.error(`Audio extraction failed: ${error?.message || 'Unknown error'}`);
          }
          // Continue polling for 'pending' and 'processing' statuses
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error polling audio extraction status:', error);
        clearInterval(pollInterval);
        setIsExtracting(false);
        toast.error('Failed to check audio extraction status. Please try again.');
      }
    }, 2000); // Poll every 2 seconds
    
    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (audioExtractionStatus === 'processing') {
        setIsExtracting(false);
        toast.error('Audio extraction is taking longer than expected. Please check back later.');
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const generateSrt = async () => {
    if (!audioUrl) return;
    try {
      const tSentence0 = performance.now();
      setIsGeneratingSrt(true);
      setSrtText("");
      setWordSrtText("");
      // fetch the blob from object url and convert to base64
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const { data } = await axios.post(`${API_BASE_URL}/api/vtr/generate-srt`, { audio: base64 }, {
        headers: { "Content-Type": "application/json" },
        responseType: "text",
      });
      // axios with responseType text returns string in data
      setSrtText(typeof data === 'string' ? data : String(data));
      const tSentence1 = performance.now();
      setTimers(prev => ({ ...prev, sentenceSrtMs: Math.max(0, tSentence1 - tSentence0) }));

      // Also fetch word-level SRT in parallel after sentence-level succeeds
      try {
        const tWord0 = performance.now();
        const { data: wordData } = await axios.post(`${API_BASE_URL}/api/vtr/generate-srt-words`, { audio: base64 }, {
          headers: { "Content-Type": "application/json" },
          responseType: "text",
        });
        setWordSrtText(typeof wordData === 'string' ? wordData : String(wordData));
        const tWord1 = performance.now();
        setTimers(prev => ({ ...prev, wordSrtMs: Math.max(0, tWord1 - tWord0) }));
      } catch (e) {
        // Non-blocking
        setWordSrtText("");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate SRT");
    } finally {
      setIsGeneratingSrt(false);
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // Removed image normalization helpers (not used)

  // Clean up job files after video is displayed
  const cleanupJobFiles = async (jobId) => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/vtr/cleanup-job/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log(`[VTR] Cleaned up job files for ${jobId}`);
      } else {
        console.warn(`[VTR] Failed to cleanup job files for ${jobId}:`, response.status);
      }
    } catch (error) {
      console.warn(`[VTR] Error cleaning up job files for ${jobId}:`, error.message);
    }
  };

  // Reliable segment download helper
  const downloadSegment = async (url, index) => {
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `segment-${(index + 1)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      toast.error(e.message || 'Failed to download segment');
    }
  };

  // Poll segments async job status
  const pollVtsJobStatus = async (jobId) => {
    setVtsJobId(jobId);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vts/job-status/${jobId}`);
        if (!response.ok) throw new Error(`Failed to get job status: ${response.status}`);
        const data = await response.json();
        if (data.success && data.job) {
          const { status, progress, videos, error } = data.job;
          setVtsJobStatus(status);
          setVtsJobProgress(progress || 0);
          // Derive and append human-friendly status messages
          const prog = Number(progress || 0);
          const phase = (() => {
            if (status === 'completed') return 'completed';
            if (status === 'failed') return 'failed';
            if (prog < 10) return 'starting';
            if (prog < 30) return 'trimming';
            if (prog < 55) return 'portrait';
            if (prog < 80) return 'overlays';
            if (prog < 95) return 'uploading';
            return 'finalizing';
          })();
          const phaseLabel = {
            starting: 'Starting job…',
            trimming: 'Trimming segments…',
            portrait: 'Normalizing to portrait (9:16)…',
            overlays: 'Applying text/logo overlays…',
            uploading: 'Uploading segments to S3…',
            finalizing: 'Finalizing…',
            completed: 'Completed ✅',
            failed: `Failed ❌ ${error?.message ? '- ' + error.message : ''}`,
          }[phase];
          if (phase && phase !== lastPhaseRef.current) {
            setStatusMessages((prev) => [...prev, `${phaseLabel}`]);
            lastPhaseRef.current = phase;
          }
          // Per-segment upload messages when new videos appear
          const count = Array.isArray(videos) ? videos.length : 0;
          if (count > lastVideoCountRef.current) {
            const newCount = count - lastVideoCountRef.current;
            for (let i = 0; i < newCount; i++) {
              const segNum = lastVideoCountRef.current + i + 1;
              setStatusMessages((prev) => [...prev, `Segment ${segNum} uploaded to S3`]);
            }
            lastVideoCountRef.current = count;
          }
          // Progressive: append new videos as they appear
          if (Array.isArray(videos)) {
            const urls = videos.map(v => v.url).filter(Boolean);
            setSegmentUrls(prev => {
              const seen = new Set(prev);
              const merged = [...prev];
              for (const u of urls) if (!seen.has(u)) merged.push(u);
              return merged;
            });
          }
          const hasVideos = Array.isArray(videos) && videos.some(v => v && v.url);
          const isBenignFailure = typeof error?.message === 'string' && /No matching document found for id/i.test(error.message);
          if (status === 'completed' || (status === 'failed' && (hasVideos || isBenignFailure))) {
            clearInterval(pollInterval);
            setIsGeneratingSegments(false);
            toast.success('Segments generated successfully');
            // Cleanup server temp after successful completion
            try { await fetch(`${API_BASE_URL}/api/vts/cleanup-job/${jobId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); } catch (_) {}
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setIsGeneratingSegments(false);
            toast.error(`Segments generation failed: ${error?.message || 'Unknown error'}`);
            try { await fetch(`${API_BASE_URL}/api/vts/cleanup-job/${jobId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); } catch (_) {}
          }
        }
      } catch (e) {
        clearInterval(pollInterval);
        setIsGeneratingSegments(false);
        toast.error('Failed to check segments job status.');
      }
    }, 2000);
    setTimeout(() => { try { clearInterval(pollInterval); } catch(_) {} }, 10 * 60 * 1000);
  };

  // Generate important paragraphs from SRT
  const generateImportant = async () => {
    if (!srtText) return;
    try {
      const t0 = performance.now();
      setImportantLoading(true);
      setImportantSentences([]);
      let minSec = parseInt(minSeconds, 10);
      let maxSec = parseInt(maxSeconds, 10);
      if (!Number.isFinite(minSec) || minSec < 20) minSec = 20;
      if (!Number.isFinite(maxSec) || maxSec > 40) maxSec = 40;
      if (minSec > maxSec) { const tmp = minSec; minSec = maxSec; maxSec = tmp; }
      const resp = await axios.post(`${API_BASE_URL}/api/vts/important-paragraphs`, {
        srt: srtText,
        count: Math.max(1, Math.min(5, parseInt(reelCount, 10) || 3)),
        minSeconds: minSec,
        maxSeconds: maxSec,
      });
      const paragraphs = Array.isArray(resp.data?.paragraphs) ? resp.data.paragraphs : [];
        const joined = paragraphs.map(p => Array.isArray(p) ? p.join(' ') : String(p));
        setImportantSentences(joined);
      const t1 = performance.now();
      setTimers(prev => ({ ...prev, importantMs: Math.max(0, t1 - t0) }));
      toast.success('Important paragraphs generated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate important sentences');
    } finally {
      setImportantLoading(false);
    }
  };

  // Removed prompts reset tied to important sentences

  // Cleanup job files when component unmounts
  useEffect(() => {
    return () => {
      if (videoJobId) {
        cleanupJobFiles(videoJobId);
      }
      if (audioExtractionJobId) {
        // Clean up audio extraction job files
        fetch(`${API_BASE_URL}/api/audio/cleanup-job/${audioExtractionJobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(error => {
          console.warn(`[Audio] Error cleaning up job files for ${audioExtractionJobId}:`, error.message);
        });
      }
      if (vtsJobId) {
        // Clean up VTS job files
        fetch(`${API_BASE_URL}/api/vts/cleanup/${vtsJobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(error => {
          console.warn(`[VTS] Error cleaning up job files for ${vtsJobId}:`, error.message);
        });
      }
    };
  }, [videoJobId || null, audioExtractionJobId || null, vtsJobId || null]);

  const buildImagePromptFromSentence = (sentence) => {
    const trimmed = (sentence || "").trim();
    return `Highly detailed, cinematic vertical scene capturing: "${trimmed}". Use engaging composition, soft natural lighting, vivid colors, shallow depth of field. Social-media ready, photorealistic, 4k.`;
  };

  // Removed prompt generation (not used)

  // Removed helpers for prompt parsing

  // Removed image generation (not used)

  // Removed individual image generation (not used)

  const generateReel = async () => {
    if (!videoFile || importantSentences.length === 0 || !srtText) return;
    // Word-level SRT and images are optional; backend handles missing gracefully
    const hasWordSrt = !!wordSrtText && String(wordSrtText).trim().length > 0;
    // Build selected images list (newest first per prompt slot; fallback to newest if not selected)
    const selectedList = [];
    importantSentences.forEach((_, pIdx) => {
      const paragraphGalleries = generatedImages[pIdx] || {};
      const paragraphSelections = selectedImages[pIdx] || {};
      Object.keys(paragraphGalleries).forEach((slotKey) => {
        const gallery = Array.isArray(paragraphGalleries[slotKey]) ? paragraphGalleries[slotKey] : [];
        if (!gallery.length) return;
        const chosen = paragraphSelections[slotKey] || gallery[0];
        if (chosen) selectedList.push(chosen);
      });
    });
    try {
      reelStartRef.current = performance.now();
      currentJobTypeRef.current = 'full';
      setIsGeneratingReel(true);
      setReelUrl(null);
      setReelUrls([]);
      setSegmentUrls([]);
      setVideoJobProgress(0);
      setVideoJobStatus(null);
      
      // Use async endpoint instead of synchronous
      const form = new FormData();
      form.append('video', videoFile);
      form.append('srt', srtText);
      if (wordSrtText) form.append('wordSrt', wordSrtText);
      form.append('sentences', JSON.stringify(importantSentences));
      form.append('portrait', 'false');
      form.append('fontKey', textOverlayFont); // pass selected font to backend
      form.append('textColor', textOverlayColor); // pass selected text color to backend
      // Include selected images (data URLs) for overlay step
      form.append('images', JSON.stringify(selectedList));
      
      const response = await fetch(`${API_BASE_URL}/api/vtr/generate-reel-async`, {
        method: 'POST',
        body: form
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start reel generation: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.jobId) {
        // Start polling for job status
        pollJobStatus(data.jobId);
      } else {
        throw new Error('No job ID returned from server');
      }
    } catch (error) {
      console.error('Error starting reel generation:', error);
      alert(`Failed to start reel generation: ${error.message}`);
      setIsGeneratingReel(false);
    }
  };

  // Removed generate segments reel

  const sendToTelegram = async (url) => {
    if (!url) return;
    try {
      setTelegramSending(prev => ({ ...prev, [url]: true }));
      const resp = await fetch(`${API_BASE_URL}/api/telegram/send-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${resp.status})`);
      }
      alert('Sent to Telegram successfully!');
    } catch (e) {
      alert(e.message || 'Failed to send to Telegram');
    } finally {
      setTelegramSending(prev => ({ ...prev, [url]: false }));
    }
  };

  // Save video to pool
  const handleSaveToPool = async (url) => {
    if (!url) {
      alert('No video available to save');
      return;
    }

    if (!pool || !pool._id) {
      alert('No pool selected to save the video');
      return;
    }

    setIsSavingToPool(prev => ({ ...prev, [url]: true }));
    
    try {
      // Fetch the video blob from the URL
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', blob, `beta-generated-video-${Date.now()}.mp4`);

      // Upload to pool using the existing API
      const uploadResponse = await fetch(`${API_BASE_URL}/api/pools/${pool._id}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save video: ${uploadResponse.status}`);
      }

      const data = await uploadResponse.json();
      
      if (data.success) {
        alert('Video saved to pool successfully!');
      } else {
        throw new Error(data.error || 'Failed to save video to pool');
      }
      
    } catch (error) {
      console.error('Error saving video to pool:', error);
      alert(`Failed to save video to pool: ${error.message}`);
    } finally {
      setIsSavingToPool(prev => ({ ...prev, [url]: false }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-rose-700 flex items-center gap-2 mb-2">
          <FaPlay className="text-rose-500" /> Video to Reels
        </h2>
        <p className="text-gray-500 mb-2">Upload a source video to get started.</p>

        

        {/* Source video and Extracted audio side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2 text-rose-700 font-semibold">
              Source Video
            </div>
            {!videoFile ? (
              <div className="border-2 border-dashed border-rose-200 rounded-lg p-6 text-center hover:bg-rose-50 transition">
                <label
                  htmlFor="reels-video-upload"
                  className="cursor-pointer flex flex-col items-center gap-2 p-4"
                >
                  <FaUpload className="text-3xl text-rose-400" />
                  <span className="text-sm text-rose-600 font-medium">Upload from Computer</span>
                </label>
                <input
                  id="reels-video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-white rounded-lg p-2 border border-rose-200 flex items-center gap-2">
                  <video
                    src={URL.createObjectURL(videoFile)}
                    className="w-36 h-24 object-cover rounded shadow"
                    controls
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rose-700 truncate">{`${videoFile.name.slice(0, 20)}${videoFile.name.length > 20 ? '...' : ''}`}</p>
                    <p className="text-xs text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full ml-2"
                    title="Remove video"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
                
                
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-rose-700 font-semibold">
              <FaVolumeUp /> Extracted Audio
              {typeof timers.extractAudioMs === 'number' && (
                <span className="ml-auto text-xs text-gray-500">{formatDuration(timers.extractAudioMs)}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={extractAudio}
                disabled={!videoFile || isExtracting}
                className={`px-4 py-2 rounded-lg ${isExtracting ? 'bg-gray-300 text-gray-500' : (!videoFile ? 'bg-gray-200 text-gray-400' : 'bg-rose-600 hover:bg-rose-700 text-white')} font-medium`}
              >
                {isExtracting ? 'Extracting...' : 'Extract Audio'}
              </button>
              {audioUrl && (
                <>
                  <audio controls src={audioUrl} className="flex-1">
                    Your browser does not support the audio element.
                  </audio>
                  <button
                    type="button"
                    onClick={generateSrt}
                    disabled={isGeneratingSrt}
                    className={`px-4 py-2 rounded-lg ${isGeneratingSrt ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-medium`}
                  >
                    {isGeneratingSrt ? 'Generating...' : 'Generate SRT'}
                  </button>
                </>
              )}
            </div>
            {audioExtractionStatus === 'processing' && (
              <div className="mt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-rose-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${audioExtractionProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-rose-600 font-medium">
                    {audioExtractionProgress}%
                  </span>
                </div>
                <div className="text-xs text-rose-500 mt-1">
                  Extracting audio from video...
                </div>
              </div>
            )}
          </div>
        </div>

        {srtText && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-blue-700 font-semibold mb-2 flex items-center">
                  <span>Sentence-level SRT</span>
                  {typeof timers.sentenceSrtMs === 'number' && (
                    <span className="ml-auto text-xs text-gray-500">{formatDuration(timers.sentenceSrtMs)}</span>
                  )}
                </div>
                <div className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-gray-800 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  {srtText}
                </div>

                {/* Controls: time range, paragraph count, and generate button */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Time range (sec):</span>
                <input
                  type="number"
                  min={20}
                  max={40}
                  step={5}
                  value={minSeconds}
                  onChange={(e) => {
                    const snapped = clampSnap(e.target.value, 20, 40, 5);
                    const newMin = Math.min(snapped, maxSeconds);
                    setMinSeconds(newMin);
                  }}
                  onBlur={(e) => {
                    const snapped = clampSnap(e.target.value, 20, 40, 5);
                    const newMin = Math.min(snapped, maxSeconds);
                    if (newMin !== minSeconds) setMinSeconds(newMin);
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                />
                <span>-</span>
                <input
                  type="number"
                  min={20}
                  max={40}
                  step={5}
                  value={maxSeconds}
                  onChange={(e) => {
                    const snapped = clampSnap(e.target.value, 20, 40, 5);
                    const newMax = Math.max(snapped, minSeconds);
                    setMaxSeconds(newMax);
                  }}
                  onBlur={(e) => {
                    const snapped = clampSnap(e.target.value, 20, 40, 5);
                    const newMax = Math.max(snapped, minSeconds);
                    if (newMax !== maxSeconds) setMaxSeconds(newMax);
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium">Reels:</span>
                <select
                  value={reelCount}
                  onChange={(e) => setReelCount(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 3)))}
                  className="px-2 py-1 border border-gray-300 rounded bg-white"
                      title="Select number of paragraphs to generate"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <button
                type="button"
                onClick={generateImportant}
                disabled={importantLoading}
                className={`px-4 py-2 rounded-lg ${importantLoading ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} font-medium`}
              >
                    {importantLoading ? 'Generating…' : 'Generate'}
              </button>
              {typeof timers.importantMs === 'number' && (
                <span className="text-xs text-gray-500">{formatDuration(timers.importantMs)}</span>
              )}
            </div>
          </div>
              <div>
                <div className="text-purple-700 font-semibold mb-2 flex items-center">
                  <span>Word-level SRT</span>
                  {typeof timers.wordSrtMs === 'number' && (
                    <span className="ml-auto text-xs text-gray-500">{formatDuration(timers.wordSrtMs)}</span>
                  )}
                    </div>
                <div className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-gray-800 bg-purple-50 p-3 rounded-lg border border-purple-100">
                  {wordSrtText || '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important sentences and segment generation UI removed */}

        {importantSentences.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200 mt-4">
            <div className="text-emerald-700 font-semibold mb-3">Generated Important Paragraphs</div>
                      <div className="space-y-3">
              {importantSentences.map((p, idx) => (
                <div key={idx} className="bg-emerald-50 p-3 rounded border border-emerald-100">
                  <div className="text-sm text-gray-600 mb-1">Paragraph {idx + 1}</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{p}</div>
                          </div>
                        ))}
            </div>
          </div>
        )}

        {/* Trim & Outro */}
        {videoFile && srtText && importantSentences.length > 0 && (
          <div className="mt-4">
                <div className="flex flex-wrap items-center gap-3">
              <label className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium cursor-pointer">
                {logoFile ? 'Logo Selected' : 'Add Logo Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    setLogoFile(f);
                    toast.success('Logo image selected');
                  }}
                />
              </label>
              {logoFile && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-sm text-gray-700">Logo position:</span>
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded bg-white text-sm"
                    title="Select logo position"
                  >
                    <option value="top-right">Top right</option>
                    <option value="top-left">Top left</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="bottom-right">Bottom right</option>
                  </select>
                </div>
              )}
              <label className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium cursor-pointer">
                {outroFile ? 'Outro Selected' : 'Add Outro Video'}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    setOutroFile(f);
                    toast.success('Outro video selected');
                  }}
                />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Font:</span>
                <select
                  value={textOverlayFont}
                  onChange={(e) => setTextOverlayFont(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded bg-white text-sm"
                  title="Select text overlay font"
                >
                  <option value="notosans">Noto Sans</option>
                  <option value="khand">Khand Bold</option>
                  <option value="poppins">Poppins Bold</option>
                  <option value="amaticsc">Amatic SC</option>
                  <option value="bebasneue">Bebas Neue</option>
                  <option value="comfortaa">Comfortaa Variable</option>
                  <option value="exo2italic">Exo2 Italic Variable</option>
                  <option value="orbitron">Orbitron</option>
                  <option value="pacifico">Pacifico</option>
                  <option value="shadowsintolight">Shadows Into Light</option>
                  <option value="lato">Lato Regular</option>
                  <option value="poppins-regular">Poppins Regular</option>
                  <option value="anton">Anton Regular</option>
                  <option value="proteststrike">Protest Strike</option>
                  <option value="specialgothic">Special Gothic</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Crop:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCropPosition('left')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      cropPosition === 'left' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Crop from left third of video"
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropPosition('middle')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      cropPosition === 'middle' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Crop from middle third of video"
                  >
                    Middle
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropPosition('right')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      cropPosition === 'right' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="Crop from right third of video"
                  >
                    Right
                  </button>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  (16:9 → 9:16)
                </div>
              </div>
              <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsGeneratingSegments(true);
                      setStatusMessages((prev) => [...prev, 'Job started…']);
                      lastProgressRef.current = 0;
                      lastVideoCountRef.current = 0;
                      lastPhaseRef.current = '';
                      // Revoke old preview URL if any
                      try { if (reelUrl) URL.revokeObjectURL(reelUrl); } catch(_) {}
                      const form = new FormData();
                      form.append('video', videoFile);
                      form.append('srt', srtText);
                      if (wordSrtText) form.append('wordSrt', wordSrtText);
                      // Pass selected font to backend
                      form.append('fontKey', textOverlayFont);
                      form.append('textColor', 'white');
                      form.append('cropPosition', cropPosition);
                      form.append('paragraphs', JSON.stringify(importantSentences));
                      if (outroFile) form.append('outro', outroFile);
                      if (logoFile) form.append('logo', logoFile);
                      if (logoFile) form.append('logoPosition', logoPosition);
                      // Include poolId so backend stores association to the pool
                      if (pool && pool._id) {
                        form.append('poolId', String(pool._id));
                      }
                      // Call async segments endpoint instead of synchronous
                      const resp = await fetch(`${API_BASE_URL}/api/vts/generate-segments-async`, { method: 'POST', body: form });
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => ({}));
                        throw new Error(err?.error || `Failed (${resp.status})`);
                      }
                      const data = await resp.json();
                      if (data?.success && data?.jobId) {
                        setVtsJobId(data.jobId);
                        setReelUrl(null);
                        setReelUrls([]);
                        pollVtsJobStatus(data.jobId);
                      } else {
                        throw new Error('No job ID returned from server');
                      }
                    } catch (e) {
                      toast.error(e.message || 'Failed to trim video');
                    } finally {}
                  }}
                  disabled={isGeneratingSegments || vtsJobStatus === 'processing'}
                  className={`px-4 py-2 rounded-lg font-medium ${(isGeneratingSegments || vtsJobStatus === 'processing') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
              >
                {(isGeneratingSegments || vtsJobStatus === 'processing') ? 'Generating…' : 'Generate Segments'}
              </button>
              {statusMessages.length > 0 && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                  <div className="font-semibold text-gray-800 mb-1">Job status</div>
                  <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-auto">
                    {statusMessages.map((m, i) => (
                      <li key={`${i}-${m}`}>{m}</li>
                    ))}
                  </ul>
                  {typeof vtsJobProgress === 'number' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-rose-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, vtsJobProgress))}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round(vtsJobProgress)}%</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* spinner removed per request */}
            {segmentUrls.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-700 mb-2">Segments</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {segmentUrls.map((url, idx) => (
                    <div key={url} className="bg-gray-50 p-3 rounded-lg border">
                      <div className="text-xs text-gray-600 mb-1">Segment {idx + 1}</div>
                      <div className="w-full flex justify-center">
                        <div className="aspect-[9/16] w-40 rounded overflow-hidden border bg-black">
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            playsInline
                            style={{ aspectRatio: '9 / 16' }}
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => downloadSegment(url, idx)}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveToPool(url)}
                          disabled={!!isSavingToPool[url] || !pool}
                          className={`px-3 py-1 rounded text-white ${isSavingToPool[url] || !pool ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                          {isSavingToPool[url] ? 'Saving…' : `Save to Pool${pool?.name ? ` (${pool.name})` : ''}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendToTelegram(url)}
                          disabled={!!telegramSending[url]}
                          className={`px-3 py-1 rounded text-white ${telegramSending[url] ? 'bg-gray-300' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                          {telegramSending[url] ? 'Sending…' : 'Send to Telegram'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GammaButton;