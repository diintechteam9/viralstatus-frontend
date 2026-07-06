import React from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS FOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════

// Premium Card Component
export const PremiumCard = ({ 
  icon: Icon, 
  label, 
  value, 
  sub, 
  gradient, 
  loading, 
  trend,
  onClick 
}) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl border border-white/10 backdrop-blur-sm cursor-pointer transition-all hover:shadow-3xl hover:scale-105 ${gradient}`}
  >
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-3xl" />
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-widest">{label}</p>
          {loading ? (
            <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse mt-3" />
          ) : (
            <div className="flex items-baseline gap-2 mt-3">
              <p className="text-4xl font-black">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 text-sm font-semibold bg-white/20 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="w-3 h-3" />
                  {trend}
                </div>
              )}
            </div>
          )}
          {sub && <p className="text-xs opacity-70 mt-2 font-medium">{sub}</p>}
        </div>
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  </div>
);

// Mini Card Component
export const MiniCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = "blue", 
  loading, 
  trend,
  onClick 
}) => {
  const colorMap = {
    blue: "from-blue-600 to-blue-500",
    pink: "from-pink-600 to-pink-500",
    purple: "from-purple-600 to-purple-500",
    teal: "from-teal-600 to-teal-500",
    orange: "from-orange-600 to-orange-500",
    yellow: "from-yellow-600 to-yellow-500",
    green: "from-green-600 to-green-500",
    red: "from-red-600 to-red-500",
  };

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg border border-white/10 bg-gradient-to-br cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${colorMap[color]}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">{label}</p>
          {loading ? (
            <div className="h-6 w-20 bg-white/20 rounded-lg animate-pulse mt-2" />
          ) : (
            <div className="flex items-baseline gap-1 mt-2">
              <p className="text-2xl font-black">{value}</p>
              {trend && <span className="text-xs opacity-75 font-medium">{trend}</span>}
            </div>
          )}
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ label, value, color, percentage, icon: Icon }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-300">{label}</span>
      </div>
      <span className="text-sm font-black text-white">₹{value.toLocaleString()}</span>
    </div>
    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 group-hover:shadow-lg group-hover:shadow-orange-500/50`}
        style={{ width: `${Math.min(100, percentage)}%` }}
      />
    </div>
  </div>
);

// Stat Row Component
export const StatRow = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-semibold text-gray-300">{label}</span>
    </div>
    <span className="text-lg font-black text-white">{value.toLocaleString()}</span>
  </div>
);

// Section Header Component
export const SectionHeader = ({ icon: Icon, title, color = "from-orange-500 to-orange-400" }) => (
  <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
    <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    {title}
  </h3>
);

// Loading Skeleton Component
export const SkeletonLoader = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse border border-white/10" />
    ))}
  </div>
);

// Empty State Component
export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 text-center">{description}</p>
  </div>
);

// Circular Progress Component
export const CircularProgress = ({ percentage, completed, total, submitted }) => (
  <div className="flex items-center gap-8">
    <div className="relative w-32 h-32 shrink-0">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 50}`}
          strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{percentage}%</span>
        <span className="text-xs text-gray-400 font-semibold">Complete</span>
      </div>
    </div>

    <div className="flex-1 space-y-4">
      <StatRow 
        label="Completed" 
        value={completed} 
        icon={TrendingUp} 
        color="from-green-500 to-emerald-400" 
      />
      <StatRow 
        label="Total Assigned" 
        value={total} 
        icon={TrendingUp} 
        color="from-orange-500 to-amber-400" 
      />
      <StatRow 
        label="Submitted" 
        value={submitted} 
        icon={TrendingUp} 
        color="from-blue-500 to-cyan-400" 
      />
    </div>
  </div>
);

// Card Container Component
export const CardContainer = ({ children, className = "" }) => (
  <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 ${className}`}>
    {children}
  </div>
);

// Grid Container Component
export const GridContainer = ({ children, cols = "grid-cols-1 lg:grid-cols-2" }) => (
  <div className={`grid ${cols} gap-6`}>
    {children}
  </div>
);

// Header Component
export const DashboardHeader = ({ title, subtitle, onRefresh, loading }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-4xl font-black text-white mb-2">{title}</h1>
      <p className="text-gray-400 flex items-center gap-2">
        {subtitle}
      </p>
    </div>
    <button
      onClick={onRefresh}
      disabled={loading}
      className="p-3 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
    >
      <TrendingUp className={`w-5 h-5 text-white ${loading ? "animate-spin" : ""}`} />
    </button>
  </div>
);

export default {
  PremiumCard,
  MiniCard,
  ProgressBar,
  StatRow,
  SectionHeader,
  SkeletonLoader,
  EmptyState,
  CircularProgress,
  CardContainer,
  GridContainer,
  DashboardHeader,
};
