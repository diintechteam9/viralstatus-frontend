import { useState, useEffect, useCallback, useMemo } from 'react'
import { API_BASE_URL } from '../../config'
import './News.css'

const CATEGORIES = ['All', 'News', 'Blog', 'Announcement', 'Update', 'Tips']

function getVisitorId() {
  let id = localStorage.getItem('yovo_visitor_id')
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('yovo_visitor_id', id)
  }
  return id
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatIso(d) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 19)
}

function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolvePostMedia(post) {
  if (!post) return []
  const list = []
  const seen = new Set()
  if (Array.isArray(post.media)) {
    post.media.forEach((m, i) => {
      if (!m?.url || seen.has(m.url)) return
      seen.add(m.url)
      const type =
        m.type === 'video' || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(m.url) ? 'video' : 'image'
      list.push({ id: m._id || `m-${i}`, type, url: m.url, caption: m.caption || '' })
    })
  }
  if (post.imageUrl && !seen.has(post.imageUrl)) {
    list.unshift({ id: 'cover', type: 'image', url: post.imageUrl, caption: '' })
  }
  return list
}

function splitParagraphs(text) {
  if (!text) return []
  return String(text)
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function buildToc(paragraphs) {
  const items = []
  paragraphs.forEach((p, i) => {
    if (items.length >= 8) return
    if (p.length >= 20 && p.length <= 120) {
      items.push({
        id: `sec-${i}`,
        label: p.length > 85 ? `${p.slice(0, 85).trim()}…` : p,
      })
    }
  })
  return items
}

function IconHeart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function TrendingSidebar({ posts, currentId, onSelect, title = 'Trending Stories' }) {
  const items = posts.filter((p) => p._id !== currentId).slice(0, 8)
  if (!items.length) return null

  return (
    <aside className="news-aside-block">
      <h2 className="news-aside-title">
        <span className="news-aside-title-icon" aria-hidden="true" />
        {title}
      </h2>
      {items.map((post, idx) => {
        const media = resolvePostMedia(post)
        const thumb = media.find((m) => m.type === 'image') || media[0]
        const isActive = post._id === currentId
        return (
          <div
            key={post._id}
            className={`news-trend-row ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelect(post)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(post)}
            role="button"
            tabIndex={0}
          >
            <div className="news-trend-row-thumb">
              {thumb?.type === 'video' ? (
                <video src={thumb.url} muted playsInline preload="metadata" />
              ) : thumb ? (
                <img src={thumb.url} alt="" loading="lazy" />
              ) : null}
              <span className="news-trend-row-rank">#{idx + 1}</span>
            </div>
            <div>
              <p className="news-trend-row-title">{post.title}</p>
              <p className="news-trend-row-meta">
                {formatIso(post.createdAt)} · <span className="author">By {post.author || 'YovoAI Team'}</span>
              </p>
            </div>
          </div>
        )
      })}
    </aside>
  )
}

function TrendingWebStories({ posts, currentId, onSelect }) {
  const items = posts.filter((p) => p._id !== currentId).slice(0, 4)
  if (!items.length) return null

  return (
    <aside className="news-aside-block">
      <h2 className="news-aside-title">
        <span className="news-aside-title-icon" aria-hidden="true" />
        Related Stories
      </h2>
      {items.map((post) => {
        const media = resolvePostMedia(post)
        const thumb = media.find((m) => m.type === 'image') || media[0]
        return (
          <div
            key={post._id}
            className="news-trend-card"
            onClick={() => onSelect(post)}
            role="button"
            tabIndex={0}
          >
            {thumb && (
              <img src={thumb.url} alt="" loading="lazy" />
            )}
            <div className="news-trend-card-overlay">
              <p className="news-trend-card-title">{post.title}</p>
              <p className="news-trend-card-meta">
                {formatDate(post.createdAt)} · {post.author || 'YovoAI Team'}
              </p>
            </div>
          </div>
        )
      })}
    </aside>
  )
}

export default function News() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState([])
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [engagement, setEngagement] = useState({})
  const [shareToast, setShareToast] = useState('')

  const visitorId = getVisitorId()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog?published=true`)
      const data = await res.json()
      const list = Array.isArray(data.posts) ? data.posts : []
      setPosts(list)
      const eng = {}
      list.forEach((p) => {
        eng[p._id] = {
          likesCount: p.likesCount || 0,
          shareCount: p.shareCount || 0,
          commentsCount: p.commentsCount || 0,
          liked: (p.likedBy || []).includes(visitorId),
        }
      })
      setEngagement(eng)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [visitorId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const loadComments = async (postId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${postId}/comments`)
      const data = await res.json()
      setComments(Array.isArray(data.comments) ? data.comments : [])
    } catch {
      setComments([])
    }
  }

  const openPost = (post) => {
    setSelected(post)
    setCommentName('')
    setCommentText('')
    setShareToast('')
    loadComments(post._id)
    window.history.replaceState({}, '', `${window.location.pathname}?post=${post._id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closePost = () => {
    setSelected(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  useEffect(() => {
    const postId = new URLSearchParams(window.location.search).get('post')
    if (!postId || !posts.length || selected) return
    const p = posts.find((x) => x._id === postId)
    if (p) {
      setSelected(p)
      loadComments(p._id)
    }
  }, [posts, selected])

  const handleLike = async (postId, e) => {
    e?.stopPropagation?.()
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      })
      const data = await res.json()
      if (data.success) {
        setEngagement((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], likesCount: data.likesCount, liked: data.liked },
        }))
      }
    } catch { /* ignore */ }
  }

  const copyShareLink = async (post) => {
    const url = `${window.location.origin}/landingpage/news?post=${post._id}`
    await navigator.clipboard.writeText(url)
    setShareToast('Link copied')
    setTimeout(() => setShareToast(''), 3000)
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${post._id}/share`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setEngagement((prev) => ({
          ...prev,
          [post._id]: { ...prev[post._id], shareCount: data.shareCount },
        }))
      }
    } catch { /* ignore */ }
  }

  const handleShare = async (post, e) => {
    e?.stopPropagation?.()
    const url = `${window.location.origin}/landingpage/news?post=${post._id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.summary || '', url })
      } else {
        await copyShareLink(post)
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${post._id}/share`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setEngagement((prev) => ({
          ...prev,
          [post._id]: { ...prev[post._id], shareCount: data.shareCount },
        }))
      }
    } catch { /* cancelled */ }
  }

  const shareWhatsApp = async (post) => {
    const url = `${window.location.origin}/landingpage/news?post=${post._id}`
    window.open(`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`, '_blank', 'noopener')
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${post._id}/share`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setEngagement((prev) => ({
          ...prev,
          [post._id]: { ...prev[post._id], shareCount: data.shareCount },
        }))
      }
    } catch { /* ignore */ }
  }

  const submitComment = async (postId) => {
    if (!commentName.trim() || !commentText.trim()) return
    setCommentSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: commentName.trim(),
          text: commentText.trim(),
          visitorId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setComments((prev) => [data.comment, ...prev])
        setCommentText('')
        setEngagement((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], commentsCount: data.commentsCount },
        }))
      }
    } catch { /* ignore */ }
    finally {
      setCommentSubmitting(false)
    }
  }

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        const matchCat = filterCat === 'All' || p.category === filterCat
        const q = search.trim().toLowerCase()
        const matchSearch =
          !q ||
          p.title?.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q)
        return matchCat && matchSearch
      }),
    [posts, filterCat, search]
  )

  const articleNav = useMemo(() => {
    if (!selected) return { prev: null, next: null }
    const idx = filtered.findIndex((p) => p._id === selected._id)
    return {
      prev: idx > 0 ? filtered[idx - 1] : null,
      next: idx >= 0 && idx < filtered.length - 1 ? filtered[idx + 1] : null,
    }
  }, [selected, filtered])

  if (selected) {
    const media = resolvePostMedia(selected)
    const lead = media[0]
    const restMedia = media.slice(1)
    const paragraphs = splitParagraphs(selected.content)
    const toc = buildToc(paragraphs)
    const eng = engagement[selected._id] || {}

    return (
      <div className="news-portal">
        <div className="news-wrap">
          {lead && (
            <div className="news-article-hero-wrap">
              {lead.type === 'video' ? (
                <video src={lead.url} className="news-article-hero" controls playsInline preload="metadata" />
              ) : (
                <img src={lead.url} alt={selected.title} className="news-article-hero" />
              )}
            </div>
          )}

          <div className="news-layout">
            <div className="news-main">
              <div className="news-article-hero-panel">
                <nav className="news-breadcrumb" aria-label="Breadcrumb">
                  <button type="button" onClick={closePost}>Home</button>
                  <span className="news-breadcrumb-sep">›</span>
                  <button type="button" onClick={closePost}>Blog</button>
                  <span className="news-breadcrumb-sep">›</span>
                  <span>{selected.category}</span>
                </nav>
                <span className="news-article-kicker">{selected.category}</span>
                <h1 className="news-article-title">{selected.title}</h1>
                {selected.summary && (
                  <div className="news-summary-box">{selected.summary}</div>
                )}
                <div className="news-article-meta-row">
                  <p className="news-article-byline">
                    Updated: <strong>{formatIso(selected.createdAt)}</strong>
                    {' · '}
                    By <strong>{selected.author || 'YovoAI Team'}</strong>
                  </p>
                  <div className="news-share-row">
                    <span className="news-share-label">Share</span>
                    <button type="button" className="news-share-btn" title="Facebook" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}>f</button>
                    <button type="button" className="news-share-btn" title="Twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(selected.title)}`, '_blank')}>𝕏</button>
                    <button type="button" className="news-share-btn" title="WhatsApp" onClick={() => shareWhatsApp(selected)}>Wa</button>
                    <button type="button" className="news-share-btn" title="Copy link" onClick={() => copyShareLink(selected)}>⎘</button>
                  </div>
                </div>
              </div>

              <div className="news-article-content-wrap">
                {toc.length > 1 && (
                  <nav className="news-toc" aria-label="Table of contents">
                    <h3 className="news-toc-title">Table of Contents</h3>
                    <ul className="news-toc-list">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a href={`#${item.id}`}>{item.label}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                <div className="news-article-body">
                  {paragraphs.map((p, i) => {
                    const inToc = toc.some((t) => t.id === `sec-${i}`)
                    return (
                      <p key={i} id={inToc ? `sec-${i}` : undefined}>
                        {p}
                      </p>
                    )
                  })}
                </div>

                {restMedia.length > 0 && (
                  <div className="news-inline-gallery">
                    {restMedia.map((item) => (
                      <figure key={item.id} className="news-inline-figure">
                        {item.type === 'video' ? (
                          <video src={item.url} controls playsInline preload="metadata" />
                        ) : (
                          <img src={item.url} alt={item.caption || ''} loading="lazy" />
                        )}
                        {item.caption && <figcaption className="news-lead-caption">{item.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}

                {(selected.tags || []).length > 0 && (
                  <div className="news-article-tags">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="news-article-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="news-engage-bar">
                  <button
                    type="button"
                    className={`news-engage-btn ${eng.liked ? 'is-liked' : ''}`}
                    onClick={(e) => handleLike(selected._id, e)}
                  >
                    <IconHeart filled={!!eng.liked} />
                    {eng.likesCount ?? selected.likesCount ?? 0} Likes
                  </button>
                  <button
                    type="button"
                    className="news-engage-btn"
                    onClick={() => document.getElementById('news-comments-anchor')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <IconComment />
                    {eng.commentsCount ?? comments.length} Comments
                  </button>
                  <button type="button" className="news-engage-btn" onClick={(e) => handleShare(selected, e)}>
                    <IconShare />
                    {eng.shareCount ?? selected.shareCount ?? 0} Share
                  </button>
                </div>
                {shareToast && <p className="news-share-toast">{shareToast}</p>}
              </div>

              <div className="news-comment-card" id="news-comments-anchor">
                <h3>✎ Write Comment</h3>
                <div className="news-comment-grid">
                  <input
                    className="news-comment-input"
                    placeholder="Enter your name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                  />
                  <textarea
                    className="news-comment-textarea"
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>
                <div className="news-comment-actions">
                  <button type="button" className="news-comment-cancel" onClick={() => setCommentText('')}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="news-comment-submit"
                    disabled={commentSubmitting || !commentName.trim() || !commentText.trim()}
                    onClick={() => submitComment(selected._id)}
                  >
                    {commentSubmitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
                {comments.length > 0 && (
                  <div className="news-comments-list">
                    {comments.map((c) => (
                      <div key={c._id} className="news-comment-item">
                        <span className="news-comment-author">{c.authorName}</span>
                        <span className="news-comment-date">{formatDateTime(c.createdAt)}</span>
                        <p className="news-comment-text">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <nav className="news-pager">
                <div
                  className={`news-pager-cell ${articleNav.prev ? '' : 'is-empty'}`}
                  onClick={() => articleNav.prev && openPost(articleNav.prev)}
                  role={articleNav.prev ? 'button' : undefined}
                  tabIndex={articleNav.prev ? 0 : undefined}
                >
                  <div className="news-pager-label">Read Previous Post</div>
                  <div className="news-pager-title">{articleNav.prev?.title || '—'}</div>
                </div>
                <div
                  className={`news-pager-cell ${articleNav.next ? '' : 'is-empty'}`}
                  onClick={() => articleNav.next && openPost(articleNav.next)}
                  role={articleNav.next ? 'button' : undefined}
                  tabIndex={articleNav.next ? 0 : undefined}
                >
                  <div className="news-pager-label">Read Next Post</div>
                  <div className="news-pager-title">{articleNav.next?.title || '—'}</div>
                </div>
              </nav>
            </div>

            <div className="news-aside">
              <TrendingSidebar
                posts={filtered}
                currentId={selected._id}
                onSelect={openPost}
                title="Trending in YovoAI"
              />
              <TrendingWebStories posts={filtered} currentId={selected._id} onSelect={openPost} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="news-portal">
      <div className="news-wrap">
        <div className="news-toolbar">
          <div className="news-toolbar-cats">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`news-toolbar-cat ${filterCat === cat ? 'is-active' : ''}`}
                onClick={() => setFilterCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories…"
            className="news-toolbar-search"
          />
        </div>

        {loading ? (
          <div className="news-state">
            <div className="news-state-spinner" />
            <p>Loading stories…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="news-state">
            <h3>No stories found</h3>
            <p>Try another category or search.</p>
          </div>
        ) : (
          <>
            {featured && (
              <div
                className="news-featured"
                onClick={() => openPost(featured)}
                onKeyDown={(e) => e.key === 'Enter' && openPost(featured)}
                role="button"
                tabIndex={0}
              >
                <div className="news-featured-visual">
                  {(() => {
                    const m = resolvePostMedia(featured)
                    const img = m.find((x) => x.type === 'image') || m[0]
                    return img ? (
                      img.type === 'video' ? (
                        <video src={img.url} className="news-featured-media" muted playsInline preload="metadata" />
                      ) : (
                        <img src={img.url} alt={featured.title} className="news-featured-media" />
                      )
                    ) : (
                      <div className="news-featured-media" aria-hidden="true" />
                    )
                  })()}
                </div>
                <div className="news-featured-body">
                  <span className="news-featured-kicker">{featured.category}</span>
                  <h2 className="news-featured-title">{featured.title}</h2>
                  {featured.summary && (
                    <p className="news-featured-meta" style={{ lineHeight: 1.5, marginBottom: 10 }}>
                      {featured.summary.length > 160
                        ? `${featured.summary.slice(0, 160).trim()}…`
                        : featured.summary}
                    </p>
                  )}
                  <p className="news-featured-meta">
                    {formatDate(featured.createdAt)} · By {featured.author || 'YovoAI Team'}
                  </p>
                  <span className="news-featured-read">Read full story →</span>
                </div>
              </div>
            )}

            <div className="news-layout">
              <div className="news-main">
                <div className="news-feed-main">
                  {rest.map((post, idx) => {
                    const media = resolvePostMedia(post)
                    const thumb = media.find((m) => m.type === 'image') || media[0]
                    return (
                      <article
                        key={post._id}
                        className="news-feed-row"
                        onClick={() => openPost(post)}
                        onKeyDown={(e) => e.key === 'Enter' && openPost(post)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="news-feed-thumb-wrap">
                          {thumb ? (
                            thumb.type === 'video' ? (
                              <video src={thumb.url} muted playsInline preload="metadata" />
                            ) : (
                              <img src={thumb.url} alt="" loading="lazy" />
                            )
                          ) : null}
                          <span className="news-feed-rank">#{idx + 2}</span>
                        </div>
                        <div className="news-feed-text">
                          <h3 className="news-feed-headline">{post.title}</h3>
                          <p className="news-feed-meta">
                            {formatIso(post.createdAt)} ·{' '}
                            <span className="author">By {post.author || 'YovoAI Team'}</span>
                          </p>
                        </div>
                      </article>
                    )
                  })}
                  {rest.length === 0 && featured && (
                    <p className="news-feed-empty">More stories coming soon.</p>
                  )}
                </div>
              </div>

              <div className="news-aside">
                <TrendingSidebar posts={filtered} onSelect={openPost} title="Trending in YovoAI" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
