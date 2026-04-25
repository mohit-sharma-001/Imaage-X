/**
 * ImageX Utility Functions
 */

const utils = {
    /**
     * Returns a random integer between 1 and 999999
     */
    randomSeed: () => {
        return Math.floor(Math.random() * 999999) + 1;
    },

    /**
     * Formats seconds into a human-readable string
     */
    formatTime: (seconds) => {
        if (!seconds) return "0s";
        return seconds < 60 ? `${seconds}s` : `${(seconds / 60).toFixed(1)}m`;
    },

    /**
     * Truncates text with ellipsis
     */
    truncateText: (text, maxLength) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    },

    /**
     * Picks a random placeholder and sets it on the element
     */
    rotatePlaceholder: (element) => {
        const placeholders = [
            "describe what you want to see...",
            "kya dekhna chahte ho? yahaan likho...",
            "अपनी कल्पना लिखें...",
            "لکھیں جو آپ دیکھنا چاہتے ہیں...",
            "Décrivez votre image ici...",
            "あなたのイメージを説明してください..."
        ];
        const randomIdx = Math.floor(Math.random() * placeholders.length);
        element.placeholder = placeholders[randomIdx];
    },

    /**
     * Returns true if text contains non-ASCII characters
     */
    isNonAscii: (text) => {
        return /[^\x00-\x7F]/.test(text);
    },

    /**
     * Validates prompt input
     */
    validatePrompt: (text) => {
        const trimmed = text.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: "Prompt cannot be empty" };
        }
        if (trimmed.length < 3) {
            return { valid: false, error: "Prompt is too short (min 3 chars)" };
        }
        if (trimmed.length > 500) {
            return { valid: false, error: "Prompt is too long (max 500 chars)" };
        }
        return { valid: true, error: null };
    },

    /**
     * Updates the status line with message and color
     */
    showStatus: (message, type = "idle") => {
        const statusEl = document.getElementById("statusLine");
        if (!statusEl) return;

        statusEl.textContent = message;
        
        // Clear existing classes
        statusEl.className = "status-line";
        
        // Add type class
        if (type !== "idle") {
            statusEl.classList.add(`status-${type}`);
        }

        // Color logic via CSS classes (defined in style.css or inline)
        const colors = {
            idle: "#52526E",
            loading: "#4F8EF7",
            success: "#00C851",
            error: "#FF4D4D"
        };
        statusEl.style.color = colors[type] || colors.idle;
    },

    /**
     * Formats ISO timestamp to relative or absolute string
     */
    formatTimestamp: (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
};
