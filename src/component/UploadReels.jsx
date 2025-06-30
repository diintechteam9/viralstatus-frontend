import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const UploadReels = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a video file.");
      return;
    }
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("video", file);

    try {
      await axios.post(`${API_BASE_URL}/api/instagram/upload-reel`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });
      setStatus("Upload successful! Your Reel is being processed.");
    } catch (err) {
      setStatus("Upload failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center mt-2">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      <button
        className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        onClick={handleUpload}
        disabled={!file}
      >
        Upload Instagram Reels
      </button>
      {progress > 0 && <div className="mt-1 text-sm">Progress: {progress}%</div>}
      {status && <div className="mt-1 text-sm">{status}</div>}
    </div>
  );
};

export default UploadReels; 