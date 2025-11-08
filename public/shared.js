// ==================== shared.js ====================

// === Backend base URLs ===
const API_BASE = "https://ambienceinator-web.onrender.com";
const WS_URL = "wss://ambienceinator-web.onrender.com/ws";

// === Global State ===
let ws;
let authorized = false;

let playbackState = {
    music: { 
        playlist_name: "None",
        track_name: "None",
        playing: false, 
        volume: 100, 
        shuffle: true, 
        loop: false 
    },
    ambience: { 
        name: "None",
        playing: false, 
        volume: 25 
    },
    in_vc: false,
    bot_online: "offline"
};


let READ_ONLY_COMMANDS = [
    "GET_PLAYLISTS",
    "GET_AMBIENCE",
    "GET_PLAYBACK_STATE",
    "GET_BOT_STATUS"
];


(function loadSavedTheme() {
    const saved = localStorage.getItem("ai-theme") || "green";
    document.documentElement.setAttribute("data-theme", saved);
})();

// === Auth helper ===
async function authCheck() {
    window.isAuthorized = false;  // default
    try {
        const res = await fetch(`${API_BASE}/auth_check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            credentials: "include"
        });

        // Network error or server failure
        if (!res.ok) {
            console.warn("[WEB] Auth check request failed with status:", res.status);
            return false;
        }

        const data = await res.json();

        // Server responded — now check the auth result
        if (data.ok === true) {
            console.log("[WEB] Authenticated");
            window.isAuthorized = true;
            return true;
        } else {
            console.log("[WEB] Not authenticated");
            window.isAuthorized = false;
            return false;
        }

    } catch (err) {
        // Only log REAL failures such as server offline, CORS issues, etc
        console.error("[WEB] Auth check error:", err);
        window.isAuthorized = false;
        return false;
    }
}
// === WebSocket setup ===
function connectWebSocket(onMessageCallback) {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log("[WS] Connected");
        if (typeof window.onWebSocketConnected === "function")
            window.onWebSocketConnected();
    };
    
    ws.onclose = () => {
        console.warn("[WS] Closed");
        if (typeof window.onWebSocketClosed === "function")
            window.onWebSocketClosed();
    };
    
    ws.onerror = (e) => console.error("[WS] Error:", e);
   
    ws.onmessage = (msg) => {
        let data;
        try{
            data = JSON.parse(msg.data);
        }catch(e){
            console.warn("[WS] Invalid JSON", msg.data);
            return
        }
        
        handleIncomingCommand(data);
        
        if(typeof onMessageCallback === "function"){
            onMessageCallback(data);
        }
        
    };
}

// ===== Global Command Router =====
function handleIncomingCommand(data) {
    const type = data.type || "response";  // default
    const cmd  = data.command;
    
    console.log(`Received command type: ${type}\nCommand has data ${data.data}`)
    switch (type) {
        // === Command responses ===
        case "response":
            if (!data.ok) {
                console.warn(`[WS] Command '${cmd}' failed:`, data.error, `\nFull Data Preview ${JSON.stringify(data)}`);
                if (typeof window.onCommandError === "function")
                    window.onCommandError(cmd, data.error);
                return;
            }

            switch (cmd) {

                case "BOT_STATUS":
                    if (data.data.online) window.playbackState.bot_online = data.data.online ?? window.playbackState.bot_online;
                    if (typeof window.onReturnStatus === "function")
                        window.onReturnStatus(data.data?.online);
                    break;

                case "PLAYLISTS_DATA":
                    if (typeof window.onReturnPlaylists === "function")
                        window.onReturnPlaylists(data.data?.playlists);
                    break;

                case "AMBIENCE_DATA":
                    if (typeof window.onReturnAmbience === "function")
                        window.onReturnAmbience(data.data?.ambience);
                    break;
                    
                case "PLAYLIST_SAVE":
                    if (typeof window.onReturnPlaylistSave === "function")
                        window.onReturnPlaylistSave(data.data?.playlist);
                    break;
                    
                case "AMBIENCE_SAVE":
                    if (typeof window.onReturnAmbienceSave === "function")
                        window.onReturnAmbienceSave(data.data?.ambience);
                    break;
                    
                case "JOINEDVC":
                    if (typeof window.onReturnVCJoin === "function")
                        window.onReturnVCJoin();
                    break;
                    
                case "LEFTVC":
                    resetPlaybackState();
                    if (typeof window.onReturnVCLeft === "function")
                        window.onReturnVCLeft();
                    break;
                    

                default:
                    console.log("[WS] Unhandled response:", data);
                    if (typeof window.onUnhandledCommand === "function")
                        window.onUnhandledCommand(data);
            }
            break;

        // === Bot playback state return ===
        case "state_update":
            const state = data.payload || data.state;
            updatePlaybackState(state);

        case "bot_ready":
            if (typeof window.onBotReady === "function")
                window.onBotReady(data);
            break;
        
        // === Broadcasts / server messages ===
        case "broadcast":
            console.log("[WS] Broadcast:", data.message || data);
            if (typeof window.onBroadcast === "function")
                window.onBroadcast(data);
            break;

        default:
            console.log("[WS] Unknown message type:", data);
            if (typeof window.onUnhandledMessage === "function")
                window.onUnhandledMessage(data);
    }
}

// === Send command to bot backend ===
function sendCommand(command, data = {}) {
    console.log(`[WEB-DEBUG] Is user authorized? ${window.isAuthorized}`);
    if (!window.isAuthorized) {
            console.warn(`[WEB] Unauthorized user tried sending unauthorized command: ${command}`);
        if (!READ_ONLY_COMMANDS.includes(command)){
            console.warn("[WEB] User did not send a command in READ_ONLY_COMMAND");
            showStatus("Authorization required to use that feature", "warning", null, 10000);
            return;
        }
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, ...data }));
    } else {
        console.warn("[WS] Not connected. Command dropped:", command);
    }
}

// ===== Global Playback State Updater =====
function updatePlaybackState(newState) {
    if (!newState) return;

    console.log(`Old Playback State: ${JSON.stringify(window.playbackState)}`);
    console.log(`Attempting to write ${JSON.stringify(newState)}, ${typeof(newState)} into playback state`)
    
    // --- Parse if it's a JSON string ---
    if (typeof newState === "string") {
        try {
            newState = JSON.parse(newState);
            console.log("[WEB] Parsed playback state from JSON string.");
        } catch (err) {
            console.error("[WEB] Failed to parse playback state:", err, newState);
            return;
        }
    }
    
    // --- Unwrap if it's in an array ---
    if (Array.isArray(newState)) {
        console.warn("[WEB] Playback state is array; unwrapping first element.");
        newState.music = newState[0];
        newState.ambience = newState[1];
        newState.in_vc = newState[2];
        newState.bot_online = newState[3];
    }
    
    // --- Merge in safely ---
    if (newState.music) {
        window.playbackState.music = {
            playlist_name: newState.music.playlist_name ?? window.playbackState.music.playlist_name,
            track_name: newState.music.track_name ?? window.playbackState.music.track_name,
            playing: newState.music.playing ?? window.playbackState.music.playing,
            volume: newState.music.volume ?? window.playbackState.music.volume,
            shuffle: newState.music.shuffle ?? window.playbackState.music.shuffle,
            loop: newState.music.loop ?? window.playbackState.music.loop,
        };
    }

    if (newState.ambience) {
        window.playbackState.ambience = {
            name: newState.ambience.name ?? window.playbackState.ambience.name,
            playing: newState.ambience.playing ?? window.playbackState.ambience.playing,
            volume: newState.ambience.volume ?? window.playbackState.ambience.volume,
        };
    }

    if (typeof newState.in_vc === "boolean") window.playbackState.in_vc = newState.in_vc ?? window.playbackState.in_vc;
    
    if (newState.bot_online) window.playbackState.bot_online = newState.bot_online ?? window.playbackState.bot_online;
    
    // --- Notify page listeners ---
    if (typeof window.onPlaybackStateUpdated === "function") {
        window.onPlaybackStateUpdated(window.playbackState);
    }
    
    console.log(`New Playback State: ${JSON.stringify(window.playbackState)}`);
}

function resetPlaybackState(){
    playbackState = {
        music: { 
            playlist_name: "None",
            track_name: "None",
            playing: false, 
            volume: 100, 
            shuffle: true, 
            loop: false 
        },
        ambience: { 
            name: "None",
            playing: false, 
            volume: 25 
        },
        in_vc: false
    };
}

// ==== Status updates for pages which modify data ====

function showStatus(message, type = "success", statusElement = null, timeout = 2500){
    console.log(`[WEB] Attempting to show a status message`);
    // Use global floating status if no specific element is provided
    if (statusElement === null) {
        statusElement = document.getElementById("global-status");
    }

    if (!statusElement) {
        console.warn("[WEB] No status element available.");
        return;
    }
    
    statusElement.textContent = message;
    
    // Reset classes
    statusElement.className = "status-message";
    if (type === "success") statusElement.classList.add("status-success");
    if (type === "warning") statusElement.classList.add("status-warning");
    if (type === "error") statusElement.classList.add("status-error");
    
    // Fade in
    statusElement.classList.add("show");
    
    // Automatically fade out after 2.5s
    setTimeout(() => {
        statusElement.classList.remove("show");
    }, timeout);
    
}

// Auto-connect once the page loads
window.addEventListener("load", () => {
    if (!window.ws || window.ws.readyState > 1) {
        connectWebSocket();
        startHeartbeat(300000);
        
        const g = document.getElementById("global-status");
        if (g) g.classList.remove("show");
    }
});


function startHeartbeat(interval = 60000){
    async function ping(){
        try{
            const res = await fetch(`${API_BASE}/heartbeat`, {method: "GET"})
            const data = await res.json();
            const botOK = !!data.bot_connected;
            const webOK = !!data.ok;
            
            if (typeof window.onHeartbeatUpdate === "function"){
                window.onHeartbeatUpdate(webOK, botOK);
            }
        }catch(e){
            console.warn("[HEARTBEAT] Webserver unreachable");
            if (typeof window.onHeartbeatUpdate === "function"){
                window.onHeartbeatUpdate(false, false);
            }
        }
    }
    
    // Initial ping, then repeat
    ping();
    return setInterval(ping, interval);
}

// === Export-like global access ===
window.API_BASE = API_BASE;
window.WS_URL = WS_URL;
window.ws = ws;
window.playbackState = playbackState;
window.isAuthorized = authorized;
window.sendCommand = sendCommand;
window.authCheck = authCheck;
window.connectWebSocket = connectWebSocket;
window.updatePlaybackState = updatePlaybackState;