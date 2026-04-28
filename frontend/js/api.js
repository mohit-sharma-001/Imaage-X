/**
 * ImageX API Service
 */

const BASE_URL = "http://localhost:5000";

const api = {
    /**
     * POST /generate
     */
    generateImage: async (payload) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 min timeout (safe for 25+ steps on CPU)

        try {
            const response = await fetch(`${BASE_URL}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.detail || "Generation failed");
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === "AbortError") {
                throw new Error("Generation timed out (took longer than 30 mins)");
            }
            if (error.message.includes("Failed to fetch")) {
                throw new Error("server_offline");
            }
            throw error;
        }
    },

    /**
     * GET /history
     */
    getHistory: async (limit = 10) => {
        try {
            const response = await fetch(`${BASE_URL}/history?limit=${limit}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch history:", error);
            return [];
        }
    },

    /**
     * DELETE /history
     */
    clearHistory: async () => {
        try {
            const response = await fetch(`${BASE_URL}/history`, { method: "DELETE" });
            const data = await response.json();
            return data.success || false;
        } catch (error) {
            console.error("Failed to clear history:", error);
            return false;
        }
    },

    /**
     * DELETE /history/:id
     */
    deleteHistoryItem: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/history/${id}`, { method: "DELETE" });
            const data = await response.json();
            return data.success || false;
        } catch (error) {
            console.error("Failed to delete history item:", error);
            return false;
        }
    },

    /**
     * GET /status
     */
    getStatus: async () => {
        try {
            const response = await fetch(`${BASE_URL}/status`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch status:", error);
            return null;
        }
    }
};
