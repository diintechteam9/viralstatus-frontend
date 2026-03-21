import React, { useState } from "react";
import { FaStar, FaSpinner, FaCopy, FaCheck, FaRedo, FaThumbsUp } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

import { saveToHistory } from "./contentHistory";
import YouTubePublish from "./YouTubePublish";

const TONES = ["Professional", "Casual", "Enthusiastic", "Balanced", "Critical", "Emotional"];
const RATINGS = ["5 Star", "4 Star", "3 Star", "2 Star", "1 Star"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const REVIEW_COUNTS = [3, 5, 7];

export default function ReviewGenerator() {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [features, setFeatures] = useState("");
  const [tone, setTone] = useState("Professional");
  const [rating, setRating] = useState("5 Star");
  const [language, setLanguage] = useState("English");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [helpfulCounts, setHelpfulCounts] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    setError("");
    setReviews([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/review/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, productType, features, tone, rating, language, count }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate");
      setReviews(data.reviews || []);
      setHelpfulCounts((data.reviews || []).map(() => Math.floor(Math.random() * 50) + 5));
      const reviewText = (data.reviews || []).map((r, i) =>
        `Review ${i + 1} — ${r.reviewer || "Customer"}\n${rating}\n${r.title ? r.title + "\n" : ""}${r.text}\n${r.pros ? "Pros: " + r.pros : ""}\n${r.cons ? "Cons: " + r.cons : ""}`
      ).join("\n\n---\n\n");
      saveToHistory("ReviewGenerator", productName, reviewText, { rating, tone, language, count: `${count} reviews` });
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
    const text = reviews.map((r, i) =>
      `Review ${i + 1} — ${r.reviewer || "Customer"}\n${rating}\n${r.title ? r.title + "\n" : ""}${r.text}\n${r.pros ? "Pros: " + r.pros : ""}\n${r.cons ? "Cons: " + r.cons : ""}`
    ).join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const starCount = parseInt(rating[0]);
  const starColor = starCount >= 4 ? "text-yellow-400" : starCount === 3 ? "text-orange-400" : "text-red-400";

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
          <FaStar className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Review Generator</h1>
          <p className="text-sm text-gray-500">Generate authentic, human-like product reviews with AI</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Product Name <span className="text-rose-500">*</span></label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. iPhone 15 Pro, Mamaearth Vitamin C Serum"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Product Category</label>
            <input type="text" value={productType} onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g. Smartphone, Skincare, Running Shoes"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Key Features / Highlights</label>
          <textarea value={features} onChange={(e) => setFeatures(e.target.value)}
            placeholder="e.g. 48MP camera, 5000mAh battery, lightweight design, fast delivery, good packaging..."
            rows={3} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition resize-none" />
        </div>

        {/* Rating selector */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Rating</label>
          <div className="flex gap-2 flex-wrap">
            {RATINGS.map((r) => {
              const s = parseInt(r[0]);
              return (
                <button key={r} onClick={() => setRating(r)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${rating === r ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <div className="flex">
                    {Array.from({ length: s }).map((_, i) => <FaStar key={i} className="text-yellow-400" size={10} />)}
                  </div>
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition">
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">No. of Reviews</label>
            <div className="flex gap-2">
              {REVIEW_COUNTS.map((c) => (
                <button key={c} onClick={() => setCount(c)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition ${count === c ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !productName.trim()}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Reviews...</> : <><FaStar /> Generate {count} Reviews</>}
        </button>
      </div>

      {/* Results */}
      {reviews.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{reviews.length} Reviews Generated</h2>
              <p className="text-xs text-gray-500">{productName} · {rating} · {tone} · {language}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition">
                <FaRedo size={10} /> Regenerate
              </button>
              <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500 text-white text-xs font-medium hover:bg-yellow-600 transition">
                {copied === "all" ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy All</>}
              </button>
            </div>
          </div>

          {reviews.map((review, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm">
                    {(review.reviewer || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.reviewer || `Customer ${idx + 1}`}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < starCount ? starColor : "text-gray-200"} size={12} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">Verified Purchase</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleCopy(`${review.title ? review.title + "\n" : ""}${review.text}`, idx)}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-50">
                  {copied === idx ? <><FaCheck className="text-green-500" size={11} /> Copied</> : <><FaCopy size={11} /> Copy</>}
                </button>
              </div>

              {/* Review Title */}
              {review.title && (
                <p className="font-bold text-gray-900 text-sm mb-2">"{review.title}"</p>
              )}

              {/* Review Body */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.text}</p>

              {/* Pros & Cons */}
              {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  {review.pros && (
                    <div className="bg-green-50 rounded-xl px-3 py-2">
                      <p className="text-xs font-bold text-green-600 mb-1">✅ Pros</p>
                      <p className="text-xs text-gray-700">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div className="bg-red-50 rounded-xl px-3 py-2">
                      <p className="text-xs font-bold text-red-500 mb-1">❌ Cons</p>
                      <p className="text-xs text-gray-700">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Helpful */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <FaThumbsUp className="text-gray-300" size={12} />
                <span className="text-xs text-gray-400">{helpfulCounts[idx] || 0} people found this helpful</span>
              </div>
            </div>
          ))}

          <YouTubePublish
            defaultTitle={productName}
            defaultDescription={reviews.map((r, i) => `Review ${i+1}: ${r.title || ''}\n${r.text}`).join('\n\n')}
          />
        </div>
      )}
    </div>
  );
}
