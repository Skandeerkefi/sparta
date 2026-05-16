import http from "./api";

type StreamConfigResponse = {
  nextStreamAt: string | null;
  updatedAt?: string | null;
};

export const getPublicStreamConfig = async (): Promise<StreamConfigResponse> => {
  const res = await http.get("/api/stream-config/public");
  return res.data;
};

export const updateStreamConfig = async (nextStreamAt: string, token: string): Promise<StreamConfigResponse> => {
  const res = await http.post(
    "/api/stream-config/admin",
    { nextStreamAt },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export default {
  getPublicStreamConfig,
  updateStreamConfig,
};
