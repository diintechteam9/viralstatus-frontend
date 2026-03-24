import axios from "axios";
import { API_BASE_URL } from "../config";

// ── Helper: get auth token from storage ──────────────────────────────────────
function getToken() {
  return (
    sessionStorage.getItem("clienttoken") ||
    localStorage.getItem("clienttoken") ||
    sessionStorage.getItem("usertoken") ||
    localStorage.getItem("usertoken") ||
    ""
  );
}

// ── Helper: get userId from storage ──────────────────────────────────────────
function getUserId() {
  try {
    const userData = sessionStorage.getItem("userData");
    if (userData) return JSON.parse(userData).clientId || "";
  } catch (_) {}
  return localStorage.getItem("mongoId") || "";
}

// ── GET /api/youtube/status — check connection status ────────────────────────
// Fixed: was calling /api/youtube/info which does not exist on backend
export async function fetchYoutubeInfo() {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/youtube/status`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    return { connected: false };
  }
}

// ── POST /api/youtube/disconnect — disconnect YouTube account ─────────────────
// Fixed: now sends userId in body and auth header; backend protect middleware needs token
export async function disconnectYoutube() {
  try {
    const userId = getUserId();
    await axios.post(
      `${API_BASE_URL}/api/youtube/disconnect`,
      { userId },
      {
        headers: { Authorization: `Bearer ${getToken()}` },
        withCredentials: true,
      }
    );
  } catch (e) {
    console.error("[YouTube API] Disconnect error:", e?.response?.data || e.message);
  }
}
