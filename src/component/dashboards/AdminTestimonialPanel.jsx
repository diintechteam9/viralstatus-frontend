import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Star, CheckCircle, XCircle, RefreshCw, Search,
  MessageSquare, User, Trash2, Eye, EyeOff,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
    ))}
  </div>
);

const AdminTestimonialPanel = () => {
  const [list, setList]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState("pending"); // pending | approved | all
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast]         = useState(null);

  const token = localStorage.getItem("admintoken") || localStorage.getItem("adminToken") || localStorage.getItem("token");

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3000); };

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter === "pending")  params.set("isApproved", "false");
      if (filter === "approved") params.set("isApproved", "true");
      const res = await axios.get(`${API_BASE_URL}/api/testimonials/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) { setList(res.data.testimonials || []); setTotal(res.data.total || 0); }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [page, filter]);

  const handleApprove = async (id, approve) => {
    setActionLoading(id);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/testimonials/${id}/approve`,
        { isApproved: approve, isVisible: approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setList(prev => prev.map(t => t._id === id ? res.data.testimonial : t));
        showToast("success", approve ? "Review approved!" : "Review hidden");
      }
    } catch { showToast("error", "Action failed"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    setActionLoading(id);
    try {
      await axios.delete(`${API_BASE_URL}/api/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(prev => prev.filter(t => t._id !== id));
      showToast("success", "Review deleted");
    } catch { showToast("error", "Delete failed"); }
    finally { setActionLoading(null); }
  };

  const filtered = search
    ? list.filter(t => t.userName?.toLowerCase().includes(search.toLowerCase()) || t.review?.toLowerCase().includes(search.toLowerCase()))
    : list;

  const totalPages = Math.ceil(total / 20);
  const pending = list.filter(t => !t.isApproved).length;

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Testimonials</h2>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{total}</span>
          {pending > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{pending} pending</span>
          )}
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
            placeholder="Search by name or review..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[
            { key: "pending",  label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "all",      label: "All" },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                ${filter === f.key ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No testimonials found</p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t._id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all
              ${!t.isApproved ? "border-yellow-200 bg-yellow-50/30" : "border-gray-100"}`}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {t.avatarUrl
                    ? <img src={t.avatarUrl} alt={t.userName} className="w-full h-full object-cover" />
                    : <User className="w-5 h-5 text-orange-500" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800">{t.userName || "Anonymous"}</p>
                    {t.userCity && <p className="text-xs text-gray-400">{t.userCity}</p>}
                    <StarDisplay rating={t.rating} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {t.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">"{t.review}"</p>
                  {t.campaignName && (
                    <p className="text-xs text-orange-500 font-medium mt-1">Campaign: {t.campaignName}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!t.isApproved ? (
                    <button onClick={() => handleApprove(t._id, true)} disabled={actionLoading === t._id}
                      title="Approve"
                      className="p-2 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50">
                      {actionLoading === t._id
                        ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        : <CheckCircle className="w-4 h-4 text-green-500" />}
                    </button>
                  ) : (
                    <button onClick={() => handleApprove(t._id, false)} disabled={actionLoading === t._id}
                      title="Hide"
                      className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50">
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(t._id)} disabled={actionLoading === t._id}
                    title="Delete"
                    className="p-2 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">Previous</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all">Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonialPanel;
