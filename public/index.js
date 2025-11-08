// ========================
// index.js — Updated for BEM + new HTML
// ========================

// Cached status labels + global state
let elBotStatus   = null;
let elWebStatus   = null;

// ========================
// EVENT DELEGATION — CLICK
// ========================
document.body.addEventListener("click", (e) => {
    switch (e.target.id) {

        case "btn-start":
            sendCommand("START_BOT");
            break;

        case "btn-stop":
            sendCommand("STOP_BOT");
            break;

        case "btn-reboot":
            sendCommand("REBOOT_BOT");
            break;
    }
});

// ========================
// PAGE LOAD
// ========================
window.onload = async () => {

    // --- Auth check ---
    const authed = await authCheck();
    if (!authed) return;

    // --- Cache DOM references ---
    elBotStatus = document.getElementById("status-bot");
    elWebStatus = document.getElementById("status-web");

    if (!elBotStatus || !elWebStatus) {
        console.warn("[INDEX] Missing status elements");
    }

    // --- Request initial status once WS connects ---
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
    // If server responded, then web is definitely online
    updateBotStatus(true);
};

// ========================
// UI UPDATE FUNCTION
// ========================
function updateBotStatus(webOK) {

    const btnStart  = document.getElementById("btn-start");
    const btnStop   = document.getElementById("btn-stop");
    const btnReboot = document.getElementById("btn-reboot");

    const elBotStatus = document.getElementById("status-bot");
    const elWebStatus = document.getElementById("status-web");

    // Bot status comes from playbackState
    botStatus = window.playbackState.bot_online;

    // Reset status lists
    elBotStatus.classList.remove(
        "status--ok",
        "status--warn",
        "status--err"
    );
    
    elWebStatus.classList.remove(
        "status--ok",
        "status--warn",
        "status--err"
    );
    
    
    // --- Webserver ---
    if(webOK){
        elWebStatus.textContent = "Online";
        elWebStatus.classList.add("status--ok");
    }else{
        elWebStatus.textContent = "Offline";
        elWebStatus.classList.add("status--err");
    }
    
    
    // --- Bot status display ---
    switch (botStatus) {
        case "online":
            elBotStatus.textContent = "Online";
            elBotStatus.classList.add("status--ok");
            break;

        case "booting":
            elBotStatus.textContent = "Booting...";
            elBotStatus.classList.add("status--warn");
            break;

        default:
            elBotStatus.textContent = "Offline";
            elBotStatus.classList.add("status--err");
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
