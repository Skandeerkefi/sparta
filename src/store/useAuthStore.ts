import { create } from "zustand";

interface User {
	id: string;
	kickUsername: string;
	rainbetUsername: string; // add this
	role: string; // "user" or "admin"
}

interface AuthState {
	user: User | null;
	token: string | null;
	isLoading: boolean;

	setUser: (user: User | null) => void;
	setToken: (token: string | null) => void;
	setIsLoading: (loading: boolean) => void;

	login: (
		kickUsername: string,
		password: string
	) => Promise<{ success: boolean; error?: string }>;

	signup: (
		kickUsername: string,
		rainbetUsername: string,
		password: string,
		confirmPassword: string
	) => Promise<boolean>;

	logout: () => void;
	loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	token: null,
	isLoading: false,

	setUser: (user) => set({ user }),
	setToken: (token) => set({ token }),
	setIsLoading: (loading) => set({ isLoading: loading }),

	login: async (kickUsername, password) => {
		try {
			const res = await fetch(
				"https://bswrxstidata-production.up.railway.app/api/auth/login",
				// "https://pnpplxprssdata.onrender.com/api/auth/login",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ kickUsername, password }),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				return {
					success: false,
					error: data.message || "Login failed",
				};
			}

			const data = await res.json();

			console.log("🔐 Login success, saving user:", data.user);

			set({ user: data.user, token: data.token });
			localStorage.setItem("token", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));

			return { success: true };
		} catch (error: any) {
			console.error("❌ Login error:", error);
			return { success: false, error: error.message };
		}
	},

	signup: async (kickUsername, rainbetUsername, password, confirmPassword) => {
		set({ isLoading: true });
		try {
			const res = await fetch(
				// "https://pnpplxprssdata.onrender.com/api/auth/register",
				"https://bswrxstidata-production.up.railway.app/api/auth/register",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						kickUsername,
						rainbetUsername,
						password,
						confirmPassword,
					}),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Signup failed");
			}

			set({ isLoading: false });
			return true;
		} catch (error: any) {
			set({ isLoading: false });
			throw error;
		}
	},

	logout: () => {
		console.log("🚪 Logging out...");
		set({ user: null, token: null });
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	},

	loadFromStorage: () => {
		const token = localStorage.getItem("token");
		const userStr = localStorage.getItem("user");

		console.log("🧠 Auth Load -> localStorage:", { token, userStr });

		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);

				if (!user.role || typeof user.role !== "string") {
					console.warn(
						"⚠️ User role missing or invalid, setting default role 'user'"
					);
					user.role = "user";
				}

				console.log("✅ Parsed user from storage:", user);

				set({ token, user });
			} catch (err) {
				console.error("❌ Failed to parse user from localStorage", err);
				set({ token: null, user: null });
			}
		} else {
			console.warn("ℹ️ No user or token found in storage.");
			set({ token: null, user: null });
		}
	},
}));
