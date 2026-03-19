import React, { useState } from "react";
import { FaMapMarkedAlt, FaSpinner, FaCopy, FaCheck, FaRedo, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const DURATIONS = ["1 Day", "2 Days", "3 Days", "5 Days", "7 Days", "10 Days", "14 Days"];
const TRAVEL_STYLES = ["Budget", "Luxury", "Adventure", "Family", "Romantic", "Solo", "Cultural", "Backpacker"];

export default function TripAdvisor() {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("3 Days");
  const [travelStyle, setTravelStyle] = useState("Cultural");
  const [interests, setInterests] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [expandedDay, setExpandedDay] = useState(0);
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setExpandedDay(0);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trip-advisor/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, duration, travelStyle, interests, language }),
      });
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
    const text = `${result.tripTitle}\n\n${result.overview}\n\n${result.days?.map(d => `Day ${d.day}: ${d.title}\n${d.activities?.join("\n")}\nFood: ${d.food || "-"}\nStay: ${d.stay || "-"}${d.localTip ? "\nTip: " + d.localTip : ""}`).join("\n\n")}\n\nTravel Tips:\n${result.tips?.join("\n")}\n\nBudget: ${result.budget}`;
    handleCopy(text, "all");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
          <FaMapMarkedAlt className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Advisor</h1>
          <p className="text-sm text-gray-500">AI-powered travel recommendations, guides & day-by-day plans</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Destination <span className="text-rose-500">*</span></label>
          <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. Goa, Paris, Rajasthan, Bali, Manali..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Interests / Preferences (optional)</label>
          <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. beaches, street food, history, nightlife, trekking, photography..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition">
              {DURATIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Travel Style</label>
            <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition">
              {TRAVEL_STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !destination.trim()}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Guide...</> : <><FaMapMarkedAlt /> Get Trip Guide</>}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900 text-xl">{result.tripTitle}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{travelStyle}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{duration}</span>
                {result.bestTimeToVisit && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Best: {result.bestTimeToVisit}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Redo
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
          </div>

          {result.overview && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
              <p className="text-sm text-gray-700 leading-relaxed">{result.overview}</p>
            </div>
          )}

          {/* Day-by-day */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Day-by-Day Plan</p>
            {(result.days || []).map((day, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-black flex items-center justify-center shrink-0">D{day.day}</span>
                    <span className="font-semibold text-gray-800">{day.title}</span>
                  </div>
                  {expandedDay === i ? <FaChevronUp size={12} className="text-gray-400" /> : <FaChevronDown size={12} className="text-gray-400" />}
                </button>
                {expandedDay === i && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-3 pt-3">
                    {(day.activities || []).map((act, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                        <p className="text-sm text-gray-700">{act}</p>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {day.food && <div className="bg-orange-50 rounded-xl px-3 py-2"><p className="text-xs font-bold text-orange-600 mb-0.5">🍽️ Food</p><p className="text-xs text-gray-700">{day.food}</p></div>}
                      {day.stay && <div className="bg-blue-50 rounded-xl px-3 py-2"><p className="text-xs font-bold text-blue-600 mb-0.5">🏨 Stay</p><p className="text-xs text-gray-700">{day.stay}</p></div>}
                    </div>
                    {day.localTip && <div className="bg-yellow-50 rounded-xl px-3 py-2"><p className="text-xs font-bold text-yellow-600 mb-0.5">💡 Local Tip</p><p className="text-xs text-gray-700">{day.localTip}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Must Try */}
          {result.mustTry && result.mustTry.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⭐ Must-Try Experiences</p>
              <div className="flex flex-wrap gap-2">
                {result.mustTry.map((item, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">💡 Travel Tips</p>
              <div className="space-y-2">
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold text-sm shrink-0">✓</span>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.budget && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">💰 Estimated Budget</p>
              <p className="text-sm font-semibold text-gray-800">{result.budget}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
