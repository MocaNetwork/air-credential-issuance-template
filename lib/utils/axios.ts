import axios from "axios";
import { useSession } from "../hooks/useSession";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useSession.getState();
  if (accessToken) {
    config.headers.Authorization = accessToken;
  }
  return config;
});
