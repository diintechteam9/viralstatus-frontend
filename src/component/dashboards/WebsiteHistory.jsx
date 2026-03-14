import React, { useEffect, useState } from 'react';
import { FaClock, FaGlobe, FaRobot, FaTrash } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

const WebsiteHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      setDeleting(id);
      const res = await fetch(`${API_BASE_URL}/api/website-analyzer/history/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error || 'Failed to delete');
      
      // Remove from list
      const newItems = items.filter(item => item.id !== id);
      setItems(newItems);
      
      // If deleted item was selected, select first item or null
      if (selected && selected.id === id) {
        setSelected(newItems.length > 0 ? newItems[0] : null);
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert(e.message || 'Failed to delete history item');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE_URL}/api/website-analyzer/history`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load history');
        setItems(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelected(data.items[0]);
        }
      } catch (e) {
        console.error('History load error:', e);
        setError(e.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="w-full h-full">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaClock className="text-orange-600" />
              Website Analysis History
            </h2>
            <p className="text-gray-600 mt-2">
              All websites analyzed will be saved here with complete reports and insights.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-4 max-h-[600px] overflow-y-auto">
          {loading && <p className="text-sm text-gray-500">Loading history...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-gray-500">
              No analysis saved yet. Please analyze a website first using Website Analyzer.
            </p>
          )}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`relative rounded-lg border transition-colors ${
                  selected && selected.id === item.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => setSelected(item)}
                  className="w-full text-left p-3 pr-12"
                >
                  <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-2">
                    <FaGlobe className="text-orange-500" />
                    {item.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-600 truncate mt-1">{item.url}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  disabled={deleting === item.id}
                  className="absolute top-3 right-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all z-10"
                  title="Delete"
                >
                  {deleting === item.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaTrash className="text-sm" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          {!selected && (
            <p className="text-sm text-gray-500">
              Select a website from the left sidebar to view its detailed analysis report.
            </p>
          )}
          {selected && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaGlobe className="text-orange-600" />
                  {selected.title || 'Untitled'}
                </h3>
                <p className="text-sm text-blue-600 break-all mt-1">{selected.url}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Analyzed at {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Quick Stats */}
              {selected.pageInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Links</p>
                    <p className="font-semibold text-gray-900">
                      {selected.pageInfo.linksCount ?? 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Images</p>
                    <p className="font-semibold text-gray-900">
                      {selected.pageInfo.imagesCount ?? 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Words</p>
                    <p className="font-semibold text-gray-900">
                      {selected.pageInfo.wordCount ?? 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Trust Score</p>
                    <p className="font-semibold text-gray-900">
                      {selected.aiSummary?.trustScore ?? 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {selected.aiSummary?.executiveSummary && selected.aiSummary.executiveSummary !== 'N/A' && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                    <FaRobot className="text-purple-600" />
                    AI Executive Summary
                  </h4>
                  <p className="text-sm text-gray-800">
                    {selected.aiSummary.executiveSummary}
                  </p>
                </div>
              )}

              {/* Screenshots */}
              {selected.screenshots && selected.screenshots.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Screenshots ({selected.screenshots.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selected.screenshots.slice(0, 6).map((screenshot, idx) => (
                      <img
                        key={idx}
                        src={String(screenshot.path || screenshot).startsWith('http') ? (screenshot.path || screenshot) : `${selected.assetsBaseUrl || 'http://localhost:5000'}${screenshot.path || screenshot}`}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-orange-500 transition-all"
                        onClick={() => window.open(String(screenshot.path || screenshot).startsWith('http') ? (screenshot.path || screenshot) : `${selected.assetsBaseUrl || 'http://localhost:5000'}${screenshot.path || screenshot}`, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Technologies */}
              {selected.technologies && selected.technologies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.technologies.slice(0, 10).map((tech, idx) => (
                      <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {selected.contactInfo && (selected.contactInfo.emails?.length > 0 || selected.contactInfo.phones?.length > 0) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selected.contactInfo.emails?.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Emails</p>
                        {selected.contactInfo.emails.slice(0, 3).map((email, idx) => (
                          <p key={idx} className="text-sm text-gray-800">{email}</p>
                        ))}
                      </div>
                    )}
                    {selected.contactInfo.phones?.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Phones</p>
                        {selected.contactInfo.phones.slice(0, 3).map((phone, idx) => (
                          <p key={idx} className="text-sm text-gray-800">{phone}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Domain Info */}
              {selected.domainInfo && selected.domainInfo.domain && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Domain Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Registrar</p>
                      <p className="text-sm font-medium text-gray-900">{selected.domainInfo.registrar || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Created</p>
                      <p className="text-sm font-medium text-gray-900">{selected.domainInfo.created || selected.domainInfo.createdDate || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Expires</p>
                      <p className="text-sm font-medium text-gray-900">{selected.domainInfo.expires || selected.domainInfo.expiryDate || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteHistory;

