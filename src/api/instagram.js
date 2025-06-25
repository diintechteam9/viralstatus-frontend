import axios from "axios";
import { API_BASE_URL } from "../config";

export async function fetchInstagramInfo() {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/instagram/info`, { withCredentials: true });
    return res.data;
  } catch (e) {
    return { connected: false };
  }
}

export async function disconnectInstagram() {
  try {
    await axios.post(`${API_BASE_URL}/api/instagram/disconnect`, {}, { withCredentials: true });
  } catch (e) {}
} 