import React, { useState } from "react";
import { FaRoute, FaSpinner, FaCopy, FaCheck, FaRedo, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const DURATIONS = ["1 Day", "2 Days", "3 Days", "5 Days", "7 Days", "10 Days", "14 Days"];
const TRIP_TYPES = ["Leisure", "Business", "Adventure", "Honeymoon", "Family", "Solo", "Group Tour", "Pilgrimage"];
const BUDGETS = ["Budget (Economy)", "Mid-range", "Luxury", "Ultra Luxury"];

export default function ItineraryGenerator() {
  const [destination, setDestination] = useState("");
  const [startCity, setStartCity] = useState("");
  const [duration, setDuration] = useState("5 Days");
  const [tripType, setTripType] = useState("Leisure");
  const [budget, setBudget] = useState("Mid-range");
  const [groupSize, setGroupSize] = useState("2");
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
      const res = await fetch(`${API_BASE_URL}/api/itinerary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, startCity, duration, tripType, budget, groupSize, language }),
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
    const text = `${result.title}\n\n${result.summary}\n\n${result.days?.map(d => `Day ${d.day} — ${d.title}\n🌅 Morning: ${d.morning}\n☀️ Afternoon: ${d.afternoon}\n🌙 Evening: ${d.evening}\n🏨 Stay: ${d.accommodation || "-"}\n🚗 Transport: ${d.transport || "-"}\n💰 Cost: ${d.estimatedCost || "-"}`).join("\n\n")}\n\nTotal Budget: ${result.totalBudget}`;
    handleCopy(text, "all");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md">
          <FaRoute className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Itinerary Generator</h1>
          <p className="text-sm text-gray-500">Generate detailed day-by-day travel itineraries with timings & budget</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Destination <span className="text-rose-500">*</span></label>
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kerala, Switzerland, Tokyo, Ladakh..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Starting City (optional)</label>
            <input type="text" value={startCity} onChange={(e) => setStartCity(e.target.value)}
              placeholder="e.g. Mumbai, Delhi, Bangalore..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-violet-400 transition">
              {DURATIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Trip Type</label>
            <select value={tripType} onChange={(e) => setTripType(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-violet-400 transition">
              {TRIP_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Budget</label>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-violet-400 transition">
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Group Size</label>
            <input type="number" min="1" max="50" value={groupSize} onChange={(e) => setGroupSize(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-violet-400 transition" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="w-full sm:w-48 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition">
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !destination.trim()}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-700 hover:from-violet-600 hover:to-purple-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Itinerary...</> : <><FaRoute /> Generate Itinerary</>}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900 text-xl">{result.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{tripType}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{duration}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{budget}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{groupSize} people</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Redo
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
          </div>

          {result.summary && (
            <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4">
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Days */}
          <div className="space-y-2">
            {(result.days || []).map((day, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 text-sm font-black flex items-center justify-center shrink-0">D{day.day}</span>
                    <div>
                      <span className="font-semibold text-gray-800">{day.title}</span>
                      {day.estimatedCost && <span className="text-xs text-green-600 ml-2">💰 {day.estimatedCost}</span>}
                    </div>
                  </div>
                  {expandedDay === i ? <FaChevronUp size={12} className="text-gray-400" /> : <FaChevronDown size={12} className="text-gray-400" />}
                </button>
                {expandedDay === i && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-3 pt-3">
                    {day.morning && <div className="bg-yellow-50 rounded-xl px-4 py-3"><p className="text-xs font-bold text-yellow-600 mb-1">🌅 Morning</p><p className="text-sm text-gray-700">{day.morning}</p></div>}
                    {day.afternoon && <div className="bg-orange-50 rounded-xl px-4 py-3"><p className="text-xs font-bold text-orange-600 mb-1">☀️ Afternoon</p><p className="text-sm text-gray-700">{day.afternoon}</p></div>}
                    {day.evening && <div className="bg-purple-50 rounded-xl px-4 py-3"><p className="text-xs font-bold text-purple-600 mb-1">🌙 Evening</p><p className="text-sm text-gray-700">{day.evening}</p></div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {day.accommodation && <div className="bg-blue-50 rounded-xl px-3 py-2"><p className="text-xs font-bold text-blue-600 mb-0.5">🏨 Stay</p><p className="text-xs text-gray-700">{day.accommodation}</p></div>}
                      {day.transport && <div className="bg-gray-50 rounded-xl px-3 py-2"><p className="text-xs font-bold text-gray-500 mb-0.5">🚗 Transport</p><p className="text-xs text-gray-700">{day.transport}</p></div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Packing List */}
          {result.packingList && result.packingList.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🎒 Packing List</p>
              <div className="flex flex-wrap gap-2">
                {result.packingList.map((item, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Booking Tips */}
          {result.bookingTips && result.bookingTips.length > 0 && (
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">📱 Booking Tips</p>
              <div className="space-y-1">
                {result.bookingTips.map((tip, i) => (
                  <p key={i} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-blue-400 shrink-0">→</span>{tip}</p>
                ))}
              </div>
            </div>
          )}

          {result.totalBudget && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">💰 Total Estimated Budget</p>
              <p className="text-base font-bold text-gray-900">{result.totalBudget}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
