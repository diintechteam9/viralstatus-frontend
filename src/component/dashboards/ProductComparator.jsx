import React, { useState } from "react";
import { FaBalanceScale, FaSpinner, FaCopy, FaCheck, FaRedo, FaTrophy } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const CATEGORIES = ["Electronics", "Smartphones", "Laptops", "Clothing", "Shoes", "Skincare", "Appliances", "Food & Beverages", "Furniture", "Vehicles", "Other"];

const IMPORTANCE_COLORS = { High: "text-red-500", Medium: "text-yellow-500", Low: "text-gray-400" };

export default function ProductComparator() {
  const [product1, setProduct1] = useState("");
  const [product2, setProduct2] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!product1.trim() || !product2.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-comparator/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product1, product2, category, language }),
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
    const text = `${result.product1} vs ${result.product2}\n\n${result.features?.map(f => `${f.feature}: ${f.product1Value} vs ${f.product2Value} ${f.winner === 1 ? "✓ " + result.product1 : f.winner === 2 ? "✓ " + result.product2 : "Tie"}`).join("\n")}\n\nVerdict: ${result.verdict}\n\nBuy Recommendation: ${result.buyRecommendation}`;
    handleCopy(text, "all");
  };

  const p1Wins = result?.features?.filter(f => f.winner === 1).length || 0;
  const p2Wins = result?.features?.filter(f => f.winner === 2).length || 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <FaBalanceScale className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Comparator</h1>
          <p className="text-sm text-gray-500">AI-powered side-by-side product comparison with verdict</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Product 1 <span className="text-rose-500">*</span></label>
            <input type="text" value={product1} onChange={(e) => setProduct1(e.target.value)}
              placeholder="e.g. iPhone 15 Pro"
              className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Product 2 <span className="text-rose-500">*</span></label>
            <input type="text" value={product2} onChange={(e) => setProduct2(e.target.value)}
              placeholder="e.g. Samsung Galaxy S24 Ultra"
              className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !product1.trim() || !product2.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Comparing...</> : <><FaBalanceScale /> Compare Products</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Score Banner */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3">
              <div className="bg-blue-50 p-4 text-center border-r border-gray-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{result.product1}</p>
                <p className="text-3xl font-black text-blue-600">{p1Wins}</p>
                <p className="text-xs text-gray-500">wins</p>
              </div>
              <div className="p-4 text-center bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">VS</p>
                <FaBalanceScale className="text-gray-300 text-2xl mx-auto my-1" />
                <p className="text-xs text-gray-400">{result.features?.length} features</p>
              </div>
              <div className="bg-purple-50 p-4 text-center border-l border-gray-100">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">{result.product2}</p>
                <p className="text-3xl font-black text-purple-600">{p2Wins}</p>
                <p className="text-xs text-gray-500">wins</p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-700">Feature Comparison</p>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="text-left px-5 py-3 w-1/3">Feature</th>
                    <th className="text-center px-4 py-3 text-blue-600 w-1/3">{result.product1}</th>
                    <th className="text-center px-4 py-3 text-purple-600 w-1/3">{result.product2}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(result.features || []).map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-700">{f.feature}</p>
                        {f.importance && <span className={`text-xs font-medium ${IMPORTANCE_COLORS[f.importance] || "text-gray-400"}`}>{f.importance}</span>}
                      </td>
                      <td className={`px-4 py-3.5 text-center text-sm ${f.winner === 1 ? "font-bold text-blue-600 bg-blue-50" : "text-gray-600"}`}>
                        {f.winner === 1 && <span className="mr-1">✓</span>}{f.product1Value}
                      </td>
                      <td className={`px-4 py-3.5 text-center text-sm ${f.winner === 2 ? "font-bold text-purple-600 bg-purple-50" : "text-gray-600"}`}>
                        {f.winner === 2 && <span className="mr-1">✓</span>}{f.product2Value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pros & Cons */}
          {(result.pros1 || result.pros2) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">{result.product1}</p>
                {result.pros1 && <div className="mb-3">{result.pros1.map((p, i) => <p key={i} className="text-xs text-gray-700 flex items-start gap-1.5 mb-1"><span className="text-green-500 mt-0.5">✓</span>{p}</p>)}</div>}
                {result.cons1 && result.cons1.map((c, i) => <p key={i} className="text-xs text-gray-700 flex items-start gap-1.5 mb-1"><span className="text-red-400 mt-0.5">✗</span>{c}</p>)}
              </div>
              <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">{result.product2}</p>
                {result.pros2 && <div className="mb-3">{result.pros2.map((p, i) => <p key={i} className="text-xs text-gray-700 flex items-start gap-1.5 mb-1"><span className="text-green-500 mt-0.5">✓</span>{p}</p>)}</div>}
                {result.cons2 && result.cons2.map((c, i) => <p key={i} className="text-xs text-gray-700 flex items-start gap-1.5 mb-1"><span className="text-red-400 mt-0.5">✗</span>{c}</p>)}
              </div>
            </div>
          )}

          {/* Verdict */}
          {result.verdict && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <FaTrophy className="text-yellow-500" />
                <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Verdict</p>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{result.verdict}</p>
            </div>
          )}

          {result.buyRecommendation && (
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">💡 Who Should Buy What?</p>
              <p className="text-sm text-gray-800 leading-relaxed">{result.buyRecommendation}</p>
            </div>
          )}

          {result.priceRange && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">💰 Price Range</p>
              <p className="text-sm text-gray-700">{result.priceRange}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
