import React, { useState, useRef } from "react";
import {
  FaUpload,
  FaTrash,
  FaVideo,
  FaDownload,
  FaCog,
  FaPlay,
  FaFilm,
  FaLayerGroup,
  FaClock,
  FaCloudUploadAlt,
} from "react-icons/fa";
import S3VideoSelector from "./S3VideoSelector";
import S3ImageVideoSelector from "./S3ImageVideoSelector";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const overlayPositions = [
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "full-screen", label: "Full Screen" },
];

const VideoOverlayTool = () => {
  const [mainVideo, setMainVideo] = useState(null);
  const [overlayFile, setOverlayFile] = useState(null);
  const [overlayStart, setOverlayStart] = useState(0);
  const [overlayPosition, setOverlayPosition] = useState("bottom-left");
  const [overlayDuration, setOverlayDuration] = useState(0);
  const [overlayVideoDuration, setOverlayVideoDuration] = useState(0);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showS3Modal, setShowS3Modal] = useState(false);
  const [showS3OverlayModal, setShowS3OverlayModal] = useState(false);
  const overlayVideoRef = useRef(null);

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event, isMain) => {
    const file = event.target.files[0];
    if (!file) return;

    if (isMain) {
      setMainVideo(file);
    } else {
      setOverlayFile(file);

      // If it's a video file, get its duration
      if (file.type.startsWith("video/")) {
        try {
          const duration = await getVideoDuration(file);
          setOverlayVideoDuration(duration);
          setOverlayDuration(Math.round(duration)); // Set default duration to full video length
        } catch (err) {
          console.error("Error getting video duration:", err);
          setOverlayVideoDuration(0);
          setOverlayDuration(0);
        }
      } else {
        // For images, set a default duration of 5 seconds
        setOverlayVideoDuration(0);
        setOverlayDuration(5);
      }
    }
  };

  const handleRemoveFile = (isMain) => {
    if (isMain) {
      setMainVideo(null);
    } else {
      setOverlayFile(null);
      setOverlayVideoDuration(0);
      setOverlayDuration(0);
    }
    setProcessedVideoUrl(null);
    setError(null);
  };

  const handleS3VideoSelect = async (videoUrl, videoName) => {
    try {
      // Fetch the video from the S3 URL
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      // Create a File object from the blob
      const file = new File([blob], videoName, { type: blob.type });

      // Set this file as the main video
      setMainVideo(file);
      setShowS3Modal(false); // Close the modal
    } catch (err) {
      console.error("Error fetching video from S3:", err);
      setError("Failed to load video from S3.");
    }
  };

  const handleS3OverlaySelect = async (fileUrl, fileName, mimeType) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType });

      setOverlayFile(file);

      if (file.type.startsWith("video/")) {
        try {
          const duration = await getVideoDuration(file);
          setOverlayVideoDuration(duration);
          setOverlayDuration(Math.round(duration));
        } catch (err) {
          setOverlayVideoDuration(0);
          setOverlayDuration(0);
        }
      } else {
        setOverlayVideoDuration(0);
        setOverlayDuration(5);
      }
      setShowS3OverlayModal(false);
    } catch (err) {
      console.error("Error fetching file from S3:", err);
      setError("Failed to load file from S3.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessedVideoUrl(null);
    if (!mainVideo || !overlayFile) {
      setError("Please select both a main video and an overlay file.");
      return;
    }
    if (overlayStart < 0) {
      setError("Overlay start time cannot be negative.");
      return;
    }
    if (overlayDuration <= 0) {
      setError("Overlay duration must be greater than 0.");
      return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("mainVideo", mainVideo);
      formData.append("overlayFile", overlayFile);
      formData.append("overlayStart", overlayStart);
      formData.append("overlayPosition", overlayPosition);
      formData.append("overlayDuration", overlayDuration);
      const response = await fetch(`${API_BASE_URL}/video/overlay`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to process overlay");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedVideoUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedVideoUrl) return;
    const a = document.createElement("a");
    a.href = processedVideoUrl;
    a.download = `overlayed-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 py-8 px-2">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row gap-8">
          {/* Left: Controls */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-2 mb-2">
              <FaLayerGroup className="text-blue-500" /> Video Overlay Tool
            </h2>
            <p className="text-gray-500 mb-4">
              Easily overlay a video or image onto your main video. Choose
              position, start time, duration, and preview the result instantly.
            </p>

            {/* Main Video Upload */}
            <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold">
                <FaFilm /> Main Video
              </div>
              {!mainVideo ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:bg-blue-50 transition">
                  <div className="flex justify-around items-center">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                      id="main-video-upload"
                    />
                    <label
                      htmlFor="main-video-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 p-4"
                    >
                      <FaUpload className="text-3xl text-blue-400" />
                      <span className="text-sm text-blue-600 font-medium">
                        Upload from Computer
                      </span>
                    </label>

                    <div className="w-px h-12 bg-gray-300"></div>

                    <button
                      type="button"
                      onClick={() => setShowS3Modal(true)}
                      className="cursor-pointer flex flex-col items-center gap-2 p-4"
                    >
                      <FaCloudUploadAlt className="text-3xl text-blue-400" />
                      <span className="text-sm text-blue-600 font-medium">
                        Select from S3
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative bg-white rounded-lg p-2 border border-blue-200 flex items-center gap-2">
                  <video
                    src={URL.createObjectURL(mainVideo)}
                    className="w-32 h-20 object-cover rounded shadow"
                    controls
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 truncate">
                      {mainVideo.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(true)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full ml-2"
                    title="Remove main video"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Overlay File Upload */}
            <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold">
                <FaVideo /> Overlay File (Video or Image)
              </div>
              {!overlayFile ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 transition">
                  <div className="flex justify-around items-center">
                    <label
                      htmlFor="overlay-file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-blue-100"
                    >
                      <FaUpload className="text-3xl text-blue-400" />
                      <span className="text-sm text-blue-600 font-medium">
                        Upload from Computer
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                      id="overlay-file-upload"
                    />

                    <div className="w-px h-16 bg-gray-300"></div>

                    <button
                      type="button"
                      onClick={() => setShowS3OverlayModal(true)}
                      className="cursor-pointer flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-blue-100"
                    >
                      <FaCloudUploadAlt className="text-3xl text-blue-400" />
                      <span className="text-sm text-blue-600 font-medium">
                        Select from S3
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative bg-white rounded-lg p-2 border border-blue-200 flex items-center gap-2">
                  {overlayFile.type.startsWith("video/") ? (
                    <video
                      ref={overlayVideoRef}
                      src={URL.createObjectURL(overlayFile)}
                      className="w-32 h-20 object-cover rounded shadow"
                      controls
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(overlayFile)}
                      className="w-32 h-20 object-cover rounded shadow"
                      alt="Overlay"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 truncate">
                      {overlayFile.name}
                    </p>
                    {overlayFile.type.startsWith("video/") &&
                      overlayVideoDuration > 0 && (
                        <p className="text-xs text-gray-500">
                          Duration: {formatTime(overlayVideoDuration)}
                        </p>
                      )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(false)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full ml-2"
                    title="Remove overlay file"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Overlay Settings */}
            <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                <FaCog /> Overlay Settings
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overlay Start Time (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={overlayStart}
                      onChange={(e) => {
                        const intValue = parseInt(e.target.value, 10);
                        setOverlayStart(isNaN(intValue) ? 0 : intValue);
                      }}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overlay Position
                    </label>
                    <select
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                      value={overlayPosition}
                      onChange={(e) => setOverlayPosition(e.target.value)}
                      disabled={isProcessing}
                    >
                      {overlayPositions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Overlay Duration */}
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaClock /> Overlay Duration (seconds)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={overlayDuration}
                      onChange={(e) => {
                        const intValue = parseInt(e.target.value, 10);
                        setOverlayDuration(isNaN(intValue) ? 0 : intValue);
                      }}
                      className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-300"
                      disabled={isProcessing}
                    />
                    {overlayFile &&
                      overlayFile.type.startsWith("video/") &&
                      overlayVideoDuration > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOverlayDuration(Math.round(overlayVideoDuration))
                          }
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-medium transition"
                          disabled={isProcessing}
                        >
                          Use Full Duration
                        </button>
                      )}
                  </div>
                  {overlayDuration > 0 && (
                    <p className="text-xs text-gray-500">
                      Overlay will play for {formatTime(overlayDuration)}
                      {overlayFile &&
                        overlayFile.type.startsWith("video/") &&
                        overlayVideoDuration > 0 &&
                        ` (${
                          overlayDuration >= overlayVideoDuration
                            ? "full video"
                            : `${Math.round(
                                (overlayDuration / overlayVideoDuration) * 100
                              )}% of video`
                        })`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button & Error */}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-lg font-semibold shadow transition-all duration-200 ${
                !mainVideo ||
                !overlayFile ||
                isProcessing ||
                overlayStart < 0 ||
                overlayDuration <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              disabled={
                !mainVideo ||
                !overlayFile ||
                isProcessing ||
                overlayStart < 0 ||
                overlayDuration <= 0
              }
            >
              <FaLayerGroup />
              {isProcessing ? "Processing..." : "Overlay Now"}
            </button>
            {error && (
              <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
                {error}
              </div>
            )}
          </form>

          {/* Right: Output Preview */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-inner p-6 min-h-[400px]">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-xl mb-4">
              <FaPlay /> Output Preview
            </div>
            {processedVideoUrl ? (
              <>
                <video
                  src={processedVideoUrl}
                  className="w-full max-w-md h-64 object-contain rounded-xl border-2 border-blue-200 shadow-lg mb-4"
                  controls
                />
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-semibold shadow"
                >
                  <FaDownload />
                  Download Processed Video
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                <FaLayerGroup className="text-6xl mb-4" />
                <span className="text-lg font-medium">
                  Your overlayed video will appear here
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {showS3Modal && (
        <S3VideoSelector
          onClose={() => setShowS3Modal(false)}
          onVideoSelect={handleS3VideoSelect}
        />
      )}
      {showS3OverlayModal && (
        <S3ImageVideoSelector
          onClose={() => setShowS3OverlayModal(false)}
          onFileSelect={handleS3OverlaySelect}
        />
      )}
    </>
  );
};

export default VideoOverlayTool;
