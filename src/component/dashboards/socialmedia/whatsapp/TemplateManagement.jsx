import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';
import TemplateForm from './TemplateForm';

const TemplateManagement = ({ client }) => {
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('approved');
  const [approvedTemplates, setApprovedTemplates] = useState([]);
  const [pendingTemplates, setPendingTemplates] = useState([]);
  const [rejectedTemplates, setRejectedTemplates] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [requestedTemplates, setRequestedTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clientId = client?._id || client?.id || null;

  const openTemplateForm = () => setIsTemplateFormOpen(true);
  const closeTemplateForm = () => setIsTemplateFormOpen(false);
  
  const handleTemplateFormSuccess = (template) => {
    console.log('Template created successfully:', template);
    // Refresh templates after creating a new one
    fetchTemplates();
  };

  const fetchApprovedTemplates = async () => {
    try {
      const url = `${API_BASE_URL}/api/create-template/templates/approved${clientId ? `?clientId=${clientId}` : ''}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setApprovedTemplates(response.data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching approved templates:', err);
      setError('Failed to fetch approved templates');
    }
  };

  const fetchPendingTemplates = async () => {
    try {
      const url = `${API_BASE_URL}/api/create-template/templates/pending${clientId ? `?clientId=${clientId}` : ''}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setPendingTemplates(response.data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching pending templates:', err);
      setError('Failed to fetch pending templates');
    }
  };

  const fetchRejectedTemplates = async () => {
    try {
      const url = `${API_BASE_URL}/api/create-template/templates/rejected${clientId ? `?clientId=${clientId}` : ''}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setRejectedTemplates(response.data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching rejected templates:', err);
      setError('Failed to fetch rejected templates');
    }
  };

  const fetchAllTemplates = async () => {
    try {
      const [approvedRes, pendingRes, rejectedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/create-template/templates/approved${clientId ? `?clientId=${clientId}` : ''}`),
        axios.get(`${API_BASE_URL}/api/create-template/templates/pending${clientId ? `?clientId=${clientId}` : ''}`),
        axios.get(`${API_BASE_URL}/api/create-template/templates/rejected${clientId ? `?clientId=${clientId}` : ''}`)
      ]);
      
      const all = [
        ...(approvedRes.data.success ? approvedRes.data.templates || [] : []),
        ...(pendingRes.data.success ? pendingRes.data.templates || [] : []),
        ...(rejectedRes.data.success ? rejectedRes.data.templates || [] : [])
      ];
      setAllTemplates(all);
    } catch (err) {
      console.error('Error fetching all templates:', err);
      setError('Failed to fetch templates');
    }
  };

  const fetchRequestedTemplates = async () => {
    if (!clientId) {
      setRequestedTemplates([]);
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/requested-templates?clientId=${encodeURIComponent(clientId)}`
      );
      if (response.data.success) {
        setRequestedTemplates(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setRequestedTemplates([]);
      }
    } catch (err) {
      console.error('Error fetching requested templates:', err);
      setError('Failed to fetch requested templates');
      setRequestedTemplates([]);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'approved':
          await fetchApprovedTemplates();
          break;
        case 'pending':
          await fetchPendingTemplates();
          break;
        case 'rejected':
          await fetchRejectedTemplates();
          break;
        case 'all':
          await fetchAllTemplates();
          break;
        case 'requested':
          await fetchRequestedTemplates();
          break;
        default:
          await fetchApprovedTemplates();
      }
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeTab, clientId]);

  const getCurrentTemplates = () => {
    switch (activeTab) {
      case 'approved':
        return approvedTemplates;
      case 'pending':
        return pendingTemplates;
      case 'rejected':
        return rejectedTemplates;
      case 'all':
        return allTemplates;
      case 'requested':
        return requestedTemplates;
      default:
        return [];
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: allTemplates.length },
    { id: 'approved', label: 'Approved', count: approvedTemplates.length },
    { id: 'pending', label: 'Pending', count: pendingTemplates.length },
    { id: 'rejected', label: 'Rejected', count: rejectedTemplates.length },
    { id: 'requested', label: 'Requested', count: requestedTemplates.length },
  ];

  const currentTemplates = getCurrentTemplates();

  return (
    <>
      <div className="flex-1 bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Template Management</h2>
              <button
                onClick={openTemplateForm}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Template
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${
                        activeTab === tab.id
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-500">Loading templates...</p>
              </div>
            )}

            {/* Templates List */}
            {!loading && currentTemplates.length > 0 && (
              <div className={activeTab === 'requested' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
                {currentTemplates.map((template) => {
                  // Requested templates have a different structure
                  if (activeTab === 'requested') {
                    return (
                      <div
                        key={template._id}
                        className="border border-violet-100 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500">
                            Created: {new Date(template.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-md p-3 border border-gray-200">
                          {template.templateBody}
                        </div>
                      </div>
                    );
                  }
                  
                  // Regular templates (approved, pending, rejected, all)
                  return (
                    <div
                      key={template._id || template.metaTemplateId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(template.status)}`}>
                          {template.status || 'unknown'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Language:</span> {template.language}</p>
                        {template.category && (
                          <p><span className="font-medium">Category:</span> {template.category}</p>
                        )}
                        {template.quality_score && (
                          <p><span className="font-medium">Quality Score:</span> {template.quality_score}</p>
                        )}
                        {template.createdAt && (
                          <p className="text-xs text-gray-400">
                            Created: {new Date(template.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {template.components && template.components.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">Components:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.components.map((comp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {comp.type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && currentTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab === 'all' ? '' : activeTab} templates yet
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'all' 
                    ? 'Create your first WhatsApp template to get started'
                    : activeTab === 'requested'
                    ? 'No requested templates found.'
                    : `No ${activeTab} templates found. Create a template to see it here.`
                  }
                </p>
                {activeTab !== 'requested' && (
                  <button
                    onClick={openTemplateForm}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Create Template
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TemplateForm 
        isOpen={isTemplateFormOpen} 
        onClose={closeTemplateForm} 
        onSuccess={handleTemplateFormSuccess}
        client={client}
      />
    </>
  );
};

export default TemplateManagement;

