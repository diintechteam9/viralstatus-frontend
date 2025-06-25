import { useState, useCallback, useEffect } from 'react';
import { FaTrash, FaChevronDown, FaChevronRight, FaArrowLeft, FaFolder, FaFolderOpen, FaTimes,FaImage  } from 'react-icons/fa';
import axios from 'axios';
import { IoMusicalNotes } from "react-icons/io5";
import { API_BASE_URL } from '../../config';

export default function ReelTemplatePanel({ onGenerate }) {
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [showContent, setShowContent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [numImages, setNumImages] = useState(5);
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubCategories, setExpandedSubCategories] = useState({});
  
  // Template options state
  const [showLogo, setShowLogo] = useState(false);
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [showOutrow, setShowOutrow] = useState(false);
  const [showInrow, setShowInrow] = useState(false);

  // Music folder selection state
  const [selectedMusicFolder, setSelectedMusicFolder] = useState(null);
  const [showMusicFolderBrowser, setShowMusicFolderBrowser] = useState(false);
  const [musicFolders, setMusicFolders] = useState([]);
  const [expandedMusicCategories, setExpandedMusicCategories] = useState({});
  const [expandedMusicSubCategories, setExpandedMusicSubCategories] = useState({});

  // Reset all states when component mounts or key changes
  useEffect(() => {
    setSelectedFolder(null);
    setSelectedMusicFolder(null);
    setShowFolderBrowser(false);
    setShowMusicFolderBrowser(false);
    setExpandedSubCategories({});
    setExpandedMusicSubCategories({});
    setError(null);
    setShowLogo(false);
    setLogoPosition('top-right');
    setShowOutrow(false);
    setShowInrow(false);
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories and their subcategories
  const fetchCategories = async () => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/categories`,
        {
        headers: {
          'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.categories) {
        // Fetch subcategories for each category
        const categoriesWithSubcategories = await Promise.all(
          response.data.categories.map(async (category) => {
            const subcategories = await fetchSubcategories(category._id);
            return { ...category, subcategories };
          })
        );
        setCategories(categoriesWithSubcategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    }
  };

  // Fetch subcategories
  const fetchSubcategories = async (categoryId) => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/categories/${categoryId}/subcategories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.subcategories) {
        return response.data.subcategories;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      setError('Failed to fetch subcategories');
      return [];
    }
  };

  // Fetch folders for a specific subcategory
  const fetchFoldersForSubcategory = async (categoryId, subcategoryId) => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/folders/category/${categoryId}/subcategory/${subcategoryId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.folders) {
        const formattedFolders = response.data.folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          category: folder.category,
          subCategory: folder.subCategory,
          createdAt: folder.createdAt
        }));

        setFolders(formattedFolders);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to fetch folders');
    }
  };

  // Fetch music folders for a specific subcategory
  const fetchMusicFoldersForSubcategory = async (categoryId, subcategoryId) => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/folders/category/${categoryId}/subcategory/${subcategoryId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      

      if (response.data && response.data.folders) {
        const formattedFolders = response.data.folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          category: folder.category,
          subCategory: folder.subCategory,
          createdAt: folder.createdAt
        }));

        setMusicFolders(formattedFolders);
      }
    } catch (err) {
      console.error('Error fetching music folders:', err);
      setError('Failed to fetch music folders');
    }
  };

  // Toggle subcategory expansion
  const toggleSubCategory = async (categoryId, subCategoryId) => {
    setExpandedSubCategories(prev => ({
      ...prev,
      [subCategoryId]: !prev[subCategoryId]
    }));

    if (!expandedSubCategories[subCategoryId]) {
      await fetchFoldersForSubcategory(categoryId, subCategoryId);
    }
  };

  // Toggle music subcategory expansion
  const toggleMusicSubCategory = async (categoryId, subCategoryId) => {
    setExpandedMusicSubCategories(prev => ({
      ...prev,
      [subCategoryId]: !prev[subCategoryId]
    }));
    
    if (!expandedMusicSubCategories[subCategoryId]) {
      await fetchMusicFoldersForSubcategory(categoryId, subCategoryId);
    }
  };

  // Handle folder selection
  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder.id);
    setSelectedCategory(folder.categoryId);
    setSelectedSubCategory(folder.subcategoryId);
    setShowFolderBrowser(false);
  };

  // Handle music folder selection
  const handleMusicFolderSelect = (folder) => {
    setSelectedMusicFolder(folder.id);
    setShowMusicFolderBrowser(false);
  };

  // Helper function to get random items from array
  const getRandomItems = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Handle template generation
  const handleGenerateTemplate = async () => {
    if (!selectedCategory || !selectedSubCategory || !selectedFolder) {
      setError('Please select category, subcategory, and folder');
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('clienttoken');
      const userData = sessionStorage.getItem('userData');
      
      if (!token || !userData) {
        setError('Authentication required');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const selectedFolderData = folders.find(f => f.id === selectedFolder);
      
      if (!selectedFolderData) {
        setError('Selected folder not found');
        return;
      }

      // Get files from the selected folder
      const response = await axios.post(
        `${API_BASE_URL}/api/datastore/files`,
        {
          categoryId: selectedFolderData.categoryId,
          subcategoryId: selectedFolderData.subcategoryId,
          folderId: selectedFolderData.id,
          userId: parsedUserData.clientId,
          type: 'Image'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.files) {
        console.log('Files fetched from S3:', response.data.files);

        // Get download URLs for each image file
        const imageFiles = await Promise.all(
          response.data.files.map(async (file) => {
            try {
              const downloadResponse = await axios.post(
                `${API_BASE_URL}/api/datastore/download-url`,
                {
                  fileId: file._id,
                  categoryId: selectedFolderData.categoryId,
                  subcategoryId: selectedFolderData.subcategoryId,
                  folderId: selectedFolderData.id,
                  userId: parsedUserData.clientId
                },
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              return {
                ...file,
                fileUrl: downloadResponse.data.url
              };
            } catch (err) {
              console.error('Error getting download URL:', err);
              return null;
            }
          })
        );

        // Filter out any files that failed to get URLs
        const validImageFiles = imageFiles.filter(file => file && file.fileUrl);

        if (validImageFiles.length === 0) {
          setError('No valid images found in the selected folder');
          return;
        }

        // Now fetch music files from the selected music folder if one is selected
        let musicFiles = [];
        if (selectedMusicFolder) {
          const selectedMusicFolderData = musicFolders.find(f => f.id === selectedMusicFolder);
          if (selectedMusicFolderData) {
            const musicResponse = await axios.post(
              `${API_BASE_URL}/api/datastore/files`,
              {
                categoryId: selectedMusicFolderData.categoryId,
                subcategoryId: selectedMusicFolderData.subcategoryId,
                folderId: selectedMusicFolderData.id,
                userId: parsedUserData.clientId,
                type: 'Audio'
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (musicResponse.data && musicResponse.data.files && musicResponse.data.files.length > 0) {
              // Get download URLs for music files
              const musicFilesWithUrls = await Promise.all(
                musicResponse.data.files.map(async (file) => {
                  try {
                    const downloadResponse = await axios.post(
                      `${API_BASE_URL}/api/datastore/download-url`,
                      {
                        fileId: file._id,
                        categoryId: selectedMusicFolderData.categoryId,
                        subcategoryId: selectedMusicFolderData.subcategoryId,
                        folderId: selectedMusicFolderData.id,
                        userId: parsedUserData.clientId
                      },
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                    
                    return {
                      ...file,
                      fileUrl: downloadResponse.data.url
                    };
                  } catch (err) {
                    console.error('Error getting download URL for music:', err);
                    return null;
                  }
                })
              );

              // Filter out any music files that failed to get URLs
              const validMusicFiles = musicFilesWithUrls.filter(file => file && file.fileUrl);
              
              if (validMusicFiles.length > 0) {
                // Randomly select one music file
                const randomMusic = validMusicFiles[Math.floor(Math.random() * validMusicFiles.length)];
                
                // Fetch the audio file and create a blob URL
                try {
                  const audioResponse = await fetch(randomMusic.fileUrl);
                  const audioBlob = await audioResponse.blob();
                  const audioBlobUrl = URL.createObjectURL(audioBlob);
                  
                  musicFiles = [{
                    file: null,
                    url: audioBlobUrl,
                    type: 'audio',
                    name: randomMusic.fileName,
                    start: 0,
                    end: duration,
                    trimmed: true,
                    trimStart: 0,
                    trimEnd: duration,
                    duration: duration
                  }];
                } catch (err) {
                  console.error('Error creating blob URL for music:', err);
                  // Continue without music if there's an error
                  musicFiles = [];
                }
              }
            }
          }
        }

        // Randomly select the specified number of images
        const selectedFiles = getRandomItems(validImageFiles, numImages);
        console.log('Randomly selected files:', selectedFiles);

        // Calculate duration per image
        const effectiveDuration = duration;
        const durationPerImage = effectiveDuration / selectedFiles.length;

        // Process selected files for video generation
        const processedFiles = await Promise.all(
          selectedFiles.map(async (file, index) => {
            try {
              // Fetch the image
              const imageResponse = await fetch(file.fileUrl);
              const blob = await imageResponse.blob();
              
              // Create a File object from the blob
              const imageFile = new File([blob], file.fileName || `image_${index}.jpg`, {
                type: blob.type
              });

              // Calculate timing for each image
              const startTime = index * durationPerImage;
              const endTime = (index + 1) * durationPerImage;

              return {
                file: imageFile,
                url: URL.createObjectURL(imageFile),
                type: 'image',
                name: file.fileName || `image_${index}.jpg`,
                start: startTime,
                end: endTime,
                duration: durationPerImage,
                trimmed: true,
                trimStart: 0,
                trimEnd: durationPerImage
              };
            } catch (err) {
              console.error('Error processing file:', err);
              return null;
            }
          })
        );

        // Filter out any files that failed to process
        const finalFiles = processedFiles.filter(file => file !== null);

        if (finalFiles.length === 0) {
          setError('Failed to process any files');
          return;
        }

        // Call onGenerate with the processed files and music
        onGenerate(numImages, duration, {
          files: finalFiles,
          musicFiles: musicFiles,
          showLogo,
          logoPosition,
          showOutrow,
          showInrow,
          folder: selectedFolderData
        });
      }
    } catch (error) {
      console.error('Error generating template:', error);
      setError('Failed to generate template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 w-full max-w-xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Image Folder Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          Select Image Folder <FaImage className="text-gray-600" />
        </label>
        <div className="relative">
          <button
            onClick={() => setShowFolderBrowser(true)}
            className="w-full p-2 rounded-lg bg-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between"
          >
            <span className="truncate">
              {selectedFolder ? (
                (() => {
                  const folder = folders.find(f => f.id === selectedFolder);
                  const category = categories.find(c => c._id === folder?.categoryId);
                  const subcategory = category?.subcategories?.find(s => s._id === folder?.subcategoryId);
                  return `${category?.name || ''} / ${subcategory?.name || ''} / ${folder?.name || ''}`;
                })()
              ) : 'Choose an image folder'}
            </span>
            <FaChevronDown className="ml-2" />
          </button>

          {/* Image Folder Browser Modal */}
          {showFolderBrowser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Select Image Folder </h3>
                  <button
                    onClick={() => setShowFolderBrowser(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
                  {categories.map(category => (
                    <div key={category._id} className="mb-6">
                      <div className="flex items-center p-2 mb-2">
                        <span className="font-medium text-lg">{category.name}</span>
                      </div>
                      
                      <div className="ml-6">
                        <div className="flex flex-wrap gap-4 mb-4">
                          {category.subcategories?.map(subCategory => (
                            <div key={subCategory._id} className="w-48">
                              <button
                                onClick={() => toggleSubCategory(category._id, subCategory._id)}
                                className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded mb-2 text-left transition-colors"
                              >
                                <span className="truncate">{subCategory.name}</span>
                              </button>
                              
                              {expandedSubCategories[subCategory._id] && (
                                <div className="flex flex-wrap gap-2">
                                  {folders
                                    .filter(folder => folder.categoryId === category._id && folder.subcategoryId === subCategory._id)
                                    .map(folder => (
                                      <button
                                        key={folder.id}
                                        onClick={() => handleFolderSelect(folder)}
                                        className="flex items-center p-2 hover:bg-gray-100 rounded border border-gray-200"
                                      >
                                        <FaFolderOpen className="mr-2 text-yellow-500 text-4xl" />
                                        <span className="truncate">{folder.name}</span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Music Folder Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          Select Music Folder <IoMusicalNotes className="text-gray-600" />
        </label>
        <div className="relative">
          <button
            onClick={() => setShowMusicFolderBrowser(true)}
            className="w-full p-2 rounded-lg bg-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between"
          >
            <span className="truncate">
              {selectedMusicFolder ? (
                (() => {
                  const folder = musicFolders.find(f => f.id === selectedMusicFolder);
                  const category = categories.find(c => c._id === folder?.categoryId);
                  const subcategory = category?.subcategories?.find(s => s._id === folder?.subcategoryId);
                  return `${category?.name || ''} / ${subcategory?.name || ''} / ${folder?.name || ''}`;
                })()
              ) : 'Choose a music folder'}
            </span>
            <FaChevronDown className="ml-2" />
          </button>

          {/* Music Folder Browser Modal */}
          {showMusicFolderBrowser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Select Music Folder</h3>
                  <button
                    onClick={() => setShowMusicFolderBrowser(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
                  {categories.map(category => (
                    <div key={category._id} className="mb-6">
                      <div className="flex items-center p-2 mb-2">
                        <span className="font-medium text-lg">{category.name}</span>
      </div>
      
                      <div className="ml-6">
                        <div className="flex flex-wrap gap-4 mb-4">
                          {category.subcategories?.map(subCategory => (
                            <div key={subCategory._id} className="w-48">
                              <button
                                onClick={() => toggleMusicSubCategory(category._id, subCategory._id)}
                                className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded mb-2 text-left transition-colors"
                              >
                                <span className="truncate">{subCategory.name}</span>
                              </button>
                              
                              {expandedMusicSubCategories[subCategory._id] && (
                                <div className="flex flex-wrap gap-2">
                                  {musicFolders
                                    .filter(folder => folder.categoryId === category._id && folder.subcategoryId === subCategory._id)
                                    .map(folder => (
                                      <button
                                        key={folder.id}
                                        onClick={() => handleMusicFolderSelect(folder)}
                                        className="flex items-center p-2 hover:bg-gray-100 rounded border border-gray-200"
                                      >
                                        <FaFolderOpen className="mr-2 text-yellow-500 text-xl" />
                                        <span className="truncate">{folder.name}</span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Number of Images and Duration */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Number of Images</label>
          <input
            type="number"
            min="1"
            max="20"
            value={numImages}
            onChange={(e) => setNumImages(parseInt(e.target.value))}
            className="w-full p-3 rounded-lg bg-white border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full p-3 rounded-lg bg-white border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg"
          />
        </div>
      </div>

      {/* Options in one row */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Logo Options</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
              className="w-4 h-4"
            />
            <select
              value={logoPosition}
              onChange={(e) => setLogoPosition(e.target.value)}
              className="flex-1 p-2 border rounded"
              disabled={!showLogo}
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Row Options</label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showInrow}
                onChange={(e) => setShowInrow(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">In Row</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showOutrow}
                onChange={(e) => setShowOutrow(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Out Row</span>
            </label>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateTemplate}
        disabled={loading || !selectedFolder}
        className={`w-full py-2 px-4 rounded-lg transition-colors ${
          loading || !selectedFolder
            ? 'bg-green-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Generating...' : 'Generate Template'}
      </button>
    </div>
  );
} 