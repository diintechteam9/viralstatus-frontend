import React, { useState, useRef, useEffect } from "react";
import {
  FaArrowLeft, FaBrain, FaPen, FaBullhorn, FaPaperPlane,
  FaRobot, FaStar, FaLightbulb, FaChartLine, FaMagic,
  FaLayerGroup, FaShareAlt, FaCalendarAlt, FaFileAlt,
  FaBolt, FaGlobe, FaHashtag, FaVideo, FaImage, FaCopy, FaCheck, FaStop,
  FaHistory, FaTrash, FaChevronRight,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

function renderText(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (/^#{1,3}\s/.test(line)) {
      const content = line.replace(/^#{1,3}\s/, "");
      return <p key={i} className="text-white font-bold text-sm mt-4 mb-1 tracking-wide uppercase">{renderInline(content)}</p>;
    }
    if (/^[A-Z][A-Z\s\-&:()]{4,}$/.test(line.trim())) {
      return <p key={i} className="text-white font-bold text-sm mt-4 mb-1 tracking-wide">{line}</p>;
    }
    if (/^\d+\.\s/.test(line)) {
      const clean = line.replace(/\*\*(.*?)\*\*/g, "$1");
      return <p key={i} className="text-white/80 text-sm pl-2 py-0.5">{clean}</p>;
    }
    if (/^[-*]\s/.test(line)) {
      const clean = line.replace(/^[-*]\s/, "").replace(/\*\*(.*?)\*\*/g, "$1");
      return (
        <p key={i} className="text-white/70 text-sm pl-3 py-0.5 flex gap-2">
          <span className="text-white/30 flex-shrink-0">·</span><span>{clean}</span>
        </p>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    const clean = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^#+\s*/, "");
    return <p key={i} className="text-white/75 text-sm py-0.5 leading-relaxed">{clean}</p>;
  });
}

const AGENTS = [
  {
    id: "yovo",
    name: "Yovo",
    title: "Master Agent",
    tagline: "Your AI Strategist & Orchestrator",
    emoji: "🧠",
    gradient: "from-[#6C3DE8] via-[#8B5CF6] to-[#A78BFA]",
    darkGradient: "from-[#4C1D95] to-[#6C3DE8]",
    softBg: "from-[#F5F3FF] to-[#EDE9FE]",
    border: "border-purple-300",
    glow: "shadow-purple-300",
    textColor: "text-purple-700",
    badgeBg: "bg-purple-100 text-purple-700",
    ringColor: "ring-purple-400",
    accentColor: "#7C3AED",
    description: "Yovo is your master strategist. Give it your big goal and it coordinates Yo & Vo to deliver a complete brand execution plan.",
    powers: [
      { icon: <FaBrain />, label: "Full Brand Strategy" },
      { icon: <FaLayerGroup />, label: "Multi-Agent Coordination" },
      { icon: <FaChartLine />, label: "Growth Roadmap" },
      { icon: <FaMagic />, label: "Master Campaign Plan" },
    ],
    tasks: ["Launch my brand on social media", "Create a 30-day growth plan", "Build a complete digital presence"],
    icon: <FaBrain className="text-white" size={26} />,
  },
  {
    id: "yo",
    name: "Yo",
    title: "Creator Agent",
    tagline: "Your AI Content Factory",
    emoji: "✍️",
    gradient: "from-[#E8193C] via-[#F43F5E] to-[#FB7185]",
    darkGradient: "from-[#9F1239] to-[#E8193C]",
    softBg: "from-[#FFF1F2] to-[#FFE4E6]",
    border: "border-rose-300",
    glow: "shadow-rose-300",
    textColor: "text-rose-600",
    badgeBg: "bg-rose-100 text-rose-600",
    ringColor: "ring-rose-400",
    accentColor: "#F43F5E",
    description: "Yo is your creative powerhouse. It generates reels, captions, carousels, blogs, hashtags and trending content — all tailored to your brand.",
    powers: [
      { icon: <FaVideo />, label: "Reel Scripts & Ideas" },
      { icon: <FaFileAlt />, label: "Captions & Blogs" },
      { icon: <FaImage />, label: "Carousel Content" },
      { icon: <FaHashtag />, label: "Hashtag Strategy" },
    ],
    tasks: ["Write 7 reel scripts for my brand", "Create a week of Instagram captions", "Generate blog + carousel + hashtags"],
    icon: <FaPen className="text-white" size={22} />,
  },
  {
    id: "vo",
    name: "Vo",
    title: "Distributor Agent",
    tagline: "Your AI Distribution Engine",
    emoji: "📢",
    gradient: "from-[#059669] via-[#10B981] to-[#34D399]",
    darkGradient: "from-[#064E3B] to-[#059669]",
    softBg: "from-[#ECFDF5] to-[#D1FAE5]",
    border: "border-emerald-300",
    glow: "shadow-emerald-300",
    textColor: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-700",
    ringColor: "ring-emerald-400",
    accentColor: "#10B981",
    description: "Vo is your distribution strategist. It plans where, when and how to publish your content for maximum reach and engagement.",
    powers: [
      { icon: <FaGlobe />, label: "Platform Strategy" },
      { icon: <FaCalendarAlt />, label: "Posting Schedule" },
      { icon: <FaShareAlt />, label: "Distribution Plan" },
      { icon: <FaChartLine />, label: "Engagement Tactics" },
    ],
    tasks: ["Build my platform distribution plan", "Create a 30-day posting schedule", "Suggest best times to post per platform"],
    icon: <FaBullhorn className="text-white" size={22} />,
  },
];

export default function AgentsPage({ agent: agentId, onBack, onOpenTool }) {
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const token = sessionStorage.getItem("clienttoken") || localStorage.getItem("clienttoken") ||
    sessionStorage.getItem("admintoken") || localStorage.getItem("admintoken");

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/history?agentId=${agentId}&limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setHistory(data.history);
    } catch (_) {}
    setHistoryLoading(false);
  };

  const fetchHistoryItem = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSelectedHistory(data.item);
    } catch (_) {}
  };

  const deleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/api/agent/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((h) => h.filter((x) => x._id !== id));
      if (selectedHistory?._id === id) setSelectedHistory(null);
    } catch (_) {}
  };

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const agentColors = { yovo: "#7C3AED", yo: "#F43F5E", vo: "#10B981" };
  const agentEmojis = { yovo: "🧠", yo: "✍️", vo: "📢" };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0F0F13]/90 backdrop-blur-md border-b border-white/10 px-5 sm:px-10 py-4 flex items-center gap-4">
        <button onClick={showHistory ? () => { setShowHistory(false); setSelectedHistory(null); } : onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm font-medium">
          <FaArrowLeft size={12} /> Back
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
            <FaRobot className="text-white" size={13} />
          </div>
          <span className="font-bold text-white text-sm">YovoAI</span>
          <span className="text-white/20 mx-1">·</span>
          <span className="text-sm font-semibold" style={{ color: agent.accentColor }}>
            {agent.emoji} {agent.name} — {agent.title}
          </span>
        </div>
        <button onClick={() => { setShowHistory(!showHistory); setSelectedHistory(null); }}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition">
          <FaHistory size={11} /> History
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
        {showHistory ? (
          <HistoryPanel
            history={history}
            loading={historyLoading}
            selectedHistory={selectedHistory}
            onSelect={fetchHistoryItem}
            onDelete={deleteHistory}
            onClose={() => { setShowHistory(false); setSelectedHistory(null); }}
            agentColors={agentColors}
            agentEmojis={agentEmojis}
          />
        ) : agent.id === "yovo" ? (
          <CollabTaskScreen agent={agent} token={token} onHistoryUpdate={fetchHistory} onOpenTool={onOpenTool} />
        ) : (
          <AgentTaskScreen agent={agent} token={token} onHistoryUpdate={fetchHistory} onOpenTool={onOpenTool} />
        )}
      </div>
    </div>
  );
}

function SelectionScreen({ onSelect }) {
  return (
    <>
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase">
          <FaBolt size={10} className="text-yellow-400" /> AI Agents — Beta
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Choose Your <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">Agent</span>
        </h1>
        <p className="text-white/40 text-base max-w-lg mx-auto">
          Three specialized AI agents, each built for a different job. Pick the one that matches your goal.
        </p>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {AGENTS.map((agent, i) => (
          <button key={agent.id} onClick={() => onSelect(agent)}
            className="group relative text-left rounded-3xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            style={{ "--glow": agent.accentColor }}>

            {/* Top gradient bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${agent.gradient}`} />

            <div className="p-7">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                style={{ boxShadow: `0 8px 24px ${agent.accentColor}55` }}>
                {agent.icon}
              </div>

              {/* Name & Badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-white">{agent.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.badgeBg}`}>{agent.title}</span>
              </div>
              <p className="text-xs font-semibold mb-3" style={{ color: agent.accentColor }}>{agent.tagline}</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">{agent.description}</p>

              {/* Powers */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {agent.powers.map((p, j) => (
                  <div key={j} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <span style={{ color: agent.accentColor }} className="text-xs">{p.icon}</span>
                    <span className="text-xs text-white/60 font-medium">{p.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`w-full bg-gradient-to-r ${agent.gradient} rounded-xl py-2.5 text-center text-sm font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity`}
                style={{ boxShadow: `0 4px 16px ${agent.accentColor}44` }}>
                Start with {agent.name} →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom info */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
          <FaLightbulb className="text-white" size={15} />
        </div>
        <div>
          <p className="font-bold text-white text-sm mb-1">How do they work together?</p>
          <p className="text-xs text-white/40 leading-relaxed">
            <span className="text-purple-400 font-semibold">Yovo</span> (Master) takes your big goal and coordinates both agents.{" "}
            <span className="text-rose-400 font-semibold">Yo</span> (Creator) builds all your content.{" "}
            <span className="text-emerald-400 font-semibold">Vo</span> (Distributor) plans where and when to publish it. Together they deliver a complete brand kit.
          </p>
        </div>
      </div>
    </>
  );
}

function HistoryPanel({ history, loading, selectedHistory, onSelect, onDelete, agentColors, agentEmojis }) {
  const agentNames = { yovo: "Yovo", yo: "Yo", vo: "Vo" };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <FaHistory style={{ color: "#F59E0B" }} />
        <h2 className="text-white font-bold text-lg">Task History</h2>
        <span className="text-white/30 text-xs ml-auto">{history.length} tasks</span>
      </div>

      {loading && (
        <div className="text-center py-10 text-white/30 text-sm">Loading history...</div>
      )}

      {!loading && history.length === 0 && (
        <div className="text-center py-16 rounded-3xl border border-white/10 bg-white/5">
          <FaHistory className="mx-auto mb-3 text-white/20" size={28} />
          <p className="text-white/30 text-sm">No history yet. Complete a task to see it here.</p>
        </div>
      )}

      {/* History List */}
      {!selectedHistory && history.map((item) => (
        <button key={item._id} onClick={() => onSelect(item._id)}
          className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 px-5 py-4 transition group flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: `${agentColors[item.agentId]}22`, border: `1px solid ${agentColors[item.agentId]}44` }}>
            {agentEmojis[item.agentId]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold" style={{ color: agentColors[item.agentId] }}>{agentNames[item.agentId]}</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/30 text-xs">{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              {item.status === "stopped" && <span className="text-xs text-yellow-500/70 ml-1">(stopped)</span>}
            </div>
            <p className="text-white/70 text-sm truncate">{item.task}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={(e) => onDelete(item._id, e)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition">
              <FaTrash size={10} />
            </button>
            <FaChevronRight className="text-white/20" size={11} />
          </div>
        </button>
      ))}

      {/* Selected History Detail */}
      {selectedHistory && (
        <div className="space-y-4">
          <button onClick={() => onSelect(null) || true}
            className="text-xs text-white/40 hover:text-white transition flex items-center gap-1.5 mb-2">
            <FaArrowLeft size={10} /> Back to list
          </button>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold" style={{ color: agentColors[selectedHistory.agentId] }}>
                {agentEmojis[selectedHistory.agentId]} {agentNames[selectedHistory.agentId]}
              </span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/30 text-xs">{new Date(selectedHistory.createdAt).toLocaleString("en-IN")}</span>
            </div>
            <p className="text-white font-semibold text-sm">{selectedHistory.task}</p>
          </div>

          {selectedHistory.response && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              <div className="space-y-0.5">{renderText(selectedHistory.response)}</div>
            </div>
          )}
          {selectedHistory.yoOutput && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#F43F5E33" }}>
              <div className="px-4 py-2 text-xs font-bold" style={{ color: "#F43F5E", background: "#F43F5E11" }}>✍️ Yo — Content</div>
              <div className="p-5 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <div className="space-y-0.5">{renderText(selectedHistory.yoOutput)}</div>
              </div>
            </div>
          )}
          {selectedHistory.voOutput && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#10B98133" }}>
              <div className="px-4 py-2 text-xs font-bold" style={{ color: "#10B981", background: "#10B98111" }}>📢 Vo — Distribution</div>
              <div className="p-5 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <div className="space-y-0.5">{renderText(selectedHistory.voOutput)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Collab mode: teeno agents aapas mein communicate karte hain (only for Yovo)
function CollabTaskScreen({ agent, token, onHistoryUpdate }) {
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [activeAgent, setActiveAgent] = useState(""); // 'yovo' | 'yo' | 'vo'
  const [phases, setPhases] = useState([]); // completed phases log
  const [yoText, setYoText] = useState("");
  const [voText, setVoText] = useState("");
  const [yovoSummary, setYovoSummary] = useState("");
  const [done, setDone] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  const handleSubmit = async () => {
    if (!task.trim() || loading) return;
    abortRef.current = new AbortController();
    setLoading(true);
    setError("");
    setPhases([]);
    setYoText("");
    setVoText("");
    setYovoSummary("");
    setDone(false);
    setCurrentPhase("");
    setActiveAgent("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/collab`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentStreamAgent = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") { setDone(true); break; }
          try {
            const parsed = JSON.parse(raw);

            if (parsed.event === "phase") {
              setCurrentPhase(parsed.label);
              setActiveAgent(parsed.agent);
              currentStreamAgent = parsed.agent;
              setPhases((p) => [...p, { agent: parsed.agent, label: parsed.label }]);
            } else if (parsed.event === "yo_done" || parsed.event === "vo_done") {
              setPhases((p) => [...p, { agent: parsed.event === "yo_done" ? "yo" : "vo", label: parsed.label, done: true }]);
            } else if (parsed.event === "done") {
              setDone(true);
              setCurrentPhase("");
              setActiveAgent("");
            } else if (parsed.event === "error") {
              throw new Error(parsed.message);
            } else if (parsed.token) {
              // token belongs to current streaming agent
              if (currentStreamAgent === "yo") setYoText((p) => p + parsed.token);
              else if (currentStreamAgent === "vo") setVoText((p) => p + parsed.token);
              else if (currentStreamAgent === "yovo") setYovoSummary((p) => p + parsed.token);
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setLoading(false); };

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleReset = () => {
    setTask(""); setYoText(""); setVoText(""); setYovoSummary("");
    setPhases([]); setDone(false); setError(""); setCurrentPhase(""); setActiveAgent("");
  };

  const agentMeta = {
    yovo: { color: "#7C3AED", emoji: "🧠", name: "Yovo" },
    yo:   { color: "#F43F5E", emoji: "✍️", name: "Yo" },
    vo:   { color: "#10B981", emoji: "📢", name: "Vo" },
  };

  const hasOutput = yoText || voText || yovoSummary;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Agent Hero Banner */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${agent.darkGradient} p-8 mb-8`}
        style={{ boxShadow: `0 20px 60px ${agent.accentColor}40` }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ background: agent.accentColor }} />
        <div className="relative flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center shadow-2xl flex-shrink-0`}>
            {agent.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-white">{agent.name}</h2>
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">{agent.title}</span>
            </div>
            <p className="text-white/50 text-sm font-medium mb-1">{agent.tagline}</p>
            <p className="text-white/70 text-sm leading-relaxed">{agent.description}</p>
          </div>
        </div>
        {/* Collab badge */}
        <div className="relative mt-5 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-bold text-white/80">Collab Mode — Yovo coordinates Yo & Vo</span>
        </div>
      </div>

      {/* Task Input */}
      {!hasOutput && !loading && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
          <label className="block text-sm font-bold text-white/80 mb-4">
            🎯 Give Yovo your big goal — all 3 agents will work together
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder={`e.g. ${agent.tasks[0]}`}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/25 focus:outline-none transition resize-none"
            onFocus={(e) => (e.target.style.borderColor = agent.accentColor)}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <div className="mt-4 mb-6">
            <p className="text-xs text-white/30 font-semibold mb-3 uppercase tracking-wider">Quick Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {agent.tasks.map((t, i) => (
                <button key={i} onClick={() => setTask(t)}
                  className="text-xs px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 bg-white/5 hover:bg-white/10 transition font-medium">
                  {t}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button onClick={handleSubmit} disabled={!task.trim()}
            className={`w-full bg-gradient-to-r ${agent.gradient} text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm`}
            style={{ boxShadow: task.trim() ? `0 8px 24px ${agent.accentColor}55` : "none" }}>
            <FaBolt size={13} /> Launch All 3 Agents
          </button>
        </div>
      )}

      {/* Live Agent Pipeline */}
      {(loading || hasOutput) && (
        <div className="space-y-5">
          {/* Phase status bar */}
          {loading && currentPhase && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
                style={{ background: agentMeta[activeAgent]?.color || "#fff" }} />
              <span className="text-sm text-white/70 font-medium">{currentPhase}</span>
              <button onClick={handleStop} className="ml-auto flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition">
                <FaStop size={9} /> Stop
              </button>
            </div>
          )}

          {/* Yo Output */}
          {yoText && (
            <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "#F43F5E44" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#F43F5E22", background: "#F43F5E11" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#F43F5E", animation: (loading && activeAgent === "yo") ? "pulse 1s infinite" : "none" }} />
                  <span className="text-xs font-bold" style={{ color: "#F43F5E" }}>✍️ Yo — Content Creator</span>
                </div>
                {!(loading && activeAgent === "yo") && (
                  <button onClick={() => handleCopy(yoText, "yo")}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition">
                    {copiedKey === "yo" ? <FaCheck size={9} /> : <FaCopy size={9} />}
                    {copiedKey === "yo" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="p-5 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <div className="space-y-0.5">{renderText(yoText)}</div>
              </div>
            </div>
          )}

          {/* Vo Output */}
          {voText && (
            <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "#10B98144" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#10B98122", background: "#10B98111" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#10B981", animation: (loading && activeAgent === "vo") ? "pulse 1s infinite" : "none" }} />
                  <span className="text-xs font-bold" style={{ color: "#10B981" }}>📢 Vo — Distribution Strategist</span>
                </div>
                {!(loading && activeAgent === "vo") && (
                  <button onClick={() => handleCopy(voText, "vo")}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition">
                    {copiedKey === "vo" ? <FaCheck size={9} /> : <FaCopy size={9} />}
                    {copiedKey === "vo" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="p-5 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <div className="space-y-0.5">{renderText(voText)}</div>
              </div>
            </div>
          )}

          {/* Yovo Final Summary */}
          {yovoSummary && (
            <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "#7C3AED44" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#7C3AED22", background: "#7C3AED11" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#7C3AED", animation: (loading && activeAgent === "yovo") ? "pulse 1s infinite" : "none" }} />
                  <span className="text-xs font-bold" style={{ color: "#A78BFA" }}>🧠 Yovo — Master Summary</span>
                </div>
                {!(loading && activeAgent === "yovo") && (
                  <button onClick={() => handleCopy(yovoSummary, "yovo")}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition">
                    {copiedKey === "yovo" ? <FaCheck size={9} /> : <FaCopy size={9} />}
                    {copiedKey === "yovo" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="p-5 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                <div className="space-y-0.5">{renderText(yovoSummary)}</div>
              </div>
            </div>
          )}

          {/* Done — action buttons */}
          {done && (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
              <span className="text-xs text-white/50 font-medium">🎯 All agents completed</span>
              <button onClick={handleReset}
                className="text-xs px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition font-medium">
                New Task
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// Tool mapping — task keywords se tool detect karo
const TOOL_MAP = [
  { keywords: ["reel", "script", "reel script"], tool: "ReelGenerator" },
  { keywords: ["blog", "article", "post"], tool: "BlogGenerator" },
  { keywords: ["caption", "hook", "hashtag"], tool: "CaptionHookGenerator" },
  { keywords: ["carousel", "slide"], tool: "CarouselGenerator" },
  { keywords: ["news"], tool: "NewsGenerator" },
  { keywords: ["review"], tool: "ReviewGenerator" },
  { keywords: ["infographic", "stats", "data visual"], tool: "InfographicGenerator" },
  { keywords: ["podcast", "voice", "audio"], tool: "VoicePodcastGenerator" },
  { keywords: ["trend", "idea", "trending"], tool: "TrendIdeaGenerator" },
  { keywords: ["q&a", "qna", "question", "faq"], tool: "QnaGenerator" },
  { keywords: ["product compar", "vs ", "versus"], tool: "ProductComparator" },
  { keywords: ["trip", "travel", "destination"], tool: "TripAdvisor" },
  { keywords: ["itinerary", "day plan", "schedule"], tool: "ItineraryGenerator" },
  { keywords: ["landing page", "website", "portfolio"], tool: "LandingPageGenerator" },
];

function detectTool(task) {
  const lower = task.toLowerCase();
  for (const entry of TOOL_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.tool;
  }
  return null;
}

function AgentTaskScreen({ agent, token, onHistoryUpdate, onOpenTool }) {
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [detectedTool, setDetectedTool] = useState(null);
  const abortRef = useRef(null);
  const responseRef = useRef(null);

  const handleSubmit = async () => {
    if (!task.trim() || loading) return;
    setLoading(true);
    setResponse("");
    setError("");
    setDetectedTool(detectTool(task));

    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId: agent.id, task }),
        signal: abortRef.current?.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) {
              setResponse((prev) => prev + parsed.token);
              setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setResponse("");
    setError("");
    setTask("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Agent Hero Banner */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${agent.darkGradient} p-8 mb-8`}
        style={{ boxShadow: `0 20px 60px ${agent.accentColor}40` }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: agent.accentColor }} />
        <div className="relative flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center shadow-2xl flex-shrink-0`}>
            {agent.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-white">{agent.name}</h2>
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">{agent.title}</span>
            </div>
            <p className="text-white/50 text-sm font-medium mb-1">{agent.tagline}</p>
            <p className="text-white/70 text-sm leading-relaxed">{agent.description}</p>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2">
          {agent.powers.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <span className="text-white/70 text-xs">{p.icon}</span>
              <span className="text-white/70 text-xs font-medium">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task Input */}
      {!response && !loading && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
          <label className="block text-sm font-bold text-white/80 mb-4">
            {agent.emoji} What do you want {agent.name} to do?
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder={`e.g. ${agent.tasks[0]}`}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/25 focus:outline-none transition resize-none"
            onFocus={e => e.target.style.borderColor = agent.accentColor}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <div className="mt-4 mb-6">
            <p className="text-xs text-white/30 font-semibold mb-3 uppercase tracking-wider">Quick Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {agent.tasks.map((t, i) => (
                <button key={i} onClick={() => setTask(t)}
                  className="text-xs px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 bg-white/5 hover:bg-white/10 transition font-medium">
                  {t}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button onClick={handleSubmit} disabled={!task.trim()}
            className={`w-full bg-gradient-to-r ${agent.gradient} text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm`}
            style={{ boxShadow: task.trim() ? `0 8px 24px ${agent.accentColor}55` : "none" }}>
            <FaPaperPlane size={13} /> Give Task to {agent.name}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !response && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: agent.accentColor, animationDelay: "0ms" }} />
            <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: agent.accentColor, animationDelay: "150ms" }} />
            <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: agent.accentColor, animationDelay: "300ms" }} />
          </div>
          <p className="text-white/50 text-sm">{agent.name} is working on your task...</p>
          <button onClick={handleStop} className="mt-4 flex items-center gap-2 mx-auto text-xs text-white/30 hover:text-white/60 transition">
            <FaStop size={10} /> Stop
          </button>
        </div>
      )}

      {/* Streaming Response */}
      {(response || (loading && response)) && (
        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: agent.accentColor, animation: loading ? "pulse 1s infinite" : "none" }} />
              <span className="text-xs font-semibold text-white/60">{loading ? `${agent.name} is writing...` : `${agent.name} — Done`}</span>
            </div>
            <div className="flex items-center gap-2">
              {!loading && (
                <>
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition">
                    {copied ? <FaCheck size={10} /> : <FaCopy size={10} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  {detectedTool && onOpenTool && (
                    <button
                      onClick={() => onOpenTool(detectedTool, { topic: task, prefillText: response })}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold text-white transition"
                      style={{ background: agent.accentColor }}>
                      Open in Tool →
                    </button>
                  )}
                  <button onClick={handleReset}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition">
                    New Task
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <div className="space-y-0.5">{renderText(response)}</div>
            <div ref={responseRef} />
          </div>
        </div>
      )}
    </div>
  );
}
