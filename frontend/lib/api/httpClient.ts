import axios from "axios";

// Fallback for browser if NEXT_PUBLIC_API_URL is not set
const FALLBACK_BASE_URL = "http://localhost:4000";

// Use container name for server-side (SSR in Docker), browser uses NEXT_PUBLIC_API_URL
const baseURL =
  typeof window === "undefined"
    ? "http://backend:4000" // server-side inside Docker
    : process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BASE_URL;

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== "undefined") {
  // Log once so developers know they are hitting the fallback URL in browser
  console.warn(
    `NEXT_PUBLIC_API_URL is not set. Falling back to ${FALLBACK_BASE_URL}.`
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
