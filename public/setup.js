// ========================
// setup.js — Updated for new HTML
// ========================


// Cached global references (filled inside onload)
let setupEls = {
    inputText: null,
    inputVoice: null,
    status: null,
    themeSelect: null,
    themeStatus: null
};


// ========================
// EVENT DELEGATION (CLICK)
// ========================
document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("#setup-save, #theme-apply");
    if (!btn) return;

    switch (btn.id) {

        case "setup-save":
            if (!setupEls.inputText || !setupEls.inputVoice) return;

            sendCommand("SETUP_SAVE", {
                text_channel_id: setupEls.inputText.value.trim(),
                voice_channel_id: setupEls.inputVoice.value.trim()
            });

            showStatus("Saving bot configuration...", "success", setupEls.status);
            break;

        case "theme-apply":
            applyTheme(setupEls.themeSelect.value);
            localStorage.setItem("ai-theme", setupEls.themeSelect.value);
            setupEls.themeStatus.textContent =
                `Theme applied: ${setupEls.themeSelect.value}`;
            break;
    }
});


// ========================
// EVENT DELEGATION (CHANGE)
// ========================
document.body.addEventListener("change", (e) => {
    const control = e.target.closest("#theme-select");
    if (!control) return;

    switch (control.id) {
        case "theme-select":
            document.documentElement
                .setAttribute("data-theme", control.value);
            break;
    }
});



// ========================
// THEME APPLY HELPER
// ========================
function applyTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("ai-theme", themeName);
    setupEls.themeStatus.textContent = `Theme set to ${themeName}`;
}


// ========================
// PAGE LOAD
// ========================
window.onload = async () => {

    // 1. Run auth check
    const authed = await authCheck();
    if (!authed) return;

    // 2. Cache DOM elements
    setupEls.inputText    = document.getElementById("setup-text");
    setupEls.inputVoice   = document.getElementById("setup-voice");
    setupEls.status       = document.getElementById("setup-status");
    setupEls.themeSelect  = document.getElementById("theme-select");
    setupEls.themeStatus  = document.getElementById("theme-status");

    // Validate elements exist
    for (const [key, el] of Object.entries(setupEls)) {
        if (!el) console.warn(`[SETUP] Missing DOM element for ${key}`);
    }

    // 3. Restore saved theme
    const savedTheme = localStorage.getItem("ai-theme") || "green";
    setupEls.themeSelect.value = savedTheme;
    applyTheme(savedTheme);
};