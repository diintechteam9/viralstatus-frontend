import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const emptyPromptState = () => ({ prompt: '', images: [], loading: false, error: '' });

function downloadURI(uri, name) {
  const link = document.createElement('a');
  link.href = uri;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const PrompttoImage = () => {
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

  const generateImage = async (idx) => {
    setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, loading: true, error: '', images: [] } : row));
    try {
      const res = await axios.post(`${API_BASE_URL}/api/videocard/generate-image`, {
        prompt: promptRows[idx].prompt,
        style: 'realistic',
        aspect_ratio: '9:16',
        seed: '5'
      });
      if (res.data.success && res.data.image) {
        const dataUrl = `data:image/jpeg;base64,${res.data.image}`;
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, images: [dataUrl], loading: false } : row));
      } else {
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, error: res.data.error || 'Failed to generate image', loading: false } : row));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to generate image. Please try again.';
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
      if (row.prompt.trim()) {
        await generateImageSequential(idx);
        await new Promise(resolve => setTimeout(resolve, 7000)); // Wait 5 seconds before next
      }
    }
  };

  // Helper for sequential generation
  const generateImageSequential = async (idx) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/videocard/generate-image`, {
        prompt: promptRows[idx].prompt,
        style: 'realistic',
        aspect_ratio: '9:16',
        seed: '5'
      });
      if (res.data.success && res.data.image) {
        const dataUrl = `data:image/jpeg;base64,${res.data.image}`;
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, images: [dataUrl], loading: false } : row));
      } else {
        setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, error: res.data.error || 'Failed to generate image', loading: false } : row));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to generate image. Please try again.';
      setPromptRows(rows => rows.map((row, i) => i === idx ? { ...row, error: errorMessage, loading: false } : row));
    }
  };

  const downloadAll = () => {
    promptRows.forEach((row, idx) => {
      if (row.images && row.images.length > 0) {
        downloadURI(row.images[0], `image${idx + 1}`);
      }
    });
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
            title="Download all images"
            disabled={promptRows.every(row => !row.images || row.images.length === 0)}
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
          <div key={idx} className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-gray-50 rounded-lg shadow-inner px-2 sm:px-4 py-3 mb-6 border border-gray-200">
            <div className="w-full sm:w-24 text-lg font-semibold text-green-700 text-center select-none mb-2 sm:mb-0">Prompt {idx + 1}</div>
            <textarea
              value={row.prompt}
              onChange={e => handlePromptChange(idx, e.target.value)}
              onKeyPress={e => handleKeyPress(e, idx)}
              placeholder="Enter the image prompt..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-800 text-base shadow-sm transition-all duration-150 w-full min-w-0 resize-y"
              rows={4}
              style={{ minWidth: 0 }}
            />
            <button
              onClick={() => generateImage(idx)}
              disabled={row.loading || !row.prompt.trim()}
              className={`w-full sm:w-auto py-2 px-5 rounded-lg font-semibold shadow-md transition-all duration-150 text-white text-base ${
                row.loading || !row.prompt.trim()
                  ? 'bg-green-300 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-400'
              }`}
              style={{ minWidth: 120 }}
            >
              {row.loading ? 'Generating...' : 'Generate Image'}
            </button>
            <div className="flex justify-center items-center w-full sm:w-auto min-h-[64px] min-w-[80px]">
              {row.loading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                  <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">Generating...</p>
                </div>
              ) : (
                row.images.length > 0 && (
                  <div className="flex items-center gap-2">
                    <img
                      src={row.images[0]}
                      alt="Generated"
                      className="border-2 border-green-300 rounded-lg shadow object-contain bg-white cursor-pointer"
                      style={{ width: 64, height: 64, marginLeft: 0 }}
                      onClick={() => setPreviewImg(row.images[0])}
                      onError={() => {
                        handlePromptChange(idx, row.prompt); // clear error on image error
                      }}
                    />
                    <a
                      href={row.images[0]}
                      download={`image${idx + 1}`}
                      className="ml-1 p-2 rounded-full bg-green-100 hover:bg-green-200 border border-green-300 shadow transition"
                      title="Download image"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-9 8h10" />
                      </svg>
                    </a>
                  </div>
                )
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

export default PrompttoImage;