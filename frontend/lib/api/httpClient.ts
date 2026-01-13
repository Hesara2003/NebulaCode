import axios from "axios";

// Use 127.0.0.1 (not localhost) to avoid IPv6 (::1) resolution issues on Windows.
const FALLBACK_BASE_URL = "http://127.0.0.1:4000";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BASE_URL;

if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "development") {
  // Log once so developers know they are hitting the fallback URL.
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Falling back to http://127.0.0.1:4000."
  );
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 1000 * 15,
});

export const getApiBaseUrl = () => baseURL;
