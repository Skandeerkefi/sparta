import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "https://misterteedata-production.up.railway.app",
				changeOrigin: true,
				// ❌ remove this line or fix it
				// rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
});
