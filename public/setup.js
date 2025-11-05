let ws;

window.onload = () => {    
    //ws = new WebSocket(`wss://localhost:8080/ws`);  // if local dev
    ws = new WebSocket(`wss://ambienceinator-web.onrender.com/ws`) // (if hosted backend)

    ws.onopen = () => console.log("Connected to WS");

    document.getElementById("saveBtn").onclick = () => {
        const vc = document.getElementById("vcInput").value;
        const tc = document.getElementById("tcInput").value;
        console.log("Save button clicked!");
        sendCommand("SETUP_SAVE", {
            voice_channel_id: vc,
            text_channel_id: tc
        });
        
        showStatus("Saving bot configuration...", "success");
    };
    
    document.getElementById("updateQueueBtn").onclick = () => {
        console.log("[WEB] Sending UPDATE_QUEUE_MESSAGE to bot");
        sendCommand("UPDATE_QUEUE_MESSAGE");
    };

    document.getElementById("updateUILinkBtn").onclick = () => {
        console.log("[WEB] Sending UPDATE_UI_LINK to bot");
        sendCommand("UPDATE_UI_LINK");
    };

}


function showStatus(message, type = "success"){
    const el = document.getElementById("statusMessage");
    el.textContent = message;
    
    // Reset classes
    el.className = "status-message";
    if (type === "success") el.classList.add("status-success");
    if (type === "warning") el.classList.add("status-warning");
    if (type === "error") el.classList.add("status-error");
    
    // Fade in
    el.classList.add("show");
    
    // Automatically fade out after 2.5s
    setTimeout(() => {
        el.classList.remove("show");
    }, 2500);
    
}


// ====== WebSocket Command Sender ======
function sendCommand(command, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, ...data }));
    } else {
        console.warn("[Playback] WS not connected");
    }
}
