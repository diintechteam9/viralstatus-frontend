import React, { useState } from "react";
import { FaUpload, FaTrash, FaPlay, FaVolumeUp } from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../config.js";

const VideoToReelsTool = ({ onBack }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [srtText, setSrtText] = useState("");
  const [isGeneratingSrt, setIsGeneratingSrt] = useState(false);
  const [wordSrtText, setWordSrtText] = useState("");
  const [importantLoading, setImportantLoading] = useState(false);
  const [importantSentences, setImportantSentences] = useState([]);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [reelUrl, setReelUrl] = useState(null);
  
  // Video job tracking (same as ManualVideoGeneration)
  const [videoJobId, setVideoJobId] = useState(null);
  const [videoJobProgress, setVideoJobProgress] = useState(0);
  const [videoJobStatus, setVideoJobStatus] = useState(null);

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
    try {
      setIsExtracting(true);
      setAudioUrl(null);
      const formData = new FormData();
      formData.append("video", videoFile);
      const response = await axios.post(`${API_BASE_URL}/api/vtr/extract-audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setSrtText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to extract audio");
    } finally {
      setIsExtracting(false);
    }
  };

  const generateSrt = async () => {
    if (!audioUrl) return;
    try {
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

      // Also fetch word-level SRT in parallel after sentence-level succeeds
      try {
        const { data: wordData } = await axios.post(`${API_BASE_URL}/api/vtr/generate-srt-words`, { audio: base64 }, {
          headers: { "Content-Type": "application/json" },
          responseType: "text",
        });
        setWordSrtText(typeof wordData === 'string' ? wordData : String(wordData));
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

  // Job status polling function (same as ManualVideoGeneration)
  const pollJobStatus = async (jobId) => {
    setVideoJobId(jobId);
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vtr/job-status/${jobId}`);
        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.job) {
          const { status, progress, videoUrl, error } = data.job;
          
          setVideoJobStatus(status);
          setVideoJobProgress(progress);
          
          if (status === 'completed' && videoUrl) {
            // Video generation completed successfully
            setReelUrl(videoUrl);
            setIsGeneratingReel(false);
            clearInterval(pollInterval);
            alert('Reel generated successfully!');
          } else if (status === 'failed') {
            // Video generation failed
            setIsGeneratingReel(false);
            clearInterval(pollInterval);
            alert(`Reel generation failed: ${error?.message || 'Unknown error'}`);
          }
          // Continue polling for 'pending' and 'processing' statuses
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setIsGeneratingReel(false);
        clearInterval(pollInterval);
        alert('Failed to check reel generation status. Please try again.');
      }
    }, 2000); // Poll every 2 seconds
    
    // Clear interval after 10 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (videoJobStatus === 'processing') {
        setIsGeneratingReel(false);
        alert('Reel generation is taking longer than expected. Please check back later.');
      }
    }, 10 * 60 * 1000); // 10 minutes
  };

  const generateImportant = async () => {
    if (!srtText) return;
    try {
      setImportantLoading(true);
      setImportantSentences([]);
      const resp = await axios.post(`${API_BASE_URL}/api/vtr/important-sentences`, {
        srt: srtText,
        count: 3
      });
      const arr = resp.data?.sentences || [];
      setImportantSentences(Array.isArray(arr) ? arr : []);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate important sentences");
    } finally {
      setImportantLoading(false);
    }
  };

  const generateReel = async () => {
    if (!videoFile || importantSentences.length === 0 || !srtText) return;
    try {
      setIsGeneratingReel(true);
      setReelUrl(null);
      setVideoJobProgress(0);
      setVideoJobStatus(null);
      
      // Use async endpoint instead of synchronous
      const form = new FormData();
      form.append('video', videoFile);
      form.append('srt', srtText);
      if (wordSrtText) form.append('wordSrt', wordSrtText);
      form.append('sentences', JSON.stringify(importantSentences));
      form.append('portrait', 'false');
      
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

  return (
    <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
      <div className="w-full mb-4 px-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-rose-700 shadow-sm hover:bg-rose-50"
        >
          <span className="inline-block rotate-180">➜</span>
          Back
        </button>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-rose-700 flex items-center gap-2 mb-2">
          <FaPlay className="text-rose-500" /> Video to Reels
        </h2>
        <p className="text-gray-500 mb-2">Upload a source video to get started.</p>

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
            <div className="relative bg-white rounded-lg p-2 border border-rose-200 flex items-center gap-2">
              <video
                src={URL.createObjectURL(videoFile)}
                className="w-36 h-24 object-cover rounded shadow"
                controls
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-700 truncate">{videoFile.name}</p>
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

        {/* Extracted Audio Preview */}
        {videoFile && (
          <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-rose-700 font-semibold">
              <FaVolumeUp /> Extracted Audio
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={extractAudio}
                disabled={isExtracting}
                className={`px-4 py-2 rounded-lg ${isExtracting ? 'bg-gray-300 text-gray-500' : 'bg-rose-600 hover:bg-rose-700 text-white'} font-medium`}
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
          </div>
        )}

        {srtText && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-blue-700 font-semibold mb-2">Sentence-level SRT</div>
                <div className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-gray-800 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  {srtText}
                </div>
              </div>
              <div>
                <div className="text-purple-700 font-semibold mb-2">Word-level SRT</div>
                <div className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-gray-800 bg-purple-50 p-3 rounded-lg border border-purple-100">
                  {wordSrtText || '—'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={generateImportant}
                disabled={importantLoading}
                className={`px-4 py-2 rounded-lg ${importantLoading ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} font-medium`}
              >
                {importantLoading ? 'Finding...' : 'Important Sentences'}
              </button>
            </div>
          </div>
        )}

        {importantSentences.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
            <div className="text-emerald-700 font-semibold mb-2">Top Sentences (in order)</div>
            <ol className="list-decimal pl-5 space-y-2 text-gray-800">
              {importantSentences.map((s, idx) => (
                <li key={idx} className="bg-emerald-50 p-2 rounded border border-emerald-100">
                  {s}
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={generateReel}
                disabled={isGeneratingReel}
                className={`px-4 py-2 rounded-lg ${isGeneratingReel ? 'bg-gray-300 text-gray-500' : 'bg-rose-600 hover:bg-rose-700 text-white'} font-medium`}
              >
                {isGeneratingReel ? (
                  videoJobStatus === 'processing' 
                    ? `Generating Reel... ${videoJobProgress || 0}%`
                    : 'Starting Reel Generation...'
                ) : 'Generate Reel'}
              </button>
            </div>
            
            {/* Progress bar for reel generation */}
            {isGeneratingReel && videoJobProgress > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-rose-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${videoJobProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  {videoJobStatus === 'processing' ? 'Processing...' : 'Initializing...'}
                </div>
              </div>
            )}
            {reelUrl && (
              <div className="mt-4">
                <video src={reelUrl} className="w-full rounded-xl border-2 border-rose-200 shadow-lg" controls />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToReelsTool;


