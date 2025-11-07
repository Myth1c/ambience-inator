// ===== index.js =====
window._botCheckTimer = null;


window.onload = async () => {
    
    // Ensure user is authenticated
    const authed = await authCheck();
    if(!authed) return;
        
    // === Button references ===
    const startBtn = document.getElementById("startBotBtn");
    const stopBtn = document.getElementById("stopBotBtn");
    const rebootBtn = document.getElementById("rebootBotBtn");
    
    // === Button Actions
    rebootBtn.onclick = () => {
        console.log("[WEB] Sending REBOOT to bot");
        sendCommand("REBOOT_BOT");
    };
    startBtn.onclick = () => {
        console.log("[WEB] Sending START_BOT");
        sendCommand("START_BOT");
    };
    stopBtn.onclick = () => {
        console.log("[WEB] Sending STOP_BOT");
        sendCommand("STOP_BOT");
    };
    
};

window.onHeartbeatUpdate = (webOK, botOK) => { updateBotStatus(webOK, botOK) };

window.onReturnStatus = (statusValue) => { 
    // Normalize to boolean
    
    const webOK = true; // If we're getting responses from the bot, the webserver is online
    
    updateBotStatus(webOK, statusValue);
};

window.onWebSocketConnected = () => {
    sendCommand("GET_BOT_STATUS");
}

// ===== Helpers =====
function updateBotStatus(webOK, botStatus) {
    const webEl = document.getElementById("web-status");
    const botEl = document.getElementById("bot-status");

    const startBtn = document.getElementById("startBotBtn");
    const stopBtn = document.getElementById("stopBotBtn");
    const rebootBtn = document.getElementById("rebootBotBtn");
    
    // --- Normalize Inputs ---
    // Convert boolean to string for consistency
    if (botStatus === true) botStatus = "online";
    else if (botStatus === false) botStatus = "offline";
    else if (typeof botStatus !== "string") botStatus = "offline";
    
    // Default fallback
    if (!botStatus) botStatus = "offline";

    // ---- Web Server ----
    if (webEl) {
        if (webOK) {
            webEl.textContent = "Webserver Online";
            webEl.style.color = "#4caf50";
        } else {
            webEl.textContent = "Webserver Offline";
            webEl.style.color = "#f44336";
        }
    }

    // ---- Bot ----
    if (botEl) {
        switch (botStatus) {
            case "online":
                botEl.textContent = "Bot Online";
                botEl.style.color = "#4caf50";
                break;
            case "booting":
                botEl.textContent = "Bot Starting...";
                botEl.style.color = "#ffca28";
                break;
            case "offline":
            default:
                botEl.textContent = "Bot Offline";
                botEl.style.color = "#f44336";
                break;
        }
    }

    // ---- Button State ----
    const isOnline = botStatus === "online";
    const isBooting = botStatus === "booting";

    if (startBtn) startBtn.disabled = isOnline || isBooting;
    if (stopBtn) stopBtn.disabled = !isOnline && !isBooting;
    if (rebootBtn) rebootBtn.disabled = !isOnline;

    console.log(`[STATUS] Web=${webOK ? "Online" : "Offline"} | Bot=${botStatus}`);
}
