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
  const [imagePrompts, setImagePrompts] = useState({});
  const [promptLoading, setPromptLoading] = useState({});
  const [imagePromptLists, setImagePromptLists] = useState({});
  const [generatedImages, setGeneratedImages] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [imageProgress, setImageProgress] = useState({});
  
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
          const { status, progress, videoUrl, videos, error } = data.job;
          
          setVideoJobStatus(status);
          setVideoJobProgress(progress);
          
          if (status === 'completed' && (videoUrl || (videos && videos.length))) {
            // Video generation completed successfully
            setReelUrl(videoUrl || null);
            setReelUrls(Array.isArray(videos) ? videos.map(v => v.url) : []);
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

  // Reset prompts when important sentences change
  useEffect(() => {
    setImagePrompts({});
  }, [importantSentences]);

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
        setImagePrompts(prev => ({ ...prev, [idx]: fallback }));
      })
      .finally(() => setPromptLoading(prev => ({ ...prev, [idx]: false })));
  };

  const parseEditablePrompts = (text) => {
    if (!text) return [];
    return String(text)
      .split(/\n+/)
      .map(s => s.replace(/^\s*\d+\.\s*/, '').trim())
      .filter(Boolean)
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
        const imgs = Array.isArray(data?.images) ? data.images : [];
        const first = imgs[0] || null;
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
            <div className="text-emerald-700 font-semibold mb-3">Top Sentences and Image Prompts</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Paragraphs (half width) */}
              <div>
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

              {/* Right: Image Prompts (half width) */}
              <div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-full">
                  <div className="text-gray-700 font-semibold mb-2">Image Prompts</div>
                  <div className="space-y-3">
                    {importantSentences.map((_, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-gray-500 mb-1">For Paragraph {idx + 1}</div>
                        {promptLoading[idx] ? (
                          <div className="text-sm text-gray-500 mb-2">Generating...</div>
                        ) : (
                          <textarea
                            value={imagePrompts[idx] || ''}
                            onChange={(e) => setImagePrompts(prev => ({ ...prev, [idx]: e.target.value }))}
                            placeholder="— Click Generate Prompt on the left —"
                            className="w-full min-h-[120px] text-sm text-gray-800 bg-white p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleGenerateImage(idx)}
                            disabled={!!imageLoading[idx]}
                            className={`px-3 py-1.5 rounded-md ${imageLoading[idx] ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'} text-sm`}
                          >
                            {imageLoading[idx] ? 'Creating...' : 'Generate Image'}
                          </button>
                        </div>
                        {Array.isArray(generatedImages[idx]) && generatedImages[idx].length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-600 mb-1">Results</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {generatedImages[idx].map((src, i) => (
                                <img key={i} src={src} alt={`Paragraph ${idx + 1} - ${i + 1}`} className="w-full h-40 object-cover rounded border" />
                              ))}
                            </div>
                          </div>
                        )}
                        {imageLoading[idx] && imageProgress[idx] && (
                          <div className="mt-2 text-xs text-gray-500">Generating {imageProgress[idx].current}/{imageProgress[idx].total}...</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
            {(reelUrls && reelUrls.length > 0) ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {reelUrls.map((url, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="text-sm text-gray-600 mb-1">Reel {idx + 1}</div>
                    <video src={url} className="w-full rounded-xl border-2 border-rose-200 shadow-lg" controls />
                  </div>
                ))}
              </div>
            ) : (
              reelUrl && (
                <div className="mt-4">
                  <video src={reelUrl} className="w-full rounded-xl border-2 border-rose-200 shadow-lg" controls />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToReelsTool;


