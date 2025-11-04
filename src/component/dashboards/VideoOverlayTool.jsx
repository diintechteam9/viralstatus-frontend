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
  FaCompress,
  FaUsers,
} from "react-icons/fa";
import S3VideoSelector from "./S3VideoSelector";
import S3ImageVideoSelector from "./S3ImageVideoSelector";    
import PrompttoImage from "./PrompttoImage.jsx";
import VideoToReelsTool from "../Tools/VideoToReelsTool.jsx";
// import ImagePromptToVideoPixverse from "./ImagePromptToVideoPixverse.jsx";
import ImagePromptToVideoVeo from "../Tools/ImagePromptToVideoVeo.jsx";
import VideoCompressionTool from "../Tools/VideoCompressionTool.jsx";
import TextToAudioTool from "../Tools/TextToAudioTool.jsx";
import VideoToSegments from "../Tools/VideoToSegments.jsx";
import Dashboard from "../Tools/leadcapturetool/Dashboard.jsx";
import VideoSubtitleTool from "../Tools/VideoSubtitleTool.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://legaleeai.com";

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
  const [selectedCard, setSelectedCard] = useState(null);
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
      const response = await fetch(`${API_BASE_URL}/api/video/overlay`, {
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
      {selectedCard === null ? (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 py-12 px-4">
          <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <button
              type="button"
              onClick={() => setSelectedCard(1)}
              className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-blue-700">Video Overlay Tool</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FaLayerGroup />
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">Click to open the overlay editor</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCard(2)}
              className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-emerald-700">Text to Image</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  T2I
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">Click to open the generator</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCard(3)}
              className="group relative overflow-hidden rounded-2xl border border-purple-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-purple-700">Image to Video</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <FaFilm />
                </span>
              </div>
              <p className="mt-3 text-xs text-purple-600">Click to open the generator</p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCard(4)}
              className="group relative overflow-hidden rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-cyan-700">Video Compression</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <FaCompress />
                </span>
              </div>
              <p className="mt-3 text-xs text-cyan-600">Click to open the compressor</p>
            </button>

{/* this is the card for the video to reels tool */}


            <button
              type="button"
              onClick={() => setSelectedCard(5)}
              className="group relative overflow-hidden rounded-2xl border border-rose-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-100/60 blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tool</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-rose-700">Video to Reels</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FaVideo />
              </span>
            </div>
              <p className="mt-3 text-xs text-rose-600">Click to open the generator</p>
            </button>




            <button
              type="button"
              onClick={() => setSelectedCard(7)}
              className="group relative overflow-hidden rounded-2xl border border-rose-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-100/60 blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tool</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-rose-700">Video to Segments</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FaVideo />
              </span>
            </div>
              <p className="mt-3 text-xs text-rose-600">Click to open the generator</p>
            </button>




           
            <button
              type="button"
              onClick={() => setSelectedCard(6)}
              className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-amber-700">Text to Audio</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FaPlay />
                </span>
              </div>
              <p className="mt-3 text-xs text-amber-600">Click to open the generator</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCard(8)}
              className="group relative overflow-hidden rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-indigo-700">Lead Capture</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaUsers />
                </span>
              </div>
              <p className="mt-3 text-xs text-indigo-600">Click to open the dashboard</p>
            </button>


            <button
              type="button"
              onClick={() => setSelectedCard(9)}
              className="group relative overflow-hidden rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md text-left"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/60 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tool</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-indigo-700">Video Caption Tool</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaUsers />
                </span>
              </div>
              <p className="mt-3 text-xs text-indigo-600">Click to open the tool</p>
            </button>
          </div>
        </div>
      ) : selectedCard === 1 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-blue-700 shadow-sm hover:bg-blue-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row gap-8">
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
                  <label className="flex text-sm font-medium text-gray-700 mb-1 items-center gap-2">
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
      ) : selectedCard === 2 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full">
            <PrompttoImage/>
          </div>
        </div>
      ) : selectedCard === 3 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-purple-700 shadow-sm hover:bg-purple-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full">
            <ImagePromptToVideoVeo/>
          </div>
        </div>
      ) : selectedCard === 4 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-cyan-700 shadow-sm hover:bg-cyan-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full">
            <VideoCompressionTool/>
          </div>
        </div>
      ) : selectedCard === 5 ? (
        <VideoToReelsTool onBack={() => setSelectedCard(null)} />
      ) : selectedCard === 7 ? (
        <VideoToSegments pool={null} onBack={() => setSelectedCard(null)} />
      ) : selectedCard === 6 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-700 shadow-sm hover:bg-amber-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full">
            <TextToAudioTool />
          </div>
        </div>
      ): selectedCard === 9 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-700 shadow-sm hover:bg-amber-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full">
            <VideoSubtitleTool onBack={() => setSelectedCard(null)} />
          </div>
        </div>
      ): selectedCard === 8 ? (
        <div className="flex flex-col min-h-screen w-full bg-white py-8 px-2">
          <div className="w-full mb-4 px-1">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-indigo-700 shadow-sm hover:bg-indigo-50"
            >
              <span className="inline-block rotate-180">➜</span>
              Back
            </button>
          </div>
          <div className="w-full">
            <Dashboard />
          </div>
        </div>
      ) : null}
      {selectedCard === 1 && showS3Modal && (
        <S3VideoSelector
          onClose={() => setShowS3Modal(false)}
          onVideoSelect={handleS3VideoSelect}
        />
      )}
      {selectedCard === 1 && showS3OverlayModal && (
        <S3ImageVideoSelector
          onClose={() => setShowS3OverlayModal(false)}
          onFileSelect={handleS3OverlaySelect}
        />
      )}
    </>
  );
};

export default VideoOverlayTool;
