import { useState, useCallback } from 'react';
import { createFolder, saveFile } from '../utils/fileSystemAPI';

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState('image'); // 'image', 'video', or 'audio'
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    tags: '',
    files: []
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files
    }));
    // Clear messages when new files are selected
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.category.trim()) {
        throw new Error('Please enter a category name');
      }

      if (!formData.name.trim()) {
        throw new Error('Please enter a folder name');
      }

      if (formData.files.length === 0) {
        throw new Error('Please select at least one file');
      }

      // Create folder with the given name in the category
      const folderPath = `${activeTab}s/${formData.name}`;
      await createFolder(folderPath, formData.category);

      // Save each file to the folder
      for (const file of formData.files) {
        await saveFile(folderPath, file, formData.category);
      }

      // Reset form
      setFormData({
        name: '',
        category: '',
        tags: '',
        files: []
      });

      setSuccess('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      setError(error.message || 'Error saving content. Please try again.');
    }
  };

  const getAcceptType = () => {
    switch (activeTab) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      default:
        return '*/*';
    }
  };

  return (
    <div className="bg-grey text-white h-full border border-white flex flex-col">
      <div className="p-4 border-b border-white">
        <h2 className="text-lg font-semibold mb-4">Content Library</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'image'
                ? 'bg-yellow-400 text-yellow-400'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'video'
                ? 'bg-yellow-400 text-yellow-400'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'audio'
                ? 'bg-yellow-400 text-yellow-400'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Audio
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {error && (
            <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-black">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-500 bg-opacity-20 border border-green-500 rounded text-black">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Folder Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
              placeholder="Enter folder name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
              placeholder="Enter tags (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
              accept={getAcceptType()}
            />
            {formData.files.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                {formData.files.length} file(s) selected
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full p-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-500 transition-colors"
          >
            Save Content
          </button>
        </form>
      </div>
    </div>
  );
} 