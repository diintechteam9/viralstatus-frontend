import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';

const Setting = ({ selectedPhone }) => {
  const [activeTab, setActiveTab] = useState(''); // '' | 'template' | 'quick'
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [quickReplies, setQuickReplies] = useState([
    'Hello! How can I help you?',
    'We will get back to you shortly.',
    'Thank you!'
  ]);
  const [newQuick, setNewQuick] = useState('');

  const loadApprovedTemplates = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE_URL}/api/create-template/get-templates`);
      const docs = res.data?.templates || [];
      // status may be 'approved' (lowercase) from webhook or 'APPROVED' from Meta copy
      const approved = docs.filter(t => (t.status === 'approved' || t.status === 'APPROVED'));
      setTemplates(approved);
    } catch (e) {
      setError('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'template') {
      loadApprovedTemplates();
    }
  }, [activeTab]);

  const handleSendTemplate = async (tpl) => {
    if (!selectedPhone) {
      alert('Please select a contact first');
      return;
    }

    // Call backend endpoint following pattern: /api/whatsapp/send-<templatename>
    // Keep exact name as provided by Meta; your backend should expose matching routes
    const routeName = tpl.name; // e.g., pragati, jansuraaj, eg_classes
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/whatsapp/send-${routeName}`, { to: selectedPhone });
      if (resp.data?.success) {
        alert('Template sent successfully');
      } else {
        alert(resp.data?.message || 'Failed to send template');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send template';
      alert(msg);
    }
  };

  const handleAddQuick = () => {
    const text = (newQuick || '').trim();
    if (!text) return;
    setQuickReplies(prev => [text, ...prev]);
    setNewQuick('');
  };

  const handleSendQuick = async (text) => {
    if (!selectedPhone) {
      alert('Please select a contact first');
      return;
    }
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/whatsapp/send-message`, {
        to: selectedPhone,
        message: text
      });
      if (resp.data?.success) {
        alert('Message sent');
      } else {
        alert(resp.data?.message || 'Failed to send message');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send message';
      alert(msg);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Setting</h3>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('template')}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'template' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Template
        </button>
        <button
          onClick={() => setActiveTab('quick')}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'quick' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Quick Reply
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'template' ? (
          <div>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading templates...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-gray-500">No approved templates found.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(tpl => (
                  <div key={tpl._id || tpl.name} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tpl.name}</p>
                      <p className="text-xs text-gray-500">{tpl.language || 'en'} • {tpl.category || ''}</p>
                    </div>
                    <button
                      onClick={() => handleSendTemplate(tpl)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                    >
                      Send
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'quick' ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newQuick}
                onChange={(e) => setNewQuick(e.target.value)}
                placeholder="Add a quick reply"
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={handleAddQuick}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
              >
                Add
              </button>
            </div>

            {quickReplies.length === 0 ? (
              <p className="text-sm text-gray-500">No quick replies yet.</p>
            ) : (
              <div className="space-y-2">
                {quickReplies.map((qr, idx) => (
                  <div key={`${qr}-${idx}`} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-800 truncate mr-3">{qr}</p>
                    <button
                      onClick={() => handleSendQuick(qr)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                    >
                      Send
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Choose an option above to get started.</div>
        )}
      </div>
    </div>
  );
};

export default Setting;