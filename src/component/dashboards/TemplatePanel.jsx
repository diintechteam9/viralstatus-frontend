import { useState, useCallback, useEffect } from 'react';
import { getFolders, getFilesInFolder, deleteFolder, deleteCategory } from '../utils/fileSystemAPI';
import { FaTrash, FaChevronDown, FaChevronRight, FaArrowLeft } from 'react-icons/fa';

export default function TemplatePanel({ onGenerate }) {
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [showContent, setShowContent] = useState(null); // null, 'images', 'videos', or 'audio'
  const [categories, setCategories] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [numImages, setNumImages] = useState(5);
  const [duration, setDuration] = useState(10);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // New state variables for logo and outrow
  const [showLogo, setShowLogo] = useState(false);
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [showOutrow, setShowOutrow] = useState(false);
  const [showInrow, setShowInrow] = useState(false);

  useEffect(() => {
    if (showContent) {
      loadFolders();
    }
  }, [showContent]);

  const handleBack = () => {
    setShowContent(null);
    setSelectedFolder(null);
    setFolderFiles([]);
    setExpandedCategories(new Set());
    setExpandedFolders(new Set());
  };

  const loadFolders = async () => {
    try {
      const categoriesList = await getFolders(showContent);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleCategoryToggle = (categoryName) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleDeleteCategory = async (categoryName, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}" and all its contents?`)) {
      try {
        await deleteCategory(categoryName, showContent);
        setExpandedCategories(prev => {
          const newSet = new Set(prev);
          newSet.delete(categoryName);
          return newSet;
        });
        await loadFolders();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const handleFolderSelect = async (folder, category) => {
    try {
      if (expandedFolders.has(folder.path)) {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.delete(folder.path);
          return newSet;
        });
        setSelectedFolder(null);
        setFolderFiles([]);
      } else {
        const files = await getFilesInFolder(folder.path, category, showContent);
        setSelectedFolder(folder);
        setFolderFiles(files);
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(folder.path);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error loading folder files:', error);
    }
  };

  const handleDeleteFolder = async (folderPath, category, e) => {
    e.stopPropagation();
    try {
      await deleteFolder(folderPath, category, showContent);
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderPath);
        return newSet;
      });
      if (selectedFolder?.path === folderPath) {
        setSelectedFolder(null);
        setFolderFiles([]);
      }
      await loadFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Error deleting folder. Please try again.');
    }
  };

  const handleGenerate = () => {
    console.log('TemplatePanel handleGenerate called with options:', {
      showLogo,
      logoPosition,
      showOutrow,
      showInrow
    });
    onGenerate(numImages, duration, {
      showLogo,
      logoPosition,
      showOutrow,
      showInrow
    });
  };

  const renderFilePreview = (file) => {
    if (showContent === 'images') {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-full object-cover rounded"
        />
      );
    } else if (showContent === 'videos') {
      return (
        <video
          src={file.url}
          controls
          className="w-60 h-50"
        />
      );
    } else if (showContent === 'audio') {
      return (
        <audio
          src={file.url}
          controls
          className="w-63"
        />
      );
    }
    return null;
  };

  return (
    <div className="bg-grey text-white h-full border border-white flex flex-col">
      <div className="p-4 border-b border-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Templates</h2>
        {showContent && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <FaArrowLeft />
            Back
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {showContent ? (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div 
                  className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => handleCategoryToggle(category.name)}
                >
                  <div className="flex-1 flex items-center gap-2">
                    {expandedCategories.has(category.name) ? (
                      <FaChevronDown className="text-yellow-400" />
                    ) : (
                      <FaChevronRight className="text-yellow-400" />
                    )}
                    <span className="font-medium text-yellow-400">{category.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteCategory(category.name, e)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    title="Delete category"
                  >
                    <FaTrash />
                  </button>
                </div>
                
                {expandedCategories.has(category.name) && (
                  <div className="pl-6 space-y-2">
                    {category.folders.map((folder) => (
                      <div key={folder.path} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFolderSelect(folder, category.name)}
                            className={`flex-1 p-3 rounded-lg border transition-all ${
                              expandedFolders.has(folder.path)
                                ? 'bg-yellow-400 text-yellow-400 border-yellow-400'
                                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{folder.name}</div>
                            </div>
                          </button>
                          <button
                            onClick={(e) => handleDeleteFolder(folder.path, category.name, e)}
                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="Delete folder"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        
                        {expandedFolders.has(folder.path) && (
                          <div className="grid grid-cols-2 gap-2 p-2">
                            {folderFiles.map((file, index) => (
                              <div key={index} className="relative aspect-square">
                                {renderFilePreview(file)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Images</label>
              <input
                type="number"
                min="1"
                max="20"
                value={numImages}
                onChange={(e) => setNumImages(parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Video Duration (seconds)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>

            <div className="flex justify-center items-center gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showLogo"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="showLogo" className="text-white">Add Logo</label>
                </div>
                {showLogo && (
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                  </select>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInrow"
                    checked={showInrow}
                    onChange={(e) => setShowInrow(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="showInrow" className="text-white">Inrow</label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showOutrow"
                    checked={showOutrow}
                    onChange={(e) => setShowOutrow(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="showOutrow" className="text-white">Outrow</label>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-400 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Generate Video
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowContent('images')}
                className="flex-1 p-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-400 rounded-lg transition-colors"
              >
                View Images
              </button>
              <button
                onClick={() => setShowContent('videos')}
                className="flex-1 p-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-400 rounded-lg transition-colors"
              >
                View Videos
              </button>
              <button
                onClick={() => setShowContent('audio')}
                className="flex-1 p-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-400 rounded-lg transition-colors"
              >
                View Audio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 