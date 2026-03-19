import React, { useState } from "react";
import { FaMicrophone, FaSpinner, FaCopy, FaCheck, FaRedo } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const FORMATS = ["Solo Monologue", "Interview Style", "Storytelling", "News Briefing", "Educational", "Motivational Talk"];
const DURATIONS = ["2 min", "5 min", "10 min", "15 min"];

export default function VoicePodcastGenerator() {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("Solo Monologue");
  const [duration, setDuration] = useState("5 min");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [activeSegment, setActiveSegment] = useState(0);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setActiveSegment(0);
    try {
      const res = await fetch(`${API_BASE_URL}/api/podcast/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, format, duration, language }),
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

  const handleCopyFull = async () => {
    if (!result) return;
    const full = `${result.title}\n\n${result.description || ""}\n\n--- INTRO ---\n${result.intro}\n\n${(result.segments || []).map(s => `--- ${s.segmentTitle} ---\n${s.content}`).join("\n\n")}\n\n--- OUTRO ---\n${result.outro}${result.showNotes ? `\n\n--- SHOW NOTES ---\n${result.showNotes}` : ""}`;
    await handleCopy(full, "all");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md">
          <FaMicrophone className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice / Podcast Generator</h1>
          <p className="text-sm text-gray-500">Generate professional podcast scripts and voice-over content</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Topic / Episode Idea <span className="text-rose-500">*</span></label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. The future of AI in healthcare, How to build a morning routine..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400 transition" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400 transition">
              {FORMATS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Duration</label>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button key={d} onClick={() => setDuration(d)}
                className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition ${duration === d ? "border-pink-400 bg-pink-50 text-pink-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Script...</> : <><FaMicrophone /> Generate Script</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{result.title}</h2>
              {result.description && <p className="text-sm text-gray-500 mt-0.5">{result.description}</p>}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">{format}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{duration}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{language}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Redo
              </button>
              <button onClick={handleCopyFull} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500 text-white text-xs font-medium hover:bg-pink-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy Full</>}
              </button>
            </div>
          </div>

          {/* Intro */}
          {result.intro && (
            <div className="bg-white rounded-2xl border-2 border-pink-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center">🎙️</span>
                  <span className="text-sm font-bold text-pink-600 uppercase tracking-wider">Intro</span>
                </div>
                <button onClick={() => handleCopy(result.intro, "intro")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "intro" ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                </button>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result.intro}</p>
            </div>
          )}

          {/* Segments */}
          {result.segments && result.segments.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Main Content Segments</p>
              {result.segments.map((seg, i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                  <button onClick={() => setActiveSegment(activeSegment === i ? -1 : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="font-semibold text-gray-800 text-sm">{seg.segmentTitle}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{activeSegment === i ? "▲" : "▼"}</span>
                  </button>
                  {activeSegment === i && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <div className="flex justify-end mb-2 pt-3">
                        <button onClick={() => handleCopy(seg.content, `seg-${i}`)} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                          {copied === `seg-${i}` ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{seg.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Outro */}
          {result.outro && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">🎬</span>
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Outro</span>
                </div>
                <button onClick={() => handleCopy(result.outro, "outro")} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
                  {copied === "outro" ? <FaCheck className="text-green-500" size={11} /> : <FaCopy size={11} />}
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.outro}</p>
            </div>
          )}

          {/* Show Notes */}
          {result.showNotes && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Show Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.showNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
