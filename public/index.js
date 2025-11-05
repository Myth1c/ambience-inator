let ws;
let botConnectionState = null;
window._botCheckTimer = null;

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

window.onload = () => {
    ws = new WebSocket(`wss://localhost:8080/ws`);  // if local dev
    // or wss://ambienceinator.onrender.com/ws  (if hosted backend)
    
    ws.onmessage = msg => {
        const data = JSON.parse(msg.data);

        switch (data.command) {
            case "BOT_STATUS":
                updateBotStatus(data.online);
                break;
            case "PLAYBACK_STATE":
                const stateData = Array.isArray(data.state) ? data.state[0] : data.state;
                updateBotPlayingStatus(stateData);
                break;
        }
    };
    
    
    ws.onopen = () => {
        console.log("[WS] Connected to Index");
        sendCommand("GET_BOT_STATUS");
        sendCommand("GET_PLAYBACK_STATE");
    };
    
    
    // === Bot Startup Buttons ===
    const startBtn = document.getElementById("startBotBtn");
    const stopBtn = document.getElementById("stopBotBtn");
    const rebootBtn = document.getElementById("rebootBotBtn");
    
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
        sendCommand("LEAVEVC");
        sendCommand("STOP_BOT");
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
    };
};

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
function updateBotPlayingStatus(data){
    const el = document.getElementById("statusMessage");
    if (!data) return;
    
    newData = data.music;
    oldData = playbackState.music;
    // Merge new state to keep structure consistent
    playbackState.music = {
        playlist_name: newData.playlist_name ?? oldData.playlist_name,
        track_name: newData.track_name ?? oldData.track_name,
        playing: newData.playing ?? oldData.playing,
        volume: newData.volume ?? oldData.volume,
        shuffle: newData.shuffle ?? oldData.shuffle,
        loop: newData.loop ?? oldData.loop
    };

    
    newData = data.ambience;
    oldData = playbackState.ambience;
    playbackState.ambience = {
        ...playbackState.ambience,
        name: newData.name ?? oldData.name,
        playing: newData.playing ?? oldData.ambience.playing,
        volume: newData.volume ?? oldData.volume
    };
    
    
    newStatusMessage = el.textContent;
    
    nowPlayingStatus = "";
    
    if (playbackState.music.playlist_name !== "None" && playbackState.music.track_name !== "None" && playbackState.music.playing){
        nowPlayingStatus += `\n\nCurrent Playlist: ${playbackState.music.playlist_name}\n\nCurrent Track: ${playbackState.music.track_name}`;
    }else{
        nowPlayingStatus += "";
    }
    
    if (playbackState.ambience.name !== "None" && playbackState.ambience.playing){
        nowPlayingStatus += `\n\nCurrent Ambience: ${playbackState.ambience.name}`;
    }else{
        nowPlayingStatus += "";
    }
    
    newStatusMessage += nowPlayingStatus;
    
    el.textContent = newStatusMessage
    
    
}

// ====== WebSocket Command Sender ======
function sendCommand(command, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, ...data }));
    } else {
        console.warn("[Index] WS not connected");
    }
}
