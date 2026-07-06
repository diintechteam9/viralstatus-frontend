import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Star, ChevronLeft, ChevronRight, Send, CheckCircle, AlertCircle, MessageSquare, User } from "lucide-react";
import { API_BASE_URL } from "../../config";

// ── Star Rating ───────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => !readonly && onChange?.(n)}
        className={`transition-all ${readonly ? "cursor-default" : "hover:scale-110"}`}>
        <Star className={`w-5 h-5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      </button>
    ))}
  </div>
);

// ── Testimonial Card ──────────────────────────────────────────────────────────
const TestimonialCard = ({ t }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-full flex flex-col">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
        {t.avatarUrl
          ? <img src={t.avatarUrl} alt={t.userName} className="w-full h-full object-cover" />
          : <User className="w-5 h-5 text-orange-500" />}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">{t.userName || "Anonymous"}</p>
        {t.userCity && <p className="text-xs text-gray-400">{t.userCity}</p>}
      </div>
      <div className="ml-auto">
        <StarRating value={t.rating} readonly />
      </div>
    </div>
    <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.review}"</p>
    {t.campaignName && (
      <p className="text-xs text-orange-500 font-medium mt-3 border-t border-gray-50 pt-2">
        Campaign: {t.campaignName}
      </p>
    )}
    <p className="text-xs text-gray-300 mt-1">
      {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
    </p>
  </div>
);

// ── Slider ────────────────────────────────────────────────────────────────────
const TestimonialSlider = ({ testimonials }) => {
  const [idx, setIdx]     = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const perPage = window.innerWidth >= 768 ? 2 : 1;
  const maxIdx  = Math.max(0, testimonials.length - perPage);

  const next = () => setIdx(i => Math.min(i + 1, maxIdx));
  const prev = () => setIdx(i => Math.max(i - 1, 0));

  useEffect(() => {
    if (paused || testimonials.length <= perPage) return;
    timerRef.current = setInterval(() => setIdx(i => i >= maxIdx ? 0 : i + 1), 4000);
    return () => clearInterval(timerRef.current);
  }, [paused, testimonials.length, maxIdx, perPage]);

  if (!testimonials.length) return (
    <div className="text-center py-10 text-gray-400">
      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
      <p className="text-sm">No testimonials yet. Be the first to review!</p>
    </div>
  );

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Cards */}
      <div className="overflow-hidden">
        <div className="flex gap-4 transition-transform duration-500"
          style={{ transform: `translateX(calc(-${idx * (100 / perPage)}% - ${idx * 16 / perPage}px))` }}>
          {testimonials.map(t => (
            <div key={t._id} className="shrink-0" style={{ width: `calc(${100 / perPage}% - ${8 * (perPage - 1) / perPage}px)` }}>
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={prev} disabled={idx === 0}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        {/* Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: maxIdx + 1 }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? "w-5 h-2 bg-orange-500" : "w-2 h-2 bg-gray-300"}`} />
          ))}
        </div>

        <button onClick={next} disabled={idx >= maxIdx}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

// ── Submit Form ───────────────────────────────────────────────────────────────
const SubmitForm = ({ onSubmitted }) => {
  const [rating, setRating]   = useState(5);
  const [review, setReview]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const userId = (() => {
    try { const d = JSON.parse(localStorage.getItem("mobileUserData") || "{}"); return d.googleId || d.userId || d._id || ""; } catch { return ""; }
  })();

  const getToken = () => localStorage.getItem("mobileUserToken") || localStorage.getItem("clienttoken") || sessionStorage.getItem("clienttoken");

  const handleSubmit = async () => {
    setError("");
    if (!review.trim() || review.trim().length < 10) return setError("Please write at least 10 characters");
    
    const token = getToken();
    if (!token) return setError("No token provided");
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/testimonials`, { userId, rating, review: review.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
      <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
      <div>
        <p className="font-bold text-green-800 text-sm">Review Submitted!</p>
        <p className="text-xs text-green-600 mt-0.5">Your review is pending approval and will appear shortly.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        <Star className="w-4 h-4 text-orange-500" /> Share Your Experience
      </h3>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Your Rating</label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Your Review <span className="text-red-400">*</span></label>
        <textarea
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none"
          placeholder="Share your experience with YovoAI..."
          value={review}
          onChange={e => setReview(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">{review.length}/500</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
          : <><Send className="w-4 h-4" /> Submit Review</>}
      </button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading]           = useState(true);

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem("mobileUserToken") || localStorage.getItem("clienttoken") || sessionStorage.getItem("clienttoken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/api/testimonials?limit=20`, { headers });
      if (res.data.success) setTestimonials(res.data.testimonials || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-800">Reviews & Testimonials</h2>
      </div>

      {/* Submit form */}
      <SubmitForm onSubmitted={fetchTestimonials} />

      {/* Slider */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">What Creators Say</h3>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TestimonialSlider testimonials={testimonials} />
        )}
      </div>
    </div>
  );
};

export default TestimonialsPage;
