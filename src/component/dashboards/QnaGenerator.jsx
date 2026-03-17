import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

function getAuthToken() {
  return (
    sessionStorage.getItem('clienttoken') ||
    localStorage.getItem('clienttoken') ||
    sessionStorage.getItem('admintoken') ||
    localStorage.getItem('admintoken') ||
    sessionStorage.getItem('usertoken') ||
    localStorage.getItem('usertoken') ||
    ''
  );
}

function authHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const FORMATS = ['FAQ', 'Quiz', 'Interview', 'Trivia', 'Survey'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const COUNTS = [5, 10, 15, 20];
const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu'];

const Spinner = ({ cls = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${cls}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const IcQ    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>;
const IcCopy = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IcDown = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>;
const IcCheck= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const IcTrash= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
const IcEdit = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/></svg>;

export default function QnaGenerator() {
  const [topic, setTopic]           = useState('');
  const [format, setFormat]         = useState('FAQ');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount]           = useState(10);
  const [language, setLanguage]     = useState('English');
  const [context, setContext]       = useState('');
  const [generating, setGenerating] = useState(false);
  const [qnas, setQnas]             = useState([]);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [editIdx, setEditIdx]       = useState(null);
  const [editVal, setEditVal]       = useState({ q: '', a: '' });

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    setQnas([]);
    setExpandedIdx(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ topic, format, difficulty, count, language, context }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate Q&A');
      setQnas(data.qnas || []);
      if (data.qnas?.length) setExpandedIdx(0);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (i) => {
    setQnas(p => p.filter((_, idx) => idx !== i));
    if (expandedIdx === i) setExpandedIdx(null);
  };

  const handleEditSave = (i) => {
    setQnas(p => p.map((item, idx) => idx === i ? { ...item, question: editVal.q, answer: editVal.a } : item));
    setEditIdx(null);
  };

  const handleCopyAll = async () => {
    const text = qnas.map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = qnas.map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-qna.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBadgeColor = {
    FAQ: 'bg-blue-50 text-blue-700 border-blue-200',
    Quiz: 'bg-purple-50 text-purple-700 border-purple-200',
    Interview: 'bg-green-50 text-green-700 border-green-200',
    Trivia: 'bg-pink-50 text-pink-700 border-pink-200',
    Survey: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  const difficultyColor = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-white to-orange-50 min-h-screen p-4 sm:p-6">
      <div className="w-full max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shrink-0 text-white">
            <IcQ />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Q&A Generator</h1>
            <p className="text-gray-500 text-sm">AI-powered questions & answers for any topic</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Config Panel ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />
              <div className="p-5 space-y-4">

                {/* Topic */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Topic *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Machine Learning, Indian History…"
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Format */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Format</label>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          format === f
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all ${
                          difficulty === d
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count + Language */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Count</label>
                    <select
                      value={count}
                      onChange={e => setCount(Number(e.target.value))}
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-orange-400 transition-colors"
                    >
                      {COUNTS.map(c => <option key={c} value={c}>{c} Q&As</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Language</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-orange-400 transition-colors"
                    >
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Context (optional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Context <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                  <textarea
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="Paste any extra context, article, or notes…"
                    rows={3}
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors bg-gray-50 focus:bg-white resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating || !topic.trim()}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3.5 rounded-2xl hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-200"
                >
                  {generating ? <><Spinner cls="h-4 w-4" /> Generating…</> : <><span>✨</span> Generate Q&A</>}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Results Panel ── */}
          <div className="lg:col-span-3">
            {qnas.length === 0 && !generating && (
              <div className="h-full min-h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-400 mb-4">
                  <IcQ />
                </div>
                <p className="text-gray-500 text-sm">Fill in the topic and click <span className="font-semibold text-orange-600">Generate Q&A</span></p>
                <p className="text-gray-400 text-xs mt-1">Your questions & answers will appear here</p>
              </div>
            )}

            {generating && (
              <div className="h-full min-h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-xl p-10">
                <Spinner cls="h-10 w-10 text-orange-500 mb-4" />
                <p className="text-gray-600 font-semibold text-sm">Generating {count} {format} questions…</p>
                <p className="text-gray-400 text-xs mt-1">This may take a few seconds</p>
              </div>
            )}

            {qnas.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />

                {/* Results header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{qnas.length} Q&As</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${formatBadgeColor[format]}`}>{format}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyColor[difficulty]}`}>{difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyAll}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                    >
                      {copied ? <><IcCheck /><span className="text-green-600">Copied!</span></> : <><IcCopy />Copy All</>}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90 transition shadow-sm"
                    >
                      <IcDown />Download
                    </button>
                  </div>
                </div>

                {/* Q&A list */}
                <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {qnas.map((item, i) => (
                    <div key={i} className="px-5 py-3">
                      {editIdx === i ? (
                        <div className="space-y-2">
                          <textarea
                            value={editVal.q}
                            onChange={e => setEditVal(p => ({ ...p, q: e.target.value }))}
                            rows={2}
                            className="w-full border-2 border-orange-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none resize-none"
                          />
                          <textarea
                            value={editVal.a}
                            onChange={e => setEditVal(p => ({ ...p, a: e.target.value }))}
                            rows={3}
                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditSave(i)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500 text-white hover:opacity-90 transition">Save</button>
                            <button onClick={() => setEditIdx(null)} className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            className="w-full text-left flex items-start justify-between gap-3 group"
                            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                              <p className="text-sm font-semibold text-gray-800 leading-snug">{item.question}</p>
                            </div>
                            <span className={`shrink-0 text-gray-400 transition-transform duration-200 ${expandedIdx === i ? 'rotate-180' : ''}`}>▾</span>
                          </button>

                          {expandedIdx === i && (
                            <div className="mt-2 ml-8">
                              <p className="text-sm text-gray-600 leading-relaxed bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100">{item.answer}</p>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => { setEditIdx(i); setEditVal({ q: item.question, a: item.answer }); }}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-orange-600 transition"
                                >
                                  <IcEdit />Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(i)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-red-500 transition"
                                >
                                  <IcTrash />Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-[11px] text-gray-400 text-center">Powered by Gemini AI · Click any question to expand</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
