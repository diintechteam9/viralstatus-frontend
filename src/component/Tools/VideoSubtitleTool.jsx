import React, { useEffect, useRef, useState } from "react";
import { FaUpload, FaTrash, FaVolumeUp, FaPlay } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../config.js";

const VideoSubtitleTool = ({ onBack }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [audioExtractionJobId, setAudioExtractionJobId] = useState(null);
  const [audioExtractionProgress, setAudioExtractionProgress] = useState(0);
  const [audioExtractionStatus, setAudioExtractionStatus] = useState(null);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState(null);
  const extractStartRef = useRef(null);
  const [isGeneratingWordSrt, setIsGeneratingWordSrt] = useState(false);
  const [wordSrtText, setWordSrtText] = useState("");
  const [textOverlayFont, setTextOverlayFont] = useState('notosans');
  const [textOverlayColor, setTextOverlayColor] = useState('white');
  const [textOverlayBgColor, setTextOverlayBgColor] = useState('black');
  const [textOverlayOpacity, setTextOverlayOpacity] = useState(0.35);
  const [textOverlayPosition, setTextOverlayPosition] = useState('bottom');
  const [subtitleJobId, setSubtitleJobId] = useState(null);
  const [subtitleJobProgress, setSubtitleJobProgress] = useState(0);
  const [subtitleJobStatus, setSubtitleJobStatus] = useState(null);
  const [subtitleVideoUrl, setSubtitleVideoUrl] = useState(null);
  const [isSendingToTelegram, setIsSendingToTelegram] = useState(false);

  const formatDuration = (ms) => {
    if (typeof ms !== "number" || !isFinite(ms) || ms < 0) return null;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };
  const [timers, setTimers] = useState({ extractAudioMs: null });

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a valid video file.");
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
    setExtractedAudioUrl(null);
    setAudioExtractionJobId(null);
    setAudioExtractionProgress(0);
    setAudioExtractionStatus(null);
    setWordSrtText("");
    setSubtitleJobId(null);
    setSubtitleJobProgress(0);
    setSubtitleJobStatus(null);
    setSubtitleVideoUrl(null);
  };

  const extractAudio = async () => {
    if (!videoFile) return;
    try {
      setIsExtracting(true);
      setAudioUrl(null);
      setAudioExtractionStatus("processing");
      setAudioExtractionProgress(0);
      extractStartRef.current = performance.now();

      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch(`${API_BASE_URL}/api/audio/extract-async`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to start audio extraction: ${response.status}`
        );
      }

      const data = await response.json();
      if (data.success && data.jobId) {
        pollAudioExtractionStatus(data.jobId);
      } else {
        throw new Error("No job ID returned from server");
      }
    } catch (error) {
      console.error("Error starting audio extraction:", error);
      toast.error(`Failed to start audio extraction: ${error.message}`);
      setIsExtracting(false);
      setAudioExtractionStatus(null);
    }
  };

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      } catch (e) {
        reject(e);
      }
    });

  const generateWordSrt = async () => {
    try {
      if (!extractedAudioUrl) {
        toast.error("Please extract audio first.");
        return;
      }
      setIsGeneratingWordSrt(true);
      setWordSrtText("");

      const resp = await fetch(extractedAudioUrl);
      if (!resp.ok) throw new Error(`Failed to fetch audio: ${resp.status}`);
      const audioBlob = await resp.blob();
      const dataUrl = await blobToDataUrl(audioBlob);

      const srtResp = await fetch(`${API_BASE_URL}/api/subtitles/word-srt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: dataUrl }),
      });
      if (!srtResp.ok) {
        const err = await srtResp.json().catch(() => ({}));
        const msg = err && (err.error || err.message) ? `${err.error || err.message}${err.details ? ": " + err.details : ""}` : `SRT generation failed: ${srtResp.status}`;
        throw new Error(msg);
      }
      const srtText = await srtResp.text();
      setWordSrtText(srtText || "");
      toast.success("Generated word-level SRT!");
    } catch (e) {
      console.error("Generate word SRT error:", e);
      toast.error(e.message || "Failed to generate word SRT");
    } finally {
      setIsGeneratingWordSrt(false);
    }
  };

  const startSubtitleJob = async () => {
    try {
      if (!videoFile) {
        toast.error('Upload a video first.');
        return;
      }
      if (!wordSrtText || !wordSrtText.trim()) {
        toast.error('Generate word-level SRT first.');
        return;
      }
      const form = new FormData();
      form.append('video', videoFile);
      form.append('wordSrt', wordSrtText);
      form.append('fontKey', textOverlayFont);
      form.append('textColor', textOverlayColor);
      form.append('backgroundColor', textOverlayBgColor);
      form.append('boxOpacity', String(textOverlayOpacity));
      form.append('textPosition', textOverlayPosition);
      const resp = await fetch(`${API_BASE_URL}/api/subtitles/generate-async`, {
        method: 'POST',
        body: form
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Failed to start subtitle job: ${resp.status}`);
      }
      const data = await resp.json();
      if (data.success && data.jobId) {
        setSubtitleJobId(data.jobId);
        setSubtitleJobStatus('processing');
        setSubtitleJobProgress(0);
        pollSubtitleJobStatus(data.jobId);
        toast.info('Adding subtitles...');
      } else {
        throw new Error('No job ID returned from server');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to add subtitles');
    }
  };

  const sendToTelegram = async () => {
    try {
      if (!subtitleVideoUrl) {
        toast.error('No generated video to send.');
        return;
      }
      setIsSendingToTelegram(true);
      const resp = await fetch(`${API_BASE_URL}/api/telegram/send-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: subtitleVideoUrl, caption: 'Subtitled reel from ViralStatus' })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success) {
        throw new Error(data.error || `Telegram send failed: ${resp.status}`);
      }
      toast.success('Sent to Telegram successfully!');
    } catch (e) {
      toast.error(e.message || 'Failed to send to Telegram');
    } finally {
      setIsSendingToTelegram(false);
    }
  };

  const pollSubtitleJobStatus = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/subtitles/job-status/${jobId}`);
        if (!resp.ok) throw new Error(`Status failed: ${resp.status}`);
        const data = await resp.json();
        if (data.success && data.job) {
          const { status, progress, videoUrl, error } = data.job;
          setSubtitleJobStatus(status);
          setSubtitleJobProgress(progress || 0);
          if (status === 'completed' && videoUrl) {
            setSubtitleVideoUrl(videoUrl);
            clearInterval(interval);
            toast.success('Subtitles added successfully!');
          } else if (status === 'failed') {
            clearInterval(interval);
            toast.error(`Subtitle job failed: ${error?.message || 'Unknown error'}`);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (e) {
        clearInterval(interval);
        toast.error('Failed to check subtitle job status.');
      }
    }, 2000);
  };

  const pollAudioExtractionStatus = async (jobId) => {
    setAudioExtractionJobId(jobId);
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/audio/job-status/${jobId}`);
        if (!resp.ok) throw new Error(`Status failed: ${resp.status}`);
        const data = await resp.json();
        if (data.success && data.job) {
          const { status, progress, audioUrl: s3Url, error } = data.job;
          setAudioExtractionStatus(status);
          setAudioExtractionProgress(progress || 0);

          if (status === "completed" && s3Url) {
            setExtractedAudioUrl(s3Url);
            try {
              const audioResponse = await fetch(s3Url);
              const audioBlob = await audioResponse.blob();
              const objectUrl = URL.createObjectURL(audioBlob);
              setAudioUrl(objectUrl);
              const t1 = performance.now();
              setTimers((prev) => ({
                ...prev,
                extractAudioMs: Math.max(0, t1 - (extractStartRef.current || t1)),
              }));
            } catch (e) {
              console.warn("Failed to convert audio URL to blob:", e);
            }
            clearInterval(interval);
            setIsExtracting(false);
            toast.success("Audio extracted successfully!");
          } else if (status === "failed") {
            clearInterval(interval);
            setIsExtracting(false);
            toast.error(`Audio extraction failed: ${error?.message || "Unknown error"}`);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (e) {
        console.error("Error polling audio status:", e);
        clearInterval(interval);
        setIsExtracting(false);
        toast.error("Failed to check audio extraction status. Please try again.");
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      if (audioExtractionStatus === "processing") {
        setIsExtracting(false);
        toast.error(
          "Audio extraction is taking longer than expected. Please check back later."
        );
      }
    }, 5 * 60 * 1000);
  };

  // Cleanup job files on unmount
  useEffect(() => {
    return () => {
      if (audioExtractionJobId) {
        fetch(`${API_BASE_URL}/api/audio/cleanup-job/${audioExtractionJobId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.warn(
            `[Audio] Error cleaning up job files for ${audioExtractionJobId}:`,
            err.message
          );
        });
      }
    };
  }, [audioExtractionJobId || null]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
      <ToastContainer position="top-right" autoClose={5000} theme="light" />

      {/* <div className="w-full mb-4 px-1">
        {typeof onBack === "function" && (
          <button
            type="button"
            onClick={() => {
              if (audioExtractionJobId) {
                fetch(`${API_BASE_URL}/api/audio/cleanup-job/${audioExtractionJobId}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                }).catch(() => {});
              }
              onBack();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-rose-700 shadow-sm hover:bg-rose-50"
          >
            <span className="inline-block rotate-180">➜</span>
            Back
          </button>
        )}
      </div> */}

      <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-rose-700 flex items-center gap-2 mb-2">
          <FaPlay className="text-rose-500" /> Video Subtitle Tool
        </h2>
        <p className="text-gray-500 mb-2">Upload a source video and extract audio.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Source Video → Extracted Audio → Word-level SRT */}
          <div className="flex flex-col gap-4">
            {/* Source Video */}
            <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-rose-700 font-semibold">
                Source Video
              </div>
              
              {!videoFile ? (
                <div className="border-2 border-dashed border-rose-200 rounded-lg p-6 text-center hover:bg-rose-50 transition">
                  <label
                    htmlFor="subtitle-video-upload"
                    className="cursor-pointer flex flex-col items-center gap-2 p-4"
                  >
                    <FaUpload className="text-3xl text-rose-400" />
                    <span className="text-sm text-rose-600 font-medium">Upload from Computer</span>
                  </label>
                  <input
                    id="subtitle-video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative bg-white rounded-lg p-2 border border-rose-200 flex items-center gap-2">
                  <video
                    src={URL.createObjectURL(videoFile)}
                    className="w-36 h-24 object-cover rounded shadow"
                    controls
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rose-700 truncate">{`${videoFile.name.slice(0, 20)}${
                      videoFile.name.length > 20 ? "..." : ""
                    }`}</p>
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
              )}
            </div>

            {/* Extracted Audio */}
            <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3 text-rose-700 font-semibold">
                <FaVolumeUp /> Extracted Audio
                {typeof timers.extractAudioMs === "number" && (
                  <span className="ml-auto text-xs text-gray-500">{formatDuration(timers.extractAudioMs)}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={extractAudio}
                  disabled={!videoFile || isExtracting}
                  className={`px-4 py-2 rounded-lg ${
                    isExtracting
                      ? "bg-gray-300 text-gray-500"
                      : !videoFile
                      ? "bg-gray-200 text-gray-400"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  } font-medium`}
                >
                  {isExtracting ? "Extracting..." : "Extract Audio"}
                </button>
                {audioUrl && (
                  <audio controls src={audioUrl} className="flex-1">
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={generateWordSrt}
                  disabled={!extractedAudioUrl || isGeneratingWordSrt}
                  className={`px-4 py-2 rounded-lg ${
                    isGeneratingWordSrt
                      ? "bg-gray-300 text-gray-500"
                      : !extractedAudioUrl
                      ? "bg-gray-200 text-gray-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  } font-medium`}
                  title={!extractedAudioUrl ? "Extract audio first" : "Generate word-level SRT"}
                >
                  {isGeneratingWordSrt ? "Generating SRT..." : "Generate Word SRT"}
                </button>
              </div>
              {audioExtractionStatus === "processing" && (
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

            {/* Word-level SRT */}
            {wordSrtText && (
              <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="text-sm font-semibold text-rose-700 mb-2">Word-level SRT (Editable)</div>
                <textarea
                  className="w-full h-75 p-2 border border-gray-300 rounded text-xs font-mono resize-y"
                  value={wordSrtText}
                  onChange={(e) => setWordSrtText(e.target.value)}
                  placeholder="Edit the SRT content here..."
                />
              </div>
            )}
          </div>

          {/* Right Column: Add Subtitle */}
          <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-rose-700 mb-3">Add Subtitle</div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">Font:</label>
                <select
                  value={textOverlayFont}
                  onChange={(e) => setTextOverlayFont(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="khand">khand-bold</option>
                  <option value="notosans">notosans-regular</option>
                  <option value="poppins">poppins-bold</option>
                  <option value="amaticsc">AmaticSC-Regular</option>
                  <option value="bebasneue">BebasNeue-Regular</option>
                  <option value="comfortaa">Comfortaa-Variable</option>
                  <option value="exo2italic">Exo2-Italic-Variable</option>
                  <option value="orbitron">Orbitron-Regular</option>
                  <option value="pacifico">Pacifico-Regular</option>
                  <option value="shadowsintolight">ShadowsIntoLight-Regular</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">Text color:</label>
                <select
                  value={textOverlayColor}
                  onChange={(e) => setTextOverlayColor(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="white">White text </option>
                  <option value="black">Black text </option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">Background color:</label>
                <select
                  value={textOverlayBgColor}
                  onChange={(e) => setTextOverlayBgColor(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="black">Black</option>
                  <option value="white">White</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">Text position:</label>
                <select
                  value={textOverlayPosition}
                  onChange={(e) => setTextOverlayPosition(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">Background opacity:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={textOverlayOpacity}
                  onChange={(e) => setTextOverlayOpacity(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-10 text-right">{textOverlayOpacity.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={startSubtitleJob}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                Add Subtitle
              </button>
              {subtitleJobStatus === 'processing' && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-rose-600 h-2 rounded-full transition-all duration-300" style={{ width: `${subtitleJobProgress}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Processing...</div>
                </div>
              )}
              {subtitleVideoUrl && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Preview</div>
                  <video src={subtitleVideoUrl} className="w-[200px] h-[360px] rounded border border-rose-200" controls preload="metadata" />
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={sendToTelegram}
                      disabled={isSendingToTelegram}
                      className={`px-4 py-2 rounded-lg ${isSendingToTelegram ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-medium`}
                    >
                      {isSendingToTelegram ? 'Sending…' : 'Send to Telegram'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSubtitleTool;