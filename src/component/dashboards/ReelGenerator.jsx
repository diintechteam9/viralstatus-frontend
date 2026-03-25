import React, { useState } from "react";
import { FaFilm, FaSpinner, FaCopy, FaCheck, FaRedo } from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import { saveToHistory } from "./contentHistory";
import YouTubePublish from "./YouTubePublish";
import InstagramPublish from "./InstagramPublish";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const STYLES = ["Motivational", "Educational", "Entertaining", "Promotional", "Storytelling", "Comedy", "Inspirational"];
const DURATIONS = ["15 sec", "30 sec", "60 sec", "90 sec"];
const PLATFORMS = ["Instagram Reels", "YouTube Shorts", "TikTok", "Facebook Reels"];

export default function ReelGenerator() {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [style, setStyle] = useState("Motivational");
  const [duration, setDuration] = useState("30 sec");
  const [platform, setPlatform] = useState("Instagram Reels");
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
      const res = await fetch(`${API_BASE_URL}/api/reel/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language, style, duration, platform }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate");
      setResult(data);
      const fullText = `🪝 HOOK:\n${data.hook}\n\n📝 SCRIPT:\n${data.script}\n\n📢 CTA:\n${data.cta}${data.visualNotes ? `\n\n🎥 VISUAL NOTES:\n${data.visualNotes}` : ""}${data.hashtags ? `\n\n#️⃣ HASHTAGS:\n${data.hashtags}` : ""}`;
      saveToHistory("ReelGenerator", topic, fullText, { platform, style, duration, language });
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
    if (!result) return;
    const full = `🎬 REEL SCRIPT — ${topic}\nPlatform: ${platform} | Style: ${style} | Duration: ${duration}\n\n🪝 HOOK:\n${result.hook}\n\n📝 SCRIPT:\n${result.script}\n\n📢 CALL TO ACTION:\n${result.cta}${result.visualNotes ? `\n\n🎥 VISUAL NOTES:\n${result.visualNotes}` : ""}${result.hashtags ? `\n\n#️⃣ HASHTAGS:\n${result.hashtags}` : ""}`;
    await navigator.clipboard.writeText(full);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-md">
          <FaFilm className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reel Script Generator</h1>
          <p className="text-sm text-gray-500">AI-powered scripts for viral short-form videos</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Topic */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Topic / Idea <span className="text-rose-500">*</span></label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. 5 morning habits that changed my life, How to save money in 2024..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition"
          />
        </div>

        {/* Platform + Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition">
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Content Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition">
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Duration + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${duration === d ? "border-rose-400 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button onClick={handleGenerate} disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Script...</> : <><FaFilm /> Generate Reel Script</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Result Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Generated Script</h2>
              <p className="text-xs text-gray-500">{platform} · {style} · {duration} · {language}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Regenerate
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
          </div>

          {/* Hook */}
          {result.hook && (
            <div className="bg-white rounded-2xl border-2 border-rose-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-sm">🪝</span>
                  <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Opening Hook</span>
                </div>
                <button onClick={() => handleCopy(result.hook, "hook")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "hook" ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                </button>
              </div>
              <p className="text-base font-semibold text-gray-900 leading-relaxed">"{result.hook}"</p>
              <p className="text-xs text-gray-400 mt-2">First 3 seconds — must stop the scroll</p>
            </div>
          )}

          {/* Script */}
          {result.script && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm">📝</span>
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Full Script</span>
                </div>
                <button onClick={() => handleCopy(result.script, "script")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "script" ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                </button>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result.script}</p>
            </div>
          )}

          {/* CTA */}
          {result.cta && (
            <div className="bg-white rounded-2xl border-2 border-orange-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-sm">📢</span>
                  <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">Call to Action</span>
                </div>
                <button onClick={() => handleCopy(result.cta, "cta")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "cta" ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-800">{result.cta}</p>
            </div>
          )}

          {/* Visual Notes */}
          {result.visualNotes && (
            <div className="bg-white rounded-2xl border-2 border-blue-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-sm">🎥</span>
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Visual / Editing Notes</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.visualNotes}</p>
            </div>
          )}

          {/* Hashtags */}
          {result.hashtags && (
            <div className="bg-white rounded-2xl border-2 border-purple-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-sm">#️⃣</span>
                  <span className="text-sm font-bold text-purple-600 uppercase tracking-wider">Hashtags</span>
                </div>
                <button onClick={() => handleCopy(result.hashtags, "hashtags")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "hashtags" ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                </button>
              </div>
              <p className="text-sm text-purple-700 leading-relaxed">{result.hashtags}</p>
            </div>
          )}

          {/* Publish Buttons */}
          <div className="flex flex-wrap gap-3">
            <YouTubePublish
              defaultTitle={topic}
              defaultDescription={`${result.hook || ''}\n\n${result.script || ''}\n\n${result.hashtags || ''}`}
            />
            <InstagramPublish
              defaultCaption={`${result.hook || ''}\n\n${result.hashtags || ''}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
