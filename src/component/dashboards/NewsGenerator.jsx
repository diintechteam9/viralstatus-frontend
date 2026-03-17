import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const categories = ['Business', 'Technology', 'Sports', 'Entertainment', 'Health', 'Politics', 'Science'];
const tones = ['Formal', 'Casual', 'Breaking News', 'Analytical'];
const languages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu'];

// Azure Neural voices (can be extended)
const voices = [
  { id: 'en-US-JennyNeural', name: 'Jenny', label: 'English (US), Female' },
  { id: 'en-US-GuyNeural', name: 'Guy', label: 'English (US), Male' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja', label: 'English (India), Female' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat', label: 'English (India), Male' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara', label: 'Hindi, Female' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur', label: 'Hindi, Male' }
];

// Lazy-load Puter SDK from npm package (no API key required)
const ensurePuterLoaded = (() => {
  let promise = null;
  return async () => {
    // Puter SDK needs the browser environment
    if (typeof window === 'undefined') throw new Error('Puter SDK can only run in the browser');
    if (window.puter?.ai?.txt2img) return window.puter;
    if (!promise) {
      promise = import('@heyputer/puter.js')
        .then(() => {
          if (!window.puter?.ai?.txt2img) {
            throw new Error('Puter SDK loaded but window.puter.ai.txt2img is missing');
          }
          return window.puter;
        })
        .catch((e) => {
          promise = null;
          throw e;
        });
    }
    return promise;
  };
})();

const initialSteps = {
  step1: { status: 'idle', error: null },
  step2: { status: 'idle', error: null },
  step3: { status: 'idle', error: null, progress: { current: 0, total: 0 } },
  step4: { status: 'idle', error: null }
};

const statusStyles = {
  idle: 'text-gray-500',
  loading: 'text-orange-600',
  done: 'text-emerald-600',
  error: 'text-red-600'
};

const Spinner = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

const Icon = ({ name, className = 'h-5 w-5' }) => {
  // Minimal inline icons to avoid extra deps
  const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' };
  switch (name) {
    case 'newspaper':
      return (
        <svg {...common}>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v18H7V3z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 11h10M7 15h7" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...common}>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 14a3 3 0 003-3V7a3 3 0 00-6 0v4a3 3 0 003 3z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 21h8" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 11l3 3 5-5 4 4" />
        </svg>
      );
    case 'video':
      return (
        <svg {...common}>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 10l4-2v8l-4-2V10z" />
          <rect x="3" y="6" width="12" height="12" rx="2" strokeWidth="2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
        </svg>
      );
    default:
      return null;
  }
};

const NewsGenerator = () => {
  // Form state
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tone, setTone] = useState('Formal');
  const [language, setLanguage] = useState('English');
  const [voiceId, setVoiceId] = useState('en-US-JennyNeural');

  // Pipeline state
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState(initialSteps);

  // Results state
  const [newsData, setNewsData] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [images, setImages] = useState([]);
  const [srtText, setSrtText] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const updateStep = useCallback((stepKey, updates) => {
    setSteps((prev) => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...updates }
    }));
  }, []);

  const base64ToObjectUrl = useCallback((base64, mimeType) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  }, []);

  const safeErrorMessage = (e, fallback) => {
    const msg =
      e?.response?.data?.error ||
      e?.response?.data?.message ||
      e?.message ||
      fallback;
    return typeof msg === 'string' ? msg : fallback;
  };

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSteps(initialSteps);
    setNewsData(null);
    setAudioBase64(null);
    setImages([]);
    setSrtText(null);
    setVideoData(null);
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    setVideoObjectUrl(null);
    setAudioObjectUrl(null);
    setCopied(false);
  }, [audioObjectUrl, videoObjectUrl]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    };
  }, [audioObjectUrl, videoObjectUrl]);

  const runStep1 = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/news/generate-news`,
        { topic, category, tone, language },
        { timeout: 120000 }
      );
      const data = res.data;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate news article');
      return {
        headline: data.headline,
        subheadline: data.subheadline,
        body: data.body,
        fullArticle: data.fullArticle,
        language: data.language,
        category: data.category,
        tone: data.tone
      };
    } catch (e) {
      throw new Error(safeErrorMessage(e, 'Step 1 failed: Unable to generate article'));
    }
  };

  const runStep2 = async (text) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/videocard/azure-tts`,
        { text, voiceName: voiceId, format: 'base64' },
        { timeout: 120000 }
      );
      const data = res.data;
      if (!data?.success || !data?.audio) throw new Error(data?.error || 'Failed to generate audio');
      return data.audio;
    } catch (e) {
      throw new Error(safeErrorMessage(e, 'Step 2 failed: Unable to convert to voice'));
    }
  };

  const sentenceFallbackPrompts = (script) => {
    const raw = String(script || '')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
    return raw.map((sentence, idx) => ({
      number: idx + 1,
      sentence,
      prompt: `Highly detailed, cinematic vertical scene capturing: "${sentence}". Photorealistic, 9:16, soft natural lighting, vivid colors.`
    }));
  };

  const runStep3 = async (script) => {
    let promptItems = [];

    // Step 3A: generate prompts
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/videocard/generate-prompt`,
        { storyScript: script },
        { timeout: 120000 }
      );
      const data = res.data;
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No prompts returned');
      }
      promptItems = data.slice(0, 5);
    } catch (e) {
      // fallback required by spec
      promptItems = sentenceFallbackPrompts(script);
    }

    updateStep('step3', {
      status: 'loading',
      error: null,
      progress: { current: 0, total: promptItems.length }
    });

    // Step 3B: generate images on the frontend via Puter.js (txt2img),
    // then convert to base64 so the existing backend video pipeline still works.
    const results = await Promise.all(
      promptItems.map(async (item) => {
        try {
          const puter = await ensurePuterLoaded();
          const imgEl = await puter.ai.txt2img(item.prompt);
          const src = imgEl && imgEl.src;
          if (!src) throw new Error('No image src from Puter');

          const resp = await fetch(src);
          const blob = await resp.blob();
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Image = btoa(binary);

          return { ok: true, image: base64Image };
        } catch (_) {
          return { ok: false };
        } finally {
          updateStep('step3', (prev) => ({
            ...prev,
            progress: {
              current: Math.min((prev.progress?.current || 0) + 1, prev.progress?.total || promptItems.length),
              total: prev.progress?.total || promptItems.length
            }
          }));
        }
      })
    );

    const imgs = results.filter((r) => r.ok).map((r) => ({ image: r.image }));
    if (imgs.length < 2) {
      throw new Error('Step 3 failed: Not enough images generated (minimum 2 required)');
    }
    return imgs;
  };

  const pollJobUntilDone = async (jobId) => {
    const startedAt = Date.now();
    let delayMs = 2000;
    while (true) {
      // safety cap: 8 minutes
      if (Date.now() - startedAt > 8 * 60 * 1000) {
        throw new Error('Video generation is taking too long. Please try again.');
      }

      const res = await axios.get(`${API_BASE_URL}/api/videocard/job-status/${encodeURIComponent(jobId)}`, {
        timeout: 30000
      });
      if (!res.data?.success || !res.data?.job) {
        throw new Error(res.data?.error || 'Failed to check video job status');
      }
      const job = res.data.job;
      if (job.status === 'completed') return job;
      if (job.status === 'failed') {
        throw new Error(job.error || 'Video generation failed');
      }

      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(8000, Math.floor(delayMs * 1.5));
    }
  };

  const runStep4 = async (audioB64, imgs) => {
    // Step 4A: SRT from audio
    let srt = null;
    try {
      const srtRes = await axios.post(
        `${API_BASE_URL}/api/vtr/generate-srt`,
        { audio: audioB64 },
        { timeout: 180000, responseType: 'text' }
      );
      srt = typeof srtRes.data === 'string' ? srtRes.data : String(srtRes.data || '');
      if (!srt.trim()) throw new Error('Empty SRT');
      setSrtText(srt);
    } catch (e) {
      throw new Error(safeErrorMessage(e, 'Step 4 failed: Unable to generate subtitles (SRT)'));
    }

    // Step 4B: final video (async job for reliability on Render/Vercel)
    try {
      const jobRes = await axios.post(
        `${API_BASE_URL}/api/videocard/generate-finalvideo-async`,
        {
          // backend async API expects array; supports objects too, but keep as-is
          images: imgs,
          audio: audioB64,
          srt,
          imageSrt: srt,
          cardName: `news-reel-${Date.now()}`,
          category: 'news-reel'
        },
        { timeout: 60000 }
      );

      const data = jobRes.data;
      if (!data?.success || !data?.jobId) {
        throw new Error(data?.error || 'Failed to start video generation');
      }

      const job = await pollJobUntilDone(data.jobId);

      // Job completion returns videoUrl; base64 video is not returned in async mode.
      // We’ll use videoUrl for preview/download.
      return {
        video: null,
        videoUrl: job.videoUrl,
        videoFilename: job.fileName,
        duration: job.duration
      };
    } catch (e) {
      throw new Error(safeErrorMessage(e, 'Step 4 failed: Unable to create reel video'));
    }
  };

  const handleDownload = () => {
    if (!videoObjectUrl) return;
    const a = document.createElement('a');
    a.href = videoObjectUrl;
    a.download = `${videoData?.videoFilename || `news-reel-${Date.now()}.mp4`}`;
    a.click();
  };

  const handleCopy = async () => {
    try {
      const text = newsData?.fullArticle || newsData?.body || '';
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    handleReset();
    setIsRunning(true);

    // STEP 1
    updateStep('step1', { status: 'loading', error: null });
    let news;
    try {
      news = await runStep1();
      setNewsData(news);
      updateStep('step1', { status: 'done' });
    } catch (e) {
      updateStep('step1', { status: 'error', error: e.message });
      setIsRunning(false);
      return;
    }

    // STEP 2
    updateStep('step2', { status: 'loading', error: null });
    let audioB64;
    try {
      audioB64 = await runStep2(news.body);
      setAudioBase64(audioB64);
      const audioUrl = base64ToObjectUrl(audioB64, 'audio/mpeg');
      setAudioObjectUrl(audioUrl);
      updateStep('step2', { status: 'done' });
    } catch (e) {
      updateStep('step2', { status: 'error', error: e.message });
      setIsRunning(false);
      return;
    }

    // STEP 3
    updateStep('step3', { status: 'loading', error: null, progress: { current: 0, total: 0 } });
    let imgs = [];
    try {
      imgs = await runStep3(news.body);
      setImages(imgs);
      updateStep('step3', { status: 'done' });
    } catch (e) {
      updateStep('step3', { status: 'error', error: e.message });
      setIsRunning(false);
      return;
    }

    // STEP 4
    updateStep('step4', { status: 'loading', error: null });
    try {
      const vid = await runStep4(audioB64, imgs);
      setVideoData(vid);
      if (vid.videoUrl) {
        setVideoObjectUrl(vid.videoUrl);
      } else if (vid.video) {
        const videoUrl = base64ToObjectUrl(vid.video, 'video/mp4');
        setVideoObjectUrl(videoUrl);
      } else {
        throw new Error('Video completed but no URL was returned');
      }
      updateStep('step4', { status: 'done' });
    } catch (e) {
      updateStep('step4', { status: 'error', error: e.message });
      setIsRunning(false);
      return;
    }

    setIsRunning(false);
  };

  const selectedVoice = voices.find((v) => v.id === voiceId);

  const StepRow = ({ stepKey, title, subtitle, icon }) => {
    const step = steps[stepKey];
    return (
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${statusStyles[step.status]}`}>
          {step.status === 'loading' ? (
            <Spinner className="h-5 w-5" />
          ) : step.status === 'done' ? (
            <Icon name="check" className="h-5 w-5" />
          ) : step.status === 'error' ? (
            <Icon name="x" className="h-5 w-5" />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-gray-900">{title}</p>
            {stepKey === 'step3' && step.status !== 'idle' && (
              <span className="text-xs text-gray-600">
                {step.progress?.current || 0}/{step.progress?.total || 0}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
          {step.status === 'error' && step.error && (
            <p className="text-xs text-red-600 mt-1">{step.error}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">News Reel Generator</h2>
            <p className="text-sm text-gray-600 mt-1">
              One click pipeline: article → voice → images → MP4 reel
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. India launches new space mission to Mars"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              disabled={isRunning}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isRunning}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isRunning}
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isRunning}
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Voice</label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isRunning}
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.label}
                  </option>
                ))}
              </select>
              {selectedVoice && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: <span className="font-medium">{selectedVoice.name}</span> ({selectedVoice.label})
                </p>
              )}
            </div>

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isRunning || !topic.trim()}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    Generating...
                  </>
                ) : (
                  'Generate News Reel'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {(isRunning || steps.step1.status !== 'idle' || steps.step2.status !== 'idle' || steps.step3.status !== 'idle' || steps.step4.status !== 'idle') && (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Progress</h3>
          <div className="space-y-4">
            <StepRow
              stepKey="step1"
              title="Generating News Article"
              subtitle="Creating a structured headline, subheadline, and article"
              icon={<Icon name="newspaper" className="h-5 w-5" />}
            />
            <StepRow
              stepKey="step2"
              title="Converting to Voice"
              subtitle="ElevenLabs TTS — can take 10–30 seconds"
              icon={<Icon name="mic" className="h-5 w-5" />}
            />
            <StepRow
              stepKey="step3"
              title={`Generating Images (${steps.step3.progress.current || 0}/${steps.step3.progress.total || 0})`}
              subtitle="Up to 5 scenes, generated in parallel"
              icon={<Icon name="image" className="h-5 w-5" />}
            />
            <StepRow
              stepKey="step4"
              title="Creating Reel Video"
              subtitle="Subtitles + final MP4 generation"
              icon={<Icon name="video" className="h-5 w-5" />}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {(newsData || audioObjectUrl || images.length > 0 || videoObjectUrl) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Article */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900">Article</h3>
                {newsData?.fullArticle && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs px-3 py-1.5 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              {newsData ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xl font-extrabold text-gray-900">{newsData.headline}</p>
                  <p className="text-sm text-gray-600">{newsData.subheadline}</p>
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{newsData.fullArticle || newsData.body}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-4">No article yet.</p>
              )}
            </div>

            {/* Audio */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900">Audio</h3>
              <p className="text-xs text-gray-600 mt-1">
                Voice: <span className="font-medium">{selectedVoice?.name || '—'}</span>
              </p>
              {audioObjectUrl ? (
                <div className="mt-4 space-y-3">
                  <audio controls src={audioObjectUrl} className="w-full" />
                  <p className="text-xs text-gray-500">Generated from article body (MP3).</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-4">No audio yet.</p>
              )}
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Images</h3>
                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded-full">
                  {images.length} generated
                </span>
              </div>
              {images.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <div className="flex gap-3 min-w-max">
                    {images.map((img, idx) => (
                      <div key={idx} className="w-28">
                        <img
                          src={`data:image/png;base64,${img.image}`}
                          alt={`Scene ${idx + 1}`}
                          className="w-28 h-48 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-4">No images yet.</p>
              )}
            </div>
          </div>

          {/* Video */}
          {videoObjectUrl && (
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-3 flex-col md:flex-row">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Reel Video</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {videoData?.duration ? `Duration: ${videoData.duration}s` : 'Video ready'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold hover:opacity-95 transition"
                  >
                    Download MP4
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Generate New Reel
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <video controls src={videoObjectUrl} className="w-full rounded-xl border border-gray-200" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsGenerator;
