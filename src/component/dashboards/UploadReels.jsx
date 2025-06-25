import React, { useState, useCallback } from "react";
import {
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

const UploadReels = ({ isAuthenticated, userId }) => {
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);

  const validateVideo = useCallback((file) => {
    if (!file) throw new Error("Please select a video file");
    if (!ALLOWED_VIDEO_TYPES.includes(file.type))
      throw new Error(
        "Invalid file type. Please upload MP4 or MOV video files only."
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
      if (!caption.trim())
        throw new Error("Please enter a caption for your reel");
      validateVideo(video);
      setIsUploading(true);
      setError(null);
      setSuccess(false);
      setUploadedVideoUrl(null);
      const formData = new FormData();
      formData.append("video", video);
      formData.append("caption", caption);
      formData.append("userId", userId);
      const response = await fetch(
        `${API_BASE_URL}/api/instagram/reels/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload reel");
      }
      const data = await response.json();
      setSuccess(true);
      setUploadedVideoUrl(data.url);
      setCaption("");
      setVideo(null);
      setProgress(0);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload reel");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <form onSubmit={handleUpload} className="mb-4">
      <h5 className="mb-3 text-lg font-semibold">Upload Instagram Reel</h5>

      {/* Video File Input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video File{" "}
          <span className="text-gray-500">(MP4 or MOV, max 100MB)</span>
        </label>
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Caption Input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => {
            setError(null);
            setCaption(e.target.value);
          }}
          placeholder="Write a caption for your reel..."
          disabled={isUploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
          style={{ minHeight: 100 }}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
          <FaExclamationCircle className="text-red-500 mr-2 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-2">
          <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
          <span className="text-green-700">Reel uploaded successfully!</span>
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
        disabled={isUploading || !video || !caption.trim()}
      >
        {isUploading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <FaUpload className="mr-2" />
            Post Reel
          </>
        )}
      </button>

      {/* Note */}
      <div className="text-gray-500 text-sm text-center mt-2">
        Note: Videos will be uploaded as Instagram Reels
      </div>
    </form>
  );
};

export default UploadReels;
