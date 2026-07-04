import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Shield, CheckCircle, XCircle, Clock, Eye, Search,
  Filter, RefreshCw, AlertCircle, User, FileText,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const STATUS_CFG = {
  pending:      { label: "Pending",      cls: "bg-gray-100 text-gray-600 border-gray-200" },
  submitted:    { label: "Submitted",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
  under_review: { label: "Under Review", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved:     { label: "Approved",     cls: "bg-green-100 text-green-700 border-green-200" },
  rejected:     { label: "Rejected",     cls: "bg-red-100 text-red-700 border-red-200" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>{cfg.label}</span>;
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const KYCDetailModal = ({ kyc, token, onClose, onUpdated }) => {
  const [action, setAction]   = useState("");
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleReview = async () => {
    if (!action) return setError("Select approve or reject");
    if (action === "rejected" && !reason.trim()) return setError("Rejection reason required");
    setLoading(true);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/kyc/review/${kyc.userId}`,
        { status: action, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) { onUpdated(res.data.kyc); onClose(); }
    } catch (err) {
      setError(err.response?.data?.message || "Review failed");
    } finally { setLoading(false); }
  };

  const DocImg = ({ url, label }) => url ? (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={label} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-all" />
      </a>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800">KYC Review</h3>
            <StatusBadge status={kyc.status} />
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-all">
            <XCircle className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Personal */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ["Full Name",    kyc.fullName],
              ["DOB",          kyc.dateOfBirth],
              ["Gender",       kyc.gender],
              ["PAN",          kyc.panNumber],
              ["Aadhaar",      kyc.aadharNumber ? `XXXX XXXX ${kyc.aadharNumber.slice(-4)}` : ""],
              ["City",         kyc.city],
              ["State",        kyc.state],
              ["Pincode",      kyc.pincode],
              ["Bank",         kyc.bankName],
              ["Account",      kyc.accountNumber ? `XXXX${kyc.accountNumber.slice(-4)}` : ""],
              ["IFSC",         kyc.ifscCode],
              ["UPI",          kyc.upiId],
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium">{l}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{v}</p>
              </div>
            ))}
          </div>

          {/* Documents */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DocImg url={kyc.panImageUrl}    label="PAN Card" />
            <DocImg url={kyc.aadharFrontUrl} label="Aadhaar Front" />
            <DocImg url={kyc.aadharBackUrl}  label="Aadhaar Back" />
            <DocImg url={kyc.selfieUrl}      label="Selfie" />
          </div>

          {/* Action */}
          {kyc.status !== "approved" && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-700">Review Decision</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setAction("approved")}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2
                    ${action === "approved" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setAction("rejected")}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2
                    ${action === "rejected" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:border-red-300"}`}>
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
              {action === "rejected" && (
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none"
                  rows={2} placeholder="Reason for rejection..."
                  value={reason} onChange={e => setReason(e.target.value)}
                />
              )}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <button onClick={handleReview} disabled={loading || !action}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : "Submit Decision"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminKYCPanel = () => {
  const [list, setList]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem("admintoken") || localStorage.getItem("adminToken") || localStorage.getItem("token");

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await axios.get(`${API_BASE_URL}/api/kyc?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) { setList(res.data.kyc || []); setTotal(res.data.total || 0); }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [page, statusFilter]);

  const handleUpdated = (updated) => {
    setList(prev => prev.map(k => k.userId === updated.userId ? updated : k));
  };

  const filtered = search
    ? list.filter(k => k.fullName?.toLowerCase().includes(search.toLowerCase()) || k.userId?.includes(search))
    : list;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">KYC Management</h2>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{total}</span>
        </div>
        <button onClick={fetchList} disabled={loading} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="Search by name or user ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No KYC records found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(k => (
              <div key={k._id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{k.fullName || "—"}</p>
                  <p className="text-xs text-gray-400 truncate">{k.userId}</p>
                  {k.submittedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted: {new Date(k.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
                <StatusBadge status={k.status} />
                <button onClick={() => setSelected(k)}
                  className="p-2 hover:bg-orange-50 rounded-xl transition-all ml-1">
                  <Eye className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">Previous</button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">Next</button>
          </div>
        )}
      </div>

      {selected && (
        <KYCDetailModal kyc={selected} token={token} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  );
};

export default AdminKYCPanel;
