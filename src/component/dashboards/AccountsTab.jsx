import React, { useEffect, useState } from "react";
import { fetchInstagramInfo, disconnectInstagram } from "../../api/instagram";
import UploadShorts from "../../component/dashboards/UploadShorts";
import UploadReels from "../../component/dashboards/UploadReels";
import { FaInstagram, FaYoutube } from "react-icons/fa";

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
      const storedUserId = localStorage.getItem("instagramUserId");
      if (storedUserId) {
        setInstaUserId(storedUserId);
        loadInstagramData(storedUserId);
      }
    };
    const checkYouTube = async () => {
      try {
        const response = await fetch(
          "https://legaleeai.com/auth/youtube/profile",
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setYoutubeData({
            username: data.name,
            profilePicture: data.picture,
            name: data.name,
          });
          setIsYouTubeAuthenticated(true);
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
      const userId = params.get("userId");
      if (userId) {
        localStorage.setItem("instagramUserId", userId); // Persist user ID
        setInstaUserId(userId);
        loadInstagramData(userId);
        // Clean the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }

    if (params.has("auth") && params.get("auth") === "success") {
      setIsYouTubeAuthenticated(true);
      loadYoutubeData();
      // Clean the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const loadInstagramData = async (userId) => {
    try {
      const data = await fetchInstagramInfo(userId);
      if (data) {
        setInstagramData({
          username: data.username,
          profilePicture: data.profilePicture,
          name: data.username,
        });
      }
    } catch (error) {
      console.error("Failed to load Instagram data:", error);
      setInstagramData(null);
      setInstaUserId(null);
      localStorage.removeItem("instagramUserId"); // Clear on failure
    }
  };

  const loadYoutubeData = async () => {
    try {
      const response = await fetch(
        "https://legaleeai.com/auth/youtube/profile",
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setYoutubeData({
          username: data.name,
          profilePicture: data.picture,
          name: data.name,
        });
      }
    } catch (error) {
      setYoutubeData(null);
      setIsYouTubeAuthenticated(false);
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!instaUserId) return;
    try {
      await disconnectInstagram(instaUserId);
    } catch (error) {
      console.error("Error during Instagram disconnect:", error);
    } finally {
      setInstagramData(null);
      setInstaUserId(null);
      localStorage.removeItem("instagramUserId"); // Remove from storage
    }
  };

  const handleYouTubeDisconnect = async () => {
    try {
      await fetch("https://legaleeai.com/auth/youtube/disconnect", {
        method: "POST",
        credentials: "include",
      });
      setIsYouTubeAuthenticated(false);
      setYoutubeData(null);
    } catch (error) {}
  };

  const fbOAuthUrl = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${
    import.meta.env.VITE_FB_APP_ID
  }&redirect_uri=${import.meta.env.VITE_FB_REDIRECT_URI}`;
  const instagramLoginUrl = `${fbOAuthUrl}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code&state=instagram`;
  const youtubeLoginUrl = `https://legaleeai.com/auth/youtube`;

  // Tailwind Card Component
  const SocialMediaCard = ({
    platform,
    icon: Icon,
    logoUrl,
    isConnected,
    profileData,
    loginUrl,
    onDisconnect,
    uploadComponent,
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-lg font-semibold mb-0">{platform}</h5>
          <img
            src={logoUrl}
            alt={platform}
            className="h-7 max-w-[100px] object-contain"
          />
        </div>
        {!isConnected ? (
          <a href={loginUrl} className="no-underline w-full block">
            <div className="border-2 border-blue-500 border-solid rounded p-3 text-center mb-0 bg-white hover:bg-blue-50 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <div
                  className={`rounded-full flex items-center justify-center mr-2 ${
                    platform === "Instagram"
                      ? "bg-red-500"
                      : platform === "YouTube"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: 48, height: 48 }}
                >
                  <Icon className="text-white" size={28} />
                </div>
                <span className="font-medium text-gray-900">
                  Connect {platform}
                </span>
              </div>
            </div>
          </a>
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
              loginUrl={instagramLoginUrl}
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
              loginUrl={youtubeLoginUrl}
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
