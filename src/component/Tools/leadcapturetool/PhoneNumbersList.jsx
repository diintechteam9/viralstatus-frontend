import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Globe,
  Eye,
  Trash2,
  Edit,
  Upload,
  Camera,
  FileImage,
  X,
  Loader,
  Download,
  FileSpreadsheet,
  MoreVertical
} from 'lucide-react';
import { API_BASE_URL } from '../../../config';
import toast from 'react-hot-toast';

const PhoneNumbersList = ({ cardId }) => {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isValid: '',
    countryCode: '',
    minConfidence: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Upload-related states
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [screenshotId, setScreenshotId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [formData, setFormData] = useState({
    url: '',
    title: ''
  });
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Selection states
  const [selectedPhoneNumbers, setSelectedPhoneNumbers] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchPhoneNumbers(true); // Show loading on initial load
  }, [pagination.currentPage, filters, searchTerm]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const fetchPhoneNumbers = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters,
        ...(searchTerm && { search: searchTerm }),
        ...(cardId && { cardId: cardId })
      };

      console.log('Fetching phone numbers with params:', params);
      const res = await fetch(`${API_BASE_URL}/api/phone-numbers?${new URLSearchParams(params)}`);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch phone numbers');
      }
      
      const response = await res.json();
      console.log('Phone numbers API response:', response);
      
      setPhoneNumbers(response.data.phoneNumbers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to fetch phone numbers');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handleDelete = async (phoneNumberId) => {
    if (!window.confirm('Are you sure you want to delete this phone number?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/phone-numbers/${phoneNumberId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete phone number');
      }
      
      toast.success('Phone number deleted successfully');
      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error deleting phone number:', error);
      toast.error('Failed to delete phone number');
    }
  };

  const handleUpdate = async (phoneNumberId, updates) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/phone-numbers/${phoneNumberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update phone number');
      }
      
      toast.success('Phone number updated successfully');
      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error('Failed to update phone number');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL phone numbers? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/phone-numbers/delete-all`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete all phone numbers');
      }
      
      toast.success('All phone numbers deleted successfully');
      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error deleting all phone numbers:', error);
      toast.error('Failed to delete all phone numbers');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Upload-related functions
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    toast.success('File selected successfully');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setProcessing(true);
      setProgress(0);
      setProgressText('Uploading screenshot...');
      
      const uploadFormData = new FormData();
      uploadFormData.append('screenshot', uploadedFile);
      uploadFormData.append('url', formData.url);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('cardId', cardId);

      const res = await fetch(`${API_BASE_URL}/api/screenshots/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload screenshot');
      }
      
      const response = await res.json();
      const screenshotId = response.data.id;
      
      setProgress(30);
      setProgressText('Upload complete. Starting OCR...');
      
      // Wait for OCR to complete and phone numbers to be saved
      await waitForProcessing(screenshotId);
      
      // Reset form
      setUploadedFile(null);
      setScreenshotId(null);
      setProgress(0);
      setProgressText('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh phone numbers list
      fetchPhoneNumbers();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload screenshot');
      setProgress(0);
      setProgressText('');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  // Poll for OCR completion
  const waitForProcessing = async (screenshotId) => {
    const maxAttempts = 60; // 60 seconds max wait
    let attempts = 0;
    
    setProgress(40);
    setProgressText('Extracting text with OCR...');

    while (attempts < maxAttempts) {
      try {
        // Check if screenshot is processed
        const res = await fetch(`${API_BASE_URL}/api/screenshots/${screenshotId}`);
        
        if (res.ok) {
          const data = await res.json();
          const screenshot = data.data;
          
          if (screenshot.processed) {
            setProgress(90);
            setProgressText('Saving phone numbers to database...');
            
            // Wait a bit for phone numbers to be saved
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setProgress(100);
            setProgressText('Complete!');
            
            toast.success('Phone numbers extracted and saved!');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking processing status:', error);
      }
      
      attempts++;
      // Update progress gradually
      setProgress(40 + Math.floor((attempts / maxAttempts) * 40));
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // If timeout, still refresh
    toast.success('Processing started. Phone numbers will appear shortly.');
  };

  const removeFile = () => {
    setUploadedFile(null);
    setScreenshotId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Selection functions
  const handleSelectPhoneNumber = (phoneNumberId) => {
    setSelectedPhoneNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phoneNumberId)) {
        newSet.delete(phoneNumberId);
      } else {
        newSet.add(phoneNumberId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPhoneNumbers.size === phoneNumbers.length) {
      setSelectedPhoneNumbers(new Set());
    } else {
      setSelectedPhoneNumbers(new Set(phoneNumbers.map(phone => phone._id)));
    }
  };

  const handleExportSelected = async () => {
    if (selectedPhoneNumbers.size === 0) {
      toast.error('Please select at least one phone number to export');
      return;
    }

    try {
      setExporting(true);
      
      // Prepare query parameters with selected IDs
      const params = {
        ids: Array.from(selectedPhoneNumbers).join(',')
      };
      
      if (cardId) {
        params.cardId = cardId;
      }

      const res = await fetch(`${API_BASE_URL}/api/phone-numbers/export/excel?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to export Excel file');
      }
      
      const response = await res.blob();
      const filename = `selected_phone_numbers_${new Date().toISOString().split('T')[0]}.xlsx`;
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // Create blob and download
      const blob = new Blob([response], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Excel file with ${selectedPhoneNumbers.size} phone numbers downloaded successfully!`);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  // Menu functions
  const handleMenuToggle = (phoneNumberId) => {
    setOpenMenuId(openMenuId === phoneNumberId ? null : phoneNumberId);
  };

  const handleMenuAction = (phoneNumberId, action) => {
    setOpenMenuId(null);
    if (action === 'edit') {
      handleUpdate(phoneNumberId, { isValid: !phoneNumbers.find(p => p._id === phoneNumberId)?.isValid });
    } else if (action === 'delete') {
      handleDelete(phoneNumberId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading phone numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Screenshot</h2>
          <p className="text-gray-600">Upload a screenshot to extract phone numbers from it</p>
        </div>

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-6 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || processing}
          />
          
          {uploadedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <FileImage className="h-12 w-12 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={uploading || processing}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your screenshot here, or{' '}
                  <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
                    browse
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports PNG, JPG, JPEG up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {processing && progress > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{progressText}</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleUpload}
            disabled={!uploadedFile || uploading || processing}
            className={`px-8 py-3 rounded-md font-medium flex items-center space-x-2 transition-colors ${
              !uploadedFile || uploading || processing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : processing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Upload & Process</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Phone Numbers Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Phone Numbers</h2>
        <div className="text-sm text-gray-500">
          {pagination.totalItems} total numbers found
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search phone numbers, names, emails..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportSelected}
              disabled={selectedPhoneNumbers.size === 0 || exporting}
              className="flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Download Excel ({selectedPhoneNumbers.size})</span>
                </>
              )}
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={phoneNumbers.length === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </button>
          </div>

          {/* Filters */}
          {/* <div className="flex flex-col md:flex-row gap-2">
            <select
              value={filters.isValid}
              onChange={(e) => handleFilterChange('isValid', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Validity</option>
              <option value="true">Valid Only</option>
              <option value="false">Invalid Only</option>
            </select>

            <select
              value={filters.countryCode}
              onChange={(e) => handleFilterChange('countryCode', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Numbers</option>
              <option value="91">India (+91)</option>
            </select>

            <select
              value={filters.minConfidence}
              onChange={(e) => handleFilterChange('minConfidence', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Confidence</option>
              <option value="0.9">High (90%+)</option>
              <option value="0.7">Medium (70%+)</option>
              <option value="0.5">Low (50%+)</option>
            </select>
          </div> */}
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={phoneNumbers.length > 0 && selectedPhoneNumbers.size === phoneNumbers.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
              
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {phoneNumbers.map((phone) => (
                <tr key={phone._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPhoneNumbers.has(phone._id)}
                      onChange={() => handleSelectPhoneNumber(phone._id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {phone.formattedNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {phone.phoneNumber}
                        </div>
                        {/* <div className="text-xs text-blue-600">
                          Original: {phone.context?.substring(0, 50)}...
                        </div> */}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {phone.name || 'N/A'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {phone.email || 'N/A'}
                    </div>
                  </td>
                  
                
                 
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => handleMenuToggle(phone._id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        title="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {openMenuId === phone._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleMenuAction(phone._id, 'edit')}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {phone.isValid ? 'Mark as invalid' : 'Mark as valid'}
                            </button>
                            <button
                              onClick={() => handleMenuAction(phone._id, 'delete')}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalItems}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {phoneNumbers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers found</h3>
          <p className="text-gray-500">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your search or filters'
              : 'Upload some screenshots to extract phone numbers'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PhoneNumbersList;
