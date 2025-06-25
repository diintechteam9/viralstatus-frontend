import React, { useState, useEffect } from 'react';
import {
  FaChartBar,
  FaBuilding,
  FaFileInvoiceDollar,
  FaChartLine,
  FaHeadset,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHistory,
  FaQuestionCircle,
  FaFileAlt,
  FaUserCircle,
  FaPhotoVideo,
  FaVideo,
  FaAngleLeft,
  FaMusic,
  FaTrash,
  FaGreaterThan,
  FaDownload,
  FaFolderPlus,
  FaPlus,
  FaEdit,
  FaFolder
} from 'react-icons/fa';
import { IoArrowBackOutline } from "react-icons/io5";
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Add this CSS class at the top of the file, after the imports
const requiredFieldClass = "after:content-['*'] after:ml-0.5 after:text-red-500";

const MusicTab = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubCategories, setExpandedSubCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [newFolder, setNewFolder] = useState({
    name: '',
    category: '',
    subCategory: ''
  });
  const [musicFormData, setMusicFormData] = useState({
    files: [],
    category: '',
    subCategory: '',
    folder: ''
  });
  const [selectedFolderView, setSelectedFolderView] = useState(null);
  const [folderMusic, setFolderMusic] = useState([]);
  const [selectedMusicCategory, setSelectedMusicCategory] = useState(null);
  const [selectedSubCategoryView, setSelectedSubCategoryView] = useState(null);
  const [musicFiles, setMusicFiles] = useState([]);

  // Fetch subcategories for a specific category
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
console.log("sub categories ka response",response);


      if (response.data && response.data.subcategories) {
        // Update the categories state with the new subcategories
        setCategories(prevCategories => 
          prevCategories.map(category => 
            category._id === categoryId 
              ? { ...category, subcategories: response.data.subcategories }
              : category
          )
        );
        return response.data.subcategories;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      setError('Failed to fetch subcategories');
      return [];
    }
  };

  // Update fetchCategories to use fetchSubcategories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.categories) {
        // First set categories without subcategories
        const initialCategories = response.data.categories.map(category => ({
          ...category,
          subcategories: []
        }));
        setCategories(initialCategories);

        // Then fetch subcategories for each category
        const categoriesWithSubcategories = await Promise.all(
          initialCategories.map(async (category) => {
            const subcategories = await fetchSubcategories(category._id);
            return {
              ...category,
              subcategories
            };
          })
        );

        setCategories(categoriesWithSubcategories);
        
        // Set the first subcategory as selected by default if categories exist
        if (categoriesWithSubcategories.length > 0 && categoriesWithSubcategories[0].subcategories.length > 0) {
          const firstCategory = categoriesWithSubcategories[0];
          const firstSubCategory = firstCategory.subcategories[0];
          setSelectedSubCategoryView(firstSubCategory._id);
          await fetchFoldersForSubcategory(firstCategory._id, firstSubCategory._id);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Update fetchFoldersForSubcategory with correct API call
  const fetchFoldersForSubcategory = async (categoryId, subcategoryId) => {
    try {
      console.log("=== Starting folder fetch ===");
      console.log("Category ID:", categoryId);
      console.log("Subcategory ID:", subcategoryId);
      
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        console.error("No token found");
        setError('Authentication required');
        return;
      }

      // Log the API call details
      const apiUrl = `${API_BASE_URL}/api/folders/category/${categoryId}/subcategory/${subcategoryId}`;
      console.log("Making API call to:", apiUrl);

      const response = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data && response.data.folders) {
        console.log("Number of folders received:", response.data.folders.length);
        
        const formattedFolders = response.data.folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          category: folder.category,
          subCategory: folder.subCategory,
          createdAt: folder.createdAt
        }));

        console.log("Formatted folders:", formattedFolders);

        setFolders(prev => {
          const otherFolders = prev.filter(f => 
            f.categoryId !== categoryId || f.subcategoryId !== subcategoryId
          );
          const newFolders = [...otherFolders, ...formattedFolders];
          console.log("Updated folders state:", newFolders);
          return newFolders;
        });
      } else {
        console.log("No folders in response or invalid response format");
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 404) {
        setFolders(prev => prev.filter(f => 
          f.categoryId !== categoryId || f.subcategoryId !== subcategoryId
        ));
      } else {
        setError('Failed to fetch folders');
      }
    }
  };

  // Update fetchAllFolders with better logging
  const fetchAllFolders = async (categoriesData) => {
    try {
      console.log("=== Starting fetchAllFolders ===");
      console.log("Categories data:", categoriesData);

      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        console.error("No token found");
        setError('Authentication required');
        return;
      }

      if (!categoriesData || categoriesData.length === 0) {
        console.log("No categories data available");
        return;
      }

      // Log each category and its subcategories
      categoriesData.forEach(category => {
        console.log(`Category: ${category.name} (${category._id})`);
        console.log("Subcategories:", category.subcategories);
      });

      const folderPromises = categoriesData.flatMap(category => 
        category.subcategories.map(subcategory => {
          console.log(`Fetching folders for category ${category._id} and subcategory ${subcategory._id}`);
          return fetchFoldersForSubcategory(category._id, subcategory._id);
        })
      );

      await Promise.all(folderPromises);
      console.log("=== Completed fetchAllFolders ===");
    } catch (err) {
      console.error('Error in fetchAllFolders:', err);
      setError('Failed to fetch folders');
    }
  };

  // Update toggleSubCategory to handle folder display
  const toggleSubCategory = async (categoryId, subCategoryId) => {
    try {
      // If clicking the same subcategory, close it
      if (selectedSubCategoryView === subCategoryId) {
        setSelectedSubCategoryView(null);
        return;
      }

      // Set the new selected subcategory, which will automatically close any other open subcategory
      setSelectedSubCategoryView(subCategoryId);
      
      // Fetch folders for this subcategory
      await fetchFoldersForSubcategory(categoryId, subCategoryId);
    } catch (error) {
      console.error("Error in toggleSubCategory:", error);
      setError("Failed to load folders");
    }
  };

  // Update useEffect to be simpler since we moved the logic to fetchCategories
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("=== Initializing MusicTab ===");
        await fetchCategories();
        console.log("=== MusicTab initialization complete ===");
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to initialize data');
      }
    };

    initializeData();
  }, []);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Update handleCreateFolder to use the correct API endpoint
  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      setError('Please enter a folder name');
      return;
    }

    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    try {
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const folderData = {
        name: newFolder.name,
        categoryId: selectedCategory,
        subcategoryId: selectedSubCategory || null
      };

      console.log('Creating folder with data:', folderData);

      const response = await axios.post(
        `${API_BASE_URL}/api/folders`,
        folderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Folder creation response:', response.data);

      if (response.data && response.data.folder) {
        // Add the new folder to the folders state
        const newFolderData = {
          id: response.data.folder.id,
          name: response.data.folder.name,
          categoryId: response.data.folder.categoryId,
          subcategoryId: response.data.folder.subcategoryId,
          category: response.data.folder.category,
          subCategory: response.data.folder.subCategory,
          createdAt: response.data.folder.createdAt
        };

        setFolders(prev => [...prev, newFolderData]);
        
        // Close modal and reset form
        setShowNewFolderModal(false);
        setNewFolder({
          name: '',
          category: '',
          subCategory: ''
        });
        setSelectedCategory('');
        setSelectedSubCategory('');
        setError('');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Create folder error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create folder. Please try again.');
      }
    }
  };

  const handleMusicFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
      const invalidFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        setError('Invalid file type(s). Please select only MP3, WAV, or OGG files.');
        return;
      }
      
      setMusicFormData(prev => ({
        ...prev,
        files: selectedFiles
      }));
    }
  };

  const handleMusicUpload = async () => {
    if (musicFormData.files.length === 0) {
      setError('Please select at least one music file');
      return;
    }

    if (!musicFormData.category || !musicFormData.subCategory || !musicFormData.folder) {
      setError('Please select category, subcategory, and folder');
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('clienttoken');
      const userData = sessionStorage.getItem('userData');
      
      if (!token || !userData) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const selectedFolder = folders.find(f => f.id === musicFormData.folder);
      
      if (!selectedFolder) {
        setError('Selected folder not found');
        return;
      }

      // Upload each file
      const uploadPromises = musicFormData.files.map(async (file) => {
        try {
          // Get upload URL with type 'Audio'
          const uploadUrlResponse = await axios.post(
            `${API_BASE_URL}/api/datastore/upload-url`,
            {
              fileId: file.name,
              categoryId: selectedFolder.categoryId,
              subcategoryId: selectedFolder.subcategoryId,
              folderId: selectedFolder.id,
              userId: parsedUserData.clientId,
              fileSize: file.size,
              mimeType: file.type,
              type: 'Audio',
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for title
              description: `Music file uploaded to ${selectedFolder.name}`
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!uploadUrlResponse.data.url) {
            throw new Error('Failed to get upload URL');
          }

          // Upload file to the URL
          await axios.put(uploadUrlResponse.data.url, file, {
            headers: {
              'Content-Type': file.type
            }
          });

          return {
            fileName: file.name,
            status: 'success',
            fileId: uploadUrlResponse.data.fileId
          };
        } catch (err) {
          console.error('Error uploading file:', file.name, err);
          return {
            fileName: file.name,
            status: 'error',
            error: err.message
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const failedUploads = results.filter(r => r.status === 'error');

      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} file(s). Please try again.`);
      } else {
        // Refresh the folder view if we're currently viewing the folder
        if (selectedFolderView && selectedFolderView.id === selectedFolder.id) {
          await handleFolderClick(selectedFolder);
        }
        
        // Close modal and reset form
        setShowAddMusicModal(false);
        setMusicFormData({
          files: [],
          category: '',
          subCategory: '',
          folder: ''
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload music files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMusicToFolder = (folder) => {
    setMusicFormData(prev => ({
      ...prev,
      category: folder.category,
      subCategory: folder.subCategory,
      folder: folder.name
    }));
    setShowAddMusicModal(true);
  };

  const handleFolderClick = async (folder) => {
    setSelectedFolderView(folder);
    setLoading(true);
    try {
      console.log("Folder clicked:", folder);
      const token = sessionStorage.getItem('clienttoken');
      const userData = sessionStorage.getItem('userData');
      
      if (!token || !userData) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      console.log("Parsed user data:", parsedUserData);
      
      // Make the API call with IDs and type 'Audio'
      const response = await axios.post(
        `${API_BASE_URL}/api/datastore/files`,
        {
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          folderId: folder.id,
          userId: parsedUserData.clientId,
          type: 'Audio' // Add type filter for music files
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Files response:", response.data);

      if (response.data && response.data.files) {
        // Get download URLs for each music file
        const musicFiles = await Promise.all(
          response.data.files.map(async (file) => {
            try {
              const downloadResponse = await axios.post(
                `${API_BASE_URL}/api/datastore/download-url`,
                {
                  fileId: file._id,
                  categoryId: folder.categoryId,
                  subcategoryId: folder.subcategoryId,
                  folderId: folder.id,
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
        const validMusicFiles = musicFiles.filter(file => file && file.fileUrl);
        
        // Sort music files by creation date in descending order (newest first)
        const sortedMusicFiles = validMusicFiles.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setMusicFiles(sortedMusicFiles);
      } else {
        setMusicFiles([]);
      }
    } catch (error) {
      console.error('Error fetching music files:', error);
      setError('Failed to fetch music files');
      setMusicFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setSelectedFolderView(null);
    setMusicFiles([]);
  };

  // Update the category and subcategory selection handlers
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubCategory(''); // Reset subcategory when category changes
    
    if (categoryId) {
      const selectedCat = categories.find(cat => cat._id === categoryId);
      if (selectedCat) {
        // If subcategories are not already loaded, fetch them
        if (!selectedCat.subcategories || selectedCat.subcategories.length === 0) {
          const subcategories = await fetchSubcategories(categoryId);
          setNewFolder(prev => ({ 
            ...prev, 
            category: selectedCat.name,
            subCategory: ''
          }));
        } else {
          setNewFolder(prev => ({ 
            ...prev, 
            category: selectedCat.name,
            subCategory: ''
          }));
        }
      }
    } else {
      setNewFolder(prev => ({ 
        ...prev, 
        category: '',
        subCategory: ''
      }));
    }
  };

  const handleSubCategoryChange = (e) => {
    const subCategoryId = e.target.value;
    setSelectedSubCategory(subCategoryId);
    const selectedCat = categories.find(cat => cat._id === selectedCategory);
    const selectedSubCat = selectedCat?.subcategories?.find(sub => sub._id === subCategoryId);
    setNewFolder(prev => ({ 
      ...prev, 
      subCategory: selectedSubCat ? selectedSubCat.name : '' 
    }));
  };

  const handleDeleteMusic = async (file) => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      const userData = sessionStorage.getItem('userData');
      
      if (!token || !userData) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      
      // Delete the file from the backend
      await axios.post(
        `${API_BASE_URL}/api/datastore/delete`,
        {
          fileName: file.fileName,
          categoryName: selectedFolderView.category,
          subcategoryName: selectedFolderView.subCategory,
          folderName: selectedFolderView.name,
          userId: parsedUserData.clientId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Remove the file from the local state
      setMusicFiles(prevFiles => prevFiles.filter(f => f._id !== file._id));
    } catch (error) {
      console.error('Error deleting music file:', error);
      setError('Failed to delete music file');
    }
  };

  return (
    <div className="p-2 sm:p-8 bg-gray-50 min-h-screen">
      {selectedFolderView ? (
        // Full Folder View
        <div>
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors font-semibold"
            >
              <IoArrowBackOutline className="text-xl"/>Back
            </button>
            <button
              onClick={() => {
                setMusicFormData({
                  files: [],
                  category: selectedFolderView.categoryId,
                  subCategory: selectedFolderView.subcategoryId,
                  folder: selectedFolderView.id
                });
                setShowAddMusicModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-base font-semibold"
            >
              <FaMusic /> Add Music
            </button>
          </div>
          <div className="flex items-center gap-2 text-base text-gray-600 mb-8">
            <span className="font-medium">{selectedFolderView.category}</span>
            <FaGreaterThan className="text-xs" />
            <span className="font-medium">{selectedFolderView.subCategory}</span>
            <FaGreaterThan className="text-xs" />
            <span className="font-medium">{selectedFolderView.name}</span>
          </div>
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {musicFiles.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-12">
                  <FaMusic className="text-5xl mx-auto mb-3" />
                  <p>No music files in this folder.</p>
                </div>
              ) : (
                musicFiles.map((file) => (
                  <div key={file._id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 group hover:shadow-2xl transition-shadow relative">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <FaMusic className="text-3xl text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate">{file.title || file.fileName}</h3>
                        <p className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full max-w-md">
                      <audio
                        controls
                        className="w-full rounded-lg border border-gray-200 shadow-sm"
                        src={file.fileUrl}
                        controlsList="nodownload"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <button
                      onClick={() => handleDeleteMusic(file)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete music"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        // Gallery View (Categories and Folders)
        <>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">Music Library</h2>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-base font-semibold"
            >
              <FaFolderPlus /> New Folder
            </button>
          </div>
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-base">
              {error}
            </div>
          )}
          {/* Categories and Subcategories Grid */}
          <div className="space-y-10">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <div key={category._id}>
                  {/* Category Tab */}
                  <div className="inline-block mb-2">
                    <h3 className="text-xl font-bold text-gray-700">{category.name}</h3>
                  </div>
                  {/* Subcategories and Folders Container */}
                  <div className="bg-white rounded-xl shadow p-4">
                    {/* Subcategories Row */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      {category.subcategories.map((subCat) => (
                        <div key={subCat._id} className="relative">
                          <div 
                            className={`bg-gray-50 rounded-lg p-3 cursor-pointer border-2 transition-all duration-200 ${selectedSubCategoryView === subCat._id ? 'border-blue-500 shadow' : 'border-transparent hover:border-blue-300'}`}
                            onClick={() => toggleSubCategory(category._id, subCat._id)}
                          >
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-semibold text-gray-800 whitespace-nowrap">{subCat.name}</h4>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Folders Row - Only show for selected subcategory */}
                    {selectedSubCategoryView && category.subcategories.some(subCat => subCat._id === selectedSubCategoryView) && (
                      <div className="flex flex-wrap gap-8 mt-4">
                        {folders.filter(folder => 
                          folder.categoryId === category._id && 
                          folder.subcategoryId === selectedSubCategoryView
                        ).length > 0 ? (
                          folders
                            .filter(folder => 
                              folder.categoryId === category._id && 
                              folder.subcategoryId === selectedSubCategoryView
                            )
                            .map(folder => (
                              <div 
                                key={folder.id}
                                className="flex flex-col items-center cursor-pointer w-28 group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFolderClick(folder);
                                }}
                              >
                                <FaFolder className="text-blue-500 text-7xl mb-2 group-hover:scale-105 transition-transform" />
                                <span className="text-base font-medium text-gray-800 text-center truncate w-full group-hover:text-blue-600">{folder.name}</span>
                              </div>
                            ))
                        ) : (
                          <div className="flex flex-col items-center w-28">
                            <FaFolder className="text-gray-300 text-5xl mb-2" />
                            <span className="text-base font-medium text-gray-400 text-center">No Folders</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategory(category._id);
                                setSelectedSubCategory(selectedSubCategoryView);
                                setShowNewFolderModal(true);
                              }}
                              className="mt-2 text-blue-500 hover:text-blue-600"
                            >
                              <FaFolderPlus className="text-xl" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <FaFolder className="text-5xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No categories available</p>
              </div>
            )}
          </div>
        </>
      )}
      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Create New Folder</h2>
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolder({
                    name: '',
                    category: '',
                    subCategory: ''
                  });
                  setSelectedCategory('');
                  setSelectedSubCategory('');
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter folder name"
                  className="w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                  Subcategory
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={handleSubCategoryChange}
                  disabled={!selectedCategory}
                  className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !selectedCategory ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                >
                  <option value="">Choose a subcategory</option>
                  {categories
                    .find(cat => cat._id === selectedCategory)
                    ?.subcategories?.map((subCat) => (
                      <option key={subCat._id} value={subCat._id}>
                        {subCat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>Fields marked with <span className="text-red-500">*</span> are required</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolder({
                    name: '',
                    category: '',
                    subCategory: ''
                  });
                  setSelectedCategory('');
                  setSelectedSubCategory('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolder.name.trim() || !selectedCategory || !selectedSubCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Music Modal */}
      {showAddMusicModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add New Music</h2>
                {selectedFolderView && (
                  <p className="text-sm text-gray-600 mt-1">
                    Adding to: {selectedFolderView.category} / {selectedFolderView.subCategory} / {selectedFolderView.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddMusicModal(false);
                  setMusicFormData({
                    files: [],
                    category: '',
                    subCategory: '',
                    folder: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {!selectedFolderView ? (
                // Show full form when not in a folder
                <>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                      Category
                    </label>
                    <select
                      value={musicFormData.category}
                      onChange={e => {
                        setMusicFormData(prev => ({
                          ...prev,
                          category: e.target.value,
                          subCategory: '',
                          folder: ''
                        }));
                      }}
                      className="w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose a category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                      Subcategory
                    </label>
                    <select
                      value={musicFormData.subCategory}
                      onChange={e => {
                        setMusicFormData(prev => ({
                          ...prev,
                          subCategory: e.target.value,
                          folder: ''
                        }));
                      }}
                      disabled={!musicFormData.category}
                      className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!musicFormData.category ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                    >
                      <option value="">Choose a subcategory</option>
                      {categories.find(cat => cat._id === musicFormData.category)?.subcategories.map(subCat => (
                        <option key={subCat._id} value={subCat._id}>
                          {subCat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                      Folder
                    </label>
                    <select
                      value={musicFormData.folder}
                      onChange={e => {
                        setMusicFormData(prev => ({
                          ...prev,
                          folder: e.target.value
                        }));
                      }}
                      disabled={!musicFormData.subCategory}
                      className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!musicFormData.subCategory ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                    >
                      <option value="">Choose a folder</option>
                      {folders
                        .filter(folder => 
                          folder.categoryId === musicFormData.category && 
                          folder.subcategoryId === musicFormData.subCategory
                        )
                        .map(folder => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}>
                  Music Files
                </label>
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleMusicFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Supported formats: MP3, WAV, OGG
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMusicModal(false);
                  setMusicFormData({
                    files: [],
                    category: '',
                    subCategory: '',
                    folder: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMusicUpload}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload Music
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicTab;
