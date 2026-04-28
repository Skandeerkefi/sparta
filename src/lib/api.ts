import axios from "axios";

const api = axios.create({
	// baseURL: "https://misterteedata.onrender.com",
	baseURL: "https://bswrxstidata-production.up.railway.app",
	// Your backend URL
});

export default api;
