// ==================== shared.js ====================

// === Backend base URLs ===
const API_BASE = "https://ambienceinator-web.onrender.com";
const WS_URL = "wss://ambienceinator-web.onrender.com/ws";

// === Global State ===
let ws;
let playbackState = {
    music: { 
        playlist_name: "None",
        track_name: "None",
        playing: false, 
        volume: 100, 
        shuffle: false, 
        loop: false 
    },
    ambience: { 
        name: "None",
        playing: false, 
        volume: 25 
    },
    in_vc: false
};

// === Auth helper ===
async function authCheck() {
    const key = localStorage.getItem("authKey");
    if (!key) {
        console.warn("[WEB] No auth key, redirecting...");
        window.location.href = "./auth.html";
        return false;
    }

    try {
        const res = await fetch(`${API_BASE}/auth_check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key })
        });

        if (!res.ok) throw new Error("Auth failed");
        const data = await res.json();
        if (!data.ok) throw new Error("Auth denied");

        console.log("[WEB] Auth successful");
        return true;
    } catch (err) {
        console.error("[WEB] Auth error:", err);
        window.location.href = "./auth.html";
        return false;
    }
}

// === WebSocket setup ===
function connectWebSocket(onMessageCallback) {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => console.log("[WS] Connected to backend");
    ws.onclose = () => console.warn("[WS] Disconnected");
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
function handleIncomingCommand(data){
    const cmd = data.command;
    
    switch(cmd){
        
        case "PLAYBACK_STATE":
            const stateData = Array.isArray(data.state) ? data.state[0] : data.state;
            updatePlaybackState(stateData);
            if (typeof window.onBotPlaybackUpdate === "function"){
                window.onBotPlaybackUpdate(stateData);
            }
            break;
            
        case "BOT_STATUS":
            if (typeof window.onBotStatusUpdate === "function"){
                window.onBotStatusUpdate(data.online);
            }
        
        case "PLAYLISTS_DATA":
            if (typeof window.onPlaylistsData === "function") {
                window.onPlaylistsData(data.playlists);
            }
            break;

        case "AMBIENCE_DATA":
            if (typeof window.onAmbienceData === "function") {
                window.onAmbienceData(data.ambience);
            }
            break;
        
        case "AMBIENCE_SAVED":
        case "PLAYLIST_SAVED":
            if (typeof window.onPlaylistSaved === "function") {
                window.onPlaylistSaved(data.name);
            }
            break;
            
        default:
            console.log("[WS] Unhandled command:", cmd);
            // Optional catch-all
            if (typeof window.onUnhandledCommand === "function") {
                window.onUnhandledCommand(data);
            }
    }
}

// === Send command to bot backend ===
function sendCommand(command, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, ...data }));
    } else {
        console.warn("[WS] Not connected. Command dropped:", command);
    }
}

// ===== Global Playback State Updater =====
function updatePlaybackState(newState) {
    if (!newState) return;

    const ps = window.playbackState;

    // Merge in new data safely
    if (newState.music) {
        ps.music = {
            playlist_name: newState.music.playlist_name ?? ps.music.playlist_name,
            track_name: newState.music.track_name ?? ps.music.track_name,
            playing: newState.music.playing ?? ps.music.playing,
            volume: newState.music.volume ?? ps.music.volume,
            shuffle: newState.music.shuffle ?? ps.music.shuffle,
            loop: newState.music.loop ?? ps.music.loop,
        };
    }

    if (newState.ambience) {
        ps.ambience = {
            name: newState.ambience.name ?? ps.ambience.name,
            playing: newState.ambience.playing ?? ps.ambience.playing,
            volume: newState.ambience.volume ?? ps.ambience.volume,
        };
    }

    if (typeof newState.in_vc === "boolean") ps.in_vc = newState.in_vc;

    // Notify page scripts (if any)
    if (typeof window.onPlaybackStateUpdated === "function") {
        window.onPlaybackStateUpdated(ps);
    }
}

function resetPlaybackState(){
    playbackState = {
        music: { 
            playlist_name: "None",
            track_name: "None",
            playing: false, 
            volume: 100, 
            shuffle: false, 
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

function showStatus(message, type = "success", statusElement = null){
    
    if (statusElement === null) {
        console.log(`[WS] Sent showStatus with an invalid element to update.`);
        return;
    }
    
    statusElement.textContent = message;
    
    // Reset classes
    statusElement.className = "status-message";
    if (type === "success") el.classList.add("status-success");
    if (type === "warning") el.classList.add("status-warning");
    if (type === "error") el.classList.add("status-error");
    
    // Fade in
    statusElement.classList.add("show");
    
    // Automatically fade out after 2.5s
    setTimeout(() => {
        statusElement.classList.remove("show");
    }, 2500);
    
}



// === Export-like global access ===
window.API_BASE = API_BASE;
window.WS_URL = WS_URL;
window.ws = ws;
window.playbackState = playbackState;
window.sendCommand = sendCommand;
window.handleMessage = handleMessage;
window.authCheck = authCheck;
window.connectWebSocket = connectWebSocket;
window.updatePlaybackState = updatePlaybackState;
