import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import Select from "react-select";
import { FaArrowCircleLeft } from "react-icons/fa";
// import TB1000Series from './TB1000Series';
// import TC1000Series from './TC1000Series';

const series = Array.from(
  { length: 26 },
  (_, i) => `T${String.fromCharCode(65 + i)}1000 Series`
);
const transitionOptions = [
  "Fade",
  "wipeleft",
  "wiperight",
  "wipeup",
  "wipedown",
  "slideleft",
  "slideright",
  "slideup",
  "slidedown",
  "circlecrop",
];

const totalDurationOptions = Array.from({ length: 11 }, (_, i) => {
  const value = 15 + i;
  return { value, label: value.toString() };
});

const colorPalette = [
  { border: "border-blue-400", bg: "from-blue-50" },
  { border: "border-green-400", bg: "from-green-50" },
  { border: "border-pink-400", bg: "from-pink-50" },
  { border: "border-yellow-400", bg: "from-yellow-50" },
  { border: "border-purple-400", bg: "from-purple-50" },
  { border: "border-teal-400", bg: "from-teal-50" },
  { border: "border-orange-400", bg: "from-orange-50" },
  { border: "border-indigo-400", bg: "from-indigo-50" },
];

const CreateTemplateTab = ({ pool, onClose, onReelsUpdated }) => {
  const [selectedSeries, setSelectedSeries] = useState("TA1000 Series");
  const [showTB1000Series, setShowTB1000Series] = useState(false);
  const [showTC1000Series, setShowTC1000Series] = useState(false);
  const [imagesCount, setImagesCount] = useState(5);
  const [totalDuration, setTotalDuration] = useState(15);
  const [transition, setTransition] = useState(transitionOptions[0]);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showAutomateModal, setShowAutomateModal] = useState(false);
  const [automateCount, setAutomateCount] = useState(1);
  const [variationImage, setVariationImage] = useState(false);
  const [variationTransition, setVariationTransition] = useState(false);
  const [variationTotalDuration, setVariationTotalDuration] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [reelTemplate, setReelTemplate] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [reelTransition, setReelTransition] = useState("");
  const [reelTotalDuration, setReelTotalDuration] = useState(15);
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null);
  const [reelLoading, setReelLoading] = useState(false);
  const [reelError, setReelError] = useState("");
  const [showAutomateReelModal, setShowAutomateReelModal] = useState(false);
  const [automateReelImages, setAutomateReelImages] = useState([]);
  const [automateReelMusic, setAutomateReelMusic] = useState(null);
  const [automateReelLoading, setAutomateReelLoading] = useState(false);
  const [automateReelError, setAutomateReelError] = useState("");
  const [automateReelVideos, setAutomateReelVideos] = useState([]);
  const [automateReelCount, setAutomateReelCount] = useState(1);
  const [imageLowerLimit, setImageLowerLimit] = useState(5);
  const [imageUpperLimit, setImageUpperLimit] = useState(15);
  const [durationLowerLimit, setDurationLowerLimit] = useState(7);
  const [durationUpperLimit, setDurationUpperLimit] = useState(30);
  const [selectedTransitions, setSelectedTransitions] = useState([]);

  // Campaign Reel state variables
  const [showCampaignReelModal, setShowCampaignReelModal] = useState(false);
  const [campaignReelImages, setCampaignReelImages] = useState([]);
  const [campaignReelMusic, setCampaignReelMusic] = useState(null);
  const [campaignReelLoading, setCampaignReelLoading] = useState(false);
  const [campaignReelError, setCampaignReelError] = useState("");
  const [campaignReelVideos, setCampaignReelVideos] = useState([]);
  const [campaignImageLowerLimit, setCampaignImageLowerLimit] = useState(5);
  const [campaignImageUpperLimit, setCampaignImageUpperLimit] = useState(15);
  const [campaignDurationLowerLimit, setCampaignDurationLowerLimit] =
    useState(7);
  const [campaignDurationUpperLimit, setCampaignDurationUpperLimit] =
    useState(30);
  const [campaignSelectedTransitions, setCampaignSelectedTransitions] =
    useState([]);
  const [campaignVariationImage, setCampaignVariationImage] = useState(false);
  const [campaignVariationTransition, setCampaignVariationTransition] =
    useState(false);
  const [campaignVariationTotalDuration, setCampaignVariationTotalDuration] =
    useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Campaign Reel handlers
  const handleCampaignTransitionToggle = (transition) => {
    if (campaignSelectedTransitions.includes(transition)) {
      setCampaignSelectedTransitions(
        campaignSelectedTransitions.filter((t) => t !== transition)
      );
    } else {
      setCampaignSelectedTransitions([
        ...campaignSelectedTransitions,
        transition,
      ]);
    }
  };

  const handleCloseCampaignReelModal = () => {
    setShowCampaignReelModal(false);
    setCampaignReelImages([]);
    setCampaignReelMusic(null);
    setCampaignReelVideos([]);
    setCampaignReelError("");
    setCampaignSelectedTransitions([]);
    setSelectedCampaign("");
    setSelectedGroup("");
  };

  const handleCampaignGenerateReel = async () => {
    if (
      !selectedCampaign ||
      campaignReelImages.length < 5 ||
      !campaignReelMusic
    ) {
      setCampaignReelError("Please select a campaign, images, and music.");
      return;
    }

    // Check if transitions are selected when variation is enabled
    if (
      campaignVariationTransition &&
      campaignSelectedTransitions.length === 0
    ) {
      setCampaignReelError("Please select at least one transition variation.");
      return;
    }

    setCampaignReelLoading(true);
    setCampaignReelError("");
    setCampaignReelVideos([]); // clear previous
    const totalUsers = getTotalUsersForCampaign(selectedCampaign);
    try {
      const promises = Array.from(
        { length: totalUsers },
        async (_, reelIndex) => {
          const randomImages = campaignVariationImage
            ? getRandom(
                Array.from(
                  {
                    length:
                      campaignImageUpperLimit - campaignImageLowerLimit + 1,
                  },
                  (_, i) => campaignImageLowerLimit + i
                )
              )
            : 5;
          const randomTransition = campaignVariationTransition
            ? getRandom(campaignSelectedTransitions)
            : transitionOptions[0];
          const randomTotalDuration = campaignVariationTotalDuration
            ? getRandom(
                Array.from(
                  {
                    length:
                      campaignDurationUpperLimit -
                      campaignDurationLowerLimit +
                      1,
                  },
                  (_, i) => campaignDurationLowerLimit + i
                )
              )
            : 15;
          if (campaignReelImages.length < randomImages) {
            throw new Error("Not enough images for the generated template.");
          }
          const imagesForTpl = getRandomSubset(
            campaignReelImages,
            randomImages
          );
          const imagesBase64 = await Promise.all(
            imagesForTpl.map(readFileAsBase64)
          );
          const musicBase64 = await readFileAsBase64(campaignReelMusic);
          const response = await fetch(
            `${API_BASE_URL}/api/reelta1000series/merge-reelta1000series`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                images: imagesBase64,
                music: musicBase64,
                transition: randomTransition,
                totalDuration: randomTotalDuration,
              }),
            }
          );
          if (!response.ok) throw new Error("Failed to generate reel");
          const videoBlob = await response.blob();
          const videoUrl = URL.createObjectURL(videoBlob);
          return {
            url: videoUrl,
            template: {
              images: randomImages,
              transition: randomTransition,
              totalDuration: randomTotalDuration,
            },
            reelIndex: reelIndex + 1,
          };
        }
      );
      // Progressive update: as each finishes, add to state
      promises.forEach(async (promise) => {
        try {
          const result = await promise;
          setCampaignReelVideos((prev) => [...prev, result]);
        } catch (err) {
          setCampaignReelError(err.message || "Failed to generate reel");
        }
      });
      await Promise.allSettled(promises);
    } catch (err) {
      setCampaignReelError(err.message || "Failed to generate reels");
    } finally {
      setCampaignReelLoading(false);
    }
  };

  // Add handler for series selection
  const handleSeriesSelect = (series) => {
    setSelectedSeries(series);
    if (series === "TB1000 Series") {
      setShowTB1000Series(true);
    }
  };

  // Add back button handler
  const handleBack = () => {
    setSelectedSeries(null);
    setShowTB1000Series(false);
  };

  // Helper to get random element from array
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper to get groups based on selected campaign
  const getGroupsByCampaign = (campaign) => {
    switch (campaign) {
      case "healthcare":
        return [{ name: "Alpha 1", users: 1 }];
      case "marketing":
        return [
          { name: "Alpha 2", users: 2 },
          { name: "Beta 2", users: 2 },
        ];
      case "sales":
        return [
          { name: "Alpha 3", users: 3 },
          { name: "Beta 3", users: 3 },
          { name: "Gamma 3", users: 3 },
        ];
      default:
        return [];
    }
  };

  // Helper to get total users for a campaign
  const getTotalUsersForCampaign = (campaign) => {
    const groups = getGroupsByCampaign(campaign);
    return groups.reduce((total, group) => total + group.users, 0);
  };

  // Automate generate handler
  const handleAutomateGenerate = async () => {
    setLoading(true);
    try {
      const requests = [];
      for (let i = 0; i < automateCount; i++) {
        const randomImages = variationImage
          ? getRandom([5, 6, 7, 8, 9, 10])
          : imagesCount;
        const randomTransition = variationTransition
          ? getRandom(transitionOptions)
          : transition;
        const randomTotalDuration = variationTotalDuration
          ? getRandom(totalDurationOptions).value
          : totalDuration;
        const payload = {
          images: randomImages,
          music: 1,
          transition: randomTransition,
          totalDuration: randomTotalDuration,
        };
        requests.push(
          axios.post(
            `${API_BASE_URL}/api/ta1000series/reelta1000series`,
            payload
          )
        );
      }
      await Promise.all(requests);
      setShowAutomateModal(false);
      // fetchTemplates();
    } catch (err) {
      alert("Failed to automate generate templates.");
    } finally {
      setLoading(false);
    }
  };

  // Handler to open modal
  const handleOpenReelModal = (tpl) => {
    setReelTemplate(tpl);
    setShowReelModal(true);
    setSelectedImages([]);
    setSelectedMusic(null);
    setReelTransition(tpl.transition);
    setReelTotalDuration(tpl.totalDuration);
  };

  // Helper to handle transition selection
  const handleTransitionToggle = (transition) => {
    if (selectedTransitions.includes(transition)) {
      setSelectedTransitions(
        selectedTransitions.filter((t) => t !== transition)
      );
    } else {
      setSelectedTransitions([...selectedTransitions, transition]);
    }
  };

  // Handler to close modal
  const handleCloseReelModal = () => {
    setShowReelModal(false);
    setReelTemplate(null);
    setSelectedImages([]);
    setSelectedMusic(null);
  };

  // Handler to close Automate Generate Reel modal
  const handleCloseAutomateReelModal = () => {
    setShowAutomateReelModal(false);
    setAutomateReelImages([]);
    setAutomateReelMusic(null);
    setAutomateReelVideos([]);
    setAutomateReelError("");
    setSelectedTransitions([]);
  };

  // Helper to read files as base64
  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Handler for Next button
  const handleGenerateReel = async () => {
    setReelLoading(true);
    setReelError("");
    setMergedVideoUrl(null);
    try {
      // Read images and music as base64
      const imagesBase64 = await Promise.all(
        selectedImages.map(readFileAsBase64)
      );
      const musicBase64 = await readFileAsBase64(selectedMusic);
      // Send to backend
      const response = await fetch(
        `${API_BASE_URL}/api/reelta1000series/merge-reelta1000series`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: imagesBase64,
            music: musicBase64,
            transition: reelTransition,
            totalDuration: reelTotalDuration,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to generate reel");
      // Get video blob
      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setMergedVideoUrl(videoUrl);
    } catch (err) {
      setReelError(err.message || "Failed to generate reel");
    } finally {
      setReelLoading(false);
    }
  };

  function getRandomSubset(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // Handler for Automate Generate Reel
  const handleAutomateGenerateReel = async () => {
    if (!automateReelImages.length || !automateReelMusic) {
      setAutomateReelError("Please select images and music.");
      return;
    }

    // Check if transitions are selected when variation is enabled
    if (variationTransition && selectedTransitions.length === 0) {
      setAutomateReelError("Please select at least one transition variation.");
      return;
    }

    setAutomateReelLoading(true);
    setAutomateReelError("");
    setAutomateReelVideos([]); // clear previous
    try {
      const promises = Array.from(
        { length: automateReelCount },
        async (_, reelIndex) => {
          const randomImages = variationImage
            ? getRandom(
                Array.from(
                  { length: imageUpperLimit - imageLowerLimit + 1 },
                  (_, i) => imageLowerLimit + i
                )
              )
            : 5;
          const randomTransition = variationTransition
            ? getRandom(selectedTransitions)
            : transitionOptions[0];
          const randomTotalDuration = variationTotalDuration
            ? getRandom(
                Array.from(
                  { length: durationUpperLimit - durationLowerLimit + 1 },
                  (_, i) => durationLowerLimit + i
                )
              )
            : 15;
          if (automateReelImages.length < randomImages) {
            throw new Error("Not enough images for the generated template.");
          }
          const imagesForTpl = getRandomSubset(
            automateReelImages,
            randomImages
          );
          const imagesBase64 = await Promise.all(
            imagesForTpl.map(readFileAsBase64)
          );
          const musicBase64 = await readFileAsBase64(automateReelMusic);
          const response = await fetch(
            `${API_BASE_URL}/api/reelta1000series/merge-reelta1000series`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                images: imagesBase64,
                music: musicBase64,
                transition: randomTransition,
                totalDuration: randomTotalDuration,
              }),
            }
          );
          if (!response.ok) throw new Error("Failed to generate reel");
          const videoBlob = await response.blob();
          const videoUrl = URL.createObjectURL(videoBlob);
          return {
            url: videoUrl,
            template: {
              images: randomImages,
              transition: randomTransition,
              totalDuration: randomTotalDuration,
            },
            reelIndex: reelIndex + 1,
          };
        }
      );
      // Progressive update: as each finishes, add to state
      promises.forEach(async (promise) => {
        try {
          const result = await promise;
          setAutomateReelVideos((prev) => [...prev, result]);
        } catch (err) {
          setAutomateReelError(err.message || "Failed to generate reel");
        }
      });
      await Promise.allSettled(promises);
    } catch (err) {
      setAutomateReelError(err.message || "Failed to generate reels");
    } finally {
      setAutomateReelLoading(false);
    }
  };

  // Save handler for uploading generated videos
  const handleSaveGeneratedReels = async () => {
    if (!pool || !pool._id || automateReelVideos.length === 0) return;
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const formData = new FormData();
      for (let idx = 0; idx < automateReelVideos.length; idx++) {
        const vid = automateReelVideos[idx];
        if (vid.file instanceof File || vid.file instanceof Blob) {
          formData.append(
            "file",
            vid.file,
            vid.file.name || `reel${idx + 1}.mp4`
          );
        } else if (vid.url) {
          // Fetch the video blob from the URL
          const response = await fetch(vid.url);
          const blob = await response.blob();
          formData.append("file", blob, `reel${idx + 1}.mp4`);
        }
      }
      // POST to /api/pools/:poolId/upload-multiple
      const res = await axios.post(
        `${API_BASE_URL}/api/pools/${pool._id}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setSaveSuccess(true);
      if (onClose) {
        onClose();
      }
      // Call onReelsUpdated after successful save
      if (onReelsUpdated) {
        onReelsUpdated();
      }
    } catch (err) {
      setSaveError(
        err.response?.data?.error || "Failed to upload generated reels"
      );
    } finally {
      setSaveLoading(false);
    }
  };

  if (selectedSeries === "TA1000 Series") {
    return (
      <>
        <div className="p-4 flex flex-col items-center justify-around">
          <div className="max-w-xs w-full flex justify-end ">
            <button
              className="bg-purple-600 text-white px-6 py-3 rounded  shadow hover:bg-purple-700 transition-colors duration-200 font-semibold text-lg"
              onClick={() => setShowAutomateReelModal(true)}
            >
              Generate Reel
            </button>
          </div>
        </div>
        {/* Automate Generate Modal */}
        {showAutomateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div
              className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl relative overflow-y-auto border border-gray-200"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-6 pb-2 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-purple-700 tracking-tight">
                  Generate Reels
                </h3>
                <button
                  className="text-gray-400 hover:text-purple-600 text-3xl font-bold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-full px-2"
                  onClick={handleCloseAutomateReelModal}
                  title="Close"
                >
                  ×
                </button>
              </div>
              {/* Body */}
              <div className="px-8 py-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                {/* Images Upload */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-lg">
                    Upload Images (at least 5){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 hover:border-blue-400 transition-colors duration-200 flex flex-col gap-2 shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      required
                      className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors duration-200 focus:ring-2 focus:ring-blue-400"
                      onChange={(e) =>
                        setAutomateReelImages(Array.from(e.target.files))
                      }
                    />
                    <div className="text-xs text-blue-700 flex items-center gap-2 mt-1">
                      <span className="text-blue-600">📁</span>
                      <span>Selected: {automateReelImages.length} images</span>
                    </div>
                  </div>
                </div>
                {/* Music Upload */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-lg">
                    Upload 1 Music File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-green-300 rounded-xl p-6 bg-green-50 hover:border-green-400 transition-colors duration-200 flex flex-col gap-2 shadow-sm">
                    <input
                      type="file"
                      accept="audio/*"
                      required
                      className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 transition-colors duration-200 focus:ring-2 focus:ring-green-400"
                      onChange={(e) => setAutomateReelMusic(e.target.files[0])}
                    />
                    <div className="text-xs text-green-700 flex items-center gap-2 mt-1">
                      <span className="text-green-600">🎵</span>
                      <span>
                        {automateReelMusic
                          ? "Music file selected"
                          : "No music file selected"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Reel Count */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-lg">
                    How many reels to generate?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="border border-blue-300 px-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-150 outline-none text-base shadow-sm"
                    value={automateReelCount === 0 ? "" : automateReelCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseInt(value);
                      if (value === "" || (numValue >= 0 && numValue <= 20)) {
                        setAutomateReelCount(value === "" ? 0 : numValue);
                      }
                    }}
                    placeholder="Generate only 20 reels at a time"
                  />
                </div>
                {/* Variations Section */}
                <div className="flex flex-col gap-4 bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <label className="flex items-center gap-3 text-base font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={variationImage}
                      onChange={(e) => setVariationImage(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Variation in image count
                  </label>
                  {variationImage && (
                    <div className="ml-6 flex flex-wrap gap-8 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Lower Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={imageLowerLimit}
                          onChange={(e) =>
                            setImageLowerLimit(Number(e.target.value))
                          }
                          placeholder="5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Upper Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={imageUpperLimit}
                          onChange={(e) =>
                            setImageUpperLimit(Number(e.target.value))
                          }
                          placeholder="15"
                        />
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-3 text-base font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={variationTransition}
                      onChange={(e) => setVariationTransition(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Variation in transition
                  </label>
                  {variationTransition && (
                    <div className="ml-6 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Transitions:
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {transitionOptions.map((transition) => (
                          <label
                            key={transition}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTransitions.includes(transition)}
                              onChange={() =>
                                handleTransitionToggle(transition)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{transition}</span>
                          </label>
                        ))}
                      </div>
                      {selectedTransitions.length > 0 && (
                        <div className="text-xs text-blue-600 mt-2">
                          Selected: {selectedTransitions.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                  <label className="flex items-center gap-3 text-base font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={variationTotalDuration}
                      onChange={(e) =>
                        setVariationTotalDuration(e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Variation in total duration
                  </label>
                  {variationTotalDuration && (
                    <div className="ml-6 flex flex-wrap gap-8 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Lower Limit (sec)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={durationLowerLimit}
                          onChange={(e) =>
                            setDurationLowerLimit(Number(e.target.value))
                          }
                          placeholder="7"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Upper Limit (sec)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={durationUpperLimit}
                          onChange={(e) =>
                            setDurationUpperLimit(Number(e.target.value))
                          }
                          placeholder="30"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Generate Button */}
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors duration-200 font-bold w-full text-lg disabled:opacity-50 shadow-lg focus:ring-2 focus:ring-purple-400"
                    disabled={
                      automateReelImages.length < 5 ||
                      !automateReelMusic ||
                      automateReelLoading ||
                      automateReelCount <= 0 ||
                      automateReelCount > 20
                    }
                    onClick={handleAutomateGenerateReel}
                  >
                    {automateReelLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      "Generate All Reels"
                    )}
                  </button>
                </div>
                {/* Feedback */}
                {automateReelError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-2 shadow-sm">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {automateReelError}
                  </div>
                )}
                {/* Generated Reels Preview */}
                {automateReelVideos.length > 0 && (
                  <div className="mt-10">
                    <h4 className="text-xl font-bold mb-6 text-purple-700">
                      Generated Reels
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {automateReelVideos.map((vid, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center bg-gray-50 rounded-xl p-6 shadow-md border border-gray-100"
                        >
                          <div className="mb-2 text-blue-700 font-bold text-base">
                            Reel {vid.reelIndex} - Random Template
                          </div>
                          <video
                            src={vid.url}
                            controls
                            className="rounded shadow mb-2 border border-gray-200"
                            style={{
                              maxWidth: 220,
                              maxHeight: 140,
                              width: "100%",
                              height: "auto",
                            }}
                          />
                          <div className="text-xs text-gray-600">
                            Images: {vid.template.images}, Transition:{" "}
                            {vid.template.transition}, Duration:{" "}
                            {vid.template.totalDuration}s
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Save Button */}
                    <div className="flex justify-end mt-8">
                      <button
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-colors shadow-lg disabled:opacity-60 focus:ring-2 focus:ring-green-400"
                        onClick={handleSaveGeneratedReels}
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              ></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                    {saveSuccess && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mt-2 shadow-sm">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Reels uploaded successfully!
                      </div>
                    )}
                    {saveError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-2 shadow-sm">
                        <svg
                          className="h-5 w-5 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {saveError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Automate Generate Reel Modal */}
        {showAutomateReelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/35 bg-opacity-30 backdrop-blur-sm">
            <div
              className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl relative overflow-y-auto border border-gray-200"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-6 pb-2 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-purple-700 tracking-tight">
                  Generate Reels
                </h3>
                <button
                  className="text-gray-400 hover:text-purple-600 text-3xl font-bold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-full px-2"
                  onClick={handleCloseAutomateReelModal}
                  title="Close"
                >
                  ×
                </button>
              </div>
              {/* Body */}
              <div className="px-8 py-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                {/* Images Upload */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-lg">
                    Upload Images (at least 5){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 hover:border-blue-400 transition-colors duration-200 flex flex-col gap-2 shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      required
                      className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors duration-200 focus:ring-2 focus:ring-blue-400"
                      onChange={(e) =>
                        setAutomateReelImages(Array.from(e.target.files))
                      }
                    />
                    <div className="text-xs text-blue-700 flex items-center gap-2 mt-1">
                      <span className="text-blue-600">📁</span>
                      <span>Selected: {automateReelImages.length} images</span>
                    </div>
                  </div>
                </div>
                {/* Music Upload */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-lg">
                    Upload 1 Music File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-green-300 rounded-xl p-6 bg-green-50 hover:border-green-400 transition-colors duration-200 flex flex-col gap-2 shadow-sm">
                    <input
                      type="file"
                      accept="audio/*"
                      required
                      className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 transition-colors duration-200 focus:ring-2 focus:ring-green-400"
                      onChange={(e) => setAutomateReelMusic(e.target.files[0])}
                    />
                    <div className="text-xs text-green-700 flex items-center gap-2 mt-1">
                      <span className="text-green-600">🎵</span>
                      <span>
                        {automateReelMusic
                          ? "Music file selected"
                          : "No music file selected"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Reel Count */}
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-lg">
                    How many reels to generate?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="border border-blue-300 px-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-150 outline-none text-base shadow-sm"
                    value={automateReelCount === 0 ? "" : automateReelCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseInt(value);
                      if (value === "" || (numValue >= 0 && numValue <= 20)) {
                        setAutomateReelCount(value === "" ? 0 : numValue);
                      }
                    }}
                    placeholder="Generate only 20 reels at a time"
                  />
                </div>
                {/* Variations Section */}
                <div className="flex flex-col gap-4 bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <label className="flex items-center gap-3 text-base font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={variationImage}
                      onChange={(e) => setVariationImage(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Variation in image count
                  </label>
                  {variationImage && (
                    <div className="ml-6 flex flex-wrap gap-8 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Lower Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={imageLowerLimit}
                          onChange={(e) =>
                            setImageLowerLimit(Number(e.target.value))
                          }
                          placeholder="5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Upper Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={imageUpperLimit}
                          onChange={(e) =>
                            setImageUpperLimit(Number(e.target.value))
                          }
                          placeholder="15"
                        />
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-3 text-base font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={variationTransition}
                      onChange={(e) => setVariationTransition(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Variation in transition
                  </label>
                  {variationTransition && (
                    <div className="ml-6 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Transitions:
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {transitionOptions.map((transition) => (
                          <label
                            key={transition}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTransitions.includes(transition)}
                              onChange={() =>
                                handleTransitionToggle(transition)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{transition}</span>
                          </label>
                        ))}
                      </div>
                      {selectedTransitions.length > 0 && (
                        <div className="text-xs text-blue-600 mt-2">
                          Selected: {selectedTransitions.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                  <label className="flex items-center gap-3 text-base font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={variationTotalDuration}
                      onChange={(e) =>
                        setVariationTotalDuration(e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Variation in total duration
                  </label>
                  {variationTotalDuration && (
                    <div className="ml-6 flex flex-wrap gap-8 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Lower Limit (sec)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={durationLowerLimit}
                          onChange={(e) =>
                            setDurationLowerLimit(Number(e.target.value))
                          }
                          placeholder="7"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Upper Limit (sec)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          className="border border-blue-300 px-3 py-2 rounded-lg w-24 text-center focus:ring-2 focus:ring-blue-300"
                          value={durationUpperLimit}
                          onChange={(e) =>
                            setDurationUpperLimit(Number(e.target.value))
                          }
                          placeholder="30"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Generate Button */}
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors duration-200 font-bold w-full text-lg disabled:opacity-50 shadow-lg focus:ring-2 focus:ring-purple-400"
                    disabled={
                      automateReelImages.length < 5 ||
                      !automateReelMusic ||
                      automateReelLoading ||
                      automateReelCount <= 0 ||
                      automateReelCount > 20
                    }
                    onClick={handleAutomateGenerateReel}
                  >
                    {automateReelLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      "Generate All Reels"
                    )}
                  </button>
                </div>
                {/* Feedback */}
                {automateReelError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-2 shadow-sm">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {automateReelError}
                  </div>
                )}
                {/* Generated Reels Preview */}
                {automateReelVideos.length > 0 && (
                  <div className="mt-10">
                    <h4 className="text-xl font-bold mb-6 text-purple-700">
                      Generated Reels
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {automateReelVideos.map((vid, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center bg-gray-50 rounded-xl p-6 shadow-md border border-gray-100"
                        >
                          <div className="mb-2 text-blue-700 font-bold text-base">
                            Reel {vid.reelIndex} - Random Template
                          </div>
                          <video
                            src={vid.url}
                            controls
                            className="rounded shadow mb-2 border border-gray-200"
                            style={{
                              maxWidth: 220,
                              maxHeight: 140,
                              width: "100%",
                              height: "auto",
                            }}
                          />
                          <div className="text-xs text-gray-600">
                            Images: {vid.template.images}, Transition:{" "}
                            {vid.template.transition}, Duration:{" "}
                            {vid.template.totalDuration}s
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Save Button */}
                    <div className="flex justify-end mt-8">
                      <button
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-colors shadow-lg disabled:opacity-60 focus:ring-2 focus:ring-green-400"
                        onClick={handleSaveGeneratedReels}
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              ></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                    {saveSuccess && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mt-2 shadow-sm">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Reels uploaded successfully!
                      </div>
                    )}
                    {saveError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-2 shadow-sm">
                        <svg
                          className="h-5 w-5 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {saveError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Generate Reel Modal */}
        {showReelModal && reelTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-2 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold"
                onClick={handleCloseReelModal}
                title="Close"
              >
                ×
              </button>
              <h3 className="text-xl font-bold mb-4 text-blue-700">
                Select Images and Music
              </h3>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select {reelTemplate.images} Images{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files);
                    const uniqueFiles = [...selectedImages];
                    newFiles.forEach((file) => {
                      if (
                        !uniqueFiles.some(
                          (f) => f.name === file.name && f.size === file.size
                        )
                      ) {
                        uniqueFiles.push(file);
                      }
                    });
                    setSelectedImages(
                      uniqueFiles.slice(0, reelTemplate.images)
                    );
                  }}
                />
                {selectedImages.length > 0 && (
                  <div className="mt-2 text-blue-700 text-sm">
                    Selected images: {selectedImages.length} /{" "}
                    {reelTemplate.images}
                  </div>
                )}
                {selectedImages.length !== reelTemplate.images && (
                  <div className="text-xs text-red-500 mt-1">
                    Please select exactly {reelTemplate.images} images.
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select 1 Music File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  required
                  onChange={(e) => setSelectedMusic(e.target.files[0])}
                />
                {selectedMusic && (
                  <div className="mt-2 text-green-700 text-sm">
                    Music file selected
                  </div>
                )}
                {!selectedMusic && (
                  <div className="text-xs text-red-500 mt-1">
                    Please select a music file.
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">Transition</label>
                <select
                  className="border border-blue-300 px-2 py-1 rounded w-full bg-gray-100 cursor-not-allowed"
                  value={reelTransition}
                  disabled
                  readOnly
                >
                  <option value={reelTransition}>{reelTransition}</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Total Duration (seconds)
                </label>
                <input
                  type="number"
                  className="border border-blue-300 px-2 py-1 rounded w-full bg-gray-100 cursor-not-allowed"
                  value={reelTotalDuration}
                  disabled
                  readOnly
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200 font-semibold w-full disabled:opacity-50"
                  disabled={
                    selectedImages.length !== reelTemplate.images ||
                    !selectedMusic ||
                    reelLoading
                  }
                  onClick={handleGenerateReel}
                >
                  {reelLoading ? "Generating..." : "Next"}
                </button>
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors duration-200 font-semibold w-full"
                  onClick={handleCloseReelModal}
                  disabled={reelLoading}
                >
                  Cancel
                </button>
              </div>
              {reelError && (
                <div className="text-red-500 text-sm mt-2">{reelError}</div>
              )}
              {mergedVideoUrl && (
                <div className="mt-6 flex flex-col items-center">
                  <h4 className="text-lg font-semibold mb-2 text-blue-700">
                    Merged Reel Preview
                  </h4>
                  <video
                    src={mergedVideoUrl}
                    controls
                    className="rounded shadow"
                    style={{
                      maxWidth: 300,
                      maxHeight: 180,
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Campaign Reel Modal */}
        {showCampaignReelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-3 text-gray-400 hover:text-orange-600 text-2xl font-bold"
                onClick={handleCloseCampaignReelModal}
                title="Close"
              >
                ×
              </button>
              <h3 className="text-xl font-bold mb-4 text-orange-700">
                Campaign Reel Generate
              </h3>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select Campaign <span className="text-red-500">*</span>
                </label>
                <select
                  className="border border-orange-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-150 outline-none w-full"
                  value={selectedCampaign}
                  onChange={(e) => {
                    setSelectedCampaign(e.target.value);
                    setSelectedGroup(""); // Reset group when campaign changes
                  }}
                  required
                >
                  <option value="">Choose a campaign...</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Groups in Campaign
                </label>
                {selectedCampaign ? (
                  <div className="space-y-1">
                    {getGroupsByCampaign(selectedCampaign).length > 0 ? (
                      getGroupsByCampaign(selectedCampaign).map(
                        (group, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 rounded bg-orange-50 border border-orange-200 flex items-center justify-between"
                          >
                            <span className="font-semibold text-orange-700">
                              {group.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {group.users} user{group.users > 1 ? "s" : ""}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-gray-400">
                        No groups in this campaign.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400">
                    Select a campaign to see groups.
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select Image Folder <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  webkitdirectory="true"
                  directory="true"
                  onChange={(e) => {
                    // Flatten all files from the folder selection
                    const files = Array.from(e.target.files).filter((file) =>
                      file.type.startsWith("image/")
                    );
                    setCampaignReelImages(files);
                  }}
                  className="border border-orange-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-150 outline-none w-full"
                />
                {campaignReelImages.length > 0 && (
                  <div className="mt-2 text-orange-700 text-sm">
                    Selected images: {campaignReelImages.length}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select Music File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  required
                  onChange={(e) => setCampaignReelMusic(e.target.files[0])}
                  className="border border-orange-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-150 outline-none w-full"
                />
                {campaignReelMusic && (
                  <div className="mt-2 text-green-700 text-sm">
                    Music file selected
                  </div>
                )}
              </div>
              <div className="mb-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-orange-700 font-medium">
                    {selectedCampaign
                      ? `Will generate ${getTotalUsersForCampaign(
                          selectedCampaign
                        )} reels (${getTotalUsersForCampaign(
                          selectedCampaign
                        )} total users in ${selectedCampaign} campaign)`
                      : "Select a campaign to see reel count"}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-3 text-orange-700">
                  Variation Options
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={campaignVariationImage}
                      onChange={(e) =>
                        setCampaignVariationImage(e.target.checked)
                      }
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Variation in image count</span>
                  </div>
                  {campaignVariationImage && (
                    <div className="ml-6 flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Lower Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="border border-orange-300 px-2 py-1 rounded w-20 text-center"
                          value={campaignImageLowerLimit}
                          onChange={(e) =>
                            setCampaignImageLowerLimit(Number(e.target.value))
                          }
                          placeholder="5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Upper Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="border border-orange-300 px-2 py-1 rounded w-20 text-center"
                          value={campaignImageUpperLimit}
                          onChange={(e) =>
                            setCampaignImageUpperLimit(Number(e.target.value))
                          }
                          placeholder="15"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={campaignVariationTransition}
                      onChange={(e) =>
                        setCampaignVariationTransition(e.target.checked)
                      }
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Variation in transition</span>
                  </div>
                  {campaignVariationTransition && (
                    <div className="ml-6 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Transitions:
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {transitionOptions.map((transition) => (
                          <label
                            key={transition}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={campaignSelectedTransitions.includes(
                                transition
                              )}
                              onChange={(e) =>
                                handleCampaignTransitionToggle(transition)
                              }
                              className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span>{transition}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={campaignVariationTotalDuration}
                      onChange={(e) =>
                        setCampaignVariationTotalDuration(e.target.checked)
                      }
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Variation in total duration</span>
                  </div>
                  {campaignVariationTotalDuration && (
                    <div className="ml-6 flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Lower Limit (sec)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          className="border border-orange-300 px-2 py-1 rounded w-20 text-center"
                          value={campaignDurationLowerLimit}
                          onChange={(e) =>
                            setCampaignDurationLowerLimit(
                              Number(e.target.value)
                            )
                          }
                          placeholder="15"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Upper Limit (sec)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          className="border border-orange-300 px-2 py-1 rounded w-20 text-center"
                          value={campaignDurationUpperLimit}
                          onChange={(e) =>
                            setCampaignDurationUpperLimit(
                              Number(e.target.value)
                            )
                          }
                          placeholder="40"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors duration-200 font-semibold w-full disabled:opacity-50"
                  disabled={
                    !selectedCampaign ||
                    campaignReelImages.length < 5 ||
                    !campaignReelMusic ||
                    campaignReelLoading
                  }
                  onClick={handleCampaignGenerateReel}
                >
                  {campaignReelLoading ? "Generating..." : "Generate All Reels"}
                </button>
              </div>
              {campaignReelError && (
                <div className="text-red-500 text-sm mt-2">
                  {campaignReelError}
                </div>
              )}
              {campaignReelVideos.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4 text-orange-700">
                    Generated Reels
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaignReelVideos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center bg-gray-50 rounded-lg p-4 shadow"
                      >
                        <div className="mb-2 text-orange-700 font-bold">
                          Reel {vid.reelIndex} - Random Template
                        </div>
                        <video
                          src={vid.url}
                          controls
                          className="rounded shadow mb-2"
                          style={{
                            maxWidth: 220,
                            maxHeight: 140,
                            width: "100%",
                            height: "auto",
                          }}
                        />
                        <div className="text-xs text-gray-600">
                          Images: {vid.template.images}, Transition:{" "}
                          {vid.template.transition}, Duration:{" "}
                          {vid.template.totalDuration}s
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-4">
        {series.map((label, idx) => {
          const color = colorPalette[idx % colorPalette.length];
          const isTA1000 = label === "TA1000 Series";
          return (
            <button
              key={label}
              className={`w-full flex items-center px-5 py-3 bg-gradient-to-r ${color.bg} to-white ${color.border} border-l-8 rounded-xl shadow hover:shadow-md hover:bg-opacity-80 transition-all duration-150 text-blue-800 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-300`}
              style={{ minHeight: "48px" }}
              onClick={() => setSelectedSeries(label)}
            >
              <span className="mr-2">{label}</span>
              {isTA1000 && (
                <a
                  href="https://youtube.com/shorts/48ugLXkxArc?feature=share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src="https://i.ytimg.com/vi/48ugLXkxArc/hqdefault.jpg"
                    alt="TA1000 Series Thumbnail"
                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                  />
                </a>
              )}
              <span className="ml-auto flex items-center gap-2">
                {isTA1000 && (
                  <span className="inline-flex items-center justify-center px-3 py-1 text-base font-extrabold leading-none text-white bg-gradient-to-r from-blue-500 to-blue-700 shadow-md rounded-full transition-transform duration-200 group-hover:scale-110 group-hover:shadow-lg">
                    Total Templates {savedTemplates.length}
                  </span>
                )}
                <span className="text-blue-400 text-xl">→</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-red-500">
        Backend and TB/TC series are commented out for now.
      </div>
    </div>
  );
};

export default CreateTemplateTab;
