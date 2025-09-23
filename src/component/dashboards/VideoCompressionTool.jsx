import React, { useState, useRef, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileVideo, 
  Settings,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config.js';

const VideoCompressionTool = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [customSettings, setCustomSettings] = useState({
    width: 1280,
    height: 720,
    bitrate: '3000k',
    crf: 20
  });
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState('blue');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const themes = {
    blue: {
      primary: 'from-blue-500 to-blue-700',
      secondary: 'from-blue-400 to-blue-600',
      accent: 'bg-blue-100 text-blue-800',
      border: 'border-blue-200',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    purple: {
      primary: 'from-purple-500 to-purple-700',
      secondary: 'from-purple-400 to-purple-600',
      accent: 'bg-purple-100 text-purple-800',
      border: 'border-purple-200',
      text: 'text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    green: {
      primary: 'from-green-500 to-green-700',
      secondary: 'from-green-400 to-green-600',
      accent: 'bg-green-100 text-green-800',
      border: 'border-green-200',
      text: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700'
    },
    orange: {
      primary: 'from-orange-500 to-orange-700',
      secondary: 'from-orange-400 to-orange-600',
      accent: 'bg-orange-100 text-orange-800',
      border: 'border-orange-200',
      text: 'text-orange-700',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    pink: {
      primary: 'from-pink-500 to-pink-700',
      secondary: 'from-pink-400 to-pink-600',
      accent: 'bg-pink-100 text-pink-800',
      border: 'border-pink-200',
      text: 'text-pink-700',
      button: 'bg-pink-600 hover:bg-pink-700'
    }
  };

  const qualityPresets = [
    { id: '720p', name: '720p HD', icon: <Monitor className="w-5 h-5" />, description: 'High Definition', bitrate: '3000k', color: 'text-orange-600' },
    { id: '480p', name: '480p SD', icon: <Tablet className="w-5 h-5" />, description: 'Standard Definition', bitrate: '1500k', color: 'text-yellow-600' },
    { id: '360p', name: '360p', icon: <Smartphone className="w-5 h-5" />, description: 'Medium Quality', bitrate: '800k', color: 'text-green-600' },
    { id: '240p', name: '240p', icon: <Smartphone className="w-5 h-5" />, description: 'Low Quality', bitrate: '400k', color: 'text-blue-600' },
    { id: '144p', name: '144p', icon: <Smartphone className="w-5 h-5" />, description: 'Very Low Quality', bitrate: '200k', color: 'text-gray-600' },
    { id: 'custom', name: 'Custom', icon: <Settings className="w-5 h-5" />, description: 'Custom Settings', bitrate: 'Variable', color: 'text-purple-600' }
  ];

  const currentTheme = themes[theme];

  // Load job history on component mount
  useEffect(() => {
    loadJobHistory();
  }, []);

  const loadJobHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/compression/jobs`);
      
      if (response.data.success && response.data.data && response.data.data.jobs) {
        setJobHistory(response.data.data.jobs);
      } else {
        console.error('Invalid response structure:', response.data);
        setJobHistory([]);
      }
    } catch (error) {
      console.error('Failed to load job history:', error);
      setJobHistory([]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB limit
      toast.error('File size must be less than 5GB');
      return;
    }

    setSelectedFile(file);
    toast.success('Video file selected successfully');
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const response = await axios.post(`${API_BASE_URL}/api/compression/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success && response.data.data) {
        setUploadedFile(response.data.data);
        toast.success('Video uploaded successfully!');
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  const startCompression = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a video first');
      return;
    }

    try {
      setIsCompressing(true);
      setCompressionProgress(0);

      const response = await axios.post(`${API_BASE_URL}/api/compression/start`, {
        jobId: uploadedFile.jobId,
        quality: selectedQuality,
        customSettings: selectedQuality === 'custom' ? customSettings : null
      });

      setCurrentJob(response.data.data);
      toast.success('Compression started!');

      // Start polling for progress
      startProgressPolling(response.data.data.jobId);
    } catch (error) {
      setIsCompressing(false);
      toast.error(error.response?.data?.message || 'Failed to start compression');
    }
  };

  const startProgressPolling = (jobId) => {
    progressIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/compression/status/${jobId}`);

        const job = response.data.data;
        setCompressionProgress(job.progress);

        if (job.status === 'completed') {
          setIsCompressing(false);
          setCompressionProgress(100);
          setCurrentJob(job); // Set the complete job data for preview
          clearInterval(progressIntervalRef.current);
          toast.success('Compression completed successfully!');
          loadJobHistory();
        } else if (job.status === 'failed') {
          setIsCompressing(false);
          clearInterval(progressIntervalRef.current);
          toast.error(`Compression failed: ${job.errorMessage}`);
        }
      } catch (error) {
        console.error('Failed to get job status:', error);
      }
    }, 2000);
  };

  const downloadCompressedVideo = async (jobId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/compression/download/${jobId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compressed_video_${jobId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Clean up the file from server after download
      try {
        await axios.delete(`${API_BASE_URL}/api/compression/cleanup/${jobId}`);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file after download:', cleanupError);
      }

      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const cancelJob = async (jobId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/compression/cancel/${jobId}`);

      setIsCompressing(false);
      setCompressionProgress(0);
      clearInterval(progressIntervalRef.current);
      toast.success('Job cancelled successfully');
      loadJobHistory();
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  const resetTool = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    setCompressionProgress(0);
    setIsCompressing(false);
    setCurrentJob(null);
    clearInterval(progressIntervalRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Video Compression Tool
            </h1>
            <p className="text-gray-600 mt-2">Compress your videos with professional quality presets</p>
          </div>
          
          {/* Theme Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Theme:</span>
            <div className="flex space-x-1">
              {Object.keys(themes).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className={`w-6 h-6 rounded-full ${
                    theme === themeKey ? 'ring-2 ring-gray-400' : ''
                  }`}
                  style={{
                    background: themeKey === 'blue' ? '#3B82F6' :
                               themeKey === 'purple' ? '#8B5CF6' :
                               themeKey === 'green' ? '#10B981' :
                               themeKey === 'orange' ? '#F59E0B' :
                               themeKey === 'pink' ? '#EC4899' : '#3B82F6'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Compression Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-3 text-blue-600" />
                Upload Video
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? `border-${theme}-400 bg-${theme}-50` 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <FileVideo className="w-16 h-16 mx-auto text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedFile.name}</h3>
                      <p className="text-gray-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-700 flex items-center mx-auto"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-600">Drag & drop your video here</p>
                      <p className="text-gray-500">or click to browse</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-6 py-3 rounded-lg ${currentTheme.button} text-white font-medium hover:shadow-lg transition-all duration-300`}
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>

              {selectedFile && !uploadedFile && (
                <div className="mt-6 text-center">
                  <button
                    onClick={uploadFile}
                    className={`px-8 py-3 rounded-lg ${currentTheme.button} text-white font-medium hover:shadow-lg transition-all duration-300`}
                  >
                    Upload Video
                  </button>
                </div>
              )}
            </div>

            {/* Quality Selection */}
            {uploadedFile && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Settings className="w-6 h-6 mr-3 text-blue-600" />
                  Select Quality
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {qualityPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedQuality(preset.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        selectedQuality === preset.id
                          ? `${currentTheme.border} ${currentTheme.accent} border-2`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        <span className={preset.color}>{preset.icon}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                      <p className="text-sm text-gray-600">{preset.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{preset.bitrate}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Settings */}
                {selectedQuality === 'custom' && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                        <input
                          type="number"
                          value={customSettings.width}
                          onChange={(e) => setCustomSettings({...customSettings, width: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                        <input
                          type="number"
                          value={customSettings.height}
                          onChange={(e) => setCustomSettings({...customSettings, height: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bitrate</label>
                        <input
                          type="text"
                          value={customSettings.bitrate}
                          onChange={(e) => setCustomSettings({...customSettings, bitrate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 3000k"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CRF</label>
                        <input
                          type="number"
                          min="0"
                          max="51"
                          value={customSettings.crf}
                          onChange={(e) => setCustomSettings({...customSettings, crf: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={startCompression}
                    disabled={isCompressing}
                    className={`flex-1 px-6 py-3 rounded-lg ${currentTheme.button} text-white font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                  >
                    {isCompressing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Start Compression
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetTool}
                    className="px-6 py-3 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-all duration-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Progress Section */}
            {isCompressing && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <RefreshCw className="w-6 h-6 mr-3 text-blue-600 animate-spin" />
                  Compression Progress
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{compressionProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${currentTheme.primary} transition-all duration-500`}
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => currentJob && cancelJob(currentJob.jobId)}
                      className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-300 flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job History */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Jobs
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {showHistory ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {showHistory && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {jobHistory.slice(0, 5).map((job) => (
                    <div key={job._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {job.originalFileName}
                        </span>
                        {getStatusIcon(job.status)}
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Quality: {job.targetQuality}</p>
                        <p>Size: {formatFileSize(job.originalFileSize)}</p>
                        {job.status === 'completed' && (
                          <div className="flex items-center justify-between mt-2">
                            <span>Compressed: {formatFileSize(job.compressedFileSize)}</span>
                            <button
                              onClick={() => downloadCompressedVideo(job._id)}
                              className="text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Info */}
            {uploadedFile && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <FileVideo className="w-5 h-5 mr-2 text-blue-600" />
                  File Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-800 truncate ml-2">
                      {uploadedFile.originalFileName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatFileSize(uploadedFile.fileSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {uploadedFile.duration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dimensions:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {uploadedFile.dimensions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Codec:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {uploadedFile.codec}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Video Preview or Tips */}
            {currentJob && currentJob.status === 'completed' ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <FileVideo className="w-5 h-5 mr-2 text-green-600" />
                  Compressed Video Preview
                </h3>
                
                <div className="space-y-4">
                  <video
                    src={`${API_BASE_URL}/api/compression/download/${currentJob.jobId}`}
                    className="w-full h-48 object-contain rounded-xl border-2 border-green-200 shadow-lg"
                    controls
                    preload="metadata"
                  />
                  
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Quality:</span>
                      <span className="text-sm font-bold text-green-700">{currentJob.quality}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className="text-sm font-bold text-green-700">Completed</span>
                    </div>
                    {currentJob.compressionRatio && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Size Reduction:</span>
                        <span className="text-sm font-bold text-green-700">{currentJob.compressionRatio}%</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => downloadCompressedVideo(currentJob.jobId)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold shadow transition-all duration-300"
                  >
                    <Download className="w-4 h-4" />
                    Download Compressed Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Pro Tips
                </h3>
                
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Use 720p for social media posts
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    480p for standard web videos
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    144p for very small file sizes
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Custom settings for specific needs
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCompressionTool;
