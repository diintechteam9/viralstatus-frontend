import React, { useState, useEffect } from "react";
import {
  FaFolder, FaFolderOpen, FaPlus, FaTrash, FaEdit, FaInstagram,
  FaDownload, FaSpinner, FaArrowLeft, FaVideo, FaTimes, FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

// ── Helpers ───────────────────────────────────────────────────────────────────
const isValidInstaReel = (url) => {
  try {
    const p = new URL(url);
    return (p.hostname === "www.instagram.com" || p.hostname === "instagram.com");
  } catch { return false; }
};

// ── Folder Reels View ─────────────────────────────────────────────────────────
function FolderReelsView({ folder, poolId, onBack }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instaUrl, setInstaUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState("");
  const [dlSuccess, setDlSuccess] = useState("");
  const [deleting, setDeleting] = useState(null);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/folders/${folder._id}/reels`);
      const data = await res.json();
      setReels(data.reels || []);
    } catch { setReels([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReels(); }, [folder._id]);

  const handleDownload = async () => {
    const trimmed = instaUrl.trim();
    if (!trimmed) return;
    if (!isValidInstaReel(trimmed)) {
      setDlError("Invalid Instagram URL. Use: https://www.instagram.com/reel/XXXXX/");
      return;
    }
    setDownloading(true);
    setDlError("");
    setDlSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/folders/${folder._id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");
      setDlSuccess("Reel downloaded and saved to folder!");
      setInstaUrl("");
      fetchReels();
    } catch (e) {
      setDlError(e.message || "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm("Delete this reel?")) return;
    setDeleting(reelId);
    try {
      await fetch(`${API_BASE_URL}/api/pools/reels/${reelId}`, { method: "DELETE" });
      setReels((prev) => prev.filter((r) => r._id !== reelId));
    } catch { }
    finally { setDeleting(null); }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
        >
          <FaArrowLeft size={12} /> Back to Folders
        </button>
        <div className="flex items-center gap-2">
          <FaFolderOpen className="text-yellow-500" size={20} />
          <h2 className="text-lg font-bold text-gray-800">{folder.name}</h2>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            {reels.length} reels
          </span>
        </div>
      </div>

      {/* Instagram Download Box */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaInstagram className="text-pink-500" size={16} />
          <span className="font-semibold text-gray-800 text-sm">Download Instagram Reel to this Folder</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={instaUrl}
            onChange={(e) => { setInstaUrl(e.target.value); setDlError(""); setDlSuccess(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleDownload()}
            placeholder="https://www.instagram.com/reel/XXXXXXX/"
            className="flex-1 px-4 py-2.5 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
            disabled={downloading}
          />
          <button
            onClick={handleDownload}
            disabled={downloading || !instaUrl.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
          >
            {downloading ? <FaSpinner className="animate-spin" size={13} /> : <FaDownload size={13} />}
            {downloading ? "Downloading..." : "Download & Save"}
          </button>
        </div>
        {downloading && (
          <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
            <FaSpinner className="animate-spin" size={10} />
            Downloading reel and uploading to storage... this may take a minute.
          </p>
        )}
        {dlError && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <FaExclamationTriangle size={12} /> {dlError}
          </div>
        )}
        {dlSuccess && (
          <div className="flex items-center gap-2 mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <FaCheck size={12} /> {dlSuccess}
          </div>
        )}
      </div>

      {/* Reels Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <FaSpinner className="animate-spin mr-2" /> Loading reels...
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <FaVideo className="text-gray-300 text-4xl mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reels in this folder yet</p>
          <p className="text-gray-400 text-sm mt-1">Paste an Instagram Reel URL above to download</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {reels.map((reel, idx) => (
            <div key={reel._id} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteReel(reel._id)}
                  disabled={deleting === reel._id}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow"
                >
                  {deleting === reel._id ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                </button>
              </div>
              <div className="aspect-[9/16] w-full bg-gray-900 rounded-t-xl overflow-hidden">
                {reel.s3Url ? (
                  <video src={reel.s3Url} controls className="w-full h-full object-cover" style={{ background: "#222" }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FaVideo className="text-3xl" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">{reel.title || `Reel #${idx + 1}`}</p>
                <p className="text-xs text-gray-400">{new Date(reel.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main: Pool Folder View ────────────────────────────────────────────────────
export default function PoolFolderView({ pool }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${pool._id}/folders`);
      const data = await res.json();
      setFolders(data.folders || []);
    } catch { setFolders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFolders(); }, [pool._id]);

  const handleCreate = async () => {
    if (!newFolderName.trim()) { setCreateError("Folder name is required"); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${pool._id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create folder");
      setNewFolderName("");
      setShowCreate(false);
      fetchFolders();
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (folderId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this folder? Reels inside will be moved back to the pool.")) return;
    try {
      await fetch(`${API_BASE_URL}/api/pools/folders/${folderId}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((f) => f._id !== folderId));
    } catch { }
  };

  const handleRenameStart = (folder, e) => {
    e.stopPropagation();
    setRenamingId(folder._id);
    setRenameValue(folder.name);
  };

  const handleRenameSubmit = async (folderId) => {
    if (!renameValue.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => prev.map((f) => f._id === folderId ? { ...f, name: data.folder.name } : f));
      }
    } catch { }
    finally { setRenaming(false); setRenamingId(null); }
  };

  // Show folder contents
  if (selectedFolder) {
    return (
      <FolderReelsView
        folder={selectedFolder}
        poolId={pool._id}
        onBack={() => { setSelectedFolder(null); fetchFolders(); }}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FaFolder className="text-yellow-500" size={18} />
          <h3 className="text-base font-bold text-gray-800">Folders in "{pool.name}"</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{folders.length}</span>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(""); setNewFolderName(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-semibold shadow-sm"
        >
          <FaPlus size={11} /> New Folder
        </button>
      </div>

      {/* Create Folder Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800">Create New Folder</h4>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => { setNewFolderName(e.target.value); setCreateError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Folder name"
              className="w-full border border-orange-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
              autoFocus
              disabled={creating}
            />
            {createError && <p className="text-red-500 text-xs mb-2">{createError}</p>}
            <div className="flex gap-2 justify-end mt-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-60 flex items-center gap-2"
              >
                {creating ? <FaSpinner className="animate-spin" size={12} /> : null}
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <FaSpinner className="animate-spin mr-2" /> Loading folders...
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <FaFolder className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No folders yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "New Folder" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <div
              key={folder._id}
              onClick={() => setSelectedFolder(folder)}
              className="group relative bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:shadow-md hover:border-yellow-400 transition-all duration-200"
            >
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => handleRenameStart(folder, e)}
                  className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition shadow"
                  title="Rename"
                >
                  <FaEdit size={10} />
                </button>
                <button
                  onClick={(e) => handleDelete(folder._id, e)}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow"
                  title="Delete"
                >
                  <FaTrash size={10} />
                </button>
              </div>

              <FaFolder className="text-yellow-400 group-hover:text-yellow-500 transition-colors mb-2" size={40} />

              {/* Rename inline */}
              {renamingId === folder._id ? (
                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(folder._id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full text-xs border border-orange-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400 text-center"
                    autoFocus
                    disabled={renaming}
                  />
                  <div className="flex gap-1 mt-1 justify-center">
                    <button
                      onClick={() => handleRenameSubmit(folder._id)}
                      className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                      disabled={renaming}
                    >
                      {renaming ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-gray-700 text-center truncate w-full">{folder.name}</p>
              )}

              <p className="text-xs text-gray-400 mt-1">{folder.reelCount || 0} reels</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
