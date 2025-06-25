import React, { useState, useCallback } from "react";
import axios from "axios";
import {
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
];

const UploadShorts = ({ isAuthenticated }) => {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const validateVideo = useCallback((file) => {
    if (!file) throw new Error("Please select a video file");
    if (!ALLOWED_VIDEO_TYPES.includes(file.type))
      throw new Error(
        "Invalid file type. Please upload MP4, MOV, or MKV video files only."
      );
    if (file.size > MAX_FILE_SIZE)
      throw new Error("File is too large. Maximum size is 100MB.");
    return true;
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null);
    setSuccess(false);
    setUploadedVideoUrl(null);
    setDebugInfo(null);
    try {
      if (file) {
        validateVideo(file);
        setVideo(file);
      }
    } catch (err) {
      setError(err.message);
      e.target.value = "";
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      if (!video) throw new Error("Please select a video file");
      if (!title.trim()) throw new Error("Please enter a title for your video");
      validateVideo(video);
      setIsUploading(true);
      setError(null);
      setSuccess(false);
      setUploadedVideoUrl(null);
      setDebugInfo(null);
      const formData = new FormData();
      formData.append("video", video);
      formData.append("title", title);
      const res = await axios.post(
        `${API_BASE_URL}/api/youtube/upload`,
        formData,
        {
          withCredentials: true,
          onUploadProgress: (e) => {
            const progress = Math.round((e.loaded * 100) / e.total);
            setProgress(progress);
          },
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSuccess(true);
      setUploadedVideoUrl(res.data.url);
      setTitle("");
      setVideo(null);
      setProgress(0);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      let errorMessage = "Failed to upload video";
      let debugData = null;
      if (err.response) {
        errorMessage = err.response.data.error || errorMessage;
        debugData = {
          stage: err.response.data.stage,
          details: err.response.data.details,
          status: err.response.status,
          apiError: err.response.data.apiError,
        };
        if (err.response.status === 401) {
          errorMessage = "Please reconnect your YouTube account and try again";
        }
      } else if (err.request) {
        errorMessage =
          "Cannot connect to server. Please check your internet connection.";
        debugData = { type: "network_error" };
      } else {
        errorMessage = err.message;
        debugData = { type: "request_setup_error" };
      }
      setError(errorMessage);
      setDebugInfo(debugData);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <form onSubmit={handleUpload} className="mb-4">
      <h5 className="mb-3 text-lg font-semibold">Upload YouTube Short</h5>

      {/* Video File Input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video File{" "}
          <span className="text-gray-500">(MP4, MOV, or MKV, max 100MB)</span>
        </label>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/x-matroska"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Title Input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setError(null);
            setTitle(e.target.value);
          }}
          placeholder="Enter your short's title"
          disabled={isUploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <FaExclamationCircle className="text-red-500 mr-2 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
          {debugInfo && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
            <span className="text-green-700">Video uploaded successfully!</span>
            {uploadedVideoUrl && (
              <a
                href={uploadedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 underline hover:text-blue-800"
              >
                View your video on YouTube
              </a>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-red-500 h-2.5 rounded-full transition-all duration-300 ease-out animate-pulse"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-600 mt-1">
            {progress}%
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
        disabled={isUploading || !video || !title.trim()}
      >
        {isUploading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <FaUpload className="mr-2" />
            Post Short
          </>
        )}
      </button>

      {/* Note */}
      <div className="text-gray-500 text-sm text-center mt-2">
        Note: Videos will be uploaded as public YouTube Shorts
      </div>
    </form>
  );
};

export default UploadShorts;
