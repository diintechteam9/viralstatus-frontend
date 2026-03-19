import React, { useState } from "react";
import { FaBolt, FaSpinner, FaCopy, FaCheck } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

import { saveToHistory } from "./contentHistory";

const PLATFORMS = ["Instagram", "YouTube", "LinkedIn", "Twitter/X", "TikTok", "Facebook"];
const TONES = ["Witty", "Inspirational", "Professional", "Casual", "Bold", "Emotional"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];

export default function CaptionHookGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Witty");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/caption/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, tone, language }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate");
      setResult(data);
      const captionText = [
        data.hooks?.length ? `⚡ HOOKS:\n${data.hooks.join("\n")}` : "",
        data.captions?.length ? `\n\n✍️ CAPTIONS:\n${data.captions.join("\n\n")}` : "",
        data.hashtags?.length ? `\n\n# HASHTAGS:\n${data.hashtags.join(" ")}` : "",
      ].join("");
      saveToHistory("CaptionHookGenerator", topic, captionText, { platform, tone, language });
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

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-yellow-50 flex items-center justify-center">
          <FaBolt className="text-yellow-500 text-xl" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Caption & Hook Generator</h1>
          <p className="text-sm text-gray-500">Generate scroll-stopping captions and hooks for your content</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Topic / Post Idea *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Launching my new skincare product, Monday motivation post..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300">
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300">
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><FaSpinner className="animate-spin" /> Generating...</> : "Generate Captions & Hooks"}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          {result.hooks && result.hooks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-3">⚡ Hooks</p>
              <div className="space-y-2">
                {result.hooks.map((hook, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{hook}</p>
                    <button onClick={() => handleCopy(hook, `hook-${i}`)} className="shrink-0 text-gray-400 hover:text-gray-700 transition mt-0.5">
                      {copied === `hook-${i}` ? <FaCheck className="text-green-500" size={12} /> : <FaCopy size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.captions && result.captions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">✍️ Captions</p>
              <div className="space-y-3">
                {result.captions.map((caption, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{caption}</p>
                    <button onClick={() => handleCopy(caption, `cap-${i}`)} className="shrink-0 text-gray-400 hover:text-gray-700 transition mt-0.5">
                      {copied === `cap-${i}` ? <FaCheck className="text-green-500" size={12} /> : <FaCopy size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.hashtags && result.hashtags.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider"># Hashtags</p>
                <button onClick={() => handleCopy(result.hashtags.join(" "), "hashtags")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "hashtags" ? <><FaCheck className="text-green-500" size={10} /> Copied</> : <><FaCopy size={10} /> Copy All</>}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
