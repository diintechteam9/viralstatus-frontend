import React, { useState, useEffect } from "react";
import {
  FaArrowLeft, FaGlobe, FaFileAlt, FaPenNib, FaQuestionCircle,
  FaFilm, FaStar, FaLayerGroup, FaChartBar, FaMicrophone, FaFire, FaBolt,
  FaBalanceScale, FaMapMarkedAlt, FaRoute, FaRocket, FaHistory
} from "react-icons/fa";
import WebsiteTab from "./WebsiteTab";
import NewsGenerator from "./NewsGenerator";
import BlogGenerator from "./BlogGenerator";
import QnaGenerator from "./QnaGenerator";
import ReelGenerator from "./ReelGenerator";
import ReviewGenerator from "./ReviewGenerator";
import CarouselGenerator from "./CarouselGenerator";
import InfographicGenerator from "./InfographicGenerator";
import VoicePodcastGenerator from "./VoicePodcastGenerator";
import TrendIdeaGenerator from "./TrendIdeaGenerator";
import CaptionHookGenerator from "./CaptionHookGenerator";
import ProductComparator from "./ProductComparator";
import TripAdvisor from "./TripAdvisor";
import ItineraryGenerator from "./ItineraryGenerator";
import LandingPageGenerator from "./LandingPageGenerator";

const tools = [
  {
    id: "ReelGenerator",
    name: "Reel Generator",
    description: "Generate engaging reel scripts with hooks, body and CTA using AI.",
    icon: <FaFilm className="text-2xl text-rose-500" />,
    border: "border-rose-200 hover:border-rose-400",
    bg: "bg-rose-50",
  },
  {
    id: "Website",
    name: "Website",
    description: "Analyze and manage your website with OSINT tools and history tracking.",
    icon: <FaGlobe className="text-2xl text-teal-500" />,
    border: "border-teal-200 hover:border-teal-400",
    bg: "bg-teal-50",
  },
  {
    id: "NewsGenerator",
    name: "News Generator",
    description: "Generate AI-powered news articles with voice, images, and reel video.",
    icon: <FaFileAlt className="text-2xl text-orange-500" />,
    border: "border-orange-200 hover:border-orange-400",
    bg: "bg-orange-50",
  },
  {
    id: "ReviewGenerator",
    name: "Review Generator",
    description: "Generate authentic product reviews with ratings, tone and language control.",
    icon: <FaStar className="text-2xl text-yellow-500" />,
    border: "border-yellow-200 hover:border-yellow-400",
    bg: "bg-yellow-50",
  },
  {
    id: "BlogGenerator",
    name: "Blog Generator",
    description: "Create full blog posts with AI — styled, with images and live preview.",
    icon: <FaPenNib className="text-2xl text-purple-500" />,
    border: "border-purple-200 hover:border-purple-400",
    bg: "bg-purple-50",
  },
  {
    id: "CarouselGenerator",
    name: "Carousel Generator",
    description: "Create slide-by-slide carousel content for Instagram and LinkedIn.",
    icon: <FaLayerGroup className="text-2xl text-indigo-500" />,
    border: "border-indigo-200 hover:border-indigo-400",
    bg: "bg-indigo-50",
  },
  {
    id: "InfographicGenerator",
    name: "Infographic Generator",
    description: "Generate structured infographic content — stats, steps, timelines and more.",
    icon: <FaChartBar className="text-2xl text-teal-500" />,
    border: "border-teal-200 hover:border-teal-400",
    bg: "bg-teal-50",
  },
  {
    id: "VoicePodcastGenerator",
    name: "Voice / Podcast Generator",
    description: "Generate podcast scripts and voice content in multiple formats and languages.",
    icon: <FaMicrophone className="text-2xl text-pink-500" />,
    border: "border-pink-200 hover:border-pink-400",
    bg: "bg-pink-50",
  },
  {
    id: "TrendIdeaGenerator",
    name: "Trend & Idea Generator",
    description: "Discover trending content ideas, hashtags and topics for your niche.",
    icon: <FaFire className="text-2xl text-orange-500" />,
    border: "border-orange-200 hover:border-orange-400",
    bg: "bg-orange-50",
  },
  {
    id: "CaptionHookGenerator",
    name: "Caption & Hook Generator",
    description: "Generate scroll-stopping captions, hooks and hashtags for any platform.",
    icon: <FaBolt className="text-2xl text-yellow-500" />,
    border: "border-yellow-200 hover:border-yellow-400",
    bg: "bg-yellow-50",
  },
  {
    id: "QnaGenerator",
    name: "Q&A Generator",
    description: "Generate questions & answers for any topic in multiple formats and languages.",
    icon: <FaQuestionCircle className="text-2xl text-blue-500" />,
    border: "border-blue-200 hover:border-blue-400",
    bg: "bg-blue-50",
  },
  {
    id: "ProductComparator",
    name: "Product Comparator",
    description: "AI-powered side-by-side product comparison with verdict and buy recommendation.",
    icon: <FaBalanceScale className="text-2xl text-indigo-500" />,
    border: "border-indigo-200 hover:border-indigo-400",
    bg: "bg-indigo-50",
  },
  {
    id: "TripAdvisor",
    name: "Trip Advisor",
    description: "AI travel recommendations, day-by-day guides and local tips for any destination.",
    icon: <FaMapMarkedAlt className="text-2xl text-emerald-500" />,
    border: "border-emerald-200 hover:border-emerald-400",
    bg: "bg-emerald-50",
  },
  {
    id: "ItineraryGenerator",
    name: "Itinerary Generator",
    description: "Generate detailed day-by-day travel itineraries with timings, stay and budget.",
    icon: <FaRoute className="text-2xl text-violet-500" />,
    border: "border-violet-200 hover:border-violet-400",
    bg: "bg-violet-50",
  },
  {
    id: "LandingPageGenerator",
    name: "Landing Page Generator",
    description: "Generate a complete visual website preview for portfolio or e-commerce with AI.",
    icon: <FaRocket className="text-2xl text-rose-500" />,
    border: "border-rose-200 hover:border-rose-400",
    bg: "bg-rose-50",
  },
];

// ── Content History ──────────────────────────────────────────────────────────
import { saveToHistory, HISTORY_KEY } from "./contentHistory";

function ContentHistory() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch (_) { return []; }
  });
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTool, setFilterTool] = useState("All");

  const toolNames = ["All", ...Array.from(new Set(history.map((h) => h.toolName)))];

  const filtered = history.filter((h) => {
    const matchTool = filterTool === "All" || h.toolName === filterTool;
    const matchSearch = !search.trim() ||
      h.toolName.toLowerCase().includes(search.toLowerCase()) ||
      (typeof h.input === "string" && h.input.toLowerCase().includes(search.toLowerCase())) ||
      (typeof h.output === "string" && h.output.toLowerCase().includes(search.toLowerCase()));
    return matchTool && matchSearch;
  });

  const deleteEntry = (id) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    if (expanded === id) setExpanded(null);
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    setExpanded(null);
  };

  const copyText = (text) => navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
          <FaFileAlt className="text-2xl text-orange-300" />
        </div>
        <p className="text-gray-700 font-semibold mb-1">No history yet</p>
        <p className="text-sm text-gray-400">Generated content will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-orange-100 bg-white/80 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
        />
        <select
          value={filterTool}
          onChange={(e) => setFilterTool(e.target.value)}
          className="border border-orange-100 bg-white/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
        >
          {toolNames.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button
          onClick={clearAll}
          className="ml-auto text-xs px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 mb-4">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((h) => {
          const isOpen = expanded === h.id;
          const tool = tools.find((t) => t.id === h.toolName);
          return (
            <div key={h.id} className={`rounded-2xl border-2 bg-white/80 backdrop-blur transition-all ${tool?.border || "border-orange-100"}`}>
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : h.id)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tool?.bg || "bg-gray-100"}`}>
                  {tool?.icon || <FaFileAlt className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{tool?.name || h.toolName}</p>
                  <p className="text-xs text-gray-400 truncate mb-1">
                    {typeof h.input === "string" ? h.input : JSON.stringify(h.input)}
                  </p>
                  {h.meta && Object.keys(h.meta).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.values(h.meta).filter(Boolean).map((v, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-medium">{v}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">{formatDate(h.createdAt)}</span>
                <span className="text-gray-400 text-xs ml-2">{isOpen ? "▲" : "▼"}</span>
              </div>

              {/* Expanded output */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Output</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyText(h.output)}
                        className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => deleteEntry(h.id)}
                        className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto leading-relaxed">
                    {typeof h.output === "string" ? h.output : JSON.stringify(h.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ContentToolsTab = ({ prefillTool, onPrefillConsumed }) => {
  const [activeTab, setActiveTab] = useState("tools");
  const [activeTool, setActiveTool] = useState(null);
  const [prefillData, setPrefillData] = useState(null);

  useEffect(() => {
    if (prefillTool?.tool) {
      setActiveTool(prefillTool.tool);
      setPrefillData(prefillTool.prefill || null);
      onPrefillConsumed?.();
    }
  }, [prefillTool]);

  if (activeTool) {
    const toolMeta = tools.find(t => t.id === activeTool);
    return (
      <div className="flex flex-col min-h-screen overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
          <button
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            <FaArrowLeft /> Back
          </button>
          {toolMeta && (
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${toolMeta.bg}`}>{toolMeta.icon}</div>
              <span className="font-semibold text-gray-800 text-sm">{toolMeta.name}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
        {activeTool === "ReelGenerator" && <ReelGenerator prefill={prefillData} />}
        {activeTool === "Website" && <WebsiteTab />}
        {activeTool === "NewsGenerator" && <NewsGenerator prefill={prefillData} />}
        {activeTool === "ReviewGenerator" && <ReviewGenerator prefill={prefillData} />}
        {activeTool === "BlogGenerator" && <BlogGenerator prefill={prefillData} />}
        {activeTool === "CarouselGenerator" && <CarouselGenerator prefill={prefillData} />}
        {activeTool === "InfographicGenerator" && <InfographicGenerator prefill={prefillData} />}
        {activeTool === "VoicePodcastGenerator" && <VoicePodcastGenerator prefill={prefillData} />}
        {activeTool === "TrendIdeaGenerator" && <TrendIdeaGenerator prefill={prefillData} />}
        {activeTool === "CaptionHookGenerator" && <CaptionHookGenerator prefill={prefillData} />}
        {activeTool === "QnaGenerator" && <QnaGenerator prefill={prefillData} />}
        {activeTool === "ProductComparator" && <ProductComparator prefill={prefillData} />}
        {activeTool === "TripAdvisor" && <TripAdvisor prefill={prefillData} />}
        {activeTool === "ItineraryGenerator" && <ItineraryGenerator prefill={prefillData} />}
        {activeTool === "LandingPageGenerator" && <LandingPageGenerator prefill={prefillData} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 rounded-3xl p-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-0.5">Content Tools</h2>
          <p className="text-sm text-gray-400">
            {activeTab === "tools" ? `${tools.length} tools available` : "Your generated content history"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/70 backdrop-blur rounded-2xl p-1 w-fit shadow-sm border border-orange-100">
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "tools"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaBolt size={11} />
            Tools
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "history"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaHistory size={11} />
            History
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "tools" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`text-left rounded-2xl border-2 p-5 bg-white/80 backdrop-blur shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-white ${tool.border}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${tool.bg}`}>
                {tool.icon}
              </div>
              <div className="font-semibold text-gray-800 mb-1 text-sm">{tool.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{tool.description}</div>
            </button>
          ))}
        </div>
      )}

      {activeTab === "history" && <ContentHistory />}
    </div>
  );
};

export default ContentToolsTab;
