import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FaRocket, FaBullhorn, FaSearch, FaFire, FaHashtag, FaChartLine,
  FaHeart, FaEye, FaShare, FaRegCommentDots, FaArrowUp, FaArrowDown,
  FaMinus, FaSpinner, FaCopy, FaCheck, FaEdit, FaCalendarAlt,
  FaNewspaper, FaBlog, FaStar, FaPen, FaComment, FaFileAlt,
  FaReddit, FaUsers, FaInstagram, FaTelegramPlane, FaFacebook,
  FaYoutube, FaTwitter, FaLayerGroup, FaDownload, FaStop,
  FaCheckCircle, FaTimesCircle, FaClock, FaBroadcastTower,
} from "react-icons/fa";
import { SiQuora } from "react-icons/si";
import { MdSensors } from "react-icons/md";
import { API_BASE_URL } from "../../config";

const getToken = () =>
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken") ||
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken") || "";

const CONTENT_TYPES = [
  "Product Offer", "AI Trends", "Testimonials", "Comparison",
  "FAQs", "Blog", "Video/Reel Script", "Post",
  "Quiz", "Comment", "Reviews", "Likes Strategy",
  "Ask Questions", "Reply to Questions", "News", "Articles",
];

const PLATFORMS = [
  { id: "news", label: "News", icon: FaNewspaper, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "blog", label: "Blog", icon: FaBlog, color: "text-green-600", bg: "bg-green-50" },
  { id: "trend", label: "Trend", icon: FaFire, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "reviews", label: "Reviews", icon: FaStar, color: "text-yellow-500", bg: "bg-yellow-50" },
  { id: "post", label: "Post", icon: FaPen, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "comment", label: "Comment", icon: FaComment, color: "text-pink-500", bg: "bg-pink-50" },
  { id: "articles", label: "Articles", icon: FaFileAlt, color: "text-gray-600", bg: "bg-gray-50" },
  { id: "reddit", label: "Reddit", icon: FaReddit, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "quora", label: "Quora", icon: SiQuora, color: "text-red-600", bg: "bg-red-50" },
  { id: "forum", label: "Forum", icon: FaUsers, color: "text-teal-600", bg: "bg-teal-50" },
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-600", bg: "bg-pink-50" },
  { id: "telegram", label: "Telegram", icon: FaTelegramPlane, color: "text-sky-500", bg: "bg-sky-50" },
  { id: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-700", bg: "bg-blue-50" },
  { id: "youtube", label: "YouTube", icon: FaYoutube, color: "text-red-600", bg: "bg-red-50" },
  { id: "twitter", label: "Twitter/X", icon: FaTwitter, color: "text-sky-600", bg: "bg-sky-50" },
];

const LISTEN_PLATFORMS = PLATFORMS.filter((p) =>
  ["instagram", "youtube", "twitter", "facebook", "reddit", "news", "blog"].includes(p.id)
);

const TONES = ["Professional", "Casual", "Viral", "Informative", "Bold", "Emotional"];

const VOLUME_PRESETS = [5, 10, 25, 50, 100];

const SOURCE_LABELS = {
  twitter: "X API",
  instagram: "Instagram Graph API",
  reddit: "Reddit API",
  newsapi: "NewsAPI",
  serpapi: "SerpAPI Google",
  "youtube-api": "YouTube Data API",
  "serpapi-youtube": "SerpAPI YouTube",
  "serpapi-news": "SerpAPI News",
  "serpapi-instagram-profile": "Instagram Profile (SerpAPI)",
  "serpapi-trends": "SerpAPI Trends",
  "newsapi-headlines": "NewsAPI Headlines",
  "google-rss": "Google Trends RSS",
  "real-data+groq": "Live data + AI",
  "serpapi+ai": "SerpAPI + AI",
};

const authHeaders = (extra = {}) => {
  const token = getToken();
  if (!token) throw new Error("Authentication required. Please log in again.");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
  };
};

const friendlyFetchError = (err) => {
  const msg = err?.message || "";
  if (msg === "Failed to fetch" || msg === "Network Error" || err?.name === "TypeError") {
    return "Cannot reach API server. Ensure backend is running and production build uses https://app.yovoai.com (not localhost).";
  }
  return msg || "Request failed";
};

const parseResponse = async (res) => {
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "Invalid server response" };
  }
  if (!res.ok || data.success === false) {
    const detail = data.details?.length ? ` (${Array.isArray(data.details) ? data.details.join("; ") : data.details})` : "";
    throw new Error((data.error || data.message || `Request failed (${res.status})`) + detail);
  }
  return data;
};

const apiGetSafe = async (path) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
    return parseResponse(res);
  } catch (err) {
    throw new Error(friendlyFetchError(err));
  }
};

const apiGet = apiGetSafe;

const apiPost = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseResponse(res);
};

const getPlatformMeta = (id) => PLATFORMS.find((p) => p.id === id) || null;

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    ready: "bg-green-100 text-green-800 border-green-200",
    published: "bg-blue-100 text-blue-800 border-blue-200",
    scheduled: "bg-purple-100 text-purple-800 border-purple-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };
  const icons = {
    pending: <FaClock className="inline mr-1" />,
    ready: <FaCheckCircle className="inline mr-1" />,
    published: <FaBroadcastTower className="inline mr-1" />,
    scheduled: <FaCalendarAlt className="inline mr-1" />,
    failed: <FaTimesCircle className="inline mr-1" />,
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {icons[status]}
      {status}
    </span>
  );
};

export default function SocialSensing() {
  const [activeTab, setActiveTab] = useState("mention");

  const [brand, setBrand] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState("Professional");
  const [dailyVolume, setDailyVolume] = useState(10);
  const [customVolume, setCustomVolume] = useState("");
  const [duration, setDuration] = useState(1);
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateSuccess, setGenerateSuccess] = useState("");
  const [jobId, setJobId] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [mentionStats, setMentionStats] = useState({ total: 0, ready: 0, failed: 0, pending: 0 });
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [localEdits, setLocalEdits] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [publishingId, setPublishingId] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState({});
  const [publishError, setPublishError] = useState({});
  const [exportingFormat, setExportingFormat] = useState(null);
  const [exportError, setExportError] = useState("");

  const [listenKeyword, setListenKeyword] = useState("");
  const [listenPlatform, setListenPlatform] = useState("instagram");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchSuccess, setSearchSuccess] = useState(false);
  const [searchSource, setSearchSource] = useState("");
  const [searchWarnings, setSearchWarnings] = useState([]);

  const [sentimentKeyword, setSentimentKeyword] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState("");
  const [sentimentSuccess, setSentimentSuccess] = useState(false);
  const [sentimentSource, setSentimentSource] = useState("");

  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [trendsSource, setTrendsSource] = useState("");

  const [singleBrand, setSingleBrand] = useState("");
  const [singleKeyword, setSingleKeyword] = useState("");
  const [singlePlatform, setSinglePlatform] = useState("instagram");
  const [singleContentType, setSingleContentType] = useState("Post");
  const [singleTone, setSingleTone] = useState("Professional");
  const [singleContent, setSingleContent] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState(false);
  const [singleCopied, setSingleCopied] = useState(false);

  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const getMentionText = useCallback(
    (m) => localEdits[m._id] ?? m.generatedText ?? "",
    [localEdits]
  );

  const effectiveVolume = useCallback(() => {
    if (customVolume.trim()) {
      const n = Number(customVolume);
      if (!Number.isFinite(n) || n < 1) return null;
      return Math.min(Math.floor(n), 500);
    }
    return Math.min(Math.max(Number(dailyVolume) || 1, 1), 500);
  }, [customVolume, dailyVolume]);

  const totalPlanned = useCallback(() => {
    const vol = effectiveVolume();
    if (!vol) return 0;
    return Math.min(vol * Math.max(Number(duration) || 1, 1), 500);
  }, [effectiveVolume, duration]);

  const toggleContentType = (type) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchMentions = useCallback(async (jid) => {
    const data = await apiGet(`/api/social-sensing/mentions?jobId=${encodeURIComponent(jid)}`);
    setMentions(data.mentions || []);
    setMentionStats(data.stats || { total: 0, ready: 0, failed: 0, pending: 0 });
    return data.stats;
  }, []);

  const startPolling = useCallback(
    (jid) => {
      stopPolling();
      setPolling(true);
      const poll = async () => {
        try {
          const stats = await fetchMentions(jid);
          if (stats && stats.pending === 0) {
            stopPolling();
            setGenerateSuccess(`All ${stats.total} mentions processed (${stats.ready} ready, ${stats.failed} failed).`);
          }
        } catch {
          /* keep polling until user stops or job completes */
        }
      };
      poll();
      pollRef.current = setInterval(poll, 2500);
    },
    [fetchMentions, stopPolling]
  );

  const handleBulkGenerate = async () => {
    setGenerateError("");
    setGenerateSuccess("");
    if (!brand.trim()) {
      setGenerateError("Brand name is required.");
      return;
    }
    if (!keyword.trim()) {
      setGenerateError("Keyword is required.");
      return;
    }
    if (!selectedContentTypes.length) {
      setGenerateError("Select at least one content type.");
      return;
    }
    if (!selectedPlatforms.length) {
      setGenerateError("Select at least one platform.");
      return;
    }
    const vol = effectiveVolume();
    if (!vol) {
      setGenerateError("Enter a valid daily volume (1â€“500).");
      return;
    }

    setGenerating(true);
    setJobId(null);
    setMentions([]);
    setMentionStats({ total: 0, ready: 0, failed: 0, pending: 0 });
    setLocalEdits({});
    setExpandedIds(new Set());
    stopPolling();

    try {
      const data = await apiPost("/api/social-sensing/generate-mentions", {
        brand: brand.trim(),
        keyword: keyword.trim(),
        tone,
        contentTypes: selectedContentTypes,
        platforms: selectedPlatforms,
        dailyVolume: vol,
        duration: Math.max(Number(duration) || 1, 1),
      });
      setJobId(data.jobId);
      setGenerateSuccess(data.message || `Job started: ${data.jobId}`);
      startPolling(data.jobId);
    } catch (e) {
      setGenerateError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (mentionId, scheduled = false) => {
    setPublishError((prev) => ({ ...prev, [mentionId]: "" }));
    if (scheduled && !scheduleDate) {
      setPublishError((prev) => ({ ...prev, [mentionId]: "Select date and time." }));
      return;
    }
    setPublishingId(mentionId);
    try {
      const body = { mentionId };
      if (scheduled) body.scheduledAt = new Date(scheduleDate).toISOString();
      await apiPost("/api/social-sensing/publish", body);
      setPublishSuccess((prev) => ({ ...prev, [mentionId]: true }));
      setTimeout(() => {
        setPublishSuccess((prev) => {
          const next = { ...prev };
          delete next[mentionId];
          return next;
        });
      }, 3000);
      setSchedulingId(null);
      setScheduleDate("");
      if (jobId) await fetchMentions(jobId);
    } catch (e) {
      setPublishError((prev) => ({ ...prev, [mentionId]: e.message }));
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyMention = async (m) => {
    const text = getMentionText(m);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(m._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setPublishError((prev) => ({ ...prev, [m._id]: "Copy failed." }));
    }
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setEditText(getMentionText(m));
  };

  const saveEdit = (id) => {
    setLocalEdits((prev) => ({ ...prev, [id]: editText }));
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleExport = async (format) => {
    if (!jobId) return;
    setExportError("");
    setExportingFormat(format);
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required. Please log in again.");
      const res = await fetch(
        `${API_BASE_URL}/api/social-sensing/export?jobId=${encodeURIComponent(jobId)}&format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yovoai-mentions-${jobId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleSearch = async () => {
    if (!listenKeyword.trim()) {
      setSearchError("Enter a keyword to analyze.");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    setSearchSuccess(false);
    setSearchResults(null);
    setSearchSource("");
    setSearchWarnings([]);
    try {
      const data = await apiGet(
        `/api/social-sensing/search?keyword=${encodeURIComponent(listenKeyword.trim())}&platform=${encodeURIComponent(listenPlatform)}`
      );
      if (!data.results?.topPosts?.length) {
        throw new Error("No results returned from live data sources.");
      }
      setSearchResults(data.results);
      setSearchSource(data.source || "");
      setSearchWarnings(data.warnings || []);
      setSearchSuccess(true);
    } catch (e) {
      setSearchError(e.message);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSentiment = async () => {
    if (!sentimentKeyword.trim()) {
      setSentimentError("Enter a keyword for sentiment analysis.");
      return;
    }
    setSentimentLoading(true);
    setSentimentError("");
    setSentimentSuccess(false);
    setSentiment(null);
    setSentimentSource("");
    try {
      const data = await apiGet(
        `/api/social-sensing/sentiment?keyword=${encodeURIComponent(sentimentKeyword.trim())}`
      );
      if (!data.sentiment) throw new Error("No sentiment data returned.");
      setSentiment(data.sentiment);
      setSentimentSource(data.source || "");
      setSentimentSuccess(true);
    } catch (e) {
      setSentimentError(e.message);
      setSentiment(null);
    } finally {
      setSentimentLoading(false);
    }
  };

  const loadTrends = useCallback(async () => {
    setTrendsLoading(true);
    setTrendsError("");
    setTrends([]);
    setTrendsSource("");
    try {
      const data = await apiGet("/api/social-sensing/trends?geo=IN");
      const list = data.trends || [];
      if (!list.length) throw new Error("No trending topics returned from live sources.");
      setTrends(list);
      setTrendsSource(data.source || "");
    } catch (e) {
      setTrendsError(e.message);
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "listening") loadTrends();
  }, [activeTab, loadTrends]);

  const handleSingleGenerate = async () => {
    if (!singleBrand.trim()) {
      setSingleError("Brand is required.");
      return;
    }
    if (!singleKeyword.trim()) {
      setSingleError("Keyword is required.");
      return;
    }
    setSingleLoading(true);
    setSingleError("");
    setSingleSuccess(false);
    setSingleContent("");
    setSingleCopied(false);
    try {
      const data = await apiPost("/api/social-sensing/generate", {
        brand: singleBrand.trim(),
        keyword: singleKeyword.trim(),
        contentType: singleContentType,
        platform: singlePlatform,
        tone: singleTone,
      });
      setSingleContent(data.content);
      setSingleSuccess(true);
    } catch (e) {
      setSingleError(e.message);
    } finally {
      setSingleLoading(false);
    }
  };

  const handleSingleCopy = async () => {
    if (!singleContent) return;
    try {
      await navigator.clipboard.writeText(singleContent);
      setSingleCopied(true);
      setTimeout(() => setSingleCopied(false), 2000);
    } catch {
      setSingleError("Copy to clipboard failed.");
    }
  };

  const progressPct =
    mentionStats.total > 0
      ? Math.round(((mentionStats.ready + mentionStats.failed) / mentionStats.total) * 100)
      : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center shadow shrink-0">
          <MdSensors className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Sensing</h2>
          <p className="text-sm text-gray-500">Trends, sentiment, keyword analysis & bulk social mentions</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("mention")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            activeTab === "mention"
              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50"
          }`}
        >
          <FaBullhorn />
          Social Mention Campaign
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("listening")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            activeTab === "listening"
              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50"
          }`}
        >
          <FaSearch />
          Social Listening
        </button>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MENTION TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "mention" && (
        <div className="space-y-4">
          {/* Campaign config */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaRocket className="text-orange-500" />
              <h3 className="font-bold text-gray-900">Campaign Configuration</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Brand *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="YovoAI"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Keyword *</label>
                <div className="relative">
                  <FaHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="AI marketing"
                    className="w-full pl-8 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Daily Volume</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {VOLUME_PRESETS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setDailyVolume(v); setCustomVolume(""); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        dailyVolume === v && !customVolume
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-orange-50"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={dailyVolume}
                  onChange={(e) => { setDailyVolume(e.target.value); setCustomVolume(""); }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Custom Volume</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={customVolume}
                  onChange={(e) => setCustomVolume(e.target.value)}
                  placeholder="Override daily volume"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div className="flex items-end">
                <div className="w-full bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-gray-500">Total mentions</p>
                  <p className="text-lg font-bold text-orange-600">{totalPlanned()}</p>
                </div>
              </div>
            </div>

            {/* Content types */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Types *</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedContentTypes([...CONTENT_TYPES])}
                    className="text-xs text-orange-500 font-semibold hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedContentTypes([])}
                    className="text-xs text-gray-400 font-semibold hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((type) => {
                  const on = selectedContentTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleContentType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        on
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platforms */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platforms *</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms(PLATFORMS.map((p) => p.id))}
                    className="text-xs text-orange-500 font-semibold hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms([])}
                    className="text-xs text-gray-400 font-semibold hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const on = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        on
                          ? "bg-orange-500 text-white border-orange-500"
                          : `bg-white border-gray-200 text-gray-600 hover:${p.bg}`
                      }`}
                    >
                      <Icon className={on ? "text-white" : p.color} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {generateError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl mb-3 flex items-center gap-2">
                <FaTimesCircle /> {generateError}
              </p>
            )}
            {generateSuccess && !generateError && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl mb-3 flex items-center gap-2">
                <FaCheckCircle /> {generateSuccess}
              </p>
            )}

            <button
              type="button"
              onClick={handleBulkGenerate}
              disabled={generating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
            >
              {generating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Launching Campaign...
                </>
              ) : (
                <>
                  <FaRocket />
                  Generate {totalPlanned()} Mentions
                </>
              )}
            </button>
          </div>

          {/* Job progress */}
          {jobId && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Job ID: <span className="font-mono text-orange-600">{jobId}</span>
                    {polling && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                        <FaSpinner className="animate-spin" /> Live
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {mentionStats.ready} ready &middot; {mentionStats.pending} pending &middot; {mentionStats.failed} failed &middot; {mentionStats.total} total
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {polling && (
                    <button
                      type="button"
                      onClick={stopPolling}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <FaStop /> Stop Polling
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchMentions(jobId)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("csv")}
                    disabled={exportingFormat === "csv" || mentionStats.ready === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {exportingFormat === "csv" ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("json")}
                    disabled={exportingFormat === "json" || mentionStats.ready === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {exportingFormat === "json" ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                    JSON
                  </button>
                </div>
              </div>
              {exportError && (
                <p className="text-xs text-red-600 mb-2">{exportError}</p>
              )}
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{progressPct}% complete</p>
            </div>
          )}

          {/* Mentions list */}
          {mentions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <FaLayerGroup className="text-orange-500" />
                <h3 className="font-bold text-gray-900">Generated Mentions ({mentions.length})</h3>
              </div>
              <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
                {mentions.map((m) => {
                  const pm = getPlatformMeta(m.platform);
                  const Icon = pm?.icon || FaPen;
                  const text = getMentionText(m);
                  const expanded = expandedIds.has(m._id);
                  const isEditing = editingId === m._id;

                  return (
                    <div key={m._id} className="border border-gray-100 rounded-xl p-3 hover:border-orange-200 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`flex items-center gap-1 text-xs font-semibold ${pm?.color || "text-gray-600"}`}>
                          <Icon /> {pm?.label || m.platform}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{m.contentType}</span>
                        <StatusBadge status={m.status} />
                      </div>

                      {m.status === "pending" && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mb-2">
                          <FaSpinner className="animate-spin" /> Generating content...
                        </p>
                      )}

                      {m.status === "failed" && (
                        <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                          <FaTimesCircle /> {m.errorMsg || "Generation failed"}
                        </p>
                      )}

                      {text && !isEditing && (
                        <p className={`text-sm text-gray-700 leading-relaxed mb-2 ${expanded ? "" : "line-clamp-3"}`}>
                          {text}
                        </p>
                      )}

                      {isEditing && (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={5}
                          className="w-full border border-orange-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-400 outline-none mb-2"
                        />
                      )}

                      {text && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(m._id)}
                          className="text-xs text-orange-500 font-semibold hover:underline mb-2"
                        >
                          {expanded ? "Show less" : "Show more"}
                        </button>
                      )}

                      {publishError[m._id] && (
                        <p className="text-xs text-red-600 mb-2">{publishError[m._id]}</p>
                      )}
                      {publishSuccess[m._id] && (
                        <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                          <FaCheckCircle /> Saved successfully
                        </p>
                      )}

                      {(m.status === "ready" || m.status === "scheduled") && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(m._id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                              >
                                <FaCheck /> Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyMention(m)}
                                disabled={!text}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                              >
                                {copiedId === m._id ? (
                                  <><FaCheck className="text-green-500" /> Copied</>
                                ) : (
                                  <><FaCopy /> Copy</>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(m)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <FaEdit /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePublish(m._id, false)}
                                disabled={publishingId === m._id}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                              >
                                {publishingId === m._id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaBroadcastTower />
                                )}
                                Publish
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSchedulingId(schedulingId === m._id ? null : m._id);
                                  setScheduleDate("");
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
                              >
                                <FaCalendarAlt /> Schedule
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {schedulingId === m._id && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-2 border-t border-gray-100">
                          <input
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handlePublish(m._id, true)}
                            disabled={publishingId === m._id}
                            className="flex items-center justify-center gap-1 px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            {publishingId === m._id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaCheck />
                            )}
                            Confirm Schedule
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {jobId && mentions.length === 0 && !generating && (
            <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-2xl border border-gray-200">
              Waiting for mentions to load...
            </p>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LISTENING TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === "listening" && (
        <div className="space-y-4">
          {/* Keyword search */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaSearch className="text-orange-500" />
              <h3 className="font-bold text-gray-900">Keyword Analysis</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {LISTEN_PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setListenPlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      listenPlatform === p.id
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    <Icon className={listenPlatform === p.id ? "text-white" : p.color} />
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <FaHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={listenKeyword}
                  onChange={(e) => setListenKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={
                    listenPlatform === "instagram"
                      ? "Brand (Aitota) or @username (aitotateam)"
                      : "Enter keyword or hashtag"
                  }
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading || !listenKeyword.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {searchLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                {searchLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            {listenPlatform === "instagram" && (
              <p className="text-xs text-gray-500 mt-1">
                Brand search auto-detects the official @handle and follower count (e.g. Aitota → @aitotateam).
              </p>
            )}

            {searchError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-2">
                <FaTimesCircle /> {searchError}
              </p>
            )}
            {searchSuccess && searchResults && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 flex-wrap">
                  <FaCheckCircle />
                  Analysis complete
                  {searchSource && (
                    <span className="ml-auto text-xs font-semibold bg-white px-2 py-0.5 rounded-full border border-green-200 text-green-800">
                      Source: {SOURCE_LABELS[searchSource] || searchSource}
                    </span>
                  )}
                </p>
                {searchWarnings.length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                    {searchWarnings.join(" · ")}
                  </p>
                )}
              </div>
            )}

            {searchResults && (
              <div className="mt-4 space-y-3">
                <div className={`grid grid-cols-1 gap-3 ${searchResults.totalFollowers ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-500">{searchResults.totalPostsLabel || "Results analyzed"}</p>
                    <p className="text-xl font-bold text-orange-600">{searchResults.totalPosts}</p>
                    {searchResults.estimatedTotal && searchResults.estimatedTotal !== searchResults.totalPosts && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Est. index: {searchResults.estimatedTotal}</p>
                    )}
                  </div>
                  {searchResults.totalFollowers && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500">Followers</p>
                      <p className="text-xl font-bold text-violet-700">{searchResults.totalFollowers}</p>
                      {searchResults.profileUsername && (
                        <p className="text-[10px] text-gray-400 mt-0.5">@{searchResults.profileUsername}</p>
                      )}
                    </div>
                  )}
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-500">
                      {["youtube"].includes(listenPlatform) ? "Avg Engagement" :
                       ["reddit", "twitter", "instagram"].includes(listenPlatform) ? "Avg Engagement" :
                       "Relevance Score"}
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {searchResults.avgEngagement !== "N/A" ? searchResults.avgEngagement : "—"}
                    </p>
                  </div>
                </div>
                {searchResults.metricsNote && (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    {searchResults.metricsNote}
                  </p>
                )}
                <div className="space-y-2">
                  {searchResults.topPosts?.map((post, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                      {post.thumbnail && (
                        <img src={post.thumbnail} alt={post.title} className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {post.url ? (
                          <a href={post.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 hover:underline line-clamp-2">{post.title}</a>
                        ) : (
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2">{post.title}</p>
                        )}
                        {post.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap mt-1">
                          {post.source && <span className="font-semibold text-orange-500">{post.source}</span>}
                          {post.publishedAt && <span>{post.publishedAt}</span>}
                          {post.views !== 'N/A' && post.views && <span className="flex items-center gap-1"><FaEye className="text-purple-400" />{post.views}</span>}
                          {post.likes !== 'N/A' && post.likes && <span className="flex items-center gap-1"><FaHeart className="text-pink-400" />{post.likes}</span>}
                          {post.comments !== 'N/A' && post.comments && <span className="flex items-center gap-1"><FaRegCommentDots className="text-blue-400" />{post.comments}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sentiment */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaChartLine className="text-blue-500" />
              <h3 className="font-bold text-gray-900">Sentiment Analysis</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={sentimentKeyword}
                onChange={(e) => setSentimentKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSentiment()}
                placeholder="Keyword for sentiment"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
              <button
                type="button"
                onClick={handleSentiment}
                disabled={sentimentLoading || !sentimentKeyword.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {sentimentLoading ? <FaSpinner className="animate-spin" /> : <FaChartLine />}
                {sentimentLoading ? "Analyzing..." : "Analyze Sentiment"}
              </button>
            </div>
            {sentimentError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-2">
                <FaTimesCircle /> {sentimentError}
              </p>
            )}
            {sentimentSuccess && sentiment && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl mb-3 flex items-center gap-2 flex-wrap">
                <FaCheckCircle /> Sentiment loaded
                {sentimentSource && (
                  <span className="ml-auto text-xs font-semibold bg-white px-2 py-0.5 rounded-full border border-green-200 text-green-800">
                    Source: {SOURCE_LABELS[sentimentSource] || sentimentSource}
                  </span>
                )}
              </p>
            )}
            {sentiment && (
              <div className="space-y-3 mt-3">
                {[
                  { label: "Positive", value: sentiment.positive, bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
                  { label: "Neutral", value: sentiment.neutral, bar: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50" },
                  { label: "Negative", value: sentiment.negative, bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
                      <span className={`text-sm font-bold ${s.text}`}>{s.value}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div className={`h-2 rounded-full ${s.bar}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
                {sentiment.summary && (
                  <p className="text-xs text-gray-500 text-center italic border-t border-gray-100 pt-3">{sentiment.summary}</p>
                )}
              </div>
            )}
          </div>

          {/* Trends */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaFire className="text-orange-500" />
                <h3 className="font-bold text-gray-900">Trending Topics (India)</h3>
                {trendsSource && (
                  <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
                    {SOURCE_LABELS[trendsSource] || trendsSource}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={loadTrends}
                disabled={trendsLoading}
                className="text-xs text-orange-500 font-semibold hover:underline disabled:opacity-50"
              >
                {trendsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            {trendsLoading && (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                <FaSpinner className="animate-spin" />
                Loading trends...
              </div>
            )}
            {trendsError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-2">
                <FaTimesCircle /> {trendsError}
              </p>
            )}
            {!trendsLoading && !trendsError && trends.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No trends available</p>
            )}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trends.map((t, i) => {
                const pm = getPlatformMeta(t.platform);
                const Icon = pm?.icon || FaFire;
                return (
                  <div key={`${t.tag}-${i}`} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-gray-400 w-5 shrink-0">{i + 1}</span>
                      <Icon className={`shrink-0 ${pm?.color || "text-orange-500"}`} />
                      {t.url ? (
                        <a href={t.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 hover:underline truncate">{t.tag}</a>
                      ) : (
                        <span className="text-sm font-semibold text-gray-800 truncate">{t.tag}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">{t.traffic}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Single content generator */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaPen className="text-orange-500" />
              <h3 className="font-bold text-gray-900">Quick Content Generator</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Brand *</label>
                <input
                  type="text"
                  value={singleBrand}
                  onChange={(e) => setSingleBrand(e.target.value)}
                  placeholder="Brand name"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Keyword *</label>
                <input
                  type="text"
                  value={singleKeyword}
                  onChange={(e) => setSingleKeyword(e.target.value)}
                  placeholder="Target keyword"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Platform</label>
                <select
                  value={singlePlatform}
                  onChange={(e) => setSinglePlatform(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Content Type</label>
                <select
                  value={singleContentType}
                  onChange={(e) => setSingleContentType(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tone</label>
                <select
                  value={singleTone}
                  onChange={(e) => setSingleTone(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSingleGenerate}
                  disabled={singleLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
                >
                  {singleLoading ? (
                    <><FaSpinner className="animate-spin" /> Generating...</>
                  ) : (
                    <><FaRocket /> Generate</>
                  )}
                </button>
              </div>
            </div>

            {singleError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl mb-3 flex items-center gap-2">
                <FaTimesCircle /> {singleError}
              </p>
            )}
            {singleSuccess && singleContent && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl mb-3 flex items-center gap-2">
                <FaCheckCircle /> Content ready to post
              </p>
            )}

            {singleContent && (
              <div className="relative bg-orange-50 border border-orange-200 rounded-xl p-4">
                <button
                  type="button"
                  onClick={handleSingleCopy}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
                  title="Copy"
                >
                  {singleCopied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed pr-8">{singleContent}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

