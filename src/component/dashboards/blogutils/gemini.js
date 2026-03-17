import { API_BASE_URL } from '../../../config';

// Get JWT token from storage (same pattern used across the app)
function getAuthToken() {
  return (
    sessionStorage.getItem('clienttoken') ||
    localStorage.getItem('clienttoken') ||
    sessionStorage.getItem('admintoken') ||
    localStorage.getItem('admintoken') ||
    sessionStorage.getItem('usertoken') ||
    localStorage.getItem('usertoken') ||
    ''
  );
}

function authHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function extractHTML(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const match = raw.match(/```html\s*([\s\S]*?)```/i);
  if (match) return match[1];
  if (raw.includes('<!DOCTYPE') || raw.includes('<html')) return raw;
  return raw;
}

export async function getDescriptionSuggestions(heading) {
  const res = await fetch(`${API_BASE_URL}/api/blog/suggestions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ heading }),
  });
  const data = await res.json();
  return data.suggestions || [];
}

export async function generateImageSearchTerm(description) {
  const res = await fetch(`${API_BASE_URL}/api/blog/image-search-term`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ description }),
  });
  const data = await res.json();
  return data.term || description.split(' ').slice(0, 3).join(' ');
}

export async function generateBlogHTML(params) {
  const res = await fetch(`${API_BASE_URL}/api/blog/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate blog');
  if (!data.html) throw new Error('No HTML returned from server');
  return data.html;
}

export async function modifyBlogHTML(currentHTML, userRequest) {
  const res = await fetch(`${API_BASE_URL}/api/blog/modify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ currentHTML, userRequest }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to modify blog');
  if (!data.html) throw new Error('No HTML returned from server');
  return data.html;
}
