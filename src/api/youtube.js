import axios from "axios";
import { API_BASE_URL } from "../config";

export async function fetchYoutubeInfo() {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/youtube/info`, { withCredentials: true });
    return res.data;
  } catch (e) {
    return { connected: false };
  }
}

export async function disconnectYoutube() {
  try {
    await axios.post(`${API_BASE_URL}/api/youtube/disconnect`, {}, { withCredentials: true });
  } catch (e) {}
} 