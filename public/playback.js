let ws;
let playlists = {};
let ambience = {};
let inVC = false;

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
    //ws = new WebSocket(`wss://localhost:8080/ws`);  // if local dev
    ws = new WebSocket(`wss://ambienceinator-web.onrender.com/ws`) // (if hosted backend)

    ws.onopen = () => {
        console.log("[WS] WS Connected");
        sendCommand("GET_PLAYLISTS");
        sendCommand("GET_AMBIENCE");
        sendCommand("GET_PLAYBACK_STATE");
        
    };

    ws.onmessage = msg => handleMessage(msg);

    // Main control events
    document.getElementById("musicPlayPause").onclick = () => togglePlayback("music");
    document.getElementById("ambiencePlayPause").onclick = () => togglePlayback("ambience");

    // Secondary control events
    document.getElementById("musicSkip").onclick = () => sendCommand("NEXT_SONG");
    document.getElementById("musicPrev").onclick = () => sendCommand("PREVIOUS_SONG");
    document.getElementById("musicShuffle").onclick = toggleShuffle;
    document.getElementById("musicLoop").onclick = toggleLoop;
    
    // Volume control events
    document.getElementById("musicVolume").oninput = e => {
        const vol = parseInt(e.target.value);
        playbackState.music.volume = vol;
        sendCommand("SET_VOLUME_MUSIC", { volume: vol });
    };

    document.getElementById("ambienceVolume").oninput = e => {
        const vol = parseInt(e.target.value);
        playbackState.ambience.volume = vol;
        sendCommand("SET_VOLUME_AMBIENCE", { volume: vol });
    };
    
    document.getElementById("joinVCBtn").onclick = () => {
        if (playbackState.in_vc) return;
        sendCommand("JOINVC");
        playbackState.in_vc = true;
        updateVCButtons();
    };

    document.getElementById("leaveVCBtn").onclick = () => {
        if (!playbackState.in_vc) return;
        sendCommand("LEAVEVC");
        updateVCButtons();
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


// ====== WebSocket Message Handler ======
function handleMessage(msg) {
    const data = JSON.parse(msg.data);

    switch (data.command) {
        case "PLAYLISTS_DATA":
            playlists = data.playlists;
            populatePlaylistList();
            break;
        case "AMBIENCE_DATA":
            ambience = data.ambience;
            populateAmbienceList();
            break;
        case "PLAYBACK_STATE":
            const stateData = Array.isArray(data.state) ? data.state[0] : data.state;
            updatePlaybackState(stateData);
            break;
    }
}

// ====== UI Setup ======
function populatePlaylistList() {
    const container = document.getElementById("playlistList");
    container.innerHTML = "";

    Object.keys(playlists).forEach(name => {
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.onclick = () => sendCommand("PLAY_PLAYLIST", { name });
        container.appendChild(btn);
    });
}

function populateAmbienceList() {
    const container = document.getElementById("ambienceList");
    container.innerHTML = "";

    for (const [url, title] of Object.entries(ambience)) {
        const btn = document.createElement("button");
        btn.textContent = title;
        btn.onclick = () => sendCommand("PLAY_AMBIENCE", { url, title });
        container.appendChild(btn);
    }
}

// ====== Playback Control ======
function togglePlayback(type) {
    const isPlaying = playbackState[type].playing;
    const cmd = isPlaying ? "PAUSE" : "RESUME";

    sendCommand(cmd, { type });
}

function toggleShuffle() {
    playbackState.music.shuffle = !playbackState.music.shuffle;
    sendCommand("SET_SHUFFLE", { enabled: playbackState.music.shuffle });
    updateToggleVisual("musicShuffle", playbackState.music.shuffle);
}

function toggleLoop() {
    playbackState.music.loop = !playbackState.music.loop;
    sendCommand("SET_LOOP", { enabled: playbackState.music.loop });
    updateToggleVisual("musicLoop", playbackState.music.loop);
}

function updatePlaybackState(newState) {
    if (!newState) return;
    
    newData = newState.music;
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

    
    newData = newState.ambience;
    oldData = playbackState.ambience;
    playbackState.ambience = {
        ...playbackState.ambience,
        name: newData.name ?? oldData.name,
        playing: newData.playing ?? oldData.ambience.playing,
        volume: newData.volume ?? oldData.volume
    };
    
    if ("in_vc" in newState) {
        playbackState.in_vc = newState.in_vc;
        updateVCButtons();  // 👈 update button visuals immediately
    }

    // Log for debugging
    console.log(
        `[WS] Updated Playback State -> music.playing: ${playbackState.music.playing}, ambience.playing: ${playbackState.ambience.playing}`
    );

    // DOM element references
    const musicBtn = document.getElementById("musicPlayPause");
    const ambienceBtn = document.getElementById("ambiencePlayPause");
    const musicVol = document.getElementById("musicVolume");
    const ambienceVol = document.getElementById("ambienceVolume");

    // Button text updates
    musicBtn.textContent = playbackState.music.playing ? "Pause" : "Play";
    ambienceBtn.textContent = playbackState.ambience.playing ? "Pause" : "Play";

    // Sync volume sliders
    musicVol.value = playbackState.music.volume;
    ambienceVol.value = playbackState.ambience.volume;

    // Shuffle/loop toggles
    updateToggleVisual("musicShuffle", playbackState.music.shuffle);
    updateToggleVisual("musicLoop", playbackState.music.loop);

    // Now playing display
    updateNowPlaying("music", playbackState.music.playlist_name, playbackState.music.track_name);
    updateNowPlaying("ambience", "Ambience", playbackState.ambience.name);

}


function updateNowPlaying(type, playlist, track) {
    const element = document.getElementById(
        type === "music" ? "musicNowPlaying" : "ambienceNowPlaying"
    );
    line1 = "";
    line2 = "None";
    
    if (type === "music" && playbackState.music.playing){
        line1 = `Playlist: ${playlist} / `;
        line2 = `Title: ${track}`;
    }else if (type === "ambience" && playbackState.ambience.playing){
        line1 = "";
        line2 = `${track}`;
    }
    
    fullLine = line1 + line2;
    element.textContent = fullLine;
}

function updateToggleVisual(id, active) {
    const btn = document.getElementById(id);
    btn.style.background = active ? "#4caf50" : "#222";
    btn.style.borderColor = active ? "#4caf50" : "#555";
}

function updateVCButtons() {
    const joinVCBtn = document.getElementById("joinVCBtn");
    const leaveVCBtn = document.getElementById("leaveVCBtn");
    const inVC = playbackState.in_vc;

    joinVCBtn.classList.toggle("active", inVC);
    leaveVCBtn.classList.toggle("active", !inVC);

    joinVCBtn.disabled = inVC;
    leaveVCBtn.disabled = !inVC;
}

// ====== WebSocket Command Sender ======
function sendCommand(command, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, ...data }));
    } else {
        console.warn("[Playback] WS not connected");
    }
}
