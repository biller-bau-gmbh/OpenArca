import axios from "axios";
import { getStoredValue, removeStoredValue, setStoredValue } from "../utils/storage";

export const TOKEN_KEY = "edudoroit_supportcenter_token";
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let authToken = getStoredValue(TOKEN_KEY, null);

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    setStoredValue(TOKEN_KEY, token);
  } else {
    removeStoredValue(TOKEN_KEY);
  }
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default client;
