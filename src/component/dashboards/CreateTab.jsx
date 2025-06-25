import React, { useState } from "react";
import {
  FaImage,
  FaClock,
  FaEye,
  FaPaperPlane,
  FaSave,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaPlus,
  FaUpload,
} from "react-icons/fa";

const dummyAccounts = [
  {
    id: "1",
    name: "Facebook",
    username: "@fbuser",
    profilePic: "https://cdn-icons-png.flaticon.com/512/733/733547.png",
    connected: true,
  },
  {
    id: "2",
    name: "Instagram",
    username: "@instauser",
    profilePic: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png",
    connected: true,
  },
  {
    id: "3",
    name: "YouTube",
    username: "@ytuser",
    profilePic: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
    connected: true,
  },
  {
    id: "4",
    name: "LinkedIn",
    username: "@lnuser",
    profilePic: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
    connected: true,
  },
];

const CreateTab = () => {
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const charCount = postContent.length;
  const maxChars = 280;

  const handleMediaSelect = (media) => {
    if (selectedMedia.find((item) => item.id === media.id)) {
      setSelectedMedia(selectedMedia.filter((item) => item.id !== media.id));
    } else {
      setSelectedMedia([...selectedMedia, media]);
    }
  };

  const handleAccountToggle = (accountId) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    const uploaded = files.map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      name: file.name,
      type: "image",
      file: file,
      url: URL.createObjectURL(file),
    }));
    setMediaFiles((prev) => [...prev, ...uploaded]);
  };

  const handleSubmit = (action) => {
    // Simulate post creation
    setPostTitle("");
    setPostContent("");
    setSelectedMedia([]);
    setSelectedAccounts([]);
    setScheduleDate("");
    setScheduleTime("");
    alert(
      `Post ${
        action === "publish"
          ? "published"
          : action === "draft"
          ? "saved as draft"
          : "scheduled"
      }!`
    );
  };

  const getAccount = (id) => {
    return dummyAccounts.find((account) => account.id === id);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block font-semibold mb-1">Post Title</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                placeholder="Enter post title..."
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Post Content</label>
              <textarea
                rows={5}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <div className="flex justify-end mt-1">
                <small
                  className={
                    charCount > maxChars ? "text-red-500" : "text-gray-500"
                  }
                >
                  {charCount}/{maxChars}
                </small>
              </div>
            </div>
            {selectedMedia.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Selected Media</span>
                  <button
                    className="text-red-500 text-sm"
                    onClick={() => setSelectedMedia([])}
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedMedia.map((media) => (
                    <div key={media.id} className="relative">
                      <img
                        src={media.url}
                        alt={media.name}
                        className="rounded w-full h-24 object-cover"
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        onClick={() =>
                          setSelectedMedia(
                            selectedMedia.filter((item) => item.id !== media.id)
                          )
                        }
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => setShowMediaLibrary(true)}
              >
                <FaImage /> Add Media
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => setShowScheduleModal(true)}
              >
                <FaClock /> Schedule
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => setShowPreview(true)}
              >
                <FaEye /> Preview
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-3">Select Platforms</h2>
            <div className="space-y-2">
              {dummyAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`flex justify-between items-center p-3 rounded border ${
                    selectedAccounts.includes(account.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={account.profilePic}
                      alt={account.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{account.name}</div>
                      <div className="text-xs text-gray-500">
                        {account.username}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`flex items-center gap-1 px-3 py-1 rounded ${
                      selectedAccounts.includes(account.id)
                        ? "bg-blue-500 text-white"
                        : "border border-blue-500 text-blue-500"
                    }`}
                    onClick={() => handleAccountToggle(account.id)}
                    disabled={!account.connected}
                  >
                    {selectedAccounts.includes(account.id) ? (
                      <FaCheck />
                    ) : (
                      <FaPlus />
                    )}{" "}
                    {selectedAccounts.includes(account.id)
                      ? "Selected"
                      : "Select"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
              onClick={() => handleSubmit("draft")}
            >
              <FaSave /> Save as Draft
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
              onClick={() => setShowScheduleModal(true)}
            >
              <FaCalendarAlt /> Schedule
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => handleSubmit("publish")}
              disabled={
                postContent.trim() === "" || selectedAccounts.length === 0
              }
            >
              <FaPaperPlane /> Publish Now
            </button>
          </div>
        </div>
        {/* Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-3">Post Preview</h2>
          <div className="border rounded p-3 mb-3">
            <div className="flex items-center mb-3">
              <div
                className="bg-blue-500 text-white rounded-full flex items-center justify-center mr-2"
                style={{ width: "40px", height: "40px" }}
              >
                {selectedAccounts.length > 0
                  ? getAccount(selectedAccounts[0])?.name.charAt(0)
                  : "A"}
              </div>
              <div>
                <div className="font-semibold">
                  {selectedAccounts.length > 0
                    ? getAccount(selectedAccounts[0])?.name
                    : "Account Name"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            {postTitle && (
              <div className="font-bold text-lg mb-1">{postTitle}</div>
            )}
            <div className={postContent ? "" : "text-gray-400 italic"}>
              {postContent || "Your post content will appear here..."}
            </div>
            {selectedMedia.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {selectedMedia.slice(0, 4).map((media) => (
                  <img
                    key={media.id}
                    src={media.url}
                    alt={media.name}
                    className="rounded w-full h-24 object-cover"
                  />
                ))}
                {selectedMedia.length > 4 && (
                  <div className="flex items-center justify-center text-xs text-gray-500">
                    +{selectedMedia.length - 4} more
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 pt-2 border-t text-xs text-gray-500">
              {selectedAccounts.length > 0
                ? `Will be posted to: ${selectedAccounts
                    .map((id) => getAccount(id)?.name)
                    .join(", ")}`
                : "Select platforms to publish to"}
            </div>
          </div>
        </div>
      </div>
      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => setShowMediaLibrary(false)}
            >
              <FaTimes />
            </button>
            <h2 className="text-lg font-bold mb-4">Select Media</h2>
            <div className="mb-4">
              <label className="block font-semibold mb-1">
                Upload from Device
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleMediaUpload}
                className="block w-full"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mediaFiles.map((media) => {
                const isSelected = selectedMedia.some(
                  (item) => item.id === media.id
                );
                return (
                  <div
                    key={media.id}
                    className={`border rounded relative cursor-pointer ${
                      isSelected ? "border-blue-500 border-2" : ""
                    }`}
                    onClick={() => handleMediaSelect(media)}
                  >
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-24 object-cover rounded"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                        <FaCheck />
                      </div>
                    )}
                    <div className="p-2 text-xs truncate">{media.name}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowMediaLibrary(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowMediaLibrary(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => setShowScheduleModal(false)}
            >
              <FaTimes />
            </button>
            <h2 className="text-lg font-bold mb-4">Schedule Post</h2>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Time</label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  handleSubmit("schedule");
                  setShowScheduleModal(false);
                }}
                disabled={!scheduleDate || !scheduleTime}
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => setShowPreview(false)}
            >
              <FaTimes />
            </button>
            <h2 className="text-lg font-bold mb-4">Post Preview</h2>
            <div className="border rounded p-3">
              <div className="flex items-center mb-3">
                <div
                  className="bg-blue-500 text-white rounded-full flex items-center justify-center mr-2"
                  style={{ width: "40px", height: "40px" }}
                >
                  {selectedAccounts.length > 0
                    ? getAccount(selectedAccounts[0])?.name.charAt(0)
                    : "A"}
                </div>
                <div>
                  <div className="font-semibold">
                    {selectedAccounts.length > 0
                      ? getAccount(selectedAccounts[0])?.name
                      : "Account Name"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
              {postTitle && (
                <div className="font-bold text-lg mb-1">{postTitle}</div>
              )}
              <div className={postContent ? "" : "text-gray-400 italic"}>
                {postContent || "No content entered yet."}
              </div>
              {selectedMedia.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {selectedMedia.map((media) => (
                    <img
                      key={media.id}
                      src={media.url}
                      alt={media.name}
                      className="rounded w-full h-24 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTab;
