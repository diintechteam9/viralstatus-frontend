import {useState,useCallback,useRef,useEffect} from "react";
import { FaVideo, FaSave, FaTimes, FaPlay, FaDownload, FaTrash } from 'react-icons/fa';
import ReelTemplatePanel from "./ReelTemplatePanel";
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const ReelVideoEditor = () => {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [musicFiles, setMusicFiles] = useState([]);
    const [showTemplatePanel, setShowTemplatePanel] = useState(true);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [mergedVideoUrl, setMergedVideoUrl] = useState(null);
    const [canvasSize] = useState({ width: 1080, height: 1920 }); // Default to Full Portrait
    const [logoOptions, setLogoOptions] = useState({ showLogo: false, logoPosition: 'top-right' });
    const [showOutrow, setShowOutrow] = useState(false);
    const [showInrow, setShowInrow] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveFormData, setSaveFormData] = useState({
        title: '',
        description: ''
    });
    const [savedVideos, setSavedVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [videoError, setVideoError] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [templatePanelKey, setTemplatePanelKey] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [isMerging, setIsMerging] = useState(false);
    const [mergeProgress, setMergeProgress] = useState('');

    const resetProject = useCallback(() => {
        setMediaFiles([]);
        setMusicFiles([]);
        setShowTemplatePanel(false);
        setSelectedMediaIndex(0);
        setMergedVideoUrl(null);
        setCurrentFolder(null);
        setIsMerging(false);
        setMergeProgress('');
    }, []);

    const handleTemplateGenerate = useCallback(async (numImages, duration, options) => {
        try {
            if (!options.files || options.files.length === 0) {
                throw new Error('No files provided for template generation');
            }

            console.log('Template generation started with options:', options);

            setMediaFiles(options.files);
            
            if (options.musicFiles && options.musicFiles.length > 0) {
                setMusicFiles(options.musicFiles);
            }
            
            setLogoOptions({
                showLogo: options.showLogo,
                logoPosition: options.logoPosition
            });
            setShowOutrow(options.showOutrow);
            setShowInrow(options.showInrow);
            
            // Store the current folder information
            if (options.folder) {
                setCurrentFolder(options.folder);
            }

            // Start video merging process
            await mergeVideosWithFFmpeg(options.files, options.musicFiles || [], options, options.folder);

        } catch (error) {
            console.error('Error generating template:', error);
            alert('Error generating template. Please try again.');
        }
    }, []);

    // New function to merge videos using FFmpeg
    const mergeVideosWithFFmpeg = async (mediaFiles, musicFiles, options, folder) => {
        try {
            setIsMerging(true);
            setMergeProgress('Starting video merge...');
            setError(null);

            const token = sessionStorage.getItem('clienttoken');
            const userData = sessionStorage.getItem('userData');
            
            if (!token || !userData) {
                throw new Error('Authentication required');
            }

            const parsedUserData = JSON.parse(userData);

            // Prepare the request payload
            const payload = {
                mediaFiles: mediaFiles.map(file => ({
                    fileUrl: file.fileUrl,
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    mimeType: file.mimeType
                })),
                musicFiles: musicFiles.map(file => ({
                    fileUrl: file.fileUrl,
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    mimeType: file.mimeType
                })),
                options: {
                    width: canvasSize.width,
                    height: canvasSize.height,
                    showLogo: options.showLogo,
                    logoPosition: options.logoPosition,
                    showOutrow: options.showOutrow,
                    showInrow: options.showInrow,
                    title: saveFormData.title || 'Generated Reel',
                    description: saveFormData.description || ''
                },
                folder: folder,
                userId: parsedUserData.clientId
            };

            setMergeProgress('Uploading files for processing...');

            // Call the backend FFmpeg merge endpoint
            const response = await axios.post(
                `${API_BASE_URL}/api/images/merge`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 300000 // 5 minutes timeout
                }
            );

            if (response.data.success) {
                setMergeProgress('Video merge completed!');
                setMergedVideoUrl(response.data.signedUrl);
                console.log('Video merged successfully:', response.data);
            } else {
                throw new Error(response.data.message || 'Failed to merge videos');
            }

        } catch (error) {
            console.error('Error merging videos:', error);
            setError(error.response?.data?.message || error.message || 'Failed to merge videos');
        } finally {
            setIsMerging(false);
            setMergeProgress('');
        }
    };

    const getVideoUrl = async (fileId, categoryId, subcategoryId, folderId) => {
        try {
            const token = sessionStorage.getItem('clienttoken');
            const userData = sessionStorage.getItem('userData');
            
            if (!token || !userData) {
                throw new Error('Authentication required');
            }

            const parsedUserData = JSON.parse(userData);

            const response = await axios.post(
                `${API_BASE_URL}/api/datastore/download-url`,
                {
                    fileId,
                    categoryId,
                    subcategoryId,
                    folderId,
                    userId: parsedUserData.clientId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.url;
        } catch (error) {
            console.error('Error getting video URL:', error);
            throw error;
        }
    };

    // Function to fetch all videos
    const fetchAllVideos = useCallback(async () => {
        try {
            setLoadingVideos(true);
            setVideoError(null);

            const token = sessionStorage.getItem('clienttoken');
            const userData = sessionStorage.getItem('userData');
            
            if (!token || !userData) {
                throw new Error('Authentication required');
            }

            const parsedUserData = JSON.parse(userData);

            // First, get all categories
            const categoriesResponse = await axios.get(
                `${API_BASE_URL}/api/categories`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!categoriesResponse.data || !categoriesResponse.data.categories) {
                throw new Error('No categories found');
            }

            // Get subcategories for each category
            const categoryPromises = categoriesResponse.data.categories.map(async (category) => {
                try {
                    const subcategoriesResponse = await axios.get(
                        `${API_BASE_URL}/api/categories/${category._id}/subcategories`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (!subcategoriesResponse.data || !subcategoriesResponse.data.subcategories) {
                        return [];
                    }

                    // Get folders for each subcategory
                    const subcategoryPromises = subcategoriesResponse.data.subcategories.map(async (subcategory) => {
                        try {
                            const foldersResponse = await axios.get(
                                `${API_BASE_URL}/api/folders/category/${category._id}/subcategory/${subcategory._id}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );

                            if (!foldersResponse.data || !foldersResponse.data.folders) {
                                return [];
                            }

                            // Get videos from each folder
                            const folderPromises = foldersResponse.data.folders.map(async (folder) => {
                                try {
                                    const response = await axios.post(
                                        `${API_BASE_URL}/api/datastore/files`,
                                        {
                                            categoryId: category._id,
                                            subcategoryId: subcategory._id,
                                            folderId: folder._id,
                                            userId: parsedUserData.clientId
                                        },
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            }
                                        }
                                    );

                                    if (response.data && response.data.files) {
                                        // Filter only video files and add folder information
                                        const videoPromises = response.data.files
                                            .filter(file => file.type === 'Video')
                                            .map(async video => {
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
                                                        subcategoryName: subcategory.name
                                                    };
                                                } catch (error) {
                                                    console.error(`Error getting video URL for ${video._id}:`, error);
                                                    return null;
                                                }
                                            });
                                        
                                        const videos = await Promise.all(videoPromises);
                                        return videos.filter(video => video !== null);
                                    }
                                    return [];
                                } catch (error) {
                                    console.error(`Error fetching videos from folder ${folder.name}:`, error);
                                    return [];
                                }
                            });

                            const folderVideos = await Promise.all(folderPromises);
                            return folderVideos.flat();
                        } catch (error) {
                            console.error(`Error fetching folders for subcategory ${subcategory.name}:`, error);
                            return [];
                        }
                    });

                    const subcategoryVideos = await Promise.all(subcategoryPromises);
                    return subcategoryVideos.flat();
                } catch (error) {
                    console.error(`Error fetching subcategories for category ${category.name}:`, error);
                    return [];
                }
            });

            const categoryVideos = await Promise.all(categoryPromises);
            const allVideos = categoryVideos.flat();
            // Sort videos by creation date in descending order (newest first)
            const sortedVideos = allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setSavedVideos(sortedVideos);
        } catch (error) {
            console.error('Error fetching all videos:', error);
            setVideoError('Failed to fetch videos');
        } finally {
            setLoadingVideos(false);
        }
    }, []);

    const handleSaveReel = useCallback(async () => {
        if (!mergedVideoUrl || !currentFolder) {
            setSaveError('No video to save or folder information missing');
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);

            const token = sessionStorage.getItem('clienttoken');
            const userData = sessionStorage.getItem('userData');
            
            if (!token || !userData) {
                throw new Error('Authentication required');
            }

            const parsedUserData = JSON.parse(userData);
            console.log('User data:', parsedUserData);

            // Convert the video URL to a blob
            console.log('Fetching video from URL:', mergedVideoUrl);
            const response = await fetch(mergedVideoUrl);
            const videoBlob = await response.blob();
            console.log('Video blob size:', videoBlob.size);

            // Create a File object from the blob
            const videoFile = new File([videoBlob], `reel_${Date.now()}.webm`, {
                type: 'video/webm'
            });

            // Generate the S3 key structure
            const key = `${parsedUserData.clientId}/${currentFolder.categoryId}/${currentFolder.subcategoryId ? currentFolder.subcategoryId + '/' : ''}${currentFolder.id}/${videoFile.name}`;

            // First, get upload URL
            console.log('Requesting upload URL...');
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
                    type: 'Video',
                    title: saveFormData.title || videoFile.name,
                    description: saveFormData.description || '',
                    metadata: {
                        userId: parsedUserData.clientId,
                        categoryId: currentFolder.categoryId,
                        subcategoryId: currentFolder.subcategoryId || null,
                        folderId: currentFolder.id,
                        key: key,
                        mimeType: videoFile.type
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Upload URL response:', uploadUrlResponse.data);

            if (!uploadUrlResponse.data.url) {
                throw new Error('Failed to get upload URL');
            }

            // Upload file to the URL
            console.log('Uploading video to URL:', uploadUrlResponse.data.url);
            const uploadResponse = await axios.put(uploadUrlResponse.data.url, videoFile, {
                headers: {
                    'Content-Type': videoFile.type
                }
            });
            console.log('Upload response:', uploadResponse);

            // Verify the upload was successful
            if (uploadResponse.status !== 200) {
                throw new Error('Failed to upload video');
            }

            // Reset video preview
            setMergedVideoUrl(null);
            setShowSaveForm(false);
            setSaveFormData({ title: '', description: '' });
            
            // Reset template panel
            setShowTemplatePanel(true);
            setMediaFiles([]);
            setMusicFiles([]);
            setSelectedMediaIndex(0);
            setCurrentFolder(null);
            
            // Reset logo and row options
            setLogoOptions({ showLogo: false, logoPosition: 'top-right' });
            setShowOutrow(false);
            setShowInrow(false);
            
            // Reset any error states
            setSaveError(null);

            // Force template panel reset by changing its key
            setTemplatePanelKey(prev => prev + 1);

            // Refresh the saved videos list
            console.log('Refreshing video list...');
            await fetchAllVideos();
        } catch (error) {
            console.error('Error saving reel:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                setSaveError(`Failed to save reel: ${error.response.data.message || error.message}`);
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
        setSaveFormData({ title: '', description: '' });
        setSaveError(null);
    };

    // Fetch all videos when component mounts
    useEffect(() => {
        fetchAllVideos();
    }, [fetchAllVideos]);

    // Add new handlers for download and discard
    const handleDownload = async () => {
        if (!mergedVideoUrl) {
            setError('No video to download');
            return;
        }

        try {
            setDownloading(true);
            setError(null);

            // Fetch the video blob
            const response = await fetch(mergedVideoUrl);
            const videoBlob = await response.blob();

            // Create a new blob with mp4 mime type
            const mp4Blob = new Blob([videoBlob], { type: 'video/mp4' });

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(mp4Blob);
            downloadLink.download = `video_${Date.now()}.mp4`;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up
            URL.revokeObjectURL(downloadLink.href);
        } catch (error) {
            console.error('Download error:', error);
            setError('Failed to download video');
        } finally {
            setDownloading(false);
        }
    };

    const handleDiscard = () => {
        if (window.confirm('Are you sure you want to discard this video?')) {
            // Reset video preview
            setMergedVideoUrl(null);
            setShowSaveForm(false);
            setSaveFormData({ title: '', description: '' });
            
            // Reset template panel
            setShowTemplatePanel(true);
            setMediaFiles([]);
            setMusicFiles([]);
            setSelectedMediaIndex(0);
            setCurrentFolder(null);
            
            // Reset logo and row options
            setLogoOptions({ showLogo: false, logoPosition: 'top-right' });
            setShowOutrow(false);
            setShowInrow(false);
            
            // Reset any error states
            setSaveError(null);

            // Force template panel reset by changing its key
            setTemplatePanelKey(prev => prev + 1);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            <div className="flex flex-1 relative overflow-hidden">
                {/* Template Button */}
                

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative bg-gray overflow-hidden ml-8">
                    <div className="flex-1 overflow-auto">
                        <div className="max-w-7xl mx-auto px-1 py-1">
                            {/* Top Section: Form and Preview */}
                            <div className="flex gap-4">
                                {/* Template Panel */}
                                {showTemplatePanel && (
                                    <div className="w-80 flex-shrink-0">
                                        <div className="p-2">
                                            <ReelTemplatePanel 
                                                key={templatePanelKey}
                                                onGenerate={handleTemplateGenerate} 
                                            />
                                        </div>
                        </div>
                    )}

                                {/* Merged Video Preview */}
                                {mergedVideoUrl ? (
                                    <div className="w-80 flex-shrink-0 ml-55">
                                        <div className="bg-white rounded-lg shadow-lg p-2">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
                                            <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden h-115 w-75">
                                                <video
                                                    className="w-full h-full object-cover"
                                                    src={mergedVideoUrl}
                                                    controls
                                                    onLoadedMetadata={() => console.log('Preview video loaded')}
                                                    onError={(e) => console.error('Preview video error:', e)}
                                                />
                                            </div>
                                            {/* Save Button */}
                                            <div className="mt-4">
                                                <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={handleSaveClick}
                                                        className="flex items-center justify-center p-3 rounded-lg shadow transition bg-green-600 text-white hover:bg-green-700"
                                                        title="Save Reel"
                                                    >
                                                        <FaSave className="text-xl" />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={handleDownload}
                                                        className="flex items-center justify-center p-3 rounded-lg shadow transition bg-blue-600 text-white hover:bg-blue-700"
                                                        title="Download"
                                                    >
                                                        <FaDownload className="text-xl" />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={handleDiscard}
                                                        className="flex items-center justify-center p-3 rounded-lg shadow transition bg-red-600 text-white hover:bg-red-700"
                                                        title="Discard"
                                                    >
                                                        <FaTrash className="text-xl" />
                                                </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : mediaFiles.length > 0 && (
                                    <div className="w-80 flex-shrink-0 ml-55">
                                        <div className="bg-white rounded-lg shadow-lg p-2">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
                                            <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden h-115 w-75 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                                    <p className="mt-4 text-white">Generating video...</p>
                                                </div>
                        </div>
                        </div>
                        </div>
                    )}
                </div>

                            {/* Saved Reels Section */}
                            <div className="mt-3">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Reels</h2>
                                
                                {loadingVideos ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-4 text-gray-600">Loading your reels...</p>
                                    </div>
                                ) : videoError ? (
                                    <div className="text-red-600 py-4 text-center">{videoError}</div>
                                ) : savedVideos.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaVideo className="text-6xl text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-xl font-medium text-gray-900 mb-2">No reels yet</h3>
                                        <p className="text-gray-500">Create your first reel using the Generate Reel button</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {savedVideos.map((video) => (
                                            <div key={video._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                                <div className="relative aspect-[9/16] bg-black">
                                                    <video
                                                        className="w-full h-full object-cover"
                                                        src={video.fileUrl}
                                                        controls
                                                    />
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-medium text-gray-900">{video.title}</h3>
                                                    {video.description && (
                                                        <p className="text-sm text-gray-500 mt-1">{video.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
                                    onChange={(e) => setSaveFormData(prev => ({ ...prev, title: e.target.value }))}
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
                                    onChange={(e) => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
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
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReelVideoEditor;
