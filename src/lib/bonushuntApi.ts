import { API_BASE } from "@/lib/api";

export interface SlotSearchResult {
  name: string;
  image: string;
  site?: string;
  [key: string]: unknown;
}

const getSlotField = (slot: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = slot[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
};

export const searchSlots = async (query: string): Promise<SlotSearchResult[]> => {
  try {
    const url = `${API_BASE}/api/bonus-hunts/slots/search?q=${encodeURIComponent(query)}&site=Stake`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const rawSlots = Array.isArray(data) ? data : data?.slots || data?.results || data?.data || [];

    return rawSlots.map((item: unknown) => {
      const slot = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;

      return {
        name:
          getSlotField(slot, ["name", "title", "slotName", "slot_name", "gameName"]) ||
          "Unknown Slot",
        image:
          getSlotField(slot, ["image", "imageUrl", "thumbnail", "thumb", "cover", "art"]),
        site: getSlotField(slot, ["site"]) || "Stake",
        ...slot,
      };
    });
  } catch (error) {
    console.error("Bonushunt API error:", error);
    throw error;
  }
};
