import React, { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  Download, 
  Phone, 
  ArrowLeft
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '../../../config';
import PhoneNumbersList from './PhoneNumbersList';
import Stats from './Stats';
import toast from 'react-hot-toast';

const LeadsCards = ({ card, onBack }) => {
  const [activeTab, setActiveTab] = useState('phone-numbers');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { id: 'phone-numbers', label: 'Phone Numbers', icon: Phone },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  const handleUploadSuccess = () => {
    // Force refresh of phone numbers list
    setRefreshKey(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'phone-numbers':
        return <PhoneNumbersList key={refreshKey} cardId={card._id} />;
      case 'stats':
        return <Stats cardId={card._id} />;
      default:
        return <PhoneNumbersList key={refreshKey} cardId={card._id} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Project</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{card.name}</h1>
                <p className="text-gray-600 mt-1">{card.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default LeadsCards;
