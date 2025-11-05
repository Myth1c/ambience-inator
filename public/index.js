// ===== index.js =====

let ws;
window._botCheckTimer = null;


window.onload = async () => {
    
    // Ensure user is authenticated
    const authed = await authCheck();
    if(!authed) return;
        
    console.log("[WEB] Connected to index");
    
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
    
    // Initial status request
    sendCommand("GET_BOT_STATUS");
};

window.onBotStatusUpdate = (online) => { updateBotStatus(online); } 

// ===== Helpers =====
function updateBotStatus(online) {
    const el = document.getElementById("statusMessage");
    
    botConnectionState = online
    btnBool = true
    
    // Update immediate text + color
    if (botConnectionState === "online") {
        el.textContent = "Bot is Online";
        el.style.color = "#4caf50";
        if (window._botCheckTimer) {
            clearInterval(window._botCheckTimer);
            window._botCheckTimer = null
        }
        btnBool = true
    } else if (botConnectionState === "offline") {
        el.textContent = "Bot is Offline";
        el.style.color = "#f44336";
        if (window._botCheckTimer) {
            clearInterval(window._botCheckTimer);
            window._botCheckTimer = null
        }
        btnBool = false
    } else {
        el.textContent = "Bot is starting...";
        el.style.color = "#ffca28";

        // Start a background polling loop if one isn’t running
        if (!window._botCheckTimer) {
            window._botCheckTimer = setInterval(() => {
                console.log("[WEB] Checking bot status");
                sendCommand("GET_BOT_STATUS");

                // If playbackState or global var tracks bot status, check it here
                if (botConnectionState === "online") {
                    updateBotStatus(true);
                    clearInterval(window._botCheckTimer);
                    window._botCheckTimer = null;
                } else if (botConnectionState === "offline") {
                    updateBotStatus(false);
                    clearInterval(window._botCheckTimer);
                    window._botCheckTimer = null;
                }

            }, 10);
        }
    }
    
    document.getElementById("startBotBtn").disabled = btnBool;
    document.getElementById("stopBotBtn").disabled = !btnBool;
    document.getElementById("rebootBotBtn").disabled = !btnBool;
}
