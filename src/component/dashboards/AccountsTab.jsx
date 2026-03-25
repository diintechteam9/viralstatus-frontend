import React, { useEffect, useState } from "react";
import { fetchInstagramInfo, disconnectInstagram } from "../../api/instagram";
import { disconnectYoutube } from "../../api/youtube";
import UploadShorts from "../UploadShorts";
import UploadReels from "../UploadReels";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const AccountsTab = () => {
  // Social Media States
  const [instaUserId, setInstaUserId] = useState(
    localStorage.getItem("instagramUserId")
  );
  const [instagramData, setInstagramData] = useState(null);
  const [isYouTubeAuthenticated, setIsYouTubeAuthenticated] = useState(false);
  const [youtubeData, setYoutubeData] = useState(null);

  useEffect(() => {
    // Always check Instagram and YouTube login state on mount for persistence
    const checkInstagram = async () => {
      await loadInstagramData();
    };
    const checkYouTube = async () => {
      try {
        const t = getToken();
        if (!t) return;
        const response = await fetch(`${API_BASE_URL}/api/youtube/status`, {
          headers: { Authorization: `Bearer ${t}` },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            setIsYouTubeAuthenticated(true);
            loadYoutubeData();
          } else {
            setYoutubeData(null);
            setIsYouTubeAuthenticated(false);
          }
        } else {
          setYoutubeData(null);
          setIsYouTubeAuthenticated(false);
        }
      } catch {
        setYoutubeData(null);
        setIsYouTubeAuthenticated(false);
      }
    };
    checkInstagram();
    checkYouTube();

    // Handle redirect from auth
    const params = new URLSearchParams(window.location.search);
    if (params.has("instagram") && params.get("instagram") === "success") {
      loadInstagramData();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    if (params.has("auth") && params.get("auth") === "success") {
      setIsYouTubeAuthenticated(true);
      loadYoutubeData();
      // Clean the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const loadInstagramData = async () => {
    try {
      const t = getToken();
      if (!t) return;
      const response = await fetch(`${API_BASE_URL}/api/instagram/status`, {
        headers: { Authorization: `Bearer ${t}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setInstagramData({ username: data.username, profilePicture: data.picture, name: data.username });
          setInstaUserId(data.username);
        } else {
          setInstagramData(null);
          setInstaUserId(null);
        }
      }
    } catch (error) {
      console.error('Failed to load Instagram data:', error);
      setInstagramData(null);
    }
  };

  const getToken = () =>
    sessionStorage.getItem('clienttoken') ||
    localStorage.getItem('clienttoken') ||
    sessionStorage.getItem('usertoken') ||
    localStorage.getItem('usertoken') || '';

  const loadYoutubeData = async () => {
    try {
      const uid = getUserId();
      const t = getToken();
      if (!uid || !t) return;
      const response = await fetch(
        `${API_BASE_URL}/auth/youtube/profile?userId=${uid}`,
        { headers: { Authorization: `Bearer ${t}` }, credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setYoutubeData({ username: data.name, profilePicture: data.picture, name: data.name });
        setIsYouTubeAuthenticated(true);
      }
    } catch (error) {
      setYoutubeData(null);
      setIsYouTubeAuthenticated(false);
    }
  };

  const handleInstagramDisconnect = async () => {
    try {
      const t = getToken();
      await fetch(`${API_BASE_URL}/api/instagram/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Instagram disconnect error:', error);
    } finally {
      setInstagramData(null);
      setInstaUserId(null);
      localStorage.removeItem('instagramUserId');
    }
  };

  const handleYouTubeDisconnect = async () => {
    try {
      await disconnectYoutube();
    } catch (error) {
      console.error("YouTube disconnect error:", error);
    } finally {
      setIsYouTubeAuthenticated(false);
      setYoutubeData(null);
    }
  };

  const instagramLoginUrl = `${API_BASE_URL}/auth/instagram/callback-init?userId=${getUserId()}`;
  const handleInstagramConnect = () => {
    const uid = getUserId();
    const fbOAuthUrl = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${import.meta.env.VITE_FB_APP_ID}&redirect_uri=${import.meta.env.VITE_FB_REDIRECT_URI}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code&state=${uid}`;
    window.location.href = fbOAuthUrl;
  };
  const handleYouTubeConnect = () => {
    const uid = getUserId();
    const t = getToken();
    const popup = window.open(`${API_BASE_URL}/auth/youtube?userId=${uid}`, '_blank', 'width=600,height=700');
    if (!popup) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/youtube/status`, {
          headers: { Authorization: `Bearer ${t}` },
          credentials: 'include',
        });
        if (r.ok) {
          const data = await r.json();
          if (data.connected) {
            setIsYouTubeAuthenticated(true);
            loadYoutubeData();
            clearInterval(interval);
            popup.close();
          }
        }
      } catch (_) {}
    }, 2000);
    setTimeout(() => clearInterval(interval), 60000);
  };

  const getUserId = () => {
    try {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.clientId || parsed._id || parsed.id || '';
      }
    } catch (_) {}
    return localStorage.getItem('mongoId') || localStorage.getItem('clientId') || '';
  };

  const userId = getUserId();
  const youtubeLoginUrl = `${API_BASE_URL}/auth/youtube?userId=${userId}`;

  // Tailwind Card Component
  const SocialMediaCard = ({
    platform,
    icon: Icon,
    logoUrl,
    isConnected,
    profileData,
    loginUrl,
    onConnect,
    onDisconnect,
    uploadComponent,
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-lg font-semibold mb-0">{platform}</h5>
          <img src={logoUrl} alt={platform} className="h-7 max-w-[100px] object-contain" />
        </div>
        {!isConnected ? (
          onConnect ? (
            <button onClick={onConnect} className="no-underline w-full block">
              <div className="border-2 border-blue-500 border-solid rounded p-3 text-center mb-0 bg-white hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <div className={`rounded-full flex items-center justify-center mr-2 ${platform === 'Instagram' ? 'bg-red-500' : 'bg-red-500'}`} style={{ width: 48, height: 48 }}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <span className="font-medium text-gray-900">Connect {platform}</span>
                </div>
              </div>
            </button>
          ) : (
            <a href={loginUrl} className="no-underline w-full block">
              <div className="border-2 border-blue-500 border-solid rounded p-3 text-center mb-0 bg-white hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <div className={`rounded-full flex items-center justify-center mr-2 ${platform === 'Instagram' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: 48, height: 48 }}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <span className="font-medium text-gray-900">Connect {platform}</span>
                </div>
              </div>
            </a>
          )
        ) : platform === "Instagram" ? (
          <>
            <div className="flex flex-col items-center mb-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center mb-2">
                  <div
                    className="rounded-full flex items-center justify-center bg-red-500"
                    style={{ width: 48, height: 48 }}
                  >
                    <Icon className="text-white" size={28} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {profileData?.profilePicture ? (
                    <img
                      src={profileData.profilePicture}
                      alt={profileData.username || "Profile"}
                      className="rounded-full mr-2 object-cover border-2 border-pink-500"
                      style={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <div
                      className="rounded-full flex items-center justify-center bg-gray-100"
                      style={{ width: 48, height: 48 }}
                    >
                      <Icon className="text-red-500" size={28} />
                    </div>
                  )}
                  <span className="font-semibold text-red-500">
                    @{profileData?.username || profileData?.name}
                  </span>
                </div>
              </div>
              <div className="text-sm text-green-600 flex items-center gap-1 mt-2">
                <span className="rounded-full bg-green-500 inline-block mr-1 w-2 h-2"></span>
                Connected
              </div>
            </div>
            <div className="text-right mb-2">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            </div>
            {uploadComponent && (
              <div className="mt-2 pt-3 border-t border-gray-200">
                {uploadComponent}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border border-blue-500 rounded p-3 bg-gray-50 mb-2">
              <div className="flex items-center gap-3">
                {profileData?.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt={profileData.username || "Profile"}
                    className="rounded-full mr-2 object-cover border-2 border-blue-500"
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center bg-blue-500"
                    style={{ width: 48, height: 48 }}
                  >
                    <Icon className="text-white" size={28} />
                  </div>
                )}
                <span className="font-semibold text-blue-500">
                  {profileData?.username || profileData?.name}
                </span>
                <span className="text-sm text-green-600 flex items-center gap-1 ml-2">
                  <span className="rounded-full bg-green-500 inline-block mr-1 w-2 h-2"></span>
                  Connected
                </span>
              </div>
            </div>
            <div className="text-right mb-2">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            </div>
            {uploadComponent && (
              <div className="mt-2 pt-3 border-t border-gray-200">
                {uploadComponent}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Connected Accounts</h2>
          <p className="text-gray-600">Manage your social media connections</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SocialMediaCard
              platform="Instagram"
              icon={FaInstagram}
              logoUrl="https://img.freepik.com/free-vector/instagram-vector-social-media-icon-7-june-2021-bangkok-thailand_53876-136728.jpg?ga=GA1.1.1151830695.1743448639&semt=ais_items_boosted&w=740"
              isConnected={!!instagramData}
              profileData={instagramData}
              onConnect={handleInstagramConnect}
              onDisconnect={handleInstagramDisconnect}
              uploadComponent={
                <UploadReels
                  isAuthenticated={!!instagramData}
                  userId={instaUserId}
                />
              }
            />
          </div>
          <div>
            <SocialMediaCard
              platform="YouTube"
              icon={FaYoutube}
              logoUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/200px-YouTube_Logo_2017.svg.png"
              isConnected={isYouTubeAuthenticated}
              profileData={youtubeData}
              onConnect={handleYouTubeConnect}
              onDisconnect={handleYouTubeDisconnect}
              uploadComponent={
                <UploadShorts isAuthenticated={isYouTubeAuthenticated} />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsTab;
