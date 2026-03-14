import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {API_BASE_URL} from '../../../../config'
import PhoneNumber from './PhoneNumber';
import Chat from './Chat';
import Setting from './Setting';
import AddContactModal from './AddContactModal';
import TemplateModal from './TemplateModal';
import TemplateManagement from './TemplateManagement';

const WhatsAppChat = ({ client }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [conversations, setConversations] = useState({}); // { phone: Message[] }
  const [settingsByPhone, setSettingsByPhone] = useState({}); // { phone: { ...settings } }
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [templatePhone, setTemplatePhone] = useState('');
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' or 'template'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const businessName = import.meta.env.VITE_BUSINESS_NAME || 'Whatsapp';
  const businessNumber = import.meta.env.VITE_BUSINESS_NUMBER || '';

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const ensureConversationArray = (phone) => {
    setConversations((prev) => ({ ...prev, [phone]: prev[phone] || [] }));
  };

  const openAddModal = () => setIsAddOpen(true);
  const closeAddModal = () => setIsAddOpen(false);
  
  const openTemplateModal = (phone) => {
    setTemplatePhone(phone);
    setIsTemplateOpen(true);
  };
  const closeTemplateModal = () => {
    setIsTemplateOpen(false);
    setTemplatePhone('');
  };

  const renderWhatsAppInterface = () => (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Left Sidebar - Contacts (Mobile: Overlay) */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ${
              selectedPhone ? '-translate-x-full' : 'translate-x-0'
            }`
          : 'w-80 bg-white border-r border-gray-200'
      } flex flex-col`}>
        <PhoneNumber
          contacts={contacts}
          selectedPhone={selectedPhone}
          onSelectPhone={(phone) => {
            handleSelectPhone(phone);
            if (isMobile) setShowSettings(false);
          }}
          onOpenAdd={openAddModal}
          onOpenTemplates={openTemplateModal}
        />
      </div>

      {/* Center - Chat */}
      <div className={`${
        isMobile && !selectedPhone ? 'hidden' : 'flex-1'
      } bg-gray-50 flex flex-col relative`}>
        {/* Mobile: Back button */}
        {isMobile && selectedPhone && (
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={() => setSelectedPhone('')}
              className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Mobile: Settings toggle button */}
        {isMobile && selectedPhone && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        <Chat
          conversation={conversations[selectedPhone] || []}
          onSendText={handleSendText}
          isLoading={isLoading}
        />
      </div>

      {/* Right Sidebar - Settings (Mobile: Overlay) */}
      <div className={`${
        isMobile
          ? `fixed inset-y-0 right-0 z-50 w-80 bg-white transform transition-transform duration-300 ${
              showSettings ? 'translate-x-0' : 'translate-x-full'
            }`
          : 'w-80 bg-white border-l border-gray-200'
      } flex flex-col`}>
        {/* Mobile: Close button */}
        {isMobile && showSettings && (
          <div className="flex justify-end p-2 border-b">
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <Setting
          selectedPhone={selectedPhone}
          client={client}
          settings={settingsByPhone[selectedPhone] || {}}
          onChangeSetting={handleChangeSetting}
        />
      </div>

      {/* Mobile: Overlay backdrop */}
      {isMobile && (showSettings || (!selectedPhone && contacts.length > 0)) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );


  const submitAddContact = async ({ waID, profilename }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/phonenumber/contacts`, { waID, profilename });
      const created = res.data;
      setContacts((prev) => [created, ...prev]);
      setSelectedPhone(created.waID);
      ensureConversationArray(created.waID);
      closeAddModal();
    } catch (err) {
      console.error(err);
      alert('Failed to add contact');
    }
  };

  const handleSelectPhone = async (phone) => {
    setSelectedPhone(phone);
    ensureConversationArray(phone);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chat/messages/${encodeURIComponent(phone)}`);
      const history = (res.data || []).map(m => ({
        id: m.messageId || m._id,
        type: m.direction,
        text: m.text,
        mediaType: m.mediaType,
        mediaUrl: m.mediaUrl,
        timestamp: m.timestamp || m.createdAt,
        status: m.status || 'sent'
      }));
      setConversations(prev => ({ ...prev, [phone]: history }));
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const handleChangeSetting = (key, value) => {
    if (!selectedPhone) return;
    setSettingsByPhone((prev) => ({
      ...prev,
      [selectedPhone]: { ...(prev[selectedPhone] || {}), [key]: value }
    }));
  };

  const handleSendText = async (text) => {
    if (!selectedPhone || !text.trim()) return;
    setIsLoading(true);
    const tempId = Date.now();
    // Show message immediately in UI
    setConversations((prev) => ({
      ...prev,
      [selectedPhone]: [...(prev[selectedPhone] || []), {
        id: tempId,
        type: 'sent',
        text: text.trim(),
        timestamp: new Date(),
        status: 'sending'
      }]
    }));
    try {
      await axios.post(`${API_BASE_URL}/api/whatsapp/send-message`, {
        to: selectedPhone,
        message: text.trim()
      });
      // Polling will update with real messageId + status
    } catch (error) {
      console.error('Error sending message:', error);
      setConversations((prev) => ({
        ...prev,
        [selectedPhone]: (prev[selectedPhone] || []).map(m =>
          m.id === tempId ? { ...m, status: 'failed' } : m
        )
      }));
      alert(error.response?.data?.message || 'Failed to send message');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/phonenumber/contacts`);
        setContacts(res.data || []);
      } catch (err) {
        console.error('Failed to load contacts', err);
      }
    };
    fetchContacts();
  }, []);

  // Poll for new messages every 3 seconds when a phone is selected
  useEffect(() => {
    if (!selectedPhone) return;
    const poll = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/chat/messages/${encodeURIComponent(selectedPhone)}`);
        const msgs = (res.data || []).map(m => ({
          id: m.messageId || m._id,
          type: m.direction,
          text: m.text,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          timestamp: m.timestamp || m.createdAt,
          status: m.status || 'sent'
        }));
        setConversations(prev => ({ ...prev, [selectedPhone]: msgs }));
      } catch (_) {}
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [selectedPhone]);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Mobile: Top Navigation Bar */}
      {isMobile && (
        <div className="bg-gray-800 flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
              {client?.businessLogoUrl || client?.googlePicture ? (
                <img 
                  src={client?.businessLogoUrl || client?.googlePicture} 
                  alt={client?.name || 'Client Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-xs">
                  {(client?.name || 'C').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-white font-semibold text-sm">{client?.name || 'Client'}</span>
          </div>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <div className={`${
        isMobile
          ? `fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ${
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-64 bg-gray-800'
      } flex flex-col py-6`}>
        {/* Close button for mobile */}
        {isMobile && (
          <div className="flex justify-end px-4 mb-4">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
              {client?.businessLogoUrl || client?.googlePicture ? (
                <img 
                  src={client?.businessLogoUrl || client?.googlePicture} 
                  alt={client?.name || 'Client Logo'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.logo-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="logo-fallback w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ display: (client?.businessLogoUrl || client?.googlePicture) ? 'none' : 'flex' }}
              >
                {(client?.name || 'C').charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                {client?.name || 'Client Name'}
              </div>
              <div className="text-gray-300 text-xs">
                {client?.email || 'client@example.com'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="px-4 space-y-2">
          <button
            onClick={() => {
              setActiveTab('whatsapp');
              if (isMobile) setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              activeTab === 'whatsapp' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
            </svg>
            <span className="font-medium">Messages</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('template');
              if (isMobile) setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              activeTab === 'template' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Template Management</span>
          </button>
        </div>
      </div>

      {/* Mobile: Sidebar overlay backdrop */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white px-4 lg:px-6 py-3 lg:py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-base lg:text-lg font-semibold">{businessName}</div>
                <div className="text-xs lg:text-sm opacity-90">{businessNumber}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'whatsapp' ? renderWhatsAppInterface() : <TemplateManagement client={client} />}
      </div>
      
      <AddContactModal open={isAddOpen} onClose={closeAddModal} onSubmit={submitAddContact} />
      <TemplateModal open={isTemplateOpen} onClose={closeTemplateModal} selectedPhone={templatePhone} />
    </div>
  );
};

export default WhatsAppChat;
