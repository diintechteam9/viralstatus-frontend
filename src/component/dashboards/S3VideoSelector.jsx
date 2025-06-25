import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFolder, FaGreaterThan, FaTimes, FaVideo } from 'react-icons/fa';
import { IoArrowBackOutline } from "react-icons/io5";
import { API_BASE_URL } from '../../config';

const S3VideoSelector = ({ onClose, onVideoSelect }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedSubCategoryView, setSelectedSubCategoryView] = useState(null);
  const [selectedFolderView, setSelectedFolderView] = useState(null);
  const [videoFiles, setVideoFiles] = useState([]);

  const fetchSubcategories = async (categoryId) => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      const response = await axios.get(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.subcategories) {
        setCategories(prev => prev.map(c => c._id === categoryId ? { ...c, subcategories: response.data.subcategories } : c));
        return response.data.subcategories;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      setError('Failed to fetch subcategories');
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('clienttoken');
      const response = await axios.get(`${API_BASE_URL}/api/categories`, { headers: { 'Authorization': `Bearer ${token}` } });

      if (response.data && response.data.categories) {
        const initialCategories = response.data.categories.map(c => ({ ...c, subcategories: [] }));
        setCategories(initialCategories);

        const categoriesWithSubcategories = await Promise.all(
          initialCategories.map(async (category) => {
            const subcategories = await fetchSubcategories(category._id);
            return { ...category, subcategories };
          })
        );
        setCategories(categoriesWithSubcategories);

        if (categoriesWithSubcategories.length > 0 && categoriesWithSubcategories[0].subcategories.length > 0) {
          const firstCategory = categoriesWithSubcategories[0];
          const firstSubCategory = firstCategory.subcategories[0];
          setSelectedSubCategoryView(firstSubCategory._id);
          await fetchFoldersForSubcategory(firstCategory._id, firstSubCategory._id);
        }
      }
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoldersForSubcategory = async (categoryId, subcategoryId) => {
    try {
      const token = sessionStorage.getItem('clienttoken');
      const response = await axios.get(`${API_BASE_URL}/api/folders/category/${categoryId}/subcategory/${subcategoryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && response.data.folders) {
        const formattedFolders = response.data.folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          category: folder.category,
          subCategory: folder.subCategory,
        }));
        setFolders(prev => {
          const otherFolders = prev.filter(f => f.categoryId !== categoryId || f.subcategoryId !== subcategoryId);
          return [...otherFolders, ...formattedFolders];
        });
      }
    } catch (err) {
        if (err.response?.status === 404) {
            setFolders(prev => prev.filter(f => f.categoryId !== categoryId || f.subcategoryId !== subcategoryId));
        } else {
            setError('Failed to fetch folders');
        }
    }
  };

  const toggleSubCategory = async (categoryId, subCategoryId) => {
    if (selectedSubCategoryView === subCategoryId) {
      setSelectedSubCategoryView(null);
      return;
    }
    setSelectedSubCategoryView(subCategoryId);
    await fetchFoldersForSubcategory(categoryId, subCategoryId);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFolderClick = async (folder) => {
    setSelectedFolderView(folder);
    setLoading(true);
    try {
      const token = sessionStorage.getItem('clienttoken');
      const userData = JSON.parse(sessionStorage.getItem('userData'));
      const response = await axios.post(`${API_BASE_URL}/api/datastore/files`, {
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          folderId: folder.id,
          userId: userData.clientId,
          type: 'Video'
        }, { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data && response.data.files) {
        const filesWithUrls = await Promise.all(
          response.data.files.map(async (file) => {
            try {
              const downloadResponse = await axios.post(`${API_BASE_URL}/api/datastore/download-url`, {
                  fileId: file._id,
                  categoryId: folder.categoryId,
                  subcategoryId: folder.subcategoryId,
                  folderId: folder.id,
                  userId: userData.clientId
                }, { headers: { 'Authorization': `Bearer ${token}` } }
              );
              return { ...file, fileUrl: downloadResponse.data.url };
            } catch (err) {
              return null;
            }
          })
        );
        const validFiles = filesWithUrls.filter(Boolean);

        // Sort video files by creation date in descending order (newest first)
        const sortedFiles = validFiles.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        });

        setVideoFiles(sortedFiles);
      } else {
        setVideoFiles([]);
      }
    } catch (error) {
      setError('Failed to fetch video files');
      setVideoFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setSelectedFolderView(null);
    setVideoFiles([]);
  };
  
  const handleVideoSelect = (file) => {
    onVideoSelect(file.fileUrl, file.fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] p-6 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Select Video from S3</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {selectedFolderView ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <button onClick={handleBackClick} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100">
                  <IoArrowBackOutline className="text-xl"/>Back
                </button>
              </div>
              <div className="flex items-center gap-2 text-base text-gray-600 mb-8">
                <span className="font-medium">{selectedFolderView.category}</span>
                <FaGreaterThan className="text-xs" />
                <span className="font-medium">{selectedFolderView.subCategory}</span>
                <FaGreaterThan className="text-xs" />
                <span className="font-medium">{selectedFolderView.name}</span>
              </div>
              {loading ? (
                <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoFiles.length === 0 ? (
                    <div className="col-span-full text-center text-gray-400 py-12">
                      <FaVideo className="text-5xl mx-auto mb-3" />
                      <p>No video files in this folder.</p>
                    </div>
                  ) : (
                    videoFiles.map((file) => (
                      <div key={file._id} className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center gap-4 group hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => handleVideoSelect(file)}>
                        <video className="w-full h-40 object-cover rounded-lg bg-gray-200" src={file.fileUrl} controls={false} />
                        <h3 className="text-md font-bold truncate text-center w-full">{file.title || file.fileName}</h3>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {loading ? (
                <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category._id}>
                    <div className="inline-block mb-2"><h3 className="text-xl font-bold text-gray-700">{category.name}</h3></div>
                    <div className="bg-white rounded-xl shadow p-4">
                      <div className="flex flex-wrap gap-4 mb-6">
                        {category.subcategories.map((subCat) => (
                          <div key={subCat._id} className="relative">
                            <div className={`bg-gray-50 rounded-lg p-3 cursor-pointer border-2 transition-all ${selectedSubCategoryView === subCat._id ? 'border-blue-500 shadow' : 'border-transparent hover:border-blue-300'}`}
                              onClick={() => toggleSubCategory(category._id, subCat._id)}>
                              <h4 className="text-base font-semibold text-gray-800 whitespace-nowrap">{subCat.name}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedSubCategoryView && category.subcategories.some(subCat => subCat._id === selectedSubCategoryView) && (
                        <div className="flex flex-wrap gap-8 mt-4">
                          {folders.filter(folder => folder.categoryId === category._id && folder.subcategoryId === selectedSubCategoryView).length > 0 ? (
                            folders.filter(folder => folder.categoryId === category._id && folder.subcategoryId === selectedSubCategoryView)
                              .map(folder => (
                                <div key={folder.id} className="flex flex-col items-center cursor-pointer w-28 group" onClick={() => handleFolderClick(folder)}>
                                  <FaFolder className="text-blue-500 text-7xl mb-2 group-hover:scale-105 transition-transform" />
                                  <span className="text-base font-medium text-gray-800 text-center truncate w-full group-hover:text-blue-600">{folder.name}</span>
                                </div>
                              ))
                          ) : (
                            <div className="flex flex-col items-center w-28">
                                <FaFolder className="text-gray-300 text-5xl mb-2" />
                                <span className="text-base font-medium text-gray-400 text-center">No Folders</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default S3VideoSelector; 