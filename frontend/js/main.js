/**
 * ImageX Main UI Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- Elements ---
    const promptInput = document.getElementById("promptInput");
    const generateBtn = document.getElementById("generateBtn");
    const progressBar = document.getElementById("progressBar");
    const progressContainer = document.querySelector(".progress-container");
    const statusLine = document.getElementById("statusLine");
    
    const outputPanel = document.getElementById("outputPanel");
    const generatedImage = document.getElementById("generatedImage");
    const imageMetadata = document.getElementById("imageMetadata");
    
    const chipSteps = document.getElementById("chipSteps");
    const chipCfg = document.getElementById("chipCfg");
    const chipSize = document.getElementById("chipSize");
    const chipSeed = document.getElementById("chipSeed");
    const chipStyle = document.getElementById("chipStyle");
    const controlPanel = document.getElementById("controlPanel");

    const historyList = document.getElementById("historyList");
    const historyCount = document.getElementById("historyCount");
    const toggleHistory = document.getElementById("toggleHistory");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");

    const downloadBtn = document.getElementById("downloadBtn");
    const regenerateBtn = document.getElementById("regenerateBtn");
    const clearBtn = document.getElementById("clearBtn");

    // --- State ---
    let lastResult = null;
    let isGenerating = false;

    // --- Initialization ---
    utils.rotatePlaceholder(promptInput);
    updateStatusBadge();
    loadHistory();
    resetSeed();

    // --- Event Listeners ---

    // Chips & Controls
    chipSteps.addEventListener("click", () => showControl("steps", [15, 25, 35, 50], chipSteps));
    chipCfg.addEventListener("click", () => showControl("cfg", [5.0, 7.5, 10.0, 12.0], chipCfg));
    chipSize.addEventListener("click", () => showControl("size", ["512x512", "768x768", "1024x1024"], chipSize));
    chipSeed.addEventListener("click", () => showSeedControl());
    chipStyle.addEventListener("click", () => showControl("style", ["None", "Cinematic", "Studio Ghibli", "Oil Painting", "3D Render", "Cyberpunk"], chipStyle));

    // Generate
    generateBtn.addEventListener("click", handleGenerate);
    promptInput.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "Enter") handleGenerate();
    });

    // Actions
    downloadBtn.addEventListener("click", handleDownload);
    regenerateBtn.addEventListener("click", () => {
        if (lastResult) {
            chipSeed.dataset.value = lastResult.seed_used;
            chipSeed.textContent = `Seed: ${lastResult.seed_used}`;
            handleGenerate();
        }
    });
    clearBtn.addEventListener("click", () => {
        outputPanel.classList.remove("visible");
        promptInput.value = "";
        resetSeed();
        utils.showStatus("model ready — imageX v1.0", "idle");
    });

    // History
    toggleHistory.addEventListener("click", () => {
        const isCollapsed = historyList.style.display === "none";
        historyList.style.display = isCollapsed ? "flex" : "none";
        toggleHistory.textContent = isCollapsed ? "↑" : "↓";
    });
    clearHistoryBtn.addEventListener("click", async () => {
        if (confirm("Delete all generation history?")) {
            await api.clearHistory();
            loadHistory();
        }
    });

    // --- Handlers ---

    async function handleGenerate() {
        if (isGenerating) return;

        const validation = utils.validatePrompt(promptInput.value);
        if (!validation.valid) {
            utils.showStatus(validation.error, "error");
            return;
        }

        const payload = {
            prompt: promptInput.value,
            steps: parseInt(chipSteps.dataset.value),
            cfg: parseFloat(chipCfg.dataset.value),
            width: parseInt(chipSize.dataset.value.split("x")[0]),
            height: parseInt(chipSize.dataset.value.split("x")[1]),
            seed: chipSeed.dataset.value === "random" ? -1 : parseInt(chipSeed.dataset.value),
            style: chipStyle.dataset.value
        };

        setLoading(true);
        utils.showStatus("generating...", "loading");

        try {
            const result = await api.generateImage(payload);
            lastResult = result;
            
            // Render Result
            generatedImage.src = `data:image/png;base64,${result.image_base64}`;
            outputPanel.classList.add("visible");
            
            imageMetadata.innerHTML = `
                <p><strong>prompt used:</strong> ${result.used_prompt}</p>
                <p><strong>seed:</strong> ${result.seed_used}</p>
                <p><strong>generated in:</strong> ${result.time_taken}s</p>
                <p><strong>saved to:</strong> outputs/${result.filename}</p>
            `;

            utils.showStatus(`image generated in ${result.time_taken}s — seed: ${result.seed_used}`, "success");
            loadHistory();
            
            // Scroll to result
            outputPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

        } catch (error) {
            if (error.message === "server_offline") {
                utils.showStatus("connection failed — is the server running?", "error");
            } else {
                utils.showStatus(error.message, "error");
            }
        } finally {
            setLoading(false);
        }
    }

    function handleDownload() {
        if (!lastResult) return;
        const link = document.createElement("a");
        link.href = generatedImage.src;
        link.download = `imagex_${lastResult.seed_used}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Helpers ---

    async function updateStatusBadge() {
        const status = await api.getStatus();
        const offlineDot = document.querySelector(".dot-offline");
        const dbDot = document.querySelector(".dot-db");
        const statusOfflineText = document.getElementById("statusOffline");

        if (status) {
            offlineDot.style.color = "#00C851"; // Green
            statusOfflineText.innerHTML = `<span class="dot dot-offline" style="color:#00C851">●</span> OFFLINE`;
            
            if (status.db_connected) {
                dbDot.style.color = "#4F8EF7"; // Blue
            }
        } else {
            offlineDot.style.color = "#FF4D4D"; // Red
        }
    }

    async function loadHistory() {
        const history = await api.getHistory(10);
        historyCount.textContent = history.length;
        
        if (history.length === 0) {
            historyList.innerHTML = `<p class="status-line">no generations yet</p>`;
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-card" 
                 data-prompt="${item.raw_prompt.replace(/"/g, '&quot;')}" 
                 data-used="${item.used_prompt.replace(/"/g, '&quot;')}"
                 data-seed="${item.seed}" 
                 data-filename="${item.filename}"
                 data-time="${item.time_taken}">
                <img src="/outputs/${item.filename}" class="history-thumb" alt="Thumbnail">
                <p class="history-prompt">${utils.truncateText(item.raw_prompt, 40)}</p>
                <p class="history-meta">${utils.formatTimestamp(item.created_at)} • Seed: ${item.seed}</p>
            </div>
        `).join("");

        // Add history click listeners
        document.querySelectorAll(".history-card").forEach(card => {
            card.addEventListener("click", () => {
                // 1. Update Input section
                promptInput.value = card.dataset.prompt;
                chipSeed.dataset.value = card.dataset.seed;
                chipSeed.textContent = `Seed: ${card.dataset.seed}`;
                
                // 2. Update Output section to show this image
                generatedImage.src = `/outputs/${card.dataset.filename}`;
                outputPanel.classList.add("visible");
                
                imageMetadata.innerHTML = `
                    <p><strong>prompt used:</strong> ${card.dataset.used}</p>
                    <p><strong>seed:</strong> ${card.dataset.seed}</p>
                    <p><strong>generated in:</strong> ${card.dataset.time}s</p>
                    <p><strong>saved to:</strong> outputs/${card.dataset.filename}</p>
                `;

                utils.showStatus(`Viewing history: seed ${card.dataset.seed}`, "success");
                
                // Scroll to top to see input, or stay? User said prompt was pasted.
                // Let's scroll to the output panel instead so they see the image.
                outputPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
        });
    }

    function setLoading(loading) {
        isGenerating = loading;
        generateBtn.disabled = loading;
        generateBtn.textContent = loading ? "generating..." : "Generate Image";
        progressContainer.style.display = loading ? "block" : "none";
        if (loading) {
            document.querySelector(".progress-container").classList.add("progress-active");
            progressBar.style.width = "95%";
        } else {
            document.querySelector(".progress-container").classList.remove("progress-active");
            progressBar.style.width = "0%";
        }
    }

    function showControl(type, options, chipEl) {
        controlPanel.innerHTML = `
            <div class="control-group">
                ${options.map(opt => `
                    <div class="control-option ${chipEl.dataset.value == opt ? 'selected' : ''}" data-value="${opt}">${opt}</div>
                `).join("")}
            </div>
        `;
        controlPanel.classList.add("open");
        
        document.querySelectorAll(".control-option").forEach(opt => {
            opt.addEventListener("click", () => {
                chipEl.dataset.value = opt.dataset.value;
                chipEl.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${opt.dataset.value}`;
                controlPanel.classList.remove("open");
            });
        });
    }

    function showSeedControl() {
        controlPanel.innerHTML = `
            <div class="control-group" style="padding: 5px;">
                <input type="number" id="seedInput" value="${chipSeed.dataset.value === 'random' ? utils.randomSeed() : chipSeed.dataset.value}" 
                       style="background:var(--bg-card); border:1px solid var(--accent); color:white; padding:4px 8px; border-radius:4px; width:120px;">
                <button id="setSeedBtn" class="control-option">Set</button>
                <button id="randomSeedBtn" class="control-option">Random</button>
            </div>
        `;
        controlPanel.classList.add("open");

        document.getElementById("setSeedBtn").addEventListener("click", () => {
            const val = document.getElementById("seedInput").value;
            chipSeed.dataset.value = val;
            chipSeed.textContent = `Seed: ${val}`;
            controlPanel.classList.remove("open");
        });

        document.getElementById("randomSeedBtn").addEventListener("click", () => {
            resetSeed();
            controlPanel.classList.remove("open");
        });
    }

    function resetSeed() {
        chipSeed.dataset.value = "random";
        chipSeed.textContent = "Seed: random";
    }
});
