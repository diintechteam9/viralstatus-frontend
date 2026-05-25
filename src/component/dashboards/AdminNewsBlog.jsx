import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../config";

const CATEGORIES = ["All", "News", "Blog", "Announcement", "Update", "Tips"];

const EMPTY_POST = {
  title: "", category: "News", summary: "", content: "",
  author: "", tags: "", imageUrl: "", published: true,
};

// Each image already has status from backend response
function PollinationImg({ img, selected, onSelect }) {
  return (
    <div
      onClick={() => img.status === 'ok' && onSelect()}
      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
        selected ? 'border-purple-600 ring-2 ring-purple-400' :
        img.status === 'ok' ? 'border-transparent hover:border-purple-300 cursor-pointer' :
        'border-transparent cursor-default'
      }`}
    >
      {img.status === 'loading' && (
        <div className="w-full h-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-400">Generating...</span>
        </div>
      )}
      {img.status === 'error' && (
        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-400">⚠ Failed</span>
        </div>
      )}
      {img.status === 'ok' && img.url && (
        <img src={img.url} alt="AI generated" className="w-full h-24 object-cover" />
      )}
      {selected && img.status === 'ok' && (
        <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Selected</span>
        </div>
      )}
    </div>
  );
}

function AdminNewsBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [form, setForm] = useState(EMPTY_POST);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");
  const [imgPrompt, setImgPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageGenMsg, setImageGenMsg] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadMsg, setCoverUploadMsg] = useState("");
  const coverFileRef = useRef(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiFilling, setAiFilling] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);
  const [postMedia, setPostMedia] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadMsg, setMediaUploadMsg] = useState("");
  const mediaFilesRef = useRef(null);

  const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");

  const buildMediaFromPost = (post) => {
    const list = [];
    const seen = new Set();
    if (Array.isArray(post?.media)) {
      post.media.forEach((m) => {
        if (!m?.url || seen.has(m.url)) return;
        seen.add(m.url);
        list.push({
          type: m.type === "video" ? "video" : "image",
          url: m.url,
          caption: m.caption || "",
        });
      });
    }
    if (post?.imageUrl && !seen.has(post.imageUrl)) {
      list.unshift({ type: "image", url: post.imageUrl, caption: "" });
    }
    return list;
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuOpenId && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpenId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog`);
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const resetForm = () => {
    setForm(EMPTY_POST);
    setGeneratedImages([]);
    setGeneratingImages(false);
    setImageGenMsg("");
    setCoverUploadMsg("");
    setCoverUploading(false);
    setImgPrompt("");
    setAiTopic("");
    setAiMsg("");
    setMsg("");
    setPostMedia([]);
    setMediaUploadMsg("");
    setMediaUploading(false);
  };

  const openCreate = () => { resetForm(); setEditPost(null); setShowForm(true); };

  const openEdit = (post) => {
    resetForm();
    setEditPost(post);
    setForm({
      title: post.title || "",
      category: post.category || "News",
      summary: post.summary || "",
      content: post.content || "",
      author: post.author || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "",
      imageUrl: post.imageUrl || "",
      published: post.published !== false,
    });
    setPostMedia(buildMediaFromPost(post));
    setShowForm(true);
  };

  const resolveCoverUrlForSave = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith("data:image/")) return imageUrl;
    const res = await fetch(`${API_BASE_URL}/api/news-blog/upload-cover-base64`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageData: imageUrl }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.imageUrl) {
      throw new Error(data.message || "Failed to upload cover image");
    }
    return data.imageUrl;
  };

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverUploadMsg("❌ Sirf image file (JPG, PNG, WebP) upload karein.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setCoverUploadMsg("❌ Image 8MB se chhoti honi chahiye.");
      return;
    }
    setCoverUploading(true);
    setCoverUploadMsg("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE_URL}/api/news-blog/upload-cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setForm((p) => ({ ...p, imageUrl: data.imageUrl }));
        setPostMedia((prev) => {
          if (prev.some((m) => m.url === data.imageUrl)) return prev;
          return [...prev, { type: "image", url: data.imageUrl, caption: "" }];
        });
        setCoverUploadMsg("✅ Image added to gallery.");
      } else {
        setCoverUploadMsg("❌ " + (data.message || "Upload failed"));
      }
    } catch {
      setCoverUploadMsg("❌ Upload failed. Backend / R2 check karo.");
    } finally {
      setCoverUploading(false);
    }
  };

  const selectGeneratedCover = async (img) => {
    const url = img.url || img.pollinationsUrl || "";
    if (!url) return;
    if (url.startsWith("data:image/")) {
      setCoverUploading(true);
      setCoverUploadMsg("Uploading selected image…");
      try {
        const hosted = await resolveCoverUrlForSave(url);
        setForm((p) => ({ ...p, imageUrl: hosted }));
        setCoverUploadMsg("✅ AI image cover ke liye save ho gayi.");
      } catch {
        setForm((p) => ({ ...p, imageUrl: url }));
        setCoverUploadMsg("⚠ Hosted upload fail — local preview use ho raha hai.");
      } finally {
        setCoverUploading(false);
      }
      return;
    }
    setForm((p) => ({ ...p, imageUrl: url }));
    setCoverUploadMsg("✅ Cover image selected.");
    setPostMedia((prev) => {
      if (prev.some((m) => m.url === url)) return prev;
      return [{ type: "image", url, caption: "" }, ...prev];
    });
  };

  const handleMediaFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setMediaUploading(true);
    setMediaUploadMsg("");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(`${API_BASE_URL}/api/news-blog/upload-media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.media) && data.media.length) {
        setPostMedia((prev) => [...prev, ...data.media]);
        const firstImg = data.media.find((m) => m.type === "image");
        if (firstImg && !form.imageUrl) {
          setForm((p) => ({ ...p, imageUrl: firstImg.url }));
        }
        setMediaUploadMsg(`Uploaded ${data.media.length} file(s) successfully.`);
      } else {
        setMediaUploadMsg(data.message || "Upload failed");
      }
    } catch {
      setMediaUploadMsg("Upload failed. Check backend and R2 for videos.");
    } finally {
      setMediaUploading(false);
    }
  };

  const removeMediaItem = (index) => {
    setPostMedia((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (form.imageUrl === removed?.url) {
        const nextImg = next.find((m) => m.type === "image");
        setForm((p) => ({ ...p, imageUrl: nextImg?.url || "" }));
      }
      return next;
    });
  };

  const setMediaAsCover = (url) => {
    setForm((p) => ({ ...p, imageUrl: url }));
    setPostMedia((prev) => {
      const item = prev.find((m) => m.url === url);
      if (!item) return prev;
      return [item, ...prev.filter((m) => m.url !== url)];
    });
  };

  const updateMediaCaption = (index, caption) => {
    setPostMedia((prev) => prev.map((m, i) => (i === index ? { ...m, caption } : m)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setMsg("Title and content are required."); return; }
    setSaving(true); setMsg("");
    try {
      let imageUrl = form.imageUrl;
      if (imageUrl?.startsWith("data:image/")) {
        imageUrl = await resolveCoverUrlForSave(imageUrl);
      }
      let media = postMedia.map(({ type, url, caption }) => ({
        type: type === "video" ? "video" : "image",
        url,
        caption: caption || "",
      }));
      if (imageUrl && !media.some((m) => m.url === imageUrl)) {
        media = [{ type: "image", url: imageUrl, caption: "" }, ...media];
      }
      if (!imageUrl && media.length) {
        const firstImg = media.find((m) => m.type === "image");
        if (firstImg) imageUrl = firstImg.url;
      }
      const body = {
        title: form.title,
        category: form.category,
        summary: form.summary,
        content: form.content,
        author: form.author,
        imageUrl,
        media,
        published: form.published,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      const url = editPost ? `${API_BASE_URL}/api/news-blog/${editPost._id}` : `${API_BASE_URL}/api/news-blog`;
      const res = await fetch(url, {
        method: editPost ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setShowForm(false); setMsg(editPost ? "Post updated!" : "Post created!"); fetchPosts(); }
      else setMsg(data.message || "Failed to save.");
    } catch { setMsg("Failed to save."); }
    finally { setSaving(false); }
  };

  const handleAiFill = async () => {
    if (!aiTopic.trim()) return;
    setAiFilling(true); setAiMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/news-blog-fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: aiTopic.trim(), category: form.category }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setForm(p => ({ ...p, title: d.title || p.title, summary: d.summary || p.summary, content: d.content || p.content, tags: d.tags || p.tags, author: d.author || p.author }));
        if (d.imagePrompt) setImgPrompt(d.imagePrompt);
        setAiMsg("✅ AI ne post generate kar diya! Review karke publish karo.");
      } else {
        setAiMsg("❌ " + (data.message || "AI fill failed"));
      }
    } catch { setAiMsg("❌ AI fill failed. Backend check karo."); }
    finally { setAiFilling(false); }
  };

  const mapImageSlot = (img, i) => ({
    id: `gen-${i}`,
    status: img?.success ? "ok" : "error",
    url: img?.data || null,
    pollinationsUrl: img?.pollinationsUrl || null,
    style: img?.style || null,
    error: img?.error || null,
  });

  // Generate 6 images one-by-one — UI updates after each (avoids long timeout)
  const handleGenerateImages = async () => {
    if (!imgPrompt.trim() || generatingImages) return;
    setImageGenMsg("");
    setGeneratingImages(true);
    setGeneratedImages(
      Array.from({ length: 6 }, (_, i) => ({
        id: `loading-${i}`,
        status: "loading",
        url: null,
        pollinationsUrl: null,
      }))
    );

    let okCount = 0;
    for (let i = 0; i < 6; i++) {
      setImageGenMsg(`Generating image ${i + 1} of 6…`);
      try {
        const res = await fetch(`${API_BASE_URL}/api/image-proxy/generate-one`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: imgPrompt.trim(), index: i }),
        });
        const data = await res.json();
        const img = data.image;
        if (img?.success) okCount += 1;
        setGeneratedImages((prev) => {
          const next = [...prev];
          next[i] = mapImageSlot(img, i);
          return next;
        });
      } catch (err) {
        setGeneratedImages((prev) => {
          const next = [...prev];
          next[i] = { id: `err-${i}`, status: "error", url: null, pollinationsUrl: null, error: err.message };
          return next;
        });
      }
      // Backend enforces Pollinations rate limit; short pause for UI
      if (i < 5) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    setGeneratingImages(false);
      setImageGenMsg(
      okCount === 6
        ? "✅ All 6 images ready — click one to select as cover."
        : okCount > 0
          ? `✅ ${okCount}/6 images generated (~15s gap each). Failed slots: Generate dubara try karein.`
          : "❌ No images generated. Backend restart karein aur prompt dubara try karein."
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(id);
    setMenuOpenId(null);
    try {
      await fetch(`${API_BASE_URL}/api/news-blog/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchPosts();
    } catch {}
    finally { setDeleting(null); }
  };

  const handleTogglePublish = async (post) => {
    setMenuOpenId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${post._id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ published: post.published === false }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(post.published === false ? "Post enabled (published)." : "Post disabled (draft).");
        fetchPosts();
      }
    } catch {
      setMsg("Failed to update publish status.");
    }
  };

  const contentPreview = (text, max = 380) => {
    if (!text) return "";
    const t = String(text).replace(/\s+/g, " ").trim();
    return t.length <= max ? t : `${t.slice(0, max).trim()}…`;
  };

  const filtered = posts.filter(p => {
    const matchCat = filterCat === "All" || p.category === filterCat;
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.author?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">News & Blog</h2>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} posts total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-violet-700 text-white text-sm font-semibold rounded-lg hover:bg-violet-800 transition-colors">
          + New Post
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${msg.includes("!") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterCat === cat ? "bg-violet-700 text-white" : "text-gray-600 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-48" />
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-semibold text-gray-600">No posts yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "New Post" to create your first post</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map(post => (
            <article
              key={post._id}
              className="relative bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:shadow-lg hover:border-violet-200/60 transition-all"
            >
              <div className="flex flex-col md:flex-row">
                {post.imageUrl && (
                  <div className="md:w-72 shrink-0">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-44 md:h-full min-h-[11rem] object-cover"
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
                <div className="flex-1 p-5 md:p-6 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        post.category === "News" ? "bg-blue-100 text-blue-700" :
                        post.category === "Blog" ? "bg-green-100 text-green-700" :
                        post.category === "Announcement" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{post.category}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${post.published !== false ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"}`}>
                        {post.published !== false ? "Published" : "Disabled"}
                      </span>
                    </div>
                    <div className="relative shrink-0" ref={menuOpenId === post._id ? menuRef : null}>
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === post._id ? null : post._id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-violet-700 transition-colors"
                        aria-label="Post settings"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                      {menuOpenId === post._id && (
                        <div className="absolute right-0 top-10 z-20 w-44 py-1 bg-white rounded-xl border border-gray-200 shadow-xl">
                          <button type="button" onClick={() => { setPreview(post); setMenuOpenId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">View</button>
                          <button type="button" onClick={() => { openEdit(post); setMenuOpenId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-violet-700 hover:bg-violet-50">Edit</button>
                          <button type="button" onClick={() => handleTogglePublish(post)} className="w-full text-left px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50">
                            {post.published !== false ? "Disable" : "Enable"}
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            type="button"
                            onClick={() => handleDelete(post._id)}
                            disabled={deleting === post._id}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deleting === post._id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">{post.title}</h3>
                  {post.summary && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-4">{post.summary}</p>
                  )}
                  {post.content && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-3 border-l-2 border-violet-200 pl-3">
                      {contentPreview(post.content, 420)}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-3">
                    <span>{post.author || "Admin"}</span>
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                    <span className="text-gray-300">|</span>
                    <span>❤️ {post.likesCount || 0}</span>
                    <span>💬 {post.commentsCount || 0}</span>
                    <span>↗ {post.shareCount || 0}</span>
                  </div>

                  {(post.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md text-[11px] font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-violet-700 rounded-t-2xl">
              <h3 className="text-white font-bold text-lg">{editPost ? "Edit Post" : "Create New Post"}</h3>
              <button onClick={() => setShowForm(false)} className="text-white hover:text-gray-200 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* AI Fill */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-1">✨ AI Content Generator</p>
                <p className="text-xs text-violet-600 mb-3">Topic likho — AI title, summary, content, tags sab generate karega</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-violet-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAiFill())}
                    placeholder="e.g. influencer marketing tips India 2025"
                  />
                  <button type="button" onClick={handleAiFill} disabled={!aiTopic.trim() || aiFilling}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5">
                    {aiFilling ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : "✨ AI Fill"}
                  </button>
                </div>
                {aiMsg && <p className={`mt-2 text-xs font-medium ${aiMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{aiMsg}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title *</label>
                  <input className={inp} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Post title" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                  <select className={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Author</label>
                  <input className={inp} value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="Author name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Summary</label>
                  <input className={inp} value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} placeholder="Short description" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Content *</label>
                  <textarea className={inp} rows={8} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Full post content..." required />
                </div>

                {/* Photos & Videos */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Photos &amp; Videos</label>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload multiple images and videos (MP4/WebM). First image is used as lead photo on the news page.
                  </p>

                  <input
                    ref={mediaFilesRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="hidden"
                    onChange={handleMediaFilesUpload}
                  />
                  <button
                    type="button"
                    onClick={() => mediaFilesRef.current?.click()}
                    disabled={mediaUploading}
                    className="mb-4 w-full py-3 px-4 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mediaUploading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                    ) : (
                      <>Upload images &amp; videos (multiple)</>
                    )}
                  </button>
                  {mediaUploadMsg && (
                    <p className={`text-xs mb-3 font-medium ${mediaUploadMsg.includes("success") || mediaUploadMsg.includes("Uploaded") ? "text-green-600" : "text-red-600"}`}>
                      {mediaUploadMsg}
                    </p>
                  )}

                  {postMedia.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {postMedia.map((item, idx) => (
                        <div key={`${item.url}-${idx}`} className="relative bg-gray-50 rounded-lg overflow-hidden shadow-sm">
                          {item.type === "video" ? (
                            <video src={item.url} className="w-full h-28 object-cover bg-black" controls muted />
                          ) : (
                            <img src={item.url} alt="" className="w-full h-28 object-cover" />
                          )}
                          <div className="p-2 space-y-1">
                            <input
                              className="w-full text-[10px] border border-gray-200 rounded px-1.5 py-1"
                              placeholder="Caption (optional)"
                              value={item.caption || ""}
                              onChange={(e) => updateMediaCaption(idx, e.target.value)}
                            />
                            <div className="flex gap-1">
                              {item.type === "image" && (
                                <button
                                  type="button"
                                  onClick={() => setMediaAsCover(item.url)}
                                  className={`flex-1 text-[10px] py-1 rounded font-semibold ${form.imageUrl === item.url ? "bg-violet-700 text-white" : "bg-violet-100 text-violet-800"}`}
                                >
                                  {form.imageUrl === item.url ? "Lead photo" : "Set lead"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeMediaItem(idx)}
                                className="text-[10px] py-1 px-2 rounded bg-red-100 text-red-700 font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pollinations Generator */}
                  <div className="bg-purple-50 rounded-xl p-4 mb-3">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">🎨 AI Image Generator</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        className="flex-1 border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        value={imgPrompt}
                        onChange={e => setImgPrompt(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleGenerateImages())}
                        placeholder="e.g. influencer marketing digital India vibrant"
                      />
                      <button type="button" onClick={handleGenerateImages} disabled={!imgPrompt.trim() || generatingImages || coverUploading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5">
                        {generatingImages ? (
                          <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                        ) : (
                          "✨ Generate 6"
                        )}
                      </button>
                    </div>

                    {imageGenMsg && (
                      <p className={`text-xs mb-2 font-medium ${imageGenMsg.startsWith("✅") ? "text-green-600" : imageGenMsg.startsWith("❌") ? "text-red-500" : "text-purple-600"}`}>
                        {imageGenMsg}
                      </p>
                    )}

                    {generatedImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {generatedImages.map((img, idx) => (
                          <PollinationImg
                            key={img.id || `slot-${idx}`}
                            img={img}
                            selected={form.imageUrl === (img.url || img.pollinationsUrl)}
                            onSelect={() => selectGeneratedCover(img)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Single cover (legacy / quick) */}
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 mt-2">Quick single image</p>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleCoverFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={coverUploading}
                    className="w-full py-2 mb-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    {coverUploading ? "Uploading…" : "Add one image file"}
                  </button>
                  {coverUploadMsg && (
                    <p className={`text-xs mb-2 ${coverUploadMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{coverUploadMsg}</p>
                  )}

                  <label className="block text-xs text-gray-400 mb-1">Or paste media URL:</label>
                  <input className={inp} value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
                  {form.imageUrl && (
                    <div className="mt-2 relative">
                      <img src={form.imageUrl} alt="preview" className="w-full h-32 object-cover rounded-lg border border-gray-200" onError={e => e.target.style.display = "none"} />
                      <button type="button" onClick={() => setForm(p => ({ ...p, imageUrl: "" }))}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hover:bg-red-600">Remove</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tags (comma separated)</label>
                  <input className={inp} value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="yovoai, campaign, tips" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input type="checkbox" id="published" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="w-4 h-4 accent-violet-600" />
                  <label htmlFor="published" className="text-sm font-medium text-gray-700">Publish immediately</label>
                </div>
              </div>

              {msg && <p className="text-sm text-red-600">{msg}</p>}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-60 flex items-center gap-2">
                  {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : (editPost ? "Update Post" : "Publish Post")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const pm = buildMediaFromPost(preview);
              const lead = pm[0];
              return lead ? (
                lead.type === "video" ? (
                  <video src={lead.url} className="w-full max-h-64 object-cover bg-black" controls />
                ) : (
                  <img src={lead.url} alt={preview.title} className="w-full h-48 object-cover" />
                )
              ) : null;
            })()}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">{preview.category}</span>
                <span className="text-xs text-gray-400">{preview.createdAt ? new Date(preview.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{preview.title}</h2>
              {preview.summary && <p className="text-gray-500 text-sm mb-4 italic">{preview.summary}</p>}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-100 pt-4">{preview.content}</div>
              {(preview.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  {preview.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full text-xs">#{tag}</span>)}
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">By {preview.author || "Admin"}</span>
                <button onClick={() => setPreview(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNewsBlog;
