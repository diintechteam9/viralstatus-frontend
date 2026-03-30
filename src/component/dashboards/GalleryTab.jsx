import React, { useState, useEffect } from "react";
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
  FaImage,
  FaTrash,
  FaGreaterThan,
  FaDownload,
  FaFolderPlus,
  FaPlus,
  FaEdit,
  FaFolder,
} from "react-icons/fa";
import { IoArrowBackOutline } from "react-icons/io5";
import axios from "axios";
import { API_BASE_URL } from "../../config";

// Add this CSS class at the top of the file, after the imports
const requiredFieldClass =
  "after:content-['*'] after:ml-0.5 after:text-red-500";

const GalleryTab = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedMediaType, setSelectedMediaType] = useState("Image"); // Image | Audio | Video
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubCategories, setExpandedSubCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [newFolder, setNewFolder] = useState({
    name: "",
    category: "",
    subCategory: "",
  });
  const [imageFormData, setImageFormData] = useState({
    files: [],
    category: "",
    subCategory: "",
    folder: "",
  });
  const [selectedFolderView, setSelectedFolderView] = useState(null);
  const [folderImages, setFolderImages] = useState([]);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState(null);
  const [selectedSubCategoryView, setSelectedSubCategoryView] = useState(null);

  // Fetch subcategories for a specific category
  const getToken = () => sessionStorage.getItem("clienttoken") || localStorage.getItem("clienttoken");

  const fetchSubcategories = async (categoryId) => {
    try {
      const token = getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/categories/${categoryId}/subcategories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("sub categories ka response", response);

      if (response.data && response.data.subcategories) {
        // Update the categories state with the new subcategories
        setCategories((prevCategories) =>
          prevCategories.map((category) =>
            category._id === categoryId
              ? { ...category, subcategories: response.data.subcategories }
              : category
          )
        );
        return response.data.subcategories;
      }
      return [];
    } catch (error) {
      console.error(
        `Error fetching subcategories for category ${categoryId}:`,
        error
      );
      setError("Failed to fetch subcategories");
      return [];
    }
  };

  // Update fetchCategories to use fetchSubcategories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.categories) {
        // First set categories without subcategories
        const initialCategories = response.data.categories.map((category) => ({
          ...category,
          subcategories: [],
        }));
        setCategories(initialCategories);

        // Then fetch subcategories for each category
        const categoriesWithSubcategories = await Promise.all(
          initialCategories.map(async (category) => {
            const subcategories = await fetchSubcategories(category._id);
            return {
              ...category,
              subcategories,
            };
          })
        );

        setCategories(categoriesWithSubcategories);

        // Set the first subcategory as selected by default if categories exist
        if (
          categoriesWithSubcategories.length > 0 &&
          categoriesWithSubcategories[0].subcategories.length > 0
        ) {
          const firstCategory = categoriesWithSubcategories[0];
          const firstSubCategory = firstCategory.subcategories[0];
          setSelectedSubCategoryView(firstSubCategory._id);
          await fetchFoldersForSubcategory(
            firstCategory._id,
            firstSubCategory._id
          );
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories");
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

      const token = getToken();
      if (!token) {
        console.error("No token found");
        setError("Authentication required");
        return;
      }

      // Log the API call details
      const apiUrl = `${API_BASE_URL}/api/folders/category/${categoryId}/subcategory/${subcategoryId}`;
      console.log("Making API call to:", apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response:", response.data);

      if (response.data && response.data.folders) {
        console.log(
          "Number of folders received:",
          response.data.folders.length
        );

        const formattedFolders = response.data.folders.map((folder) => ({
          id: folder._id,
          name: folder.name,
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          category: folder.category,
          subCategory: folder.subCategory,
          createdAt: folder.createdAt,
        }));

        console.log("Formatted folders:", formattedFolders);

        setFolders((prev) => {
          const otherFolders = prev.filter(
            (f) =>
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
      console.error("Error fetching folders:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      if (err.response?.status === 404) {
        setFolders((prev) =>
          prev.filter(
            (f) =>
              f.categoryId !== categoryId || f.subcategoryId !== subcategoryId
          )
        );
      } else {
        setError("Failed to fetch folders");
      }
    }
  };

  // Update fetchAllFolders with better logging
  const fetchAllFolders = async (categoriesData) => {
    try {
      console.log("=== Starting fetchAllFolders ===");
      console.log("Categories data:", categoriesData);

      const token = getToken();
      if (!token) {
        console.error("No token found");
        setError("Authentication required");
        return;
      }

      if (!categoriesData || categoriesData.length === 0) {
        console.log("No categories data available");
        return;
      }

      // Log each category and its subcategories
      categoriesData.forEach((category) => {
        console.log(`Category: ${category.name} (${category._id})`);
        console.log("Subcategories:", category.subcategories);
      });

      const folderPromises = categoriesData.flatMap((category) =>
        category.subcategories.map((subcategory) => {
          console.log(
            `Fetching folders for category ${category._id} and subcategory ${subcategory._id}`
          );
          return fetchFoldersForSubcategory(category._id, subcategory._id);
        })
      );

      await Promise.all(folderPromises);
      console.log("=== Completed fetchAllFolders ===");
    } catch (err) {
      console.error("Error in fetchAllFolders:", err);
      setError("Failed to fetch folders");
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
        console.log("=== Initializing GalleryTab ===");
        await fetchCategories();
        console.log("=== GalleryTab initialization complete ===");
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Failed to initialize data");
      }
    };

    initializeData();
  }, []);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Update handleCreateFolder to use the correct API endpoint
  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      setError("Please enter a folder name");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a category");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const folderData = {
        name: newFolder.name,
        categoryId: selectedCategory,
        subcategoryId: selectedSubCategory || null,
      };

      console.log("Creating folder with data:", folderData);

      const response = await axios.post(
        `${API_BASE_URL}/api/folders`,
        folderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Folder creation response:", response.data);

      if (response.data && response.data.folder) {
        // Add the new folder to the folders state
        const newFolderData = {
          id: response.data.folder.id,
          name: response.data.folder.name,
          categoryId: response.data.folder.categoryId,
          subcategoryId: response.data.folder.subcategoryId,
          category: response.data.folder.category,
          subCategory: response.data.folder.subCategory,
          createdAt: response.data.folder.createdAt,
        };

        setFolders((prev) => [...prev, newFolderData]);

        // Close modal and reset form
        setShowNewFolderModal(false);
        setNewFolder({
          name: "",
          category: "",
          subCategory: "",
        });
        setSelectedCategory("");
        setSelectedSubCategory("");
        setError("");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Create folder error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to create folder. Please try again.");
      }
    }
  };

  const handleImageFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      let allowedTypes = [];
      if (selectedMediaType === "Image") {
        allowedTypes = [
          "image/jpg",
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
      } else if (selectedMediaType === "Audio") {
        allowedTypes = [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/x-wav",
          "audio/aac",
          "audio/ogg",
          "audio/x-m4a",
          "audio/m4a",
        ];
      } else if (selectedMediaType === "Video") {
        allowedTypes = [
          "video/mp4",
          "video/webm",
          "video/ogg",
          "video/quicktime",
          "video/x-matroska",
        ];
      }
      const invalidFiles = selectedFiles.filter(
        (file) => !allowedTypes.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        setError(`Invalid file type(s) for ${selectedMediaType.toLowerCase()}.`);
        return;
      }

      setImageFormData((prev) => ({
        ...prev,
        files: selectedFiles,
      }));
    }
  };

  const handleImageUpload = async () => {
    if (imageFormData.files.length === 0) {
      setError(`Please select at least one ${selectedMediaType.toLowerCase()} file`);
      return;
    }

    if (
      !imageFormData.category ||
      !imageFormData.subCategory ||
      !imageFormData.folder
    ) {
      setError("Please select category, subcategory, and folder");
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const userData = sessionStorage.getItem("userData") || localStorage.getItem("clientData");

      if (!token || !userData) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const selectedFolder = folders.find((f) => f.id === imageFormData.folder);

      if (!selectedFolder) {
        setError("Selected folder not found");
        return;
      }

      // Upload each file
      const uploadPromises = imageFormData.files.map(async (file) => {
        try {
          // Get upload URL
          const uploadUrlResponse = await axios.post(
            `${API_BASE_URL}/api/datastore/upload-url`,
            {
              fileId: file.name, // This will be replaced with the actual file ID after upload
              categoryId: selectedFolder.categoryId,
              subcategoryId: selectedFolder.subcategoryId,
              folderId: selectedFolder.id,
              userId: parsedUserData.clientId,
              fileSize: file.size,
              mimeType: file.type,
              // Optional: send intended type for backend classification
              type: selectedMediaType,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!uploadUrlResponse.data.url) {
            throw new Error("Failed to get upload URL");
          }

          // Upload file to the URL
          await axios.put(uploadUrlResponse.data.url, file, {
            headers: {
              "Content-Type": file.type,
            },
          });

          return {
            fileName: file.name,
            status: "success",
            fileId: uploadUrlResponse.data.fileId, // Store the file ID returned from the server
          };
        } catch (err) {
          console.error("Error uploading file:", file.name, err);
          return {
            fileName: file.name,
            status: "error",
            error: err.message,
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const failedUploads = results.filter((r) => r.status === "error");

      if (failedUploads.length > 0) {
        setError(
          `Failed to upload ${failedUploads.length} file(s). Please try again.`
        );
      } else {
        // Only close modal and reset form on complete success
        setShowAddImageModal(false);
        setImageFormData({
          files: [],
          category: "",
          subCategory: "",
          folder: "",
        });

        // Refresh the folder view if we're currently viewing the folder
        if (selectedFolderView && selectedFolderView.id === selectedFolder.id) {
          await handleFolderClick(selectedFolder);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddImageToFolder = (folder) => {
    // Prefill with IDs to align with API expectations
    setImageFormData((prev) => ({
      ...prev,
      category: folder.categoryId,
      subCategory: folder.subcategoryId,
      folder: folder.id,
    }));
    setShowAddImageModal(true);
  };

  const handleFolderClick = async (folder) => {
    try {
      setLoading(true);
      setError("");
      setSelectedFolderView(folder);
      const token = getToken();
      const userData = sessionStorage.getItem("userData") || localStorage.getItem("clientData");

      if (!token || !userData) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const parsedUserData = JSON.parse(userData);

      // Make the API call with IDs using POST request
      const response = await axios.post(
        `${API_BASE_URL}/api/datastore/files`,
        {
          categoryId: folder.categoryId,
          subcategoryId: folder.subcategoryId,
          folderId: folder.id,
          userId: parsedUserData.clientId,
          type: selectedMediaType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.files) {
        // Filter files by selected media type and sort by createdAt in descending order
        const mediaFiles = response.data.files
          .filter((file) => file.type === selectedMediaType)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const filesWithUrls = await Promise.all(
          mediaFiles.map(async (file) => {
            try {
              const downloadResponse = await axios.post(
                `${API_BASE_URL}/api/datastore/download-url`,
                {
                  fileId: file._id,
                  categoryId: folder.categoryId,
                  subcategoryId: folder.subcategoryId,
                  folderId: folder.id,
                  userId: parsedUserData.clientId,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              return {
                ...file,
                fileUrl: downloadResponse.data.url,
              };
            } catch (err) {
              console.error("Error getting download URL:", err);
              return {
                ...file,
                fileUrl: null,
                error: "Failed to load image",
              };
            }
          })
        );

        setFolderImages(filesWithUrls);
      }
    } catch (err) {
      console.error("Error fetching folder images:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load folder images");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (file, e) => {
    try {
      e?.stopPropagation?.();
      const confirmed = window.confirm("Delete this item? This cannot be undone.");
      if (!confirmed) return;

      const token = getToken();
      const userData = sessionStorage.getItem("userData") || localStorage.getItem("clientData");
      if (!token || !userData || !selectedFolderView) {
        setError("Authentication or folder context missing.");
        return;
      }
      const parsedUserData = JSON.parse(userData);

      await axios.delete(`${API_BASE_URL}/api/datastore/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          fileName: file.fileName,
          categoryName: selectedFolderView.category,
          subcategoryName: selectedFolderView.subCategory,
          folderName: selectedFolderView.name,
          userId: parsedUserData.clientId,
        },
      });

      // Remove from UI
      setFolderImages((prev) => prev.filter((f) => (f._id || f.fileName) !== (file._id || file.fileName)));
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err.response?.data?.message || err.response?.data?.error || "Failed to delete the file"
      );
    }
  };

  const handleBackClick = () => {
    setSelectedFolderView(null);
    setFolderImages([]);
  };

  // Update the category and subcategory selection handlers
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubCategory(""); // Reset subcategory when category changes

    if (categoryId) {
      const selectedCat = categories.find((cat) => cat._id === categoryId);
      if (selectedCat) {
        // Update immediately so UI responds without waiting
        setNewFolder((prev) => ({
          ...prev,
          category: selectedCat.name,
          subCategory: "",
        }));
        // If subcategories are not already loaded, fetch them in background
        if (
          !selectedCat.subcategories ||
          selectedCat.subcategories.length === 0
        ) {
          fetchSubcategories(categoryId).catch(() => {
            /* handled in fetchSubcategories */
          });
        }
      }
    } else {
      setNewFolder((prev) => ({
        ...prev,
        category: "",
        subCategory: "",
      }));
    }
  };

  const handleSubCategoryChange = (e) => {
    const subCategoryId = e.target.value;
    setSelectedSubCategory(subCategoryId);
    const selectedCat = categories.find((cat) => cat._id === selectedCategory);
    const selectedSubCat = selectedCat?.subcategories?.find(
      (sub) => sub._id === subCategoryId
    );
    setNewFolder((prev) => ({
      ...prev,
      subCategory: selectedSubCat ? selectedSubCat.name : "",
    }));
  };

  return (
    <div className="p-2 sm:p-4 bg-gray-50">
      {selectedFolderView ? (
        // Full Folder View
        <div>
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors font-semibold"
            >
              <IoArrowBackOutline className="text-xl" />
              Back
            </button>
            <button
              onClick={() => {
                setImageFormData({
                  files: [],
                  category: selectedFolderView.categoryId,
                  subCategory: selectedFolderView.subcategoryId,
                  folder: selectedFolderView.id,
                });
                setShowAddImageModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-base font-semibold"
            >
              <FaImage /> {`Add ${selectedMediaType}`}
            </button>
          </div>
          <div className="flex items-center gap-2 text-base text-gray-600 mb-8">
            <span className="font-medium">{selectedFolderView.category}</span>
            <FaGreaterThan className="text-xs" />
            <span className="font-medium">
              {selectedFolderView.subCategory}
            </span>
            <FaGreaterThan className="text-xs" />
            <span className="font-medium">{selectedFolderView.name}</span>
          </div>
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Media Grid */}
              {folderImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                  {folderImages.map((file) => (
                    <div
                      key={file._id || `${file.fileName}-${file.createdAt}`}
                      className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 max-w-[220px] mx-auto w-full"
                    >
                      {/* Media Container */}
                      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                        <button
                          onClick={(e) => handleDeleteFile(file, e)}
                          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-full p-1.5 shadow transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h.293l.853 10.234A2 2 0 007.14 18h5.72a2 2 0 001.994-1.766L15.707 6H16a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 6a1 1 0 112 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {selectedMediaType === "Image" && file.fileUrl ? (
                          <img
                            src={file.fileUrl}
                            alt={file.title || file.fileName}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==";
                            }}
                          />
                        ) : null}
                        {selectedMediaType === "Audio" && (
                          <audio controls className="w-[90%]">
                            {file.fileUrl ? (
                              <source src={file.fileUrl} type={file.mimeType || "audio/*"} />
                            ) : null}
                            Your browser does not support the audio element.
                          </audio>
                        )}
                        {selectedMediaType === "Video" && file.fileUrl ? (
                          <video
                            controls
                            className="w-full h-full object-cover"
                            src={file.fileUrl}
                          />
                        ) : null}
                        {!file.fileUrl && selectedMediaType !== "Image" && (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaImage className="text-2xl" />
                          </div>
                        )}
                      </div>
                      {/* Media Info */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-800 truncate">
                          {file.title || file.fileName}
                        </h3>
                        {file.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <FaImage className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">{`No ${selectedMediaType.toLowerCase()}s in this folder yet`}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddImageToFolder(selectedFolderView);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-semibold"
                  >
                    {`Add ${selectedMediaType}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Gallery View (Categories and Folders)
        <>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex flex-col gap-3 w-full">
              
              <div role="tablist" className="flex w-full border-b border-gray-200 items-center justify-between">
                <div className="flex">
                  {[
                    { label: "Images", value: "Image" },
                    { label: "Audio", value: "Audio" },
                    { label: "Videos", value: "Video" },
                  ].map((tab) => {
                    const active = selectedMediaType === tab.value;
                    return (
                      <button
                        key={tab.value}
                        role="tab"
                        aria-selected={active}
                        onClick={async () => {
                          if (active) return;
                          setSelectedMediaType(tab.value);
                          if (selectedFolderView) {
                            await handleFolderClick(selectedFolderView);
                          }
                        }}
                        className={`relative -mb-px px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                          active
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-sm font-semibold mb-1"
                >
                  <FaFolderPlus /> New Folder
                </button>
              </div>
             
            </div>
            
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
                  {/* Category Pill (styled same as subcategory) */}
                  <div className="inline-block mb-2">
                    {(() => {
                      const isActiveCategory = category.subcategories?.some(
                        (sub) => sub._id === selectedSubCategoryView
                      );
                      return (
                        <button
                          type="button"
                          aria-pressed={!!isActiveCategory}
                          className={`inline-flex items-center px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            isActiveCategory
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                              : "border-gray-200 bg-white text-black hover:border-gray-300"
                          } text-lg font-semibold whitespace-nowrap`}
                        >
                      {category.name}
                        </button>
                      );
                    })()}
                  </div>
                  {/* Subcategories and Folders Container */}
                  <div className="bg-white rounded-xl shadow p-4">
                    {/* Subcategories Row */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {category.subcategories.map((subCat) => (
                        <div key={subCat._id} className="relative">
                          <button
                            type="button"
                            aria-pressed={selectedSubCategoryView === subCat._id}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                              selectedSubCategoryView === subCat._id
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                : "border-gray-200 bg-white text-black hover:border-gray-300"
                            } text-sm font-medium whitespace-nowrap`}
                            onClick={() => toggleSubCategory(category._id, subCat._id)}
                          >
                                {subCat.name}
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Folders Row - Only show for selected subcategory */}
                    {selectedSubCategoryView &&
                      category.subcategories.some(
                        (subCat) => subCat._id === selectedSubCategoryView
                      ) && (
                        <div className="flex flex-wrap gap-8 mt-4">
                          {folders.filter(
                            (folder) =>
                              folder.categoryId === category._id &&
                              folder.subcategoryId === selectedSubCategoryView
                          ).length > 0 ? (
                            folders
                              .filter(
                                (folder) =>
                                  folder.categoryId === category._id &&
                                  folder.subcategoryId ===
                                    selectedSubCategoryView
                              )
                              .map((folder) => (
                                <div
                                  key={folder.id}
                                  className="flex flex-col items-center cursor-pointer w-28 group"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFolderClick(folder);
                                  }}
                                >
                                  <div className="relative w-full">
                                    <div className="aspect-square rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all flex items-center justify-center pb-5">
                                      <FaFolder className="text-yellow-500 text-5xl" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-yellow-800 text-white text-center px-2 py-1 text-[10px] sm:text-xs font-medium truncate rounded-b-md">
                                      {folder.name}
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="flex flex-col items-center w-28">
                              <FaFolder className="text-gray-300 text-7xl mb-2" />
                              <span className="text-base font-medium text-gray-400 text-center">
                                No Folders
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory(category._id);
                                  setSelectedSubCategory(
                                    selectedSubCategoryView
                                  );
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
              <h2 className="text-xl font-semibold text-gray-800">
                Create New Folder
              </h2>
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolder({
                    name: "",
                    category: "",
                    subCategory: "",
                  });
                  setSelectedCategory("");
                  setSelectedSubCategory("");
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                >
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) =>
                    setNewFolder((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter folder name"
                  className="w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                >
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
                <label
                  className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                >
                  Subcategory
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={handleSubCategoryChange}
                  disabled={!selectedCategory}
                  className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !selectedCategory ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  required
                >
                  <option value="">Choose a subcategory</option>
                  {categories
                    .find((cat) => cat._id === selectedCategory)
                    ?.subcategories?.map((subCat) => (
                      <option key={subCat._id} value={subCat._id}>
                        {subCat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>
                  Fields marked with <span className="text-red-500">*</span> are
                  required
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolder({
                    name: "",
                    category: "",
                    subCategory: "",
                  });
                  setSelectedCategory("");
                  setSelectedSubCategory("");
                  setError("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={
                  !newFolder.name.trim() ||
                  !selectedCategory ||
                  !selectedSubCategory
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Image Modal */}
      {showAddImageModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Add New Image
                </h2>
                {selectedFolderView && (
                  <p className="text-sm text-gray-600 mt-1">
                    Adding to: {selectedFolderView.category} /{" "}
                    {selectedFolderView.subCategory} / {selectedFolderView.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddImageModal(false);
                  setImageFormData({
                    files: [],
                    category: "",
                    subCategory: "",
                    folder: "",
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
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                    >
                      Category
                    </label>
                    <select
                      value={imageFormData.category}
                      onChange={(e) => {
                        setImageFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                          subCategory: "",
                          folder: "",
                        }));
                      }}
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
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                    >
                      Subcategory
                    </label>
                    <select
                      value={imageFormData.subCategory}
                      onChange={(e) => {
                        setImageFormData((prev) => ({
                          ...prev,
                          subCategory: e.target.value,
                          folder: "",
                        }));
                      }}
                      disabled={!imageFormData.category}
                      className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !imageFormData.category
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      required
                    >
                      <option value="">Choose a subcategory</option>
                      {categories
                        .find((cat) => cat._id === imageFormData.category)
                        ?.subcategories.map((subCat) => (
                          <option key={subCat._id} value={subCat._id}>
                            {subCat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                    >
                      Folder
                    </label>
                    <select
                      value={imageFormData.folder}
                      onChange={(e) => {
                        setImageFormData((prev) => ({
                          ...prev,
                          folder: e.target.value,
                        }));
                      }}
                      disabled={!imageFormData.subCategory}
                      className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !imageFormData.subCategory
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      required
                    >
                      <option value="">Choose a folder</option>
                      {folders
                        .filter(
                          (folder) =>
                            folder.categoryId === imageFormData.category &&
                            folder.subcategoryId === imageFormData.subCategory
                        )
                        .map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldClass}`}
                >
                  {`${selectedMediaType} Files`}
                </label>
                <input
                  type="file"
                  multiple
                  accept={
                    selectedMediaType === "Image"
                      ? "image/*"
                      : selectedMediaType === "Audio"
                      ? "audio/*"
                      : "video/*"
                  }
                  onChange={(e) => {
                    setImageFormData((prev) => ({
                      ...prev,
                      files: Array.from(e.target.files),
                      // If in a folder, set the category, subcategory, and folder automatically
                      ...(selectedFolderView && {
                        category: selectedFolderView.categoryId,
                        subCategory: selectedFolderView.subcategoryId,
                        folder: selectedFolderView.id,
                      }),
                    }));
                  }}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddImageModal(false);
                    setImageFormData({
                      files: [],
                      category: "",
                      subCategory: "",
                      folder: "",
                    });
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageUpload}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {`Upload ${selectedMediaType}s`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryTab;
