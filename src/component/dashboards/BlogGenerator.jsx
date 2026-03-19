import React, { useState, useRef, useEffect } from 'react';
import { saveToHistory } from "./contentHistory";
import {
  generateBlogHTML, modifyBlogHTML, extractHTML,
  getDescriptionSuggestions, generateImageSearchTerm
} from './blogutils/gemini';
import { searchUnsplashImages } from './blogutils/unsplash';

const CATEGORIES = ['Technology', 'Business', 'Health', 'Travel', 'Food', 'Finance', 'Education', 'Lifestyle', 'Sports', 'Entertainment'];
const TONES = ['Professional', 'Casual', 'Informative', 'Persuasive', 'Storytelling'];
const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu'];
const TEMPLATES = [
  { name: 'Ocean Blue',  primary: '#0ea5e9', secondary: '#6366f1' },
  { name: 'Sunset',      primary: '#f97316', secondary: '#ec4899' },
  { name: 'Forest',      primary: '#22c55e', secondary: '#14b8a6' },
  { name: 'Royal',       primary: '#8b5cf6', secondary: '#ec4899' },
  { name: 'Fire',        primary: '#ef4444', secondary: '#f97316' },
  { name: 'Gold',        primary: '#eab308', secondary: '#f97316' },
];
const QUICK_EDITS = [
  'Add a FAQ section',
  'Make tone more casual',
  'Add key takeaways',
  'Change color to blue',
  'Add a conclusion',
  'Make it shorter',
];

const Spinner = ({ cls = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${cls}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcPen    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/></svg>;
const IcImage  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>;
const IcDown   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>;
const IcCopy   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IcSend   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>;
const IcBack   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IcCheck  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const IcSpark  = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>;

export default function BlogGenerator() {
  const [step, setStep]               = useState('setup'); // 'setup' | 'preview'
  const [heading, setHeading]         = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('Technology');
  const [tone, setTone]               = useState('Professional');
  const [language, setLanguage]       = useState('English');
  const [template, setTemplate]       = useState(TEMPLATES[0]);
  const [useImages, setUseImages]     = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [error, setError]             = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]     = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [iframeKey, setIframeKey]     = useState(0);
  const chatEndRef = useRef(null);
  const iframeRef  = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // refresh iframe when HTML changes
  useEffect(() => {
    setIframeKey(k => k + 1);
  }, [generatedHTML]);

  const handleGetSuggestions = async () => {
    if (!heading.trim()) return;
    setLoadingSugg(true);
    setSuggestions([]);
    const s = await getDescriptionSuggestions(heading);
    setSuggestions(s);
    setLoadingSugg(false);
  };

  const handleGenerate = async () => {
    if (!heading.trim() || !description.trim()) return;
    setGenerating(true);
    setError('');
    setGeneratedHTML('');
    setChatMessages([]);
    try {
      let images = [];
      if (useImages) {
        const term = await generateImageSearchTerm(heading);
        images = await searchUnsplashImages(term, 5);
      }
      const raw = await generateBlogHTML({
        heading, description, category, tone, language,
        primaryColor: template.primary,
        secondaryColor: template.secondary,
        images,
      });
      setGeneratedHTML(extractHTML(raw));
      setStep('preview');
      setChatMessages([{ role: 'ai', text: 'Blog is ready! Ask me to change anything — colors, sections, tone, content, etc.' }]);
      saveToHistory("BlogGenerator", heading, extractHTML(raw), { category, tone, language, template: template.name });
    } catch (e) {
      setError(e.message || 'Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(p => [...p, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const raw = await modifyBlogHTML(generatedHTML, msg);
      setGeneratedHTML(extractHTML(raw));
      setChatMessages(p => [...p, { role: 'ai', text: 'Done! Blog updated.' }]);
    } catch (e) {
      setChatMessages(p => [...p, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${heading.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-orange-50 p-4 sm:p-6">
        <div className="w-full max-w-6xl mx-auto">

          {/* ── Hero Header ── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shrink-0">
              <IcPen />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Blog Generator</h1>
              <p className="text-gray-500 text-sm">AI writes your full blog post with images, styling & live preview</p>
            </div>
          </div>

          {/* ── Main Card ── */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />

            <div className="p-6 sm:p-8">
              {/* ── TOP ROW: Title + Description side by side ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Left col */}
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blog Title *</label>
                    <input
                      type="text"
                      value={heading}
                      onChange={e => setHeading(e.target.value)}
                      placeholder="e.g. Top 10 AI Tools for Content Creators in 2025"
                      className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>

                  {/* Category · Tone · Language */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Category', value: category, set: setCategory, opts: CATEGORIES },
                      { label: 'Tone',     value: tone,     set: setTone,     opts: TONES },
                      { label: 'Language', value: language, set: setLanguage, opts: LANGUAGES },
                    ].map(({ label, value, set, opts }) => (
                      <div key={label}>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</label>
                        <select
                          value={value}
                          onChange={e => set(e.target.value)}
                          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-orange-400 transition-colors"
                        >
                          {opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Color Theme */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Color Theme</label>
                    <div className="grid grid-cols-6 gap-2">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.name}
                          onClick={() => setTemplate(t)}
                          className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                            template.name === t.name
                              ? 'border-orange-400 bg-orange-50 shadow-md scale-105'
                              : 'border-gray-100 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex gap-1">
                            <span className="w-4 h-4 rounded-full shadow-sm" style={{ background: t.primary }} />
                            <span className="w-4 h-4 rounded-full shadow-sm" style={{ background: t.secondary }} />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-600 leading-none">{t.name}</span>
                          {template.name === t.name && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <IcCheck />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right col */}
                <div className="space-y-5">
                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Description *</label>
                      <button
                        onClick={handleGetSuggestions}
                        disabled={!heading.trim() || loadingSugg}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 border border-orange-200 hover:border-orange-400 transition disabled:opacity-40"
                      >
                        {loadingSugg ? <><Spinner cls="h-3 w-3" />Getting ideas…</> : <><IcSpark />AI Suggestions</>}
                      </button>
                    </div>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe what your blog is about…"
                      rows={5}
                      className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors bg-gray-50 focus:bg-white resize-none"
                    />
                    {suggestions.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => { setDescription(s); setSuggestions([]); }}
                            className="text-left text-xs px-3 py-2.5 rounded-xl border-2 border-orange-100 bg-orange-50 text-orange-800 hover:border-orange-300 hover:bg-orange-100 transition leading-relaxed"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border-2 border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <IcImage />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Include Unsplash Images</p>
                        <p className="text-xs text-gray-400">AI picks relevant photos automatically</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseImages(!useImages)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${useImages ? 'bg-orange-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${useImages ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── BOTTOM: Error + Button ── */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 mb-4">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !heading.trim() || !description.trim()}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-2xl hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-base shadow-lg shadow-orange-200"
              >
                {generating ? <><Spinner cls="h-5 w-5" /> Generating your blog…</> : <><span className="text-lg">🚀</span> Generate Blog Post</>}
              </button>

              {generating && (
                <div className="flex items-center justify-center gap-6 mt-4">
                  {['Crafting content with AI…', 'Fetching images…', 'Styling your blog…'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">Powered by Gemini AI · Images by Unsplash</p>
        </div>
      </div>
    );
  }

  // ── PREVIEW SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-gray-100 h-full min-h-0 overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between gap-3 shadow-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setStep('setup')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition shrink-0"
          >
            <IcBack /> Back
          </button>
          <div className="w-px h-6 bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate max-w-sm">{heading}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[category, tone, language].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold border border-orange-100">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Regenerate */}
          <button
            onClick={() => setStep('setup')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            ↺ New Blog
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            {copied ? <><IcCheck /><span className="text-green-600">Copied!</span></> : <><IcCopy /> Copy HTML</>}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90 transition shadow-sm"
          >
            <IcDown /> Download HTML
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Blog Preview (left, takes all remaining space) ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Browser chrome bar */}
          <div className="flex-shrink-0 bg-gray-200 px-4 py-2 flex items-center gap-3 border-b border-gray-300">
            <div className="flex gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 border border-gray-300 truncate select-none">
              🌐 &nbsp;{heading || 'Blog Preview'}
            </div>
          </div>

          {/* iframe — fills all remaining height */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            srcDoc={generatedHTML}
            className="flex-1 w-full border-0 bg-white"
            title="Blog Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ display: 'block' }}
          />
        </div>

        {/* ── Chat / Edit Panel (right, fixed width) ── */}
        <div
          className="flex flex-col bg-white border-l border-gray-200 shrink-0"
          style={{ width: '340px' }}
        >
          {/* Panel Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                <IcPen />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI Blog Editor</p>
                <p className="text-[10px] text-gray-500">Chat to modify your blog</p>
              </div>
            </div>
          </div>

          {/* Quick Edit Chips */}
          <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Edits</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EDITS.map(s => (
                <button
                  key={s}
                  onClick={() => setChatInput(s)}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-700 border border-gray-200 hover:border-orange-300 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Messages — scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  msg.role === 'user'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                }`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`max-w-[82%] text-xs px-3 py-2.5 rounded-2xl leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                  <Spinner cls="h-3 w-3 text-white" />
                </div>
                <div className="bg-gray-100 text-gray-500 text-xs px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <span>Updating blog…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                placeholder="e.g. Add a FAQ section, change color to blue…"
                rows={3}
                disabled={chatLoading}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors resize-none bg-white"
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shrink-0 shadow-sm"
              >
                <IcSend />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
