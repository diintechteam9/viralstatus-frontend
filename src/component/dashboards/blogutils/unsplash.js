import { API_BASE_URL } from '../../../config';

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

export async function searchUnsplashImages(query, count = 5) {
  const token = getAuthToken();
  const res = await fetch(
    `${API_BASE_URL}/api/blog/unsplash-images?query=${encodeURIComponent(query)}&count=${count}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  const data = await res.json();
  return data.images || [];
}
