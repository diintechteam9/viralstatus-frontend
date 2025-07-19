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
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const CreditWallet = () => {
  const [activeTab, setActiveTab] = useState("Campaign");
  const [timeRange, setTimeRange] = useState("7d");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState({
    totalBalance: 0,
    pendingCredits: 0,
    acceptedCredits: 0,
    rejectedCredits: 0,
    totalCampaigns: 0,
  });

  // Fetch wallet data from API
  useEffect(() => {
    fetchWallet();
  }, []);
  
  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("googleId");
      if (!userId) throw new Error("User not logged in");
      // Sync wallet first
      await axios.post(
        `${API_BASE_URL}/api/user/creditwallet/sync/${userId}`
      );
      // Then fetch wallet data
      const res = await axios.get(
        `${API_BASE_URL}/api/user/creditWallet/${userId}`
      );
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
      // Optionally handle error
    } finally {
      setIsLoading(false);
    }
  };

  const transactions = []; // or fetch real transactions if you have an API

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = "blue",
  }) => (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div
              className={`p-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-${color}-500 to-${color}-600`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-600">
              {title}
            </h3>
          </div>
          <div className="space-y-1">
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors">
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
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
            <div className="text-xs sm:text-sm text-gray-500">
              {transaction.engagement}% engagement
            </div>
          )}
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
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

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-60 text-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
                <Plus className="w-4 h-4" />
                Request Payout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-6">
        {/* Wallet Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
            subtitle="successfull task completion"
            color="green"
          />
          <StatCard
            icon={Megaphone}
            title="Participated Campaigns"
            value={`${walletData.totalCampaigns.toLocaleString()} credits`}
            color="blue"
          />
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-3 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Transaction History
              </h2>
              <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="3m">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTransactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
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
