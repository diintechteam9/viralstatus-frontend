import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Search,
  Calendar,
  Download,
  CreditCard,
  Trophy,
  Target,
  Zap,
  Eye,
  MoreVertical,
  RefreshCw,
  Clock10Icon,
  LucideClock10,
  Megaphone,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import WithdrawFlow from "./WithdrawFlow";

// Create axios instance with Bearer token
const getAxiosInstance = () => {
  const token = localStorage.getItem("mobileUserToken");
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

const CreditWallet = ({ onGoToKYC }) => {
  const [timeRange, setTimeRange] = useState("7d");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [walletData, setWalletData] = useState({
    totalBalance: 0,
    pendingCredits: 0,
    acceptedCredits: 0,
    rejectedCredits: 0,
    totalCampaigns: 0,
  });

  useEffect(() => {
    fetchWallet();
  }, []);
  
  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const axiosInstance = getAxiosInstance();
      await axiosInstance.post(`/api/user/creditwallet/sync`);
      const res = await axiosInstance.get(`/api/user/creditwallet`);
      if (res.data && res.data.wallet) {
        setWalletData({
          totalBalance: res.data.wallet.totalBalance || 0,
          pendingCredits: res.data.wallet.pendingCredits || 0,
          acceptedCredits: res.data.wallet.acceptedCredits || 0,
          rejectedCredits: res.data.wallet.rejectedCredits || 0,
          totalCampaigns: res.data.wallet.totalCampaigns || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const transactions = [];

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = "blue",
  }) => {
    const colorMap = {
      blue: "from-blue-600 to-blue-500",
      green: "from-green-600 to-green-500",
      orange: "from-orange-600 to-orange-500",
      purple: "from-purple-600 to-purple-500",
    };
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`p-2 rounded-lg sm:rounded-xl bg-gradient-to-r ${colorMap[color]}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">
                {title}
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {trend > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownLeft className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
    };

    const icons = {
      pending: Clock,
      accepted: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle,
    };

    const Icon = icons[status];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const TransactionRow = ({ transaction }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 hover:bg-white/20 rounded-lg transition-colors">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
        <div
          className={`p-2 rounded-lg ${
            transaction.type === "earned" ? "bg-green-100" : "bg-blue-100"
          }`}
        >
          {transaction.type === "earned" ? (
            <ArrowUpRight
              className={`w-4 h-4 ${
                transaction.type === "earned"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
              {transaction.description}
            </h4>
            <StatusBadge status={transaction.status} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <span>{new Date(transaction.date).toLocaleDateString()}</span>
            {transaction.campaign && (
              <span className="hidden sm:inline">• {transaction.campaign}</span>
            )}
            {transaction.platform && (
              <span className="hidden sm:inline">• {transaction.platform}</span>
            )}
            {transaction.views && (
              <span className="hidden sm:inline">
                • {transaction.views.toLocaleString()} views
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
        <div className="text-right">
          <div
            className={`font-bold text-sm sm:text-base ${
              transaction.type === "earned" ? "text-green-600" : "text-blue-600"
            }`}
          >
            {transaction.type === "earned" ? "+" : ""}
            {transaction.amount} credits
          </div>
          {transaction.engagement && (
            <div className="text-xs sm:text-sm text-gray-600">
              {transaction.engagement}% engagement
            </div>
          )}
        </div>
        <button className="p-1 hover:bg-white/30 rounded">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.campaign?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || transaction.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Credit Wallet
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your earnings and track campaign performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={fetchWallet}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-700 rounded-lg transition-colors disabled:opacity-60 text-sm border border-white/30"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all text-sm shadow-lg">
                <Plus className="w-4 h-4" />
                Request Payout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Wallet Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            icon={Wallet}
            title="Total Balance"
            value={`${walletData.totalBalance.toLocaleString()} credits`}
            subtitle="Available for withdrawal"
            color="blue"
          />
          <StatCard
            icon={LucideClock10}
            title="Pending Credits"
            value={`${walletData.pendingCredits.toLocaleString()} credits`}
            subtitle="Under review"
            color="green"
          />
          <StatCard
            icon={CheckCircle}
            title="Accepted Credits"
            value={`${walletData.acceptedCredits.toLocaleString()} credits`}
            subtitle="Successful task completion"
            color="green"
          />
          <StatCard
            icon={Megaphone}
            title="Participated Campaigns"
            value={`${walletData.totalCampaigns.toLocaleString()}`}
            color="orange"
          />
        </div>

        {/* Withdraw Card - Shows when button clicked */}
        {showWithdraw && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
            <div className="p-4 border-b border-white/20 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold text-gray-900">Request Withdrawal</h2>
              <button
                onClick={() => setShowWithdraw(false)}
                className="p-1.5 hover:bg-white/30 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <WithdrawFlow onGoToKYC={onGoToKYC} />
            </div>
          </div>
        )}

        {/* Transactions Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
          <div className="p-3 sm:p-6 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Transaction History
              </h2>
              <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-700 rounded-lg transition-colors text-sm border border-white/30">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-white/30 bg-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900 placeholder-gray-600"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-white/30 bg-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-white/30 bg-white/20 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="3m">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-white/20">
            {filteredTransactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-600">
                <Wallet className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">
                  No transactions found matching your criteria.
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditWallet;
