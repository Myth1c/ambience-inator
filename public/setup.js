// ========================
// setup.js — Updated for new HTML
// ========================

window.onload = async () => {

    // === Auth check ===
    const authed = await authCheck();
    if (!authed) return;

    // === Cached DOM elements ===
    const inputText  = document.getElementById("setup-text");
    const inputVoice = document.getElementById("setup-voice");
    const btnSave    = document.getElementById("setup-save");
    const statusEl   = document.getElementById("setup-status");

    const themeSelect = document.getElementById("theme-select");
    const previewInput = document.querySelector(".setup-theme__preview-input");
    const previewBtn   = document.querySelector(".setup-theme__preview-btn");
    const themeStatus  = document.getElementById("theme-status");

    if (!inputText || !inputVoice || !btnSave || !statusEl || !themeSelect) {
        console.error("[SETUP] Missing DOM elements!");
        return;
    }

    // ========================
    // SAVE SETUP BUTTON
    // ========================
    btnSave.addEventListener("click", () => {
        const textID = inputText.value.trim();
        const voiceID = inputVoice.value.trim();

        sendCommand("SETUP_SAVE", {
            text_channel_id: textID,
            voice_channel_id: voiceID
        });

        showStatus("Saving bot configuration...", "success", statusEl);
    });

    // ========================
    // THEME SWITCHING
    // ========================

    function applyTheme(themeName) {
        document.documentElement.setAttribute("data-theme", themeName);

        // Save theme
        localStorage.setItem("ai-theme", themeName);

        themeStatus.textContent = `Theme set to ${themeName}`;
    }

    function applyPreview(themeName) {
        // Temporarily apply theme to compute preview values
        document.documentElement.setAttribute("data-theme", themeName);

        const styles = getComputedStyle(document.documentElement);

        previewInput.style.background = styles.getPropertyValue("--bg-light");
        previewInput.style.color = styles.getPropertyValue("--grey");
        previewInput.style.borderColor = styles.getPropertyValue("--accent");

        previewBtn.style.borderColor = styles.getPropertyValue("--accent");
        previewBtn.style.color = styles.getPropertyValue("--grey");
        previewBtn.style.background = "transparent";
    }

    // Theme dropdown change event
    themeSelect.addEventListener("change", () => {
        const themeName = themeSelect.value;
        applyPreview(themeName);
    });
    
    document.getElementById("theme-apply").addEventListener("click", () => {
        const themeName = themeSelect.value;

        // Apply site-wide
        applyTheme(themeName);

        // Save globally
        localStorage.setItem("ai-theme", themeName);

        themeStatus.textContent = `Theme applied: ${themeName}`;
    });

    // Restore theme on load
    const savedTheme = localStorage.getItem("ai-theme") || "green";
    themeSelect.value = savedTheme;

    applyTheme(savedTheme);
    applyPreview(savedTheme);
};
