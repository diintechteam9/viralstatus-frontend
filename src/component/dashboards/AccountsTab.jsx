import React, { useEffect, useState } from 'react';
import { disconnectYoutube, fetchYoutubeInfo, fetchYoutubeProfile, getYoutubeAuthUrl } from '../../api/youtube';
import { disconnectInstagram, fetchInstagramInfo, getInstagramAuthUrl } from '../../api/instagram';
import UploadShorts from '../UploadShorts';
import UploadReels from '../UploadReels';
import { FaInstagram, FaYoutube } from 'react-icons/fa';
import { getUserId } from '../../utils/authUtils';
import toast from 'react-hot-toast';

const SocialMediaCard = ({
  platform,
  icon: Icon,
  logoUrl,
  isConnected,
  profileData,
  onConnect,
  onDisconnect,
  uploadComponent,
  isLoading,
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
    <div className="p-6">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-lg font-semibold mb-0">{platform}</h5>
        <img src={logoUrl} alt={platform} className="h-7 max-w-[100px] object-contain" />
      </div>
      {!isConnected ? (
        <button onClick={onConnect} disabled={isLoading} className="no-underline w-full block">
          <div className="border-2 border-blue-500 rounded p-3 text-center bg-white hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="flex items-center justify-center mb-2">
              <div
                className={`rounded-full flex items-center justify-center mr-2 ${
                  platform === 'Instagram' ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-red-500'
                }`}
                style={{ width: 48, height: 48 }}
              >
                <Icon className="text-white" size={28} />
              </div>
              <span className="font-medium text-gray-900">{isLoading ? 'Connecting...' : `Connect ${platform}`}</span>
            </div>
          </div>
        </button>
      ) : (
        <>
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center gap-3">
              {profileData?.profilePicture ? (
                <img
                  src={profileData.profilePicture}
                  alt={profileData.username || 'Profile'}
                  className="rounded-full object-cover border-2 border-pink-500"
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <div
                  className={`rounded-full flex items-center justify-center ${
                    platform === 'Instagram' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: 48, height: 48 }}
                >
                  <Icon className="text-white" size={28} />
                </div>
              )}
              <span className={`font-semibold ${platform === 'Instagram' ? 'text-red-500' : 'text-blue-500'}`}>
                {platform === 'Instagram' ? '@' : ''}
                {profileData?.username || profileData?.name}
              </span>
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <span className="rounded-full bg-green-500 inline-block mr-1 w-2 h-2"></span>
              Connected
            </div>
          </div>
          <div className="text-right mb-2">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onDisconnect}
              disabled={isLoading}
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
          {uploadComponent && <div className="mt-2 pt-3 border-t border-gray-200">{uploadComponent}</div>}
        </>
      )}
    </div>
  </div>
);

const AccountsTab = () => {
  const [instaUserId, setInstaUserId] = useState(null);
  const [instagramData, setInstagramData] = useState(null);
  const [isYouTubeAuthenticated, setIsYouTubeAuthenticated] = useState(false);
  const [youtubeData, setYoutubeData] = useState(null);
  const [loading, setLoading] = useState({ instagram: false, youtube: false });
  const [youtubePopup, setYoutubePopup] = useState(null);

  // Load Instagram data
  const loadInstagramData = async () => {
    try {
      const data = await fetchInstagramInfo();
      if (data.connected) {
        setInstagramData({
          username: data.username,
          profilePicture: data.picture,
          name: data.username,
        });
        setInstaUserId(data.username);
      } else {
        setInstagramData(null);
        setInstaUserId(null);
      }
    } catch (error) {
      console.error('Failed to load Instagram data:', error);
      setInstagramData(null);
      setInstaUserId(null);
    }
  };

  // Load YouTube data
  const loadYoutubeData = async () => {
    try {
      const data = await fetchYoutubeProfile();
      if (data) {
        setYoutubeData({
          username: data.name,
          profilePicture: data.picture,
          name: data.name,
        });
        setIsYouTubeAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load YouTube data:', error);
      setYoutubeData(null);
      setIsYouTubeAuthenticated(false);
    }
  };

  // Check YouTube status
  const checkYoutubeStatus = async () => {
    try {
      const data = await fetchYoutubeInfo();
      if (data.connected) {
        setIsYouTubeAuthenticated(true);
        await loadYoutubeData();
      } else {
        setIsYouTubeAuthenticated(false);
        setYoutubeData(null);
      }
    } catch (error) {
      console.error('Failed to check YouTube status:', error);
      setIsYouTubeAuthenticated(false);
      setYoutubeData(null);
    }
  };

  // Initial load
  useEffect(() => {
    loadInstagramData();
    checkYoutubeStatus();

    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('instagram') === 'success') {
      loadInstagramData();
      toast.success('Instagram connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('auth') === 'success') {
      checkYoutubeStatus();
      toast.success('YouTube connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Cleanup popup interval on unmount
  useEffect(() => {
    return () => {
      if (youtubePopup) {
        youtubePopup.close();
      }
    };
  }, [youtubePopup]);

  // Handle Instagram connect
  const handleInstagramConnect = () => {
    const authUrl = getInstagramAuthUrl();
    if (!authUrl) {
      toast.error('Instagram configuration missing');
      return;
    }
    window.location.href = authUrl;
  };

  // Handle Instagram disconnect
  const handleInstagramDisconnect = async () => {
    setLoading((prev) => ({ ...prev, instagram: true }));
    try {
      await disconnectInstagram();
      setInstagramData(null);
      setInstaUserId(null);
      toast.success('Instagram disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Instagram');
    } finally {
      setLoading((prev) => ({ ...prev, instagram: false }));
    }
  };

  // Handle YouTube connect
  const handleYouTubeConnect = () => {
    const authUrl = getYoutubeAuthUrl();
    if (!authUrl) {
      toast.error('YouTube configuration missing');
      return;
    }

    setLoading((prev) => ({ ...prev, youtube: true }));
    const popup = window.open(authUrl, '_blank', 'width=600,height=700');

    if (!popup) {
      toast.error('Please allow popups to connect YouTube');
      setLoading((prev) => ({ ...prev, youtube: false }));
      return;
    }

    setYoutubePopup(popup);

    // Poll for connection status
    const interval = setInterval(async () => {
      try {
        const data = await fetchYoutubeInfo();
        if (data.connected) {
          await loadYoutubeData();
          clearInterval(interval);
          popup.close();
          setYoutubePopup(null);
          setLoading((prev) => ({ ...prev, youtube: false }));
          toast.success('YouTube connected successfully!');
        }
      } catch (error) {
        console.debug('Polling YouTube status...');
      }
    }, 2000);

    // Timeout after 60 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (!popup.closed) {
        popup.close();
      }
      setYoutubePopup(null);
      setLoading((prev) => ({ ...prev, youtube: false }));
    }, 60000);
  };

  // Handle YouTube disconnect
  const handleYouTubeDisconnect = async () => {
    setLoading((prev) => ({ ...prev, youtube: true }));
    try {
      await disconnectYoutube();
      setIsYouTubeAuthenticated(false);
      setYoutubeData(null);
      toast.success('YouTube disconnected');
    } catch (error) {
      toast.error('Failed to disconnect YouTube');
    } finally {
      setLoading((prev) => ({ ...prev, youtube: false }));
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Connected Accounts</h2>
          <p className="text-gray-600">Manage your social media connections</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SocialMediaCard
            platform="Instagram"
            icon={FaInstagram}
            logoUrl="https://img.freepik.com/free-vector/instagram-vector-social-media-icon-7-june-2021-bangkok-thailand_53876-136728.jpg?ga=GA1.1.1151830695.1743448639&semt=ais_items_boosted&w=740"
            isConnected={!!instagramData}
            profileData={instagramData}
            onConnect={handleInstagramConnect}
            onDisconnect={handleInstagramDisconnect}
            uploadComponent={<UploadReels isAuthenticated={!!instagramData} userId={instaUserId} />}
            isLoading={loading.instagram}
          />
          <SocialMediaCard
            platform="YouTube"
            icon={FaYoutube}
            logoUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/200px-YouTube_Logo_2017.svg.png"
            isConnected={isYouTubeAuthenticated}
            profileData={youtubeData}
            onConnect={handleYouTubeConnect}
            onDisconnect={handleYouTubeDisconnect}
            uploadComponent={<UploadShorts isAuthenticated={isYouTubeAuthenticated} />}
            isLoading={loading.youtube}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountsTab;
