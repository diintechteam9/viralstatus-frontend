import React, { useState } from "react";
import { FaLayerGroup, FaSpinner, FaCopy, FaCheck, FaChevronLeft, FaChevronRight, FaRedo, FaDownload } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

import { saveToHistory } from "./contentHistory";
import YouTubePublish from "./YouTubePublish";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const SLIDE_COUNTS = [5, 7, 10];
const STYLES = ["Educational", "Motivational", "Tips & Tricks", "Storytelling", "Product Showcase", "How-To Guide", "Listicle", "Case Study"];
const PLATFORMS = ["Instagram", "LinkedIn", "Facebook", "Pinterest"];

export default function CarouselGenerator() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("Educational");
  const [slideCount, setSlideCount] = useState(7);
  const [language, setLanguage] = useState("English");
  const [platform, setPlatform] = useState("Instagram");
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [viewMode, setViewMode] = useState("preview"); // preview | list

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSlides([]);
    setActiveSlide(0);
    try {
      const res = await fetch(`${API_BASE_URL}/api/carousel/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, style, slideCount, language, platform }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate");
      setSlides(data.slides || []);
      const slideText = (data.slides || []).map((s, i) =>
        `Slide ${i+1}${s.tag ? ` [${s.tag}]` : ""}:\n${s.heading}\n\n${s.body}${s.cta ? `\nCTA: ${s.cta}` : ""}`
      ).join("\n\n---\n\n");
      saveToHistory("CarouselGenerator", topic, slideText, { platform, style, language, count: `${data.slides?.length || slideCount} slides` });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = async () => {
    const text = slides.map((s, i) =>
      `--- Slide ${i + 1}${s.tag ? ` [${s.tag}]` : ""} ---\n${s.heading}\n\n${s.body}${s.cta ? `\n\nCTA: ${s.cta}` : ""}`
    ).join("\n\n");
    await handleCopy(text, "all");
  };

  const bgGradients = [
    "from-indigo-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-orange-500 to-amber-600",
    "from-teal-500 to-emerald-600",
    "from-blue-500 to-cyan-600",
    "from-violet-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-red-500 to-rose-600",
    "from-yellow-500 to-orange-600",
    "from-pink-500 to-rose-600",
  ];

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <FaLayerGroup className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carousel Generator</h1>
          <p className="text-sm text-gray-500">Create scroll-stopping multi-slide carousel content for social media</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Topic / Subject <span className="text-rose-500">*</span></label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. 7 habits of highly successful people, How to grow on Instagram in 2024..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition">
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Content Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition">
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Number of Slides</label>
            <div className="flex gap-2">
              {SLIDE_COUNTS.map((c) => (
                <button key={c} onClick={() => setSlideCount(c)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition ${slideCount === c ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Slides...</> : <><FaLayerGroup /> Generate {slideCount} Slides</>}
        </button>
      </div>

      {/* Results */}
      {slides.length > 0 && (
        <div className="mt-6">
          {/* Result Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{slides.length} Slides Ready</h2>
              <p className="text-xs text-gray-500">{platform} · {style} · {language}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode(viewMode === "preview" ? "list" : "preview")}
                className="px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                {viewMode === "preview" ? "List View" : "Preview"}
              </button>
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Redo
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
          </div>

          {viewMode === "preview" ? (
            <>
              {/* Slide Preview Card */}
              <div className={`bg-gradient-to-br ${bgGradients[activeSlide % bgGradients.length]} rounded-2xl p-8 text-white text-center min-h-56 flex flex-col items-center justify-center relative shadow-lg`}>
                <span className="absolute top-4 right-4 text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">{activeSlide + 1} / {slides.length}</span>
                {slides[activeSlide]?.tag && (
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full mb-4 font-semibold tracking-wider uppercase">{slides[activeSlide].tag}</span>
                )}
                <h3 className="text-xl font-bold mb-3 leading-snug max-w-sm">{slides[activeSlide]?.heading}</h3>
                <p className="text-sm text-white/85 leading-relaxed max-w-sm">{slides[activeSlide]?.body}</p>
                {slides[activeSlide]?.cta && (
                  <div className="mt-4 bg-white/20 border border-white/30 px-4 py-2 rounded-xl text-xs font-semibold">{slides[activeSlide].cta}</div>
                )}
                <button onClick={() => handleCopy(`${slides[activeSlide]?.heading}\n\n${slides[activeSlide]?.body}`, activeSlide)}
                  className="absolute bottom-4 right-4 text-white/60 hover:text-white transition">
                  {copied === activeSlide ? <FaCheck size={14} /> : <FaCopy size={14} />}
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => setActiveSlide((p) => Math.max(0, p - 1))} disabled={activeSlide === 0}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition">
                  <FaChevronLeft size={13} />
                </button>
                <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition ${i === activeSlide ? "bg-indigo-500 scale-125" : "bg-gray-300 hover:bg-gray-400"}`} />
                  ))}
                </div>
                <button onClick={() => setActiveSlide((p) => Math.min(slides.length - 1, p + 1))} disabled={activeSlide === slides.length - 1}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition">
                  <FaChevronRight size={13} />
                </button>
              </div>
            </>
          ) : null}

          {/* Slides List */}
          <div className="mt-4 space-y-2">
            {slides.map((slide, i) => (
              <div key={i} onClick={() => { setActiveSlide(i); setViewMode("preview"); }}
                className={`cursor-pointer rounded-xl border-2 p-4 transition ${i === activeSlide ? "border-indigo-300 bg-indigo-50" : "border-gray-100 bg-white hover:border-indigo-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${bgGradients[i % bgGradients.length]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{i + 1}</span>
                    <div className="min-w-0">
                      {slide.tag && <p className="text-xs text-indigo-500 font-semibold mb-0.5 uppercase tracking-wider">{slide.tag}</p>}
                      <p className="text-sm font-semibold text-gray-800 truncate">{slide.heading}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{slide.body}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(`${slide.heading}\n\n${slide.body}`, `slide-${i}`); }}
                    className="shrink-0 text-gray-400 hover:text-gray-700 transition p-1">
                    {copied === `slide-${i}` ? <FaCheck className="text-green-500" size={12} /> : <FaCopy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <YouTubePublish
            defaultTitle={topic}
            defaultDescription={slides.map((s, i) => `Slide ${i+1}: ${s.heading}\n${s.body}`).join('\n\n')}
          />
        </div>
      )}
    </div>
  );
}
