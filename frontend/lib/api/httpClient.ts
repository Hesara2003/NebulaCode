import axios from "axios";

const FALLBACK_BASE_URL = "http://localhost:4001";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BASE_URL;

if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "development") {
  // Log once so developers know they are hitting the fallback URL.
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Falling back to http://localhost:4001."
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
