import React, { useState, useEffect, useRef } from "react";
import { FaImage, FaFolder, FaTimes, FaInfoCircle, FaRedo, FaPencilAlt, FaMicrophone, FaSpinner, FaDownload, FaPlay } from "react-icons/fa";
import { HiInformationCircle } from "react-icons/hi";
import { API_BASE_URL } from "../../../config";

const BatchUpload = ({ onClose, imagePool }) => {
  const [dragged, setDragged] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const selectedImagesRef = useRef(selectedImages);
  const [script, setScript] = useState("");
  const [customMotion, setCustomMotion] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const pollingIntervalRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragged(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragged(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    // Only take the first image for video generation
    const firstImage = imageFiles[0];

    if (firstImage) {
      const imagePreview = {
        file: firstImage,
        preview: URL.createObjectURL(firstImage),
        id: Math.random().toString(36).substring(7),
      };

      setSelectedImages([imagePreview]);
      selectedImagesRef.current = [imagePreview];
    }
  };

  const calculateCharacterCount = (text) => {
    return text.length;
  };

  const calculateTimeLimit = (text) => {
    // Rough estimate: 1 second per 14 characters (average speaking speed)
    return Math.ceil(text.length / 14);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragged(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same folder again
    e.target.value = "";
  };

  const handleRemoveImage = (id) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Clean up the object URL to prevent memory leaks
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      selectedImagesRef.current = updated;
      return updated;
    });
  };

  // Update ref when selectedImages changes
  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
      // Clear polling interval on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Convert image file to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Poll for video status
  const pollVideoStatus = async (videoId) => {
    try {
      // Get token again for each poll request
      const token = 
        localStorage.getItem('usertoken') || 
        sessionStorage.getItem('clienttoken') || 
        localStorage.getItem('admintoken') ||
        localStorage.getItem('token') || 
        sessionStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/heygen/video-status/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check video status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error polling video status:', error);
      throw error;
    }
  };

  // Generate video using HeyGen API
  const handleGenerateVideo = async () => {
    if (!selectedImages.length || !script.trim()) {
      setError('Please upload an image and enter a script');
      return;
    }

    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    setGenerationStatus('Preparing image...');

    try {
      // Get auth token from localStorage or sessionStorage (check all possible keys)
      const token = 
        localStorage.getItem('usertoken') || 
        sessionStorage.getItem('clienttoken') || 
        localStorage.getItem('admintoken') ||
        localStorage.getItem('token') || 
        sessionStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Convert image to base64
      setGenerationStatus('Converting image...');
      const imageBase64 = await convertImageToBase64(selectedImages[0].file);

      // Call API to generate video
      setGenerationStatus('Uploading image and generating video...');
      const response = await fetch(`${API_BASE_URL}/api/heygen/generate-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          script: script.trim(),
          customMotion: customMotion.trim(),
          voice: selectedVoice || 'default'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();
      if (!data.success || !data.videoId) {
        throw new Error(data.error || 'Failed to get video ID');
      }

      // Start polling for video status
      setGenerationStatus('Video generation in progress...');
      const videoId = data.videoId;

      // Poll every 5 seconds
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await pollVideoStatus(videoId);
          
          if (statusData.success) {
            const status = statusData.status?.toLowerCase() || '';
            if ((status === 'completed' || status === 'done' || status === 'finished') && statusData.videoUrl) {
              // Video is ready
              clearInterval(pollingIntervalRef.current);
              setGenerating(false);
              setGenerationStatus(null);
              setVideoUrl(statusData.videoUrl);
            } else if (status === 'failed' || status === 'error' || statusData.error) {
              // Video generation failed
              clearInterval(pollingIntervalRef.current);
              setGenerating(false);
              setGenerationStatus(null);
              setError(statusData.error || 'Video generation failed');
            } else {
              // Still processing
              setGenerationStatus(`Processing... (${statusData.status || 'in progress'})`);
            }
          } else {
            throw new Error(statusData.error || 'Failed to check status');
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          // Continue polling unless it's a critical error
        }
      }, 5000);

      // Set timeout to stop polling after 5 minutes
      setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          if (generating) {
            setGenerating(false);
            setGenerationStatus(null);
            setError('Video generation timed out. Please try again.');
          }
        }
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('Error generating video:', error);
      setGenerating(false);
      setGenerationStatus(null);
      setError(error.message || 'Failed to generate video');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  };

  // Download video
  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `heygen-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset video generation
  const handleResetVideo = () => {
    setVideoUrl(null);
    setError(null);
    setGenerationStatus(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Close button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Title */}
      <div className="px-8 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Batch mode</h2>
      </div>

      {/* Main content area */}
      <div className="px-8 pb-8 flex-1 overflow-hidden">
        {selectedImages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 ${
                dragged
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 bg-gray-50"
              } transition-all duration-200`}
            >
            {/* Icon with "New" labels */}
            <div className="flex justify-center gap-8 mb-8">
              {[1, 2, 3].map((index) => (
                <div key={index} className="relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold whitespace-nowrap">
                    New
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-md transform rotate-6 hover:rotate-0 transition-transform duration-200">
                    <svg
                      className="w-full h-full text-white p-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.84L18.16 10H16v8H8v-8H5.84L12 5.84z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="text-center mb-8">
              <p className="text-xl font-bold text-gray-900 mb-2">
                Edit up to 10 images at once
              </p>
              <p className="text-gray-600">
                Drag and drop images or a folder on this page.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => document.getElementById("file-input").click()}
                className="flex items-center gap-3 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
              >
                <FaImage className="text-xl" />
                Import images
              </button>

              <button
                onClick={() => document.getElementById("folder-input").click()}
                className="flex items-center gap-3 bg-white text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <FaFolder className="text-xl" />
                Import folder
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              id="folder-input"
              type="file"
              multiple
              directory=""
              webkitdirectory=""
              onChange={handleFolderSelect}
              className="hidden"
            />
          </div>
          </div>
        ) : selectedImages.length > 0 ? (
          <div className="w-full h-full flex gap-6 py-4">
            {/* Left Side - Image/Video Display */}
            <div className="w-1/2 flex flex-col gap-4">
              {/* Generated Video Display */}
              {videoUrl && (
                <div className="flex-1 border-2 border-green-500 rounded-lg bg-gray-50 flex flex-col p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-green-700">Generated Video</span>
                    <button
                      onClick={handleResetVideo}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full max-h-[400px]"
                      autoPlay
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <button
                    onClick={handleDownloadVideo}
                    className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaDownload />
                    Download Video
                  </button>
                </div>
              )}

              {/* Original Image Display */}
              {!videoUrl && (
                <div className="flex-1 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center p-8">
                  <div className="w-full h-full relative">
                    <img
                      src={selectedImages[0].preview}
                      alt="Uploaded"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      onClick={() => {
                        handleRemoveImage(selectedImages[0].id);
                        setScript("");
                        setCustomMotion("");
                        setSelectedVoice("");
                        handleResetVideo();
                      }}
                      className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Controls */}
            <div className="w-1/2 flex flex-col gap-4 overflow-hidden h-full">
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
                {/* Script Input Area */}
                <div className="flex flex-col">
                  <div className="relative border-2 border-blue-500 rounded-lg min-h-[200px]">
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Type your script here, or upload / record audio"
                      className="w-full h-full min-h-[200px] p-4 rounded-lg resize-none focus:outline-none bg-transparent text-gray-900"
                      maxLength={210}
                    />
                    <button
                      onClick={() => setScript("")}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-500">
                      {calculateCharacterCount(script)} / 210 ({calculateTimeLimit(script)} sec max)
                    </div>
                  </div>

                  {/* Voice Selection and Sample Script */}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => {
                        // Voice selection logic here
                        setSelectedVoice("default");
                      }}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      Select voice
                    </button>
                    <button
                      onClick={() => setScript("Hello! Welcome to our platform. Let's create something amazing together.")}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      <FaPencilAlt className="w-4 h-4" />
                      Sample script
                    </button>
                  </div>
                </div>

                {/* Custom Motion Section */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">Custom motion</span>
                    <HiInformationCircle className="text-gray-400 w-4 h-4" />
                  </div>
                  <textarea
                    value={customMotion}
                    onChange={(e) => setCustomMotion(e.target.value)}
                    placeholder="Describe the gestures and facial expressions you want"
                    className="w-full min-h-[100px] p-4 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                  />
                  
                  {/* Motion Presets */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Giving an exciting announcement",
                      "Telling a funny story",
                      "Being sarcastic",
                      "Professional Instruction"
                    ].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setCustomMotion(preset)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors border border-gray-300"
                      >
                        {preset}
                      </button>
                    ))}
                    <button className="text-gray-400 hover:text-gray-600 p-2">
                      <FaRedo className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <FaInfoCircle />
                      <span className="font-semibold">Error</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1 break-words">{error}</p>
                  </div>
                )}

                {/* Generation Status */}
                {generationStatus && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <FaSpinner className="animate-spin" />
                      <span className="font-semibold">{generationStatus}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Video Button - Always visible at bottom */}
              <div className="pt-4 border-t border-gray-200 flex-shrink-0 bg-white">
                <button
                  onClick={handleGenerateVideo}
                  disabled={generating || !script.trim() || !selectedImages.length}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors shadow-md flex items-center justify-center gap-2 ${
                    generating || !script.trim() || !selectedImages.length
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {generating ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaPlay />
                      Generate video
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BatchUpload;

