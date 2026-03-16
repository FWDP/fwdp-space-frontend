import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";

export const api = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const setToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "strict" });
};

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
};

export const getToken = () => Cookies.get(TOKEN_KEY);
