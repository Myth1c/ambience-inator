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
        sendCommand("REBOOT");
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

window.onWebSocketConnected = () => {
    sendCommand("GET_BOT_STATUS");
}

// ===== Helpers =====
function updateBotStatus(webOK, botOK) {
    const webEl = document.getElementById("web-status");
    const botEl = document.getElementById("bot-status");
    
    const startBtn = document.getElementById("startBotBtn");
    const stopBtn = document.getElementById("stopBotBtn");
    const rebootBtn = document.getElementById("rebootBotBtn");
    
    // Default to disabled if anything is down
    let btnBool = false;
    
    // --- Web Server Status ---
    if (webEl){
        if (webOK){
            webEl.textContent = "Webserver Online";
            webEl.style.color = "#4caf50";
        }else{
            webEl.textContent = "Unable to reach WebServer";
            webEl.style.color = "#f44336";
        }
    }
    
    // ---- Bot Status ----
    if (botEl) {
        if (botOK) {
            botEl.textContent = "Bot Online";
            botEl.style.color = "#4caf50";
            btnBool = true;
        } else if (webOK && !botOK) {
            botEl.textContent = "Bot Disconnected";
            botEl.style.color = "#f44336";
        } else {
            botEl.textContent = "Unable to reach Ambience-inator Bot";
            botEl.style.color = "#ffca28";
        }
    }
    
    // ---- Button State ----
    if (startBtn) startBtn.disabled = btnBool;   // disable Start if bot is up
    if (stopBtn) stopBtn.disabled = !btnBool;    // disable Stop if bot is down
    if (rebootBtn) rebootBtn.disabled = !btnBool;
    
    // ---- Debugging Log ----
    console.log(`[STATUS] Web=${webOK ? "Online" : "Offline"} | Bot=${botOK ? "Online" : "Offline"}`);
}
