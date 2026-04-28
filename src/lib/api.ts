import axios from "axios";

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000";

export const http = axios.create({
	baseURL: API_BASE,
});

export default http;
