/**
 * ImageX Main UI Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- Elements ---
    const promptInput = document.getElementById("promptInput");
    const generateBtn = document.getElementById("generateBtn");
    const progressBar = document.getElementById("progressBar");
    const statusLine = document.getElementById("statusLine");
    const promptContainer = document.querySelector(".prompt-container");

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
            updateChip(chipSeed, "Seed", lastResult.seed_used);
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
                <div class="meta-item">
                    <span class="meta-label">Used Prompt</span>
                    <span class="meta-value">${result.used_prompt}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Seed</span>
                    <span class="meta-value">${result.seed_used}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Time Taken</span>
                    <span class="meta-value">${result.time_taken}s</span>
                </div>
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
            offlineDot.style.background = "#10B981"; // Green
            statusOfflineText.innerHTML = `<span class="status-dot dot-offline" style="background:#10B981"></span> READY`;

            if (status.db_connected) {
                dbDot.style.background = "#06B6D4"; // Cyan
            }
        } else {
            offlineDot.style.background = "#EF4444"; // Red
            statusOfflineText.innerHTML = `<span class="status-dot dot-offline" style="background:#EF4444"></span> ERROR`;
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
                 data-id="${item.id}"
                 data-prompt="${item.raw_prompt.replace(/"/g, '&quot;')}" 
                 data-used="${item.used_prompt.replace(/"/g, '&quot;')}"
                 data-seed="${item.seed}" 
                 data-filename="${item.filename}"
                 data-time="${item.time_taken}">
                <button class="btn-delete-item" title="Delete record">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
                <img src="/outputs/${item.filename}" class="history-thumb" alt="Thumbnail">
                <p class="history-prompt">${item.raw_prompt}</p>
            </div>
        `).join("");

        // Add history item click listeners
        document.querySelectorAll(".history-card").forEach(card => {
            const deleteBtn = card.querySelector(".btn-delete-item");
            
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation(); // Prevent loading the image
                if (confirm("Delete this creation?")) {
                    const success = await api.deleteHistoryItem(card.dataset.id);
                    if (success) {
                        utils.showStatus("Creation deleted", "success");
                        loadHistory();
                    }
                }
            });

            card.addEventListener("click", () => {
                // 1. Update Input section
                promptInput.value = card.dataset.prompt;
                updateChip(chipSeed, "Seed", card.dataset.seed);

                // 2. Update Output section to show this image
                generatedImage.src = `/outputs/${card.dataset.filename}`;
                outputPanel.classList.add("visible");

                imageMetadata.innerHTML = `
                    <div class="meta-item">
                        <span class="meta-label">Used Prompt</span>
                        <span class="meta-value">${card.dataset.used}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Seed</span>
                        <span class="meta-value">${card.dataset.seed}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Time Taken</span>
                        <span class="meta-value">${card.dataset.time}s</span>
                    </div>
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
        generateBtn.querySelector('span').textContent = loading ? "Generating..." : "Generate";

        if (loading) {
            promptContainer.classList.add("progress-active");
            progressBar.style.width = "95%";
        } else {
            promptContainer.classList.remove("progress-active");
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

        // Deactivate all chips first
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chipEl.classList.add('active');

        controlPanel.classList.add("open");

        document.querySelectorAll(".control-option").forEach(opt => {
            opt.addEventListener("click", () => {
                updateChip(chipEl, type.charAt(0).toUpperCase() + type.slice(1), opt.dataset.value);
                controlPanel.classList.remove("open");
                chipEl.classList.remove('active');
            });
        });
    }

    function showSeedControl() {
        controlPanel.innerHTML = `
            <div class="control-group" style="padding: 10px; gap: 10px;">
                <input type="number" id="seedInput" value="${chipSeed.dataset.value === 'random' ? utils.randomSeed() : chipSeed.dataset.value}" 
                       style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:8px 12px; border-radius:8px; width:140px; outline:none;">
                <button id="setSeedBtn" class="control-option selected">Set</button>
                <button id="randomSeedBtn" class="control-option">Random</button>
            </div>
        `;

        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chipSeed.classList.add('active');
        controlPanel.classList.add("open");

        document.getElementById("setSeedBtn").addEventListener("click", () => {
            const val = document.getElementById("seedInput").value;
            updateChip(chipSeed, "Seed", val);
            controlPanel.classList.remove("open");
            chipSeed.classList.remove('active');
        });

        document.getElementById("randomSeedBtn").addEventListener("click", () => {
            resetSeed();
            controlPanel.classList.remove("open");
            chipSeed.classList.remove('active');
        });
    }

    function updateChip(el, label, value) {
        el.dataset.value = value;
        const valDisplay = el.querySelector('.value');
        if (valDisplay) {
            valDisplay.textContent = value === 'random' ? 'Auto' : value;
        }
    }

    function resetSeed() {
        updateChip(chipSeed, "Seed", "random");
    }
});
