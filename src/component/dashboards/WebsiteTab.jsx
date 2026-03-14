import React, { useState } from 'react';
import { FaGlobe, FaCode, FaImage, FaFileAlt, FaCog, FaSearch } from 'react-icons/fa';
import WebsiteAnalyzer from './WebsiteAnalyzer';
import WebsiteHistory from './WebsiteHistory';

const WebsiteTab = () => {
  const [activeSection, setActiveSection] = useState('analyzer');

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaGlobe className="text-orange-600" />
              Website Management
            </h2>
            <p className="text-gray-600 mt-2">Manage your website and run OSINT analysis</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveSection('analyzer')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'analyzer'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaSearch className="inline mr-2" />
            Website Analyzer
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'history'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaFileAlt className="inline mr-2" />
            History
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeSection === 'analyzer' && <WebsiteAnalyzer />}
        {activeSection === 'history' && <WebsiteHistory />}
      </div>
    </div>
  );
};

export default WebsiteTab;
