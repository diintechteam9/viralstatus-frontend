import React, { useState } from "react";
import { FaChartBar, FaSpinner, FaCopy, FaCheck, FaRedo } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const TYPES = ["Statistics", "How-To Steps", "Comparison", "Timeline", "Fun Facts", "Tips List"];

const COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  { bg: "bg-teal-500", light: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  { bg: "bg-green-500", light: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  { bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  { bg: "bg-pink-500", light: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
];

export default function InfographicGenerator() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("Statistics");
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
      const res = await fetch(`${API_BASE_URL}/api/infographic/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, type, language }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate");
      setResult(data);
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
    const text = `${result.title}\n${result.subtitle || ""}\n\n${(result.points || []).map((p, i) => `${i + 1}. ${p.label}: ${p.value}`).join("\n")}\n\n${result.keyTakeaway || ""}`;
    await handleCopy(text, "all");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-green-600 flex items-center justify-center shadow-md">
          <FaChartBar className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infographic Generator</h1>
          <p className="text-sm text-gray-500">Generate structured, data-rich infographic content with AI</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Topic <span className="text-rose-500">*</span></label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. Benefits of drinking water daily, Social media statistics 2024..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Infographic Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition text-left ${type === t ? "border-teal-400 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating...</> : <><FaChartBar /> Generate Infographic</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{result.title}</h2>
              {result.subtitle && <p className="text-sm text-gray-500 mt-0.5">{result.subtitle}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Redo
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
          </div>

          {/* Infographic Visual */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-green-600 px-6 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-75">{type} Infographic</p>
              <h3 className="text-lg font-bold mt-1">{result.title}</h3>
              {result.subtitle && <p className="text-sm text-teal-100 mt-0.5">{result.subtitle}</p>}
            </div>

            {/* Points */}
            <div className="p-5 space-y-3">
              {(result.points || []).map((point, i) => {
                const color = COLORS[i % COLORS.length];
                return (
                  <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${color.light} ${color.border}`}>
                    <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {point.icon || (i + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${color.text}`}>{point.label}</p>
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{point.value}</p>
                    </div>
                    <button onClick={() => handleCopy(`${point.label}: ${point.value}`, i)}
                      className="shrink-0 text-gray-400 hover:text-gray-600 transition">
                      {copied === i ? <FaCheck className="text-green-500" size={12} /> : <FaCopy size={12} />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Key Takeaway */}
            {result.keyTakeaway && (
              <div className="mx-5 mb-5 bg-gray-900 rounded-xl px-5 py-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">💡 Key Takeaway</p>
                <p className="text-sm font-semibold leading-relaxed">{result.keyTakeaway}</p>
              </div>
            )}

            {/* Footer */}
            {result.source && (
              <div className="px-5 pb-4">
                <p className="text-xs text-gray-400 text-right">Source: {result.source}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
