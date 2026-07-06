import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3, LineChart, PieChart, TrendingUp, Calendar,
  Download, Filter, RefreshCw, Eye, Heart, Share2, MessageSquare,
  Clock, Zap, Target, Award, Users, Activity
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import {
  PremiumCard, MiniCard, CardContainer, GridContainer,
  SectionHeader, StatRow, SkeletonLoader, DashboardHeader
} from "./DashboardComponents";

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("earnings");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/activity/stats`);
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fmt = (n) => {
    if (n === undefined || n === null) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  // Mock data for charts
  const chartData = {
    earnings: [
      { day: "Mon", value: 120 },
      { day: "Tue", value: 190 },
      { day: "Wed", value: 150 },
      { day: "Thu", value: 220 },
      { day: "Fri", value: 280 },
      { day: "Sat", value: 250 },
      { day: "Sun", value: 310 },
    ],
    engagement: [
      { day: "Mon", views: 1200, likes: 120 },
      { day: "Tue", views: 1900, likes: 190 },
      { day: "Wed", views: 1500, likes: 150 },
      { day: "Thu", views: 2200, likes: 220 },
      { day: "Fri", views: 2800, likes: 280 },
      { day: "Sat", views: 2500, likes: 250 },
      { day: "Sun", views: 3100, likes: 310 },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <DashboardHeader
          title="Analytics & Stats"
          subtitle="Detailed performance metrics and insights"
          onRefresh={fetchStats}
          loading={loading}
        />

        {/* Time Range Filter */}
        <div className="flex gap-3 flex-wrap">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all border ${
                timeRange === range
                  ? "bg-orange-500 text-white border-orange-400"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : range === "90d" ? "Last 90 Days" : "Last Year"}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <GridContainer cols="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <PremiumCard
            icon={Eye}
            label="Total Views"
            value={fmt(stats?.totalViews)}
            sub="Across all content"
            gradient="bg-gradient-to-br from-blue-600 to-cyan-400"
            loading={loading}
            trend="+15.3%"
          />
          <PremiumCard
            icon={Heart}
            label="Total Likes"
            value={fmt(stats?.totalLikes)}
            sub="Engagement rate"
            gradient="bg-gradient-to-br from-pink-600 to-rose-400"
            loading={loading}
            trend="+8.2%"
          />
          <PremiumCard
            icon={Share2}
            label="Campaigns"
            value={fmt(stats?.totalCampaigns)}
            sub="Active campaigns"
            gradient="bg-gradient-to-br from-purple-600 to-pink-400"
            loading={loading}
            trend="+5.1%"
          />
          <PremiumCard
            icon={Activity}
            label="Task Records"
            value={fmt(stats?.totalTaskRecords)}
            sub="Submissions made"
            gradient="bg-gradient-to-br from-teal-600 to-cyan-400"
            loading={loading}
            trend="+12.7%"
          />
        </GridContainer>

        {/* Charts Section */}
        <GridContainer cols="grid-cols-1 lg:grid-cols-2">
          {/* Earnings Chart */}
          <CardContainer>
            <SectionHeader icon={BarChart3} title="Earnings Trend" color="from-orange-500 to-orange-400" />
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-4">
                {chartData.earnings.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">{item.day}</span>
                      <span className="text-sm font-bold text-white">₹{item.value}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                        style={{ width: `${(item.value / 310) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContainer>

          {/* Engagement Chart */}
          <CardContainer>
            <SectionHeader icon={LineChart} title="Engagement Metrics" color="from-pink-500 to-rose-400" />
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-4">
                {chartData.engagement.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">{item.day}</span>
                      <div className="flex gap-4">
                        <span className="text-xs text-blue-400">👁 {fmt(item.views)}</span>
                        <span className="text-xs text-pink-400">❤ {fmt(item.likes)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{ width: `${(item.views / 3100) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-400"
                          style={{ width: `${(item.likes / 310) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContainer>
        </GridContainer>

        {/* Performance Breakdown */}
        <CardContainer>
          <SectionHeader icon={PieChart} title="Performance Breakdown" color="from-purple-500 to-pink-400" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Rate */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#grad1)"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">92%</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-300">Completion Rate</p>
              <p className="text-xs text-gray-500 mt-1">18 of 25 tasks</p>
            </div>

            {/* Engagement Rate */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#grad2)"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * 0.35}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">87%</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-300">Engagement Rate</p>
              <p className="text-xs text-gray-500 mt-1">45K views, 3.2K likes</p>
            </div>

            {/* Earnings Potential */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#grad3)"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * 0.15}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">78%</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-300">Earnings Potential</p>
              <p className="text-xs text-gray-500 mt-1">₹1.5K earned</p>
            </div>
          </div>
        </CardContainer>

        {/* Top Performers */}
        <CardContainer>
          <SectionHeader icon={Award} title="Top Performing Content" color="from-yellow-500 to-amber-400" />
          
          <div className="space-y-3">
            {[
              { title: "Campaign A", views: 12500, likes: 890, engagement: "7.1%" },
              { title: "Campaign B", views: 9800, likes: 720, engagement: "7.3%" },
              { title: "Campaign C", views: 8200, likes: 580, engagement: "7.1%" },
              { title: "Campaign D", views: 6500, likes: 420, engagement: "6.5%" },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="text-xs font-bold text-orange-400">{item.engagement}</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>👁 {fmt(item.views)} views</span>
                  <span>❤ {fmt(item.likes)} likes</span>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>

        {/* Export Section */}
        <div className="flex gap-3 justify-end">
          <button className="px-6 py-3 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
