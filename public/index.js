// ========================
// index.js — Updated for BEM + new HTML
// ========================

// Cached button references
let btnStart, btnStop, btnReboot;

// Cached status labels
let elBotStatus, elWebStatus;

// ========================
// Init
// ========================
window.onload = async () => {

    // === Auth check ===
    const authed = await authCheck();
    if (!authed) return;

    // === Query DOM Elements ===
    btnStart = document.getElementById("btn-start");
    btnStop = document.getElementById("btn-stop");
    btnReboot = document.getElementById("btn-reboot");

    // === Hook up button actions ===
    btnStart.addEventListener("click", () => sendCommand("START_BOT"));
    btnStop.addEventListener("click", () => sendCommand("STOP_BOT"));
    btnReboot.addEventListener("click", () => sendCommand("REBOOT_BOT"));

    // === Request initial bot status once WS connects ===
    window.onWebSocketConnected = () => {
        sendCommand("GET_BOT_STATUS");
    };

};

// ========================
// HEARTBEAT & BOT STATUS UPDATES
// ========================
window.onHeartbeatUpdate = (webOK, botOK) => {
    updateBotStatus(webOK, botOK);
};

window.onReturnStatus = (statusValue) => {
    // If we’re receiving this response, the webserver is definitely online
    const webOK = true;

    updateBotStatus(webOK);
};

// ========================
// Update UI for bot + webserver status
// ========================
function updateBotStatus(webOK) {
 
    const btnStart = document.getElementById("btn-start");
    const btnStop = document.getElementById("btn-stop");
    const btnReboot = document.getElementById("btn-reboot");

    const elBotStatus = document.getElementById("status-bot");
    const elWebStatus = document.getElementById("status-web");

    botStatus = window.playbackState.bot_online;
    
    // Normalize botStatus
    if (botStatus === true) botStatus = "online";
    else if (botStatus === false) botStatus = "offline";
    else if (typeof botStatus !== "string") botStatus = "offline";

    // --- Webserver status ---
    elWebStatus.textContent = webOK ? "Online" : "Offline";
    elWebStatus.style.color = webOK ? "#4caf50" : "#f44336";

    // --- Bot status ---
    switch (botStatus) {
        case "online":
            elBotStatus.textContent = "Online";
            elBotStatus.style.color = "#4caf50";
            break;

        case "booting":
            elBotStatus.textContent = "Starting...";
            elBotStatus.style.color = "#ffca28";
            break;

        default:
            elBotStatus.textContent = "Offline";
            elBotStatus.style.color = "#f44336";
            break;
    }

    // --- Button states ---
    const isOnline  = botStatus === "online";
    const isBooting = botStatus === "booting";

    btnStart.disabled  = isOnline || isBooting;
    btnStop.disabled   = !isOnline && !isBooting;
    btnReboot.disabled = !isOnline;

    console.log(`[STATUS] Web=${webOK ? "Online" : "Offline"} | Bot=${botStatus}`);
}

