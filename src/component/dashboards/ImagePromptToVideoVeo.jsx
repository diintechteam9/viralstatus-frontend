  import React, { useState } from 'react';
  import axios from 'axios';
  import { API_BASE_URL } from '../../config';

  const emptyPromptState = () => ({ prompt: '', uploadedImage: null, videos: [], loading: false, error: '' });

  function downloadURI(uri, name) {
    const link = document.createElement('a');
    link.href = uri;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadFile(url, filename) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      downloadURI(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      console.error('Download failed:', e);
      // Fallback: try direct link
      downloadURI(url, filename);
    }
  }

  const ImagePromptToVideoVeo = () => {
    const [promptRows, setPromptRows] = useState([emptyPromptState()]);
    const [previewImg, setPreviewImg] = useState(null); // For modal preview

    const handlePromptChange = (idx, value) => {
      setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, prompt: value, error: row.error && value.trim() ? '' : row.error } : row));
    };

    const handleKeyPress = (e, idx) => {
      if (e.key === 'Enter' && !promptRows[idx].loading && promptRows[idx].prompt.trim()) {
        generateImage(idx);
      }
    };

    const handleImageUpload = (idx, file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, error: 'Please upload an image file' } : row));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        // Store both dataURL and mimeType for backend
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, uploadedImage: dataUrl, imageMimeType: file.type, error: '' } : row));
      };
      reader.readAsDataURL(file);
    };

    const generateVideo = async (idx) => {
      setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, loading: true, error: '', images: [] } : row));
      try {
        const row = promptRows[idx];
        if (!row.uploadedImage) {
          throw new Error('Please upload an image first');
        }
        const imageBase64 = row.uploadedImage.startsWith('data:') ? row.uploadedImage.split(',')[1] : row.uploadedImage;
        const res = await axios.post(`${API_BASE_URL}/api/videocard/generate-video-veo`, {
          prompt: row.prompt,
          imageBase64,
          imageMimeType: row.imageMimeType || 'image/jpeg',
          aspect_ratio: '9:16',
        durationSeconds: '5',
          resolution: '720p',
          generateAudio: false,
          sampleCount: 1
        });
        if (res.data.success && Array.isArray(res.data.videos) && res.data.videos.length > 0) {
          setPromptRows(rows => rows.map((r, i) => i === idx ? { ...r, videos: [res.data.videos[0]], loading: false } : r));
        } else {
          setPromptRows(rows => rows.map((r, i) => i === idx ? { ...r, error: res.data.error || 'Failed to generate video', loading: false } : r));
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to generate video. Please try again.';
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, error: errorMessage, loading: false } : row));
      }
    };

    const addPromptRow = () => {
      setPromptRows(rows => [...rows, emptyPromptState()]);
    };

    const generateAll = async () => {
      setPromptRows(rows => rows.map(row => (row.prompt.trim() && !row.loading) ? { ...row, loading: true, error: '', images: [] } : row));
      for (let idx = 0; idx < promptRows.length; idx++) {
        const row = promptRows[idx];
        if (row.prompt.trim() && row.uploadedImage) {
          await generateVideoSequential(idx);
          await new Promise(resolve => setTimeout(resolve, 7000)); // Wait 7 seconds before next
        }
      }
    };

    // Helper for sequential generation
    const generateVideoSequential = async (idx) => {
      try {
        const row = promptRows[idx];
        if (!row.uploadedImage) {
          setPromptRows(rows => rows.map((r, i) => i === idx ? { ...r, error: 'Please upload an image first', loading: false } : r));
          return;
        }
        const imageBase64 = row.uploadedImage.startsWith('data:') ? row.uploadedImage.split(',')[1] : row.uploadedImage;
        const res = await axios.post(`${API_BASE_URL}/api/videocard/generate-video-veo`, {
          prompt: row.prompt,
          imageBase64,
          imageMimeType: row.imageMimeType || 'image/jpeg',
          aspect_ratio: '9:16',
        durationSeconds: '5',
          resolution: '720p',
          generateAudio: false,
          sampleCount: 1
        });
        if (res.data.success && Array.isArray(res.data.videos) && res.data.videos.length > 0) {
          setPromptRows(rows => rows.map((r, i) => i === idx ? { ...r, videos: [res.data.videos[0]], loading: false } : r));
        } else {
          setPromptRows(rows => rows.map((r, i) => i === idx ? { ...r, error: res.data.error || 'Failed to generate video', loading: false } : r));
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to generate video. Please try again.';
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, error: errorMessage, loading: false } : row));
      }
    };

    const downloadAll = async () => {
      for (let idx = 0; idx < promptRows.length; idx++) {
        const row = promptRows[idx];
        if (row.videos && row.videos.length > 0) {
          // Download sequentially to avoid browser throttling
          // eslint-disable-next-line no-await-in-loop
          await downloadFile(row.videos[0], `video${idx + 1}.mp4`);
        }
      }
    };

    return (
      
        <div className="bg-white shadow-xl rounded-xl p-4 sm:p-8 w-full flex flex-col items-center border border-gray-100 relative">
          <h2 className="text-2xl font-extrabold mb-6 text-center text-green-700 tracking-tight drop-shadow-sm w-full">
            <span>AI Image Generation</span>
          </h2>
          <div className="flex flex-wrap gap-2 justify-end w-full mb-6">
            <button
              onClick={downloadAll}
              className="px-4 py-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 shadow transition font-semibold text-yellow-800"
              title="Download all videos"
              disabled={promptRows.every(row => !row.videos || row.videos.length === 0)}
            >
              Download All
            </button>
            <button
              onClick={generateAll}
              className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 border border-blue-300 shadow transition font-semibold text-blue-800"
              title="Generate all images"
              disabled={promptRows.every(row => !row.prompt.trim() || row.loading)}
            >
              Generate All
            </button>
            <button
              onClick={addPromptRow}
              className="px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-300 shadow transition font-semibold text-green-800"
              title="Add prompt row"
            >
              Add Prompt
            </button>
          </div>
          {promptRows.map((row, idx) => (
            <div key={idx} className="w-full flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 bg-gray-50 rounded-lg shadow-inner px-2 sm:px-4 py-3 mb-6 border border-gray-200">
              <div className="w-full sm:w-24 text-lg font-semibold text-green-700 text-center select-none mb-2 sm:mb-0">Prompt {idx + 1}</div>
              <div className="w-auto flex-shrink-0">
              <textarea
                value={row.prompt}
                onChange={e => handlePromptChange(idx, e.target.value)}
                onKeyPress={e => handleKeyPress(e, idx)}
                placeholder="Enter the image prompt..."
                  className="w-[500px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-800 text-base shadow-sm transition-all duration-150 resize-y"
                  rows={6}
                />
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                    className="w-auto max-w-[180px] py-2 px-3 rounded-lg font-semibold shadow-md transition-all duration-150 border border-gray-300 bg-white text-gray-700"
                    title="Upload image for this prompt"
                    style={{ minWidth: 120 }}
              />
              <button
                    onClick={() => generateVideo(idx)}
                disabled={row.loading || !row.prompt.trim()}
                    className={`py-2 px-5 rounded-lg font-semibold shadow-md transition-all duration-150 text-white text-base ${
                  row.loading || !row.prompt.trim()
                    ? 'bg-green-300 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-400'
                }`}
                    style={{ minWidth: 140 }}
              >
                    {row.loading ? 'Generating...' : 'Generate Video'}
              </button>
                </div>
              </div>
              <div className="flex items-center min-h-[64px] min-w-[200px] flex-shrink-0 ml-3">
                {row.loading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                    <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">Generating...</p>
                  </div>
                ) : (
                  row.videos.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <video
                        src={row.videos[0]}
                        controls
                        className="border-2 border-green-300 rounded-lg shadow bg-black"
                        style={{ width: 160, height: 284, marginLeft: 0 }}
                      />
                      <button
                        type="button"
                        onClick={() => downloadFile(row.videos[0], `video${idx + 1}.mp4`)}
                        className="ml-1 p-2 rounded-full bg-green-100 hover:bg-green-200 border border-green-300 shadow transition"
                        title="Download video"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-9 8h10" />
                        </svg>
                      </button>
                    </div>
                  ) : row.uploadedImage ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={row.uploadedImage}
                        alt="Uploaded"
                        className="border-2 border-green-300 rounded-lg shadow bg-black object-contain"
                        style={{ width: 160, height: 284, marginLeft: 0 }}
                      />
                    </div>
                  ) : null
                )}
              </div>
              {row.error && (
                <div className="w-full text-red-500 text-xs mt-2 sm:mt-0 sm:ml-2 bg-red-50 p-2 rounded border border-red-200">
                  {row.error}
                </div>
              )}
            </div>
          ))}
          {/* Image Preview Modal */}
          {previewImg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setPreviewImg(null)}>
              <div className="relative bg-white rounded-lg shadow-lg p-4" onClick={e => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-2xl font-bold" onClick={() => setPreviewImg(null)}>&times;</button>
                <img src={previewImg} alt="Preview" className="max-w-[80vw] max-h-[80vh] rounded-lg shadow" />
              </div>
            </div>
          )}
        </div>
    );
  };

  export default ImagePromptToVideoVeo;