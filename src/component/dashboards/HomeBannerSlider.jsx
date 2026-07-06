import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { API_BASE_URL } from "../../config";

const HomeBannerSlider = ({ clientId = "" }) => {
  const [banners, setBanners]   = useState([]);
  const [idx, setIdx]           = useState(0);
  const [loading, setLoading]   = useState(true);
  const [paused, setPaused]     = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("mobileUserToken") || sessionStorage.getItem("mobileUserToken") || localStorage.getItem("clienttoken") || sessionStorage.getItem("clienttoken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    axios.get(`${API_BASE_URL}/api/banners`, { headers })
      .then(res => { if (res.data.success) setBanners(res.data.banners || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % banners.length), 4500);
    return () => clearInterval(timerRef.current);
  }, [paused, banners.length]);

  if (loading) return (
    <div className="w-full h-40 bg-gray-100 rounded-2xl animate-pulse" />
  );

  if (!banners.length) return null;

  const banner = banners[idx];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-sm select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image */}
      <div className="relative h-40 sm:h-52 bg-gradient-to-br from-orange-400 to-orange-600">
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Text */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-base leading-tight">{banner.title}</h3>
          {banner.description && (
            <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{banner.description}</p>
          )}
          {banner.linkUrl && (
            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all font-medium">
              Learn More <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Nav arrows */}
        {banners.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + banners.length) % banners.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-all">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % banners.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-all">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeBannerSlider;
