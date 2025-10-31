import React, { useEffect, useState, useRef } from "react";
import {
  FaTrash,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaImage,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const PoolImages = ({
  imagePool,
  onImagesUpdated,
  onSelectedImagesChange,
  hideDelete,
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // "single", "multiple", "all"
  const [deleting, setDeleting] = useState(false);
  const [selectAllClicked, setSelectAllClicked] = useState(false);

  const fetchImages = async () => {
    if (!imagePool || !imagePool._id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/image-pools/${imagePool._id}/images`
      );
      const data = await response.json();
      const sorted = (data.images || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setImages(sorted);
    } catch (err) {
      setError("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchImages();
  }, [imagePool]);

  useEffect(() => {
    if (onSelectedImagesChange) {
      onSelectedImagesChange(Array.from(selectedImages));
    }
    // eslint-disable-next-line
  }, [selectedImages]);

  const handleSelectImage = (imageId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
      setSelectAllClicked(false);
    } else {
      setSelectedImages(new Set(images.map((image) => image._id)));
      setSelectAllClicked(true);
    }
  };

  const handleDeleteSingle = (imageId) => {
    setDeleteType("single");
    setSelectedImages(new Set([imageId]));
    setShowDeleteConfirm(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedImages.size === 0) return;
    setDeleteType("multiple");
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    if (!selectAllClicked) return;
    setDeleteType("all");
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      let response;

      if (deleteType === "single") {
        const imageId = Array.from(selectedImages)[0];
        response = await fetch(`${API_BASE_URL}/api/image-pools/images/${imageId}`, {
          method: "DELETE",
        });
      } else if (deleteType === "multiple") {
        response = await fetch(`${API_BASE_URL}/api/image-pools/images`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageIds: Array.from(selectedImages),
          }),
        });
      } else if (deleteType === "all") {
        response = await fetch(`${API_BASE_URL}/api/image-pools/${imagePool._id}/images`, {
          method: "DELETE",
        });
      }

      if (!response.ok) {
        throw new Error("Failed to delete images");
      }

      const result = await response.json();
      console.log("Delete result:", result);

      // Refresh images list
      await fetchImages();

      // Clear selections
      setSelectedImages(new Set());
      setSelectAllClicked(false);

      // Notify parent component if callback provided
      if (onImagesUpdated) {
        onImagesUpdated();
      }
    } catch (err) {
      setError(`Failed to delete images: ${err.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteType("");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading images...</span>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-red-600 font-medium">Error</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
        </div>
      </div>
    );

  const getDeleteMessage = () => {
    if (deleteType === "single") {
      return "Are you sure you want to delete this image?";
    } else if (deleteType === "multiple") {
      return `Are you sure you want to delete ${selectedImages.size} selected images?`;
    } else if (deleteType === "all") {
      return `Are you sure you want to delete all ${images.length} images from this image pool?`;
    }
    return "";
  };

  // Check if all images are selected (for hiding "Delete Selected" when "Select All" is active)
  const allImagesSelected =
    selectedImages.size === images.length && images.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto ">
      {imagePool && imagePool.name && (
        <div className="w-full max-w-7xl mx-auto mb-4 p-5">
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {imagePool.name} 
            </h2>
            <div className="w-full border-b border-gray-200 mt-2 mb-2"></div>
          </div>
          <div className="flex justify-end">
            <label className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-600 transition-colors shadow-lg disabled:opacity-60 focus:ring-2 focus:ring-purple-400 cursor-pointer">
              Upload Images
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length || !imagePool?._id) return;
                  try {
                    const uploads = files.map(async (file) => {
                      const formData = new FormData();
                      formData.append("image", file);
                      const response = await fetch(`${API_BASE_URL}/api/image-pools/${imagePool._id}/upload`, {
                        method: "POST",
                        body: formData,
                      });
                      if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        throw new Error(errText || `Upload failed (${response.status})`);
                      }
                    });
                    await Promise.all(uploads);
                    await fetchImages();
                  } catch (err) {
                    setError(`Failed to upload images: ${err.message}`);
                  } finally {
                    // allow re-selecting the same files
                    try { e.target.value = ""; } catch(_) {}
                  }
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {images.map((image, index) => (
            <div
              key={image._id}
              className={`group relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                selectedImages.has(image._id)
                  ? "border-purple-500 ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Selection checkbox - always visible for selection */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedImages.has(image._id)}
                  onChange={() => handleSelectImage(image._id)}
                  className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
              </div>

              {/* Delete button - shown on hover */}
              {!hideDelete && (
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDeleteSingle(image._id)}
                    disabled={deleting}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors duration-200 shadow-sm"
                    title="Delete this image"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}

              {/* Image Container */}
              <div className="aspect-square w-full bg-gray-900 rounded-t-xl overflow-hidden relative flex items-center justify-center">
                {image.s3Url ? (
                  <img
                    src={image.s3Url}
                    alt={image.title || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={{ background: "#222" }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FaImage className="text-4xl mb-2" />
                    <div className="text-xs">No image available</div>
                  </div>
                )}
              </div>

              {/* Image Info */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-medium">
                    Image #{index + 1}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(
                      image.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
            <div className="text-gray-400 text-4xl mb-4">🖼️</div>
            <div className="text-gray-600 font-medium mb-2">No images found</div>
            <div className="text-gray-500 text-sm">
              This image pool doesn't have any images yet.
            </div>
          </div>
        </div>
      )}

      {!hideDelete && selectedImages.size > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-40 flex justify-center pointer-events-none p-6">
          <div className="bg-white border border-gray-200 rounded-t-xl shadow-lg px-6 py-3 mb-0 flex items-center gap-6 max-w-2xl w-full pointer-events-auto">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={
                  selectedImages.size === images.length && images.length > 0
                }
                onChange={handleSelectAll}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({selectedImages.size}/{images.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              {selectedImages.size > 0 &&
                selectedImages.size !== images.length && (
                  <button
                    onClick={handleDeleteMultiple}
                    disabled={deleting}
                    className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-10 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  >
                    <FaTrash className="mr-2 text-sm" />
                    Delete Selected ({selectedImages.size})
                  </button>
                )}
              <button
                onClick={handleDeleteAll}
                disabled={
                  deleting ||
                  !(selectedImages.size === images.length && images.length > 0)
                }
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm ${
                  selectedImages.size === images.length && images.length > 0
                    ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaTrash className="mr-2 text-sm" />
                Delete All ({images.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && !hideDelete && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="text-red-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Delete
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{getDeleteMessage()}</p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200 flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolImages;
