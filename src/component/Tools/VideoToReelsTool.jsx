import React, { useState, useEffect } from "react";
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
  const [reelUrls, setReelUrls] = useState([]);
  const [videoLoadErrors, setVideoLoadErrors] = useState({});
  const [imagePrompts, setImagePrompts] = useState({});
  const [promptLoading, setPromptLoading] = useState({});
  const [imagePromptLists, setImagePromptLists] = useState({});
  const [generatedImages, setGeneratedImages] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [imageProgress, setImageProgress] = useState({});
  const [individualImageLoading, setIndividualImageLoading] = useState({}); // { [paragraphIdx]: { [promptIdx]: bool } }
  
  // Individual prompt states for each position - completely independent
  const [individualPrompts, setIndividualPrompts] = useState({}); // { [paragraphIdx]: { [promptIdx]: string } }
  
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

  // Normalize API image payloads from various backends
  // - If already a data URL, return as-is
  // - If plain base64 string, wrap as JPEG data URL
  // - If array of images, map and normalize all
  const normalizeApiImages = (data) => {
    const toDataUrl = (val) => {
      if (!val || typeof val !== 'string') return null;
      if (val.startsWith('data:image/')) return val;
      // Assume base64 payload without prefix
      return `data:image/jpeg;base64,${val}`;
    };

    if (Array.isArray(data?.images)) {
      return data.images.map(toDataUrl).filter(Boolean);
    }
    if (data?.image) {
      const single = toDataUrl(data.image);
      return single ? [single] : [];
    }
    // Some providers might nest differently; fallback to empty
    return [];
  };

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
          const { status, progress, videoUrl, videos, error } = data.job;
          
          // Debug logging
          console.log('Job status response:', { status, progress, videoUrl, videos, error });
          
          setVideoJobStatus(status);
          setVideoJobProgress(progress);
          
          if (status === 'completed' && (videoUrl || (videos && videos.length))) {
            // Video generation completed successfully
            console.log('Setting video URLs:', { videoUrl, videos });
            setReelUrl(videoUrl || null);
            setReelUrls(Array.isArray(videos) ? videos.map(v => v.url) : []);
            setIsGeneratingReel(false);
            clearInterval(pollInterval);
            alert('Reel generated successfully!');
            
            // Clean up job files after successful completion
            cleanupJobFiles(jobId);
          } else if (status === 'failed') {
            // Video generation failed
            setIsGeneratingReel(false);
            clearInterval(pollInterval);
            alert(`Reel generation failed: ${error?.message || 'Unknown error'}`);
            
            // Clean up job files after failure
            cleanupJobFiles(jobId);
          } else if (status === 'completed' && !videoUrl && (!videos || !videos.length)) {
            // Job completed but no video URL found
            console.error('Job completed but no video URL found:', data.job);
            setIsGeneratingReel(false);
            clearInterval(pollInterval);
            alert('Reel generation completed but no video URL was found. Please check the server logs.');
            
            // Clean up job files even if no video was found
            cleanupJobFiles(jobId);
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

  // Reset prompts when important sentences change
  useEffect(() => {
    setImagePrompts({});
  }, [importantSentences]);

  // Cleanup job files when component unmounts
  useEffect(() => {
    return () => {
      if (videoJobId) {
        cleanupJobFiles(videoJobId);
      }
    };
  }, [videoJobId]);

  const buildImagePromptFromSentence = (sentence) => {
    const trimmed = (sentence || "").trim();
    return `Highly detailed, cinematic vertical scene capturing: "${trimmed}". Use engaging composition, soft natural lighting, vivid colors, shallow depth of field. Social-media ready, photorealistic, 4k.`;
  };

  const handleGeneratePrompt = (idx, sentence) => {
    if (!sentence) return;
    setPromptLoading(prev => ({ ...prev, [idx]: true }));
    // Call backend to generate up to 5 prompts
    fetch(`${API_BASE_URL}/api/vtr/generate-image-prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraph: sentence, max: 5 })
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Failed (${resp.status})`);
        }
        return resp.json();
      })
      .then((data) => {
        const prompts = Array.isArray(data?.prompts) ? data.prompts : [];
        setImagePromptLists(prev => ({ ...prev, [idx]: prompts }));
        
        // Store individual prompts in their respective positions
        const individualPromptsUpdate = {};
        prompts.forEach((prompt, promptIdx) => {
          individualPromptsUpdate[promptIdx] = prompt;
        });
        setIndividualPrompts(prev => ({
          ...prev,
          [idx]: {
            ...(prev[idx] || {}),
            ...individualPromptsUpdate
          }
        }));
        
        // Store as multi-line string to display nicely
        const display = prompts.length
          ? prompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n')
          : buildImagePromptFromSentence(sentence);
        setImagePrompts(prev => ({ ...prev, [idx]: display }));
      })
      .catch((e) => {
        // Fallback locally so user still sees a prompt
        const fallback = buildImagePromptFromSentence(sentence);
        setImagePromptLists(prev => ({ ...prev, [idx]: [fallback] }));
        
        // Store fallback in individual prompts
        setIndividualPrompts(prev => ({
          ...prev,
          [idx]: {
            ...(prev[idx] || {}),
            0: fallback
          }
        }));
        
        setImagePrompts(prev => ({ ...prev, [idx]: fallback }));
      })
      .finally(() => setPromptLoading(prev => ({ ...prev, [idx]: false })));
  };

  const parseEditablePrompts = (text) => {
    if (!text) return [];
    return String(text)
      .split(/\n+/)
      .map(s => s.replace(/^\s*\d+\.\s*/, ''))
      .filter(s => s !== '') // Only filter out completely empty strings, not whitespace
      .slice(0, 10);
  };

  const handleGenerateImage = async (idx) => {
    const sentence = importantSentences[idx];
    if (!sentence) return;
    const edited = parseEditablePrompts(imagePrompts[idx]);
    const list = (edited.length > 0)
      ? edited
      : (Array.isArray(imagePromptLists[idx]) && imagePromptLists[idx].length > 0
        ? imagePromptLists[idx]
        : [buildImagePromptFromSentence(sentence)]);

    // Generate all images for the paragraph
    setGeneratedImages(prev => ({ ...prev, [idx]: [] }));
    setImageLoading(prev => ({ ...prev, [idx]: true }));
    setImageProgress(prev => ({ ...prev, [idx]: { current: 0, total: list.length } }));

    try {
      for (let i = 0; i < list.length; i++) {
        const prompt = list[i];
        // call backend for a single image per prompt
        const resp = await fetch(`${API_BASE_URL}/api/videocard/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, number_of_images: 1, aspect_ratio: '9:16' })
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error || `Failed (${resp.status})`);
        }
        const data = await resp.json();
        const normalized = normalizeApiImages(data);
        const first = normalized[0] || null;
        if (first) {
          setGeneratedImages(prev => {
            const existing = Array.isArray(prev[idx]) ? prev[idx] : [];
            return { ...prev, [idx]: [...existing, first] };
          });
        }
        setImageProgress(prev => ({ ...prev, [idx]: { current: i + 1, total: list.length } }));
      }
    } catch (e) {
      alert(e.message || 'Failed to generate image');
    } finally {
      setImageLoading(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleGenerateIndividualImage = async (paragraphIdx, promptIdx) => {
    // Get the individual prompt for this specific position
    const paragraphPrompts = individualPrompts[paragraphIdx] || {};
    const prompt = paragraphPrompts[promptIdx];
    if (!prompt || prompt === '') return;

    setIndividualImageLoading(prev => ({
      ...prev,
      [paragraphIdx]: { ...(prev[paragraphIdx] || {}), [promptIdx]: true }
    }));

    try {
      const resp = await fetch(`${API_BASE_URL}/api/videocard/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, number_of_images: 1, aspect_ratio: '9:16' })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${resp.status})`);
      }
      const data = await resp.json();
      const normalized = normalizeApiImages(data);
      const first = normalized[0] || null;
      if (first) {
        setGeneratedImages(prev => {
          const existing = Array.isArray(prev[paragraphIdx]) ? prev[paragraphIdx] : [];
          const updated = [...existing];
          updated[promptIdx] = first;
          return { ...prev, [paragraphIdx]: updated };
        });
      }
    } catch (e) {
      alert(e.message || 'Failed to generate image');
    } finally {
      setIndividualImageLoading(prev => ({
        ...prev,
        [paragraphIdx]: { ...(prev[paragraphIdx] || {}), [promptIdx]: false }
      }));
    }
  };

  const generateReel = async () => {
    if (!videoFile || importantSentences.length === 0 || !srtText) return;
    // Ensure word-level SRT and at least one image exist before proceeding
    const hasWordSrt = !!wordSrtText && String(wordSrtText).trim().length > 0;
    const allImages = importantSentences.map((_, idx) => Array.isArray(generatedImages[idx]) ? generatedImages[idx] : []).flat();
    if (!hasWordSrt) {
      alert('Please generate Word-level SRT before creating the reel.');
      return;
    }
    if (allImages.length === 0) {
      alert('Please generate at least one image before creating the reel.');
      return; 
    }
    try {
      setIsGeneratingReel(true);
      setReelUrl(null);
      setReelUrls([]);
      setVideoJobProgress(0);
      setVideoJobStatus(null);
      
      // Use async endpoint instead of synchronous
      const form = new FormData();
      form.append('video', videoFile);
      form.append('srt', srtText);
      if (wordSrtText) form.append('wordSrt', wordSrtText);
      form.append('sentences', JSON.stringify(importantSentences));
      form.append('portrait', 'false');
      // Include all generated images (data URLs) for overlay step
      form.append('images', JSON.stringify(allImages));
      
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
          onClick={() => {
            // Clean up job files when navigating away
            if (videoJobId) {
              cleanupJobFiles(videoJobId);
            }
            onBack();
          }}
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
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-rose-700 font-semibold">
              <FaVolumeUp /> Extracted Audio
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
          </div>
        </div>

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
            <div className="text-emerald-700 font-semibold mb-3">Top Important Sentences</div>
            <div className="space-y-3">
              {importantSentences.map((s, idx) => (
                <div key={idx} className="bg-emerald-50 p-3 rounded border border-emerald-100">
                  <div className="text-sm text-gray-600 mb-1">Paragraph {idx + 1}</div>
                  <div className="text-gray-800 mb-2">{s}</div>
                  <button
                    type="button"
                    onClick={() => handleGeneratePrompt(idx, s)}
                    disabled={!!promptLoading[idx]}
                    className={`px-3 py-1.5 rounded-md ${promptLoading[idx] ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} text-sm`}
                  >
                    {promptLoading[idx] ? 'Generating...' : 'Generate Prompt'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {importantSentences.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-800">Image Prompts</h4>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 shadow-sm h-[600px] flex flex-col">
              <div className="space-y-4 overflow-y-auto flex-1">
                {importantSentences.map((_, idx) => {
                  // Get individual prompts for this paragraph, initialize if not exists
                  const paragraphPrompts = individualPrompts[idx] || {};
                  const displayPrompts = Array.from({ length: 5 }, (_, i) => paragraphPrompts[i] || '');
                  
                  return (
                    <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-orange-700">Paragraph {idx + 1}</div>
                        <button
                          type="button"
                          onClick={() => handleGenerateImage(idx)}
                          disabled={!!imageLoading[idx]}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-1 ${imageLoading[idx] ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105'}`}
                        >
                          {imageLoading[idx] ? (
                            <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span>Generate All</span>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {displayPrompts.map((prompt, promptIdx) => (
                          <div key={promptIdx} className="flex items-start gap-3 p-3 bg-orange-50 rounded border border-orange-200">
                            <div className="w-full lg:w-1/2 xl:w-[55%]">
                              <span className="text-xs font-medium text-orange-600 mb-1 block">Prompt {promptIdx + 1}:</span>
                              <textarea
                                rows={4}
                                className="w-full text-orange-600 leading-relaxed rounded border border-orange-200 bg-white p-2 resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                                value={prompt}
                                onChange={(e) => {
                                  // Update individual prompt for this specific position
                                  setIndividualPrompts(prev => ({
                                    ...prev,
                                    [idx]: {
                                      ...(prev[idx] || {}),
                                      [promptIdx]: e.target.value
                                    }
                                  }));
                                  
                                  // Also update the legacy imagePrompts for backward compatibility
                                  const updatedPrompts = displayPrompts
                                    .map((p, i) => i === promptIdx ? e.target.value : p)
                                    .map((p, i) => p !== '' ? `${i + 1}. ${p}` : '')
                                    .filter(p => p !== '')
                                    .join('\n\n');
                                  setImagePrompts(prev => ({ ...prev, [idx]: updatedPrompts }));
                                }}
                                placeholder="Enter prompt text..."
                              />
                            </div>
                            <div className="flex items-start gap-3 w-full lg:w-[45%] min-w-[300px]">
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleGenerateIndividualImage(idx, promptIdx)}
                                  disabled={!!(individualImageLoading[idx] && individualImageLoading[idx][promptIdx])}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-1 ${(individualImageLoading[idx] && individualImageLoading[idx][promptIdx]) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105'}`}
                                >
                                  {(individualImageLoading[idx] && individualImageLoading[idx][promptIdx]) ? (
                                    <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                  <span>Generate</span>
                                </button>
                                
                                {Array.isArray(generatedImages[idx]) && generatedImages[idx][promptIdx] && (
                                  <div className="relative">
                                    <img
                                      src={generatedImages[idx][promptIdx]}
                                      alt={`Image for prompt ${promptIdx + 1}`}
                                      className="w-28 h-40 md:w-32 md:h-48 object-contain rounded border border-amber-200 bg-white cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        // Create a simple preview modal
                                        const modal = document.createElement('div');
                                        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
                                        modal.innerHTML = `
                                          <div class="relative max-w-4xl max-h-[90vh] w-full mx-4">
                                            <div class="bg-white rounded-lg overflow-hidden shadow-2xl">
                                              <div class="flex items-center justify-between p-4 border-b border-gray-200">
                                                <h3 class="text-lg font-semibold text-gray-800">Image Preview</h3>
                                                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
                                                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                                </button>
                                              </div>
                                              <div class="p-4">
                                                <img src="${generatedImages[idx][promptIdx]}" alt="Preview" class="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg" />
                                              </div>
                                            </div>
                                          </div>
                                        `;
                                        document.body.appendChild(modal);
                                      }}
                                      title="Click to preview image"
                                    />
                                  </div>
                                )}
                                
                                {(!prompt || prompt === '') && (
                                  <div className="w-28 h-40 md:w-32 md:h-48 flex items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-400 text-xs text-center">
                                    Enter prompt to generate image
                                  </div>
                                )}
                                
                                {imageLoading[idx] && imageProgress[idx] && (
                                  <div className="text-xs text-gray-500">Generating {imageProgress[idx].current}/{imageProgress[idx].total}...</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Separate row: Generate button and reel previews (outside green bordered box) */}
        {importantSentences.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="flex flex-col gap-2">
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

                {isGeneratingReel && (
                  <div className="mt-1">
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
              </div>

              <div className="md:col-span-2">
                {(reelUrls && reelUrls.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reelUrls.map((url, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="text-sm text-gray-600 mb-1">Reel {idx + 1}</div>
                        {!videoLoadErrors[url] ? (
                          <video 
                            src={url} 
                            className="w-full rounded-xl border-2 border-rose-200 shadow-lg" 
                            controls 
                            preload="metadata"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Video loading error:', e);
                              console.error('Video URL:', url);
                              setVideoLoadErrors(prev => ({ ...prev, [url]: true }));
                            }}
                            onLoadStart={() => console.log('Video loading started:', url)}
                            onCanPlay={() => console.log('Video can play:', url)}
                          />
                        ) : (
                          <div className="w-full h-64 rounded-xl border-2 border-red-200 bg-red-50 flex flex-col items-center justify-center">
                            <div className="text-red-600 text-sm mb-2">Video failed to load</div>
                            <div className="text-xs text-gray-500 mb-2">URL: {url.substring(0, 50)}...</div>
                            <button 
                              onClick={() => {
                                setVideoLoadErrors(prev => ({ ...prev, [url]: false }));
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Open in new tab
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  reelUrl && (
                    <div>
                      {!videoLoadErrors[reelUrl] ? (
                        <video 
                          src={reelUrl} 
                          className="w-full rounded-xl border-2 border-rose-200 shadow-lg" 
                          controls 
                          preload="metadata"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Video loading error:', e);
                            console.error('Video URL:', reelUrl);
                            setVideoLoadErrors(prev => ({ ...prev, [reelUrl]: true }));
                          }}
                          onLoadStart={() => console.log('Video loading started:', reelUrl)}
                          onCanPlay={() => console.log('Video can play:', reelUrl)}
                        />
                      ) : (
                        <div className="w-full h-64 rounded-xl border-2 border-red-200 bg-red-50 flex flex-col items-center justify-center">
                          <div className="text-red-600 text-sm mb-2">Video failed to load</div>
                          <div className="text-xs text-gray-500 mb-2">URL: {reelUrl.substring(0, 50)}...</div>
                          <button 
                            onClick={() => {
                              setVideoLoadErrors(prev => ({ ...prev, [reelUrl]: false }));
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        <a href={reelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToReelsTool;


