import React, { useState } from "react";
import { FaFire, FaSpinner, FaCopy, FaCheck, FaRedo, FaLightbulb } from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import { saveToHistory } from "./contentHistory";
import YouTubePublish from "./YouTubePublish";

const NICHES = ["Fashion", "Tech", "Food", "Fitness", "Business", "Travel", "Education", "Entertainment", "Beauty", "Finance", "Real Estate", "Health"];
const PLATFORMS = ["Instagram", "YouTube", "LinkedIn", "Twitter/X", "TikTok", "Facebook"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];

const FORMAT_COLORS = {
  "Reel": "bg-rose-100 text-rose-700",
  "Carousel": "bg-indigo-100 text-indigo-700",
  "Post": "bg-blue-100 text-blue-700",
  "Story": "bg-purple-100 text-purple-700",
};

export default function TrendIdeaGenerator() {
  const [niche, setNiche] = useState("Tech");
  const [platform, setPlatform] = useState("Instagram");
  const [keyword, setKeyword] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trend/generate-ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform, keyword, language }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate");
      setResult(data);
      const trendText = [
        data.trending?.length ? `🔥 TRENDING:\n${data.trending.map((t,i) => `${i+1}. ${t.topic||t}${t.reason ? " — "+t.reason : ""}`).join("\n")}` : "",
        data.ideas?.length ? `\n\n💡 IDEAS:\n${data.ideas.map((d,i) => `${i+1}. ${d.title||d}${d.hook ? "\nHook: "+d.hook : ""}`).join("\n\n")}` : "",
        data.hashtags?.length ? `\n\n# HASHTAGS:\n${data.hashtags.join(" ")}` : "",
        data.bestTimeToPost ? `\n\n⏰ BEST TIME: ${data.bestTimeToPost}` : "",
        data.contentTip ? `\n\n💡 TIP: ${data.contentTip}` : "",
      ].join("");
      saveToHistory("TrendIdeaGenerator", keyword || niche, trendText, { niche, platform, language });
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
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
          <FaFire className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trend & Idea Generator</h1>
          <p className="text-sm text-gray-500">Discover viral content ideas and trending topics for your niche</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Keyword / Focus (optional)</label>
          <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. AI tools, morning routine, budget travel, skincare..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Niche</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <button key={n} onClick={() => setNiche(n)}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition ${niche === n ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition ${platform === p ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Ideas...</> : <><FaFire /> Generate Trend Ideas</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600">{niche} · {platform} · {language}</p>
            <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
              <FaRedo size={10} /> Refresh
            </button>
          </div>

          {/* Trending Topics */}
          {result.trending && result.trending.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">🔥 Trending Right Now</p>
              <div className="space-y-2">
                {result.trending.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <span className="text-orange-500 font-bold text-sm shrink-0">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.topic || item}</p>
                      {item.reason && <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Ideas */}
          {result.ideas && result.ideas.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">💡 Content Ideas</p>
              <div className="space-y-3">
                {result.ideas.map((idea, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400">{i + 1}.</span>
                          {idea.format && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORMAT_COLORS[idea.format] || "bg-gray-100 text-gray-600"}`}>
                              {idea.format}
                            </span>
                          )}
                          {idea.viralScore && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${idea.viralScore === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {idea.viralScore} Viral
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{idea.title || idea}</p>
                        {idea.hook && <p className="text-xs text-gray-500 mt-1 italic">Hook: "{idea.hook}"</p>}
                      </div>
                      <button onClick={() => handleCopy(idea.title || idea, i)} className="shrink-0 text-gray-400 hover:text-gray-700 transition">
                        {copied === i ? <FaCheck className="text-green-500" size={12} /> : <FaCopy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {result.hashtags && result.hashtags.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider"># Hashtags</p>
                <button onClick={() => handleCopy(result.hashtags.join(" "), "hashtags")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "hashtags" ? <><FaCheck className="text-green-500" size={10} /> Copied</> : <><FaCopy size={10} /> Copy All</>}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full font-medium cursor-pointer hover:bg-blue-100 transition"
                    onClick={() => handleCopy(tag, `tag-${i}`)}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {(result.bestTimeToPost || result.contentTip) && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-100 p-5">
              {result.bestTimeToPost && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">⏰ Best Time to Post</p>
                  <p className="text-sm text-gray-700">{result.bestTimeToPost}</p>
                </div>
              )}
              {result.contentTip && (
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">💡 Pro Tip</p>
                  <p className="text-sm text-gray-700">{result.contentTip}</p>
                </div>
              )}
            </div>
          )}

          <YouTubePublish
            defaultTitle={keyword || niche}
            defaultDescription={[
              result.ideas?.map(i => i.title || i).join('\n'),
              result.hashtags?.join(' '),
            ].filter(Boolean).join('\n\n')}
          />
        </div>
      )}
    </div>
  );
}
