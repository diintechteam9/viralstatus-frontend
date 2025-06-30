import { useState, useCallback, useRef, useEffect } from "react";
import {
  FaVideo,
  FaSave,
  FaTimes,
  FaPlay,
  FaDownload,
  FaTrash,
  FaLayerGroup,
  FaMusic,
  FaPlus,
  FaSpinner,
} from "react-icons/fa";
import ReelTemplatePanel from "./ReelTemplatePanel";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const ReelVideoEditor = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [musicFiles, setMusicFiles] = useState([]);
  const [showTemplatePanel, setShowTemplatePanel] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null);
  const [canvasSize] = useState({ width: 1080, height: 1920 }); // Default to Full Portrait
  const [logoOptions, setLogoOptions] = useState({
    showLogo: false,
    logoPosition: "top-right",
  });
  const [showOutrow, setShowOutrow] = useState(false);
  const [showInrow, setShowInrow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    title: "",
    description: "",
  });
  const [savedVideos, setSavedVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [templatePanelKey, setTemplatePanelKey] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState("");

  const resetProject = useCallback(() => {
    setMediaFiles([]);
    setMusicFiles([]);
    setShowTemplatePanel(false);
    setSelectedMediaIndex(0);
    setMergedVideoUrl(null);
    setCurrentFolder(null);
    setIsMerging(false);
    setMergeProgress("");
  }, []);

  const handleTemplateGenerate = useCallback(
    async (numImages, duration, options) => {
      try {
        if (!options.files || options.files.length === 0) {
          throw new Error("No files provided for template generation");
        }

        console.log("Template generation started with options:", options);

        setMediaFiles(options.files);

        if (options.musicFiles && options.musicFiles.length > 0) {
          setMusicFiles(options.musicFiles);
        }

        setLogoOptions({
          showLogo: options.showLogo,
          logoPosition: options.logoPosition,
        });
        setShowOutrow(options.showOutrow);
        setShowInrow(options.showInrow);

        // Store the current folder information
        if (options.folder) {
          setCurrentFolder(options.folder);
        }

        // Start video merging process
        await mergeVideosWithFFmpeg(
          options.files,
          options.musicFiles || [],
          options,
          options.folder
        );
      } catch (error) {
        console.error("Error generating template:", error);
        alert("Error generating template. Please try again.");
      }
    },
    []
  );

  // New function to merge videos using FFmpeg
  const mergeVideosWithFFmpeg = async (
    mediaFiles,
    musicFiles,
    options,
    folder
  ) => {
    try {
      setIsMerging(true);
      setMergeProgress("Starting video merge...");
      setError(null);

      const token = sessionStorage.getItem("clienttoken");
      const userData = sessionStorage.getItem("userData");

      if (!token || !userData) {
        throw new Error("Authentication required");
      }

      const parsedUserData = JSON.parse(userData);

      setMergeProgress("Converting files to base64...");

      // Convert blob URLs to base64 data with compression
      const convertBlobToBase64 = async (blobUrl, isImage = true) => {
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();

          // Compress images to reduce payload size
          if (isImage && blob.type.startsWith("image/")) {
            return new Promise((resolve, reject) => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const img = new Image();

              img.onload = () => {
                // Set canvas size (max 1080x1920 for reels)
                const maxWidth = 1080;
                const maxHeight = 1920;
                let { width, height } = img;

                // Calculate new dimensions maintaining aspect ratio
                if (width > height) {
                  if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                  }
                } else {
                  if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                  }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                  (compressedBlob) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(compressedBlob);
                  },
                  "image/jpeg",
                  0.8
                ); // Compress to JPEG with 80% quality
              };

              img.onerror = reject;
              img.src = URL.createObjectURL(blob);
            });
          } else {
            // For non-images, convert directly
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.error("Error converting blob to base64:", error);
          throw error;
        }
      };

      // Prepare the request payload with base64 data
      const payload = {
        mediaFiles: await Promise.all(
          mediaFiles.map(async (file, index) => {
            const mediaBase64Data = await convertBlobToBase64(file.url, true); // Compress images
            return {
              fileData: mediaBase64Data, // Send base64 data instead of URL
              fileName: file.name,
              fileSize: file.file ? file.file.size : 0,
              mimeType: file.file ? file.file.type : "image/jpeg",
            };
          })
        ),
        musicFiles: await Promise.all(
          musicFiles.map(async (file, index) => {
            const musicBase64Data = await convertBlobToBase64(file.url, false); // Don't compress audio
            return {
              fileData: musicBase64Data, // Send base64 data instead of URL
              fileName: file.name,
              fileSize: file.file ? file.file.size : 0,
              mimeType: file.file ? file.file.type : "audio/mpeg",
            };
          })
        ),
        options: {
          width: canvasSize.width,
          height: canvasSize.height,
          showLogo: options.showLogo,
          logoPosition: options.logoPosition,
          showOutrow: options.showOutrow,
          showInrow: options.showInrow,
          title: saveFormData.title || "Generated Reel",
          description: saveFormData.description || "",
          previewOnly: true, // Always preview first
        },
        folder: folder,
        userId: parsedUserData.clientId,
      };

      console.log("Payload being sent to backend (first media file preview):", {
        ...payload,
        mediaFiles: payload.mediaFiles.map((f) => ({
          ...f,
          fileData: f.fileData.substring(0, 100) + "...",
          compressedSize: Math.round(f.fileData.length / 1024) + "KB",
        })),
      });

      setMergeProgress("Uploading files for processing...");

      // Call the backend FFmpeg merge endpoint for preview
      let response;
      try {
        response = await axios.post(
          `${API_BASE_URL}/api/images/merge`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 300000, // 5 minutes timeout
            responseType: "blob", // Expect a Blob for preview
          }
        );
      } catch (err) {
        // If error response is JSON, try to parse and show error
        if (
          err.response &&
          err.response.data &&
          err.response.data.type === "application/json"
        ) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result);
              setError(json.message || "Failed to merge videos");
            } catch (e) {
              setError("Failed to merge videos");
            }
          };
          reader.readAsText(err.response.data);
        } else {
          setError("Failed to merge videos");
        }
        setIsMerging(false);
        setMergeProgress("");
        return;
      }

      // If the response is a video blob, create a preview URL
      if (
        response &&
        response.data &&
        response.headers["content-type"] &&
        response.headers["content-type"].includes("video")
      ) {
        const videoBlob = new Blob([response.data], { type: "video/mp4" });
        const videoUrl = URL.createObjectURL(videoBlob);
        setMergedVideoUrl(videoUrl);
        setMergeProgress("Video merge completed!");
        console.log("Video merged and previewed from blob.");
      } else {
        // Fallback: try to parse as JSON (for S3 upload response)
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result);
              if (json.success && json.signedUrl) {
                setMergedVideoUrl(json.signedUrl);
                setMergeProgress("Video merge completed!");
              } else {
                setError(json.message || "Failed to merge videos");
              }
            } catch (e) {
              setError("Failed to merge videos");
            }
          };
          reader.readAsText(response.data);
        } catch (e) {
          setError("Failed to merge videos");
        }
      }
    } catch (error) {
      console.error("Error merging videos:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to merge videos"
      );
    } finally {
      setIsMerging(false);
      setMergeProgress("");
    }
  };

  const getVideoUrl = async (fileId, categoryId, subcategoryId, folderId) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const userData = sessionStorage.getItem("userData");

      if (!token || !userData) {
        throw new Error("Authentication required");
      }

      const parsedUserData = JSON.parse(userData);

      const response = await axios.post(
        `${API_BASE_URL}/api/datastore/download-url`,
        {
          fileId,
          categoryId,
          subcategoryId,
          folderId,
          userId: parsedUserData.clientId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.url;
    } catch (error) {
      console.error("Error getting video URL:", error);
      throw error;
    }
  };

  // Function to fetch all videos
  const fetchAllVideos = useCallback(async () => {
    try {
      setLoadingVideos(true);
      setVideoError(null);

      const token = sessionStorage.getItem("clienttoken");
      const userData = sessionStorage.getItem("userData");

      if (!token || !userData) {
        throw new Error("Authentication required");
      }

      const parsedUserData = JSON.parse(userData);

      // First, get all categories
      const categoriesResponse = await axios.get(
        `${API_BASE_URL}/api/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!categoriesResponse.data || !categoriesResponse.data.categories) {
        throw new Error("No categories found");
      }

      // Get subcategories for each category
      const categoryPromises = categoriesResponse.data.categories.map(
        async (category) => {
          try {
            const subcategoriesResponse = await axios.get(
              `${API_BASE_URL}/api/categories/${category._id}/subcategories`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (
              !subcategoriesResponse.data ||
              !subcategoriesResponse.data.subcategories
            ) {
              return [];
            }

            // Get folders for each subcategory
            const subcategoryPromises =
              subcategoriesResponse.data.subcategories.map(
                async (subcategory) => {
                  try {
                    const foldersResponse = await axios.get(
                      `${API_BASE_URL}/api/folders/category/${category._id}/subcategory/${subcategory._id}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );

                    if (
                      !foldersResponse.data ||
                      !foldersResponse.data.folders
                    ) {
                      return [];
                    }

                    // Get videos from each folder
                    const folderPromises = foldersResponse.data.folders.map(
                      async (folder) => {
                        try {
                          const response = await axios.post(
                            `${API_BASE_URL}/api/datastore/files`,
                            {
                              categoryId: category._id,
                              subcategoryId: subcategory._id,
                              folderId: folder._id,
                              userId: parsedUserData.clientId,
                            },
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                            }
                          );

                          if (response.data && response.data.files) {
                            // Filter only video files and add folder information
                            const videoPromises = response.data.files
                              .filter((file) => file.type === "Video")
                              .map(async (video) => {
                                try {
                                  const videoUrl = await getVideoUrl(
                                    video._id,
                                    category._id,
                                    subcategory._id,
                                    folder._id
                                  );
                                  return {
                                    ...video,
                                    fileUrl: videoUrl,
                                    folderName: folder.name,
                                    categoryName: category.name,
                                    subcategoryName: subcategory.name,
                                  };
                                } catch (error) {
                                  console.error(
                                    `Error getting video URL for ${video._id}:`,
                                    error
                                  );
                                  return null;
                                }
                              });

                            const videos = await Promise.all(videoPromises);
                            return videos.filter((video) => video !== null);
                          }
                          return [];
                        } catch (error) {
                          console.error(
                            `Error fetching videos from folder ${folder.name}:`,
                            error
                          );
                          return [];
                        }
                      }
                    );

                    const folderVideos = await Promise.all(folderPromises);
                    return folderVideos.flat();
                  } catch (error) {
                    console.error(
                      `Error fetching folders for subcategory ${subcategory.name}:`,
                      error
                    );
                    return [];
                  }
                }
              );

            const subcategoryVideos = await Promise.all(subcategoryPromises);
            return subcategoryVideos.flat();
          } catch (error) {
            console.error(
              `Error fetching subcategories for category ${category.name}:`,
              error
            );
            return [];
          }
        }
      );

      const categoryVideos = await Promise.all(categoryPromises);
      const allVideos = categoryVideos.flat();
      // Sort videos by creation date in descending order (newest first)
      const sortedVideos = allVideos.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setSavedVideos(sortedVideos);
    } catch (error) {
      console.error("Error fetching all videos:", error);
      setVideoError("Failed to fetch videos");
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  const handleSaveReel = useCallback(async () => {
    if (!mergedVideoUrl || !currentFolder) {
      setSaveError("No video to save or folder information missing");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const token = sessionStorage.getItem("clienttoken");
      const userData = sessionStorage.getItem("userData");

      if (!token || !userData) {
        throw new Error("Authentication required");
      }

      const parsedUserData = JSON.parse(userData);
      console.log("User data:", parsedUserData);

      // Convert the video URL to a blob
      console.log("Fetching video from URL:", mergedVideoUrl);
      const response = await fetch(mergedVideoUrl);
      const videoBlob = await response.blob();
      console.log("Video blob size:", videoBlob.size);

      // Create a File object from the blob
      const videoFile = new File([videoBlob], `reel_${Date.now()}.mp4`, {
        type: "video/mp4",
      });

      // Generate the S3 key structure
      const key = `${parsedUserData.clientId}/${currentFolder.categoryId}/${
        currentFolder.subcategoryId ? currentFolder.subcategoryId + "/" : ""
      }${currentFolder.id}/${videoFile.name}`;

      // First, get upload URL
      console.log("Requesting upload URL...");
      const uploadUrlResponse = await axios.post(
        `${API_BASE_URL}/api/datastore/upload-url`,
        {
          fileId: videoFile.name,
          categoryId: currentFolder.categoryId,
          subcategoryId: currentFolder.subcategoryId,
          folderId: currentFolder.id,
          userId: parsedUserData.clientId,
          fileSize: videoFile.size,
          mimeType: videoFile.type,
          type: "Video",
          title: saveFormData.title || videoFile.name,
          description: saveFormData.description || "",
          metadata: {
            userId: parsedUserData.clientId,
            categoryId: currentFolder.categoryId,
            subcategoryId: currentFolder.subcategoryId || null,
            folderId: currentFolder.id,
            key: key,
            mimeType: videoFile.type,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Upload URL response:", uploadUrlResponse.data);

      if (!uploadUrlResponse.data.url) {
        throw new Error("Failed to get upload URL");
      }

      // Upload file to the URL
      console.log("Uploading video to URL:", uploadUrlResponse.data.url);
      const uploadResponse = await axios.put(
        uploadUrlResponse.data.url,
        videoFile,
        {
          headers: {
            "Content-Type": videoFile.type,
          },
        }
      );
      console.log("Upload response:", uploadResponse);

      // Verify the upload was successful
      if (uploadResponse.status !== 200) {
        throw new Error("Failed to upload video");
      }

      // Reset video preview
      setMergedVideoUrl(null);
      setShowSaveForm(false);
      setSaveFormData({ title: "", description: "" });

      // Reset template panel
      setShowTemplatePanel(true);
      setMediaFiles([]);
      setMusicFiles([]);
      setSelectedMediaIndex(0);
      setCurrentFolder(null);

      // Reset logo and row options
      setLogoOptions({ showLogo: false, logoPosition: "top-right" });
      setShowOutrow(false);
      setShowInrow(false);

      // Reset any error states
      setSaveError(null);

      // Force template panel reset by changing its key
      setTemplatePanelKey((prev) => prev + 1);

      // Refresh the saved videos list
      console.log("Refreshing video list...");
      await fetchAllVideos();
    } catch (error) {
      console.error("Error saving reel:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        setSaveError(
          `Failed to save reel: ${error.response.data.message || error.message}`
        );
      } else {
        setSaveError(`Failed to save reel: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  }, [mergedVideoUrl, currentFolder, saveFormData, fetchAllVideos]);

  const handleSaveClick = () => {
    setShowSaveForm(true);
  };

  const handleSaveFormClose = () => {
    setShowSaveForm(false);
    setSaveFormData({ title: "", description: "" });
    setSaveError(null);
  };

  // Fetch all videos when component mounts
  useEffect(() => {
    fetchAllVideos();
  }, [fetchAllVideos]);

  // Add new handlers for download and discard
  const handleDownload = async () => {
    if (!mergedVideoUrl) {
      setError("No video to download");
      return;
    }

    try {
      setDownloading(true);
      setError(null);

      // Fetch the video blob
      const response = await fetch(mergedVideoUrl);
      const videoBlob = await response.blob();

      // Create a new blob with mp4 mime type
      const mp4Blob = new Blob([videoBlob], { type: "video/mp4" });

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(mp4Blob);
      downloadLink.download = `video_${Date.now()}.mp4`;

      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download video");
    } finally {
      setDownloading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this video?")) {
      // Reset video preview
      setMergedVideoUrl(null);
      setShowSaveForm(false);
      setSaveFormData({ title: "", description: "" });

      // Reset template panel
      setShowTemplatePanel(true);
      setMediaFiles([]);
      setMusicFiles([]);
      setSelectedMediaIndex(0);
      setCurrentFolder(null);

      // Reset logo and row options
      setLogoOptions({ showLogo: false, logoPosition: "top-right" });
      setShowOutrow(false);
      setShowInrow(false);

      // Reset any error states
      setSaveError(null);

      // Force template panel reset by changing its key
      setTemplatePanelKey((prev) => prev + 1);
    }
  };

  // Test function to verify endpoint is working
  const testEndpoint = async () => {
    try {
      console.log("Testing video merge endpoint...");
      const response = await axios.get(`${API_BASE_URL}/api/images/test`);
      console.log("Test endpoint response:", response.data);
      return true;
    } catch (error) {
      console.error("Test endpoint error:", error);
      return false;
    }
  };

  // Test the endpoint when component mounts
  useEffect(() => {
    testEndpoint();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <main className="flex-1 flex flex-col md:flex-row gap-8 p-6 max-w-7xl mx-auto w-full">
        {/* Left: Template/Media Panel */}
        <section className="w-full md:w-[420px] flex-shrink-0 flex flex-col gap-6">
          {showTemplatePanel && (
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-blue-100">
              <h2 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-2">
                <FaPlus /> Templates & Media
              </h2>
              <ReelTemplatePanel
                key={templatePanelKey}
                onGenerate={handleTemplateGenerate}
              />
            </div>
          )}
        </section>
        {/* Right: Preview & Actions */}
        <section className="flex-1 flex flex-col gap-6">
          {/* Preview Panel */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 flex flex-col justify-start items-center min-h-[498px] max-h-[700px] h-full">
            <h2 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-2 ">
              <FaPlay /> Preview
            </h2>
            <div className="flex w-full items-start gap-6">
              <div className="relative aspect-[9/16] w-[240px] bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-200 rounded-3xl shadow-xl overflow-hidden flex items-center justify-center h-[420px] mx-auto p-0">
                {mergedVideoUrl ? (
                  <video
                    className="w-full h-full object-contain rounded-2xl border border-blue-300 shadow-lg bg-black m-0"
                    src={mergedVideoUrl}
                    controls
                    style={{ background: "#000" }}
                  />
                ) : isMerging ? (
                  <div className="flex flex-col items-center justify-center w-full h-96">
                    <FaSpinner className="animate-spin text-5xl text-blue-500 mb-4" />
                    <span className="text-blue-700 font-semibold">
                      {mergeProgress || "Merging video..."}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-96 text-gray-400">
                    <FaVideo className="text-6xl mb-4" />
                    <span className="text-s font-medium ">
                      Your preview will appear here
                    </span>
                  </div>
                )}
              </div>
              {/* Divider */}
              <div className="h-[420px] w-px bg-blue-100 mx-2 hidden md:block" />
              {/* Action Buttons on the right */}
              <div className="flex flex-col gap-4 items-stretch justify-start min-w-[160px] pt-2">
                {mergedVideoUrl && (
                  <>
                    <button
                      onClick={handleSaveClick}
                      className="flex items-center gap-3 justify-center px-6 py-3 rounded-xl shadow bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg hover:from-green-600 hover:to-green-700 active:scale-95 transition"
                      title="Save Reel"
                    >
                      <FaSave className="text-xl" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-3 justify-center px-6 py-3 rounded-xl shadow bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 transition"
                      title="Download"
                    >
                      <FaDownload className="text-xl" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={handleDiscard}
                      className="flex items-center gap-3 justify-center px-6 py-3 rounded-xl shadow bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg hover:from-red-600 hover:to-red-700 active:scale-95 transition"
                      title="Discard"
                    >
                      <FaTrash className="text-xl" />
                      <span>Discard</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
                {error}
              </div>
            )}
          </div>
        </section>
      </main>
      {/* Saved Reels Section - now full width */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mt-6 max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-2">
          <FaVideo /> Saved Reels
        </h2>
        {loadingVideos ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <p className="text-blue-700 font-semibold">Loading your reels...</p>
          </div>
        ) : videoError ? (
          <div className="text-red-600 py-4 text-center">{videoError}</div>
        ) : savedVideos.length === 0 ? (
          <div className="text-center py-12">
            <FaVideo className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No reels yet
            </h3>
            <p className="text-gray-500">
              Create your first reel using the Generate Reel button
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedVideos.map((video) => {
              return (
                <div
                  key={video._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer"
                >
                  <div className="relative aspect-[9/16] bg-black">
                    <video
                      className="w-full h-full object-cover"
                      src={video.fileUrl}
                      controls
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Save Form Modal */}
      {showSaveForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Save Reel</h2>
              <button
                onClick={handleSaveFormClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveFormData.title}
                  onChange={(e) =>
                    setSaveFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter reel title"
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={saveFormData.description}
                  onChange={(e) =>
                    setSaveFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter reel description"
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              {saveError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {saveError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleSaveFormClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReel}
                disabled={saving || !saveFormData.title.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  saving || !saveFormData.title.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelVideoEditor;
