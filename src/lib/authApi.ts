import http from "./api";

export type UpdateProfilePayload = {
	kickUsername?: string;
	rainbetUsername?: string;
	currentPassword?: string;
	newPassword?: string;
	confirmNewPassword?: string;
};

export const updateProfile = async (payload: UpdateProfilePayload, token: string) => {
	const res = await http.put("/api/auth/profile", payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
};