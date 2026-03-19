import React, { useState } from "react";
import { FaRocket, FaSpinner, FaGlobe, FaShoppingCart, FaEye, FaRedo, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const TONES = ["Professional", "Casual", "Bold", "Minimal", "Luxury", "Playful"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];
const PAGE_TYPES = ["Portfolio / Service", "E-Commerce (Product)"];

export default function LandingPageGenerator() {
  const [pageType, setPageType] = useState("Portfolio / Service");
  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isEcommerce = pageType === "E-Commerce (Product)";

  const handleGenerate = async () => {
    if (!businessName.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/landing-page/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageType, businessName, productName, description, tone, language }),
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

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center shadow-md">
          <FaRocket className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Page Generator</h1>
          <p className="text-sm text-gray-500">Generate a complete visual website preview with AI</p>
        </div>
      </div>

      {/* Page Type Toggle */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {PAGE_TYPES.map((type) => (
          <button key={type} onClick={() => { setPageType(type); setResult(null); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-semibold transition ${pageType === type ? "border-rose-400 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"}`}>
            {isEcommerce && type.includes("E-Commerce") ? <FaShoppingCart size={13} /> : <FaGlobe size={13} />}
            {type}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              {isEcommerce ? "Brand / Store Name" : "Your Name / Business Name"} <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder={isEcommerce ? "e.g. GlowSkin Store" : "e.g. Rahul Sharma / TechFlow Agency"}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition" />
          </div>
          {isEcommerce && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Product Name</label>
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Vitamin C Serum"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            {isEcommerce ? "Product Description / Key Features" : "About You / Your Services"}
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={isEcommerce ? "e.g. Anti-aging serum with Vitamin C, reduces dark spots in 2 weeks..." : "e.g. Full-stack developer specializing in React and Node.js, 5 years experience..."}
            rows={3} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition ${tone === t ? "border-rose-400 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !businessName.trim()}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-700 hover:from-rose-600 hover:to-pink-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-base">
          {loading ? <><FaSpinner className="animate-spin" /> Generating Page...</> : <><FaEye /> Generate Website Preview</>}
        </button>
      </div>

      {/* Website Preview */}
      {result && <WebsitePreview data={result} onRegenerate={handleGenerate} loading={loading} />}
    </div>
  );
}

function WebsitePreview({ data, onRegenerate, loading }) {
  const primary = data.meta?.primaryColor || "#6366f1";
  const name = data.meta?.name || "";

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaEye className="text-gray-400" />
          <span className="font-bold text-gray-800">Website Preview</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Live Preview</span>
        </div>
        <button onClick={onRegenerate} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition disabled:opacity-50">
          <FaRedo size={10} /> Regenerate
        </button>
      </div>

      {/* Browser Chrome */}
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        {/* Browser Bar */}
        <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400 border border-gray-200">
            🔒 www.{name.toLowerCase().replace(/\s+/g, "")}.com
          </div>
        </div>

        {/* Website Content */}
        <div className="bg-white overflow-y-auto max-h-[80vh]" style={{ fontFamily: "'Inter', sans-serif" }}>

          {/* Navbar */}
          <nav style={{ backgroundColor: primary }} className="px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
            <span className="text-white font-black text-lg tracking-tight">{data.nav?.logo || name}</span>
            <div className="hidden sm:flex items-center gap-6">
              {(data.nav?.links || []).map((link, i) => (
                <span key={i} className="text-white/80 hover:text-white text-sm font-medium cursor-pointer transition">{link}</span>
              ))}
            </div>
            <span className="text-white text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/30 transition">
              {data.hero?.primaryCta || "Get Started"}
            </span>
          </nav>

          {/* Hero */}
          {data.hero && (
            <section style={{ background: `linear-gradient(135deg, ${primary}15 0%, ${primary}05 100%)` }} className="px-8 py-16 text-center">
              {data.hero.trustBadge && (
                <span style={{ backgroundColor: `${primary}20`, color: primary }} className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                  ✦ {data.hero.trustBadge}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4 max-w-2xl mx-auto">{data.hero.headline}</h1>
              <p style={{ color: primary }} className="text-lg font-semibold mb-3">{data.hero.subheadline}</p>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mb-8">{data.hero.description}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button style={{ backgroundColor: primary }} className="text-white px-7 py-3 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition">
                  {data.hero.primaryCta}
                </button>
                <button style={{ border: `2px solid ${primary}`, color: primary }} className="px-7 py-3 rounded-xl font-semibold text-sm hover:opacity-80 transition bg-white">
                  {data.hero.secondaryCta}
                </button>
              </div>
            </section>
          )}

          {/* Stats / About */}
          {data.about && (
            <section className="px-8 py-12 bg-white">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-black text-gray-900 mb-3 text-center">{data.about.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed text-center mb-8">{data.about.description}</p>
                {data.about.stats && (
                  <div className="grid grid-cols-3 gap-4">
                    {data.about.stats.map((s, i) => (
                      <div key={i} style={{ borderColor: `${primary}30` }} className="text-center p-4 rounded-2xl border-2 bg-gray-50">
                        <p style={{ color: primary }} className="text-2xl font-black">{s.value}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Services or Features */}
          {(data.services || data.features) && (() => {
            const section = data.services || data.features;
            return (
              <section style={{ backgroundColor: `${primary}08` }} className="px-8 py-12">
                <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">{section.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {(section.items || []).map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                      <div style={{ backgroundColor: `${primary}15` }} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3">
                        {item.icon || "✨"}
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{item.title || item.name}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.description || item.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Portfolio (for service pages) */}
          {data.portfolio && (
            <section className="px-8 py-12 bg-white">
              <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">{data.portfolio.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {(data.portfolio.items || []).map((item, i) => (
                  <div key={i} style={{ borderTop: `4px solid ${primary}` }} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="text-2xl mb-2">{item.icon || "🎨"}</div>
                    <span style={{ backgroundColor: `${primary}20`, color: primary }} className="text-xs font-bold px-2 py-0.5 rounded-full">{item.category}</span>
                    <h3 className="font-bold text-gray-800 text-sm mt-2 mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Products (for ecommerce) */}
          {data.products && (
            <section className="px-8 py-12 bg-white">
              <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">{data.products.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {(data.products.items || []).map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg transition relative">
                    {item.badge && (
                      <span style={{ backgroundColor: primary }} className="absolute -top-2 right-3 text-white text-xs px-2 py-0.5 rounded-full font-bold">{item.badge}</span>
                    )}
                    <div className="text-3xl mb-3 text-center">{item.icon || "📦"}</div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1 text-center">{item.name}</h3>
                    <p className="text-xs text-gray-500 text-center mb-3">{item.description}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span style={{ color: primary }} className="text-lg font-black">{item.price}</span>
                      {item.originalPrice && <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>}
                    </div>
                    <button style={{ backgroundColor: primary }} className="w-full mt-3 text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition">
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Testimonials */}
          {data.testimonials && (
            <section style={{ backgroundColor: `${primary}08` }} className="px-8 py-12">
              <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">{data.testimonials.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {(data.testimonials.items || []).map((t, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, j) => (
                        <FaStar key={j} className="text-yellow-400 text-xs" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed mb-3">"{t.quote || t.text}"</p>
                    <div className="flex items-center gap-2">
                      <div style={{ backgroundColor: primary }} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(t.name || "U")[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA Banner */}
          {data.cta && (
            <section style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }} className="px-8 py-12 text-center text-white">
              <h2 className="text-2xl font-black mb-3">{data.cta.headline}</h2>
              <p className="text-white/80 text-sm mb-2">{data.cta.subtext}</p>
              {data.cta.urgency && <p className="text-yellow-300 text-xs font-semibold mb-6">⏰ {data.cta.urgency}</p>}
              <button className="bg-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg hover:opacity-90 transition" style={{ color: primary }}>
                {data.cta.buttonText}
              </button>
            </section>
          )}

          {/* FAQ */}
          {data.faq && (
            <section className="px-8 py-12 bg-white max-w-2xl mx-auto w-full">
              <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">{data.faq.title}</h2>
              <div className="space-y-3">
                {(data.faq.items || []).map((item, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${primary}` }} className="bg-gray-50 rounded-xl p-4">
                    <p className="font-bold text-gray-800 text-sm mb-1">{item.question}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact */}
          {data.contact && (
            <section style={{ backgroundColor: `${primary}08` }} className="px-8 py-12">
              <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">{data.contact.title}</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {data.contact.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaEnvelope style={{ color: primary }} />
                    <span>{data.contact.email}</span>
                  </div>
                )}
                {data.contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhone style={{ color: primary }} />
                    <span>{data.contact.phone}</span>
                  </div>
                )}
                {data.contact.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt style={{ color: primary }} />
                    <span>{data.contact.address}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer style={{ backgroundColor: primary }} className="px-8 py-6 text-center">
            <p className="text-white font-black text-base mb-1">{name}</p>
            <p className="text-white/60 text-xs mb-3">{data.footer?.tagline || data.meta?.tagline}</p>
            <div className="flex justify-center gap-4">
              {(data.footer?.socialLinks || []).map((s, i) => (
                <span key={i} className="text-white/70 hover:text-white text-xs cursor-pointer transition font-medium">{s.platform}</span>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-4">© 2025 {name}. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
