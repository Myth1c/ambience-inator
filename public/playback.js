// ===== playback.js =====

let playlists = {};
let ambience = {};

window.onload = async () => {
    const authed = await authCheck();
    if (!authed) return;

    // Main controls
    document.getElementById("musicPlayPause").onclick = () => togglePlayback("music");
    document.getElementById("ambiencePlayPause").onclick = () => togglePlayback("ambience");

    document.getElementById("musicSkip").onclick = () => sendCommand("NEXT_SONG");
    document.getElementById("musicPrev").onclick = () => sendCommand("PREVIOUS_SONG");
    document.getElementById("musicShuffle").onclick = sendCommand("SET_SHUFFLE", { enabled: playbackState.music.shuffle });
    document.getElementById("musicLoop").onclick = sendCommand("SET_LOOP", { enabled: window.playbackState.music.loop });

    document.getElementById("musicVolume").oninput = e => {
        const vol = parseInt(e.target.value);
        sendCommand("SET_VOLUME_MUSIC", { volume: vol });
    };

    document.getElementById("ambienceVolume").oninput = e => {
        const vol = parseInt(e.target.value);
        sendCommand("SET_VOLUME_AMBIENCE", { volume: vol });
    };

    document.getElementById("joinVCBtn").onclick = () => {
        if (window.playbackState.in_vc) return;
        sendCommand("JOINVC");
    };

    document.getElementById("leaveVCBtn").onclick = () => {
        if (!window.playbackState.in_vc) return;
        sendCommand("LEAVEVC");
    };
};

window.onPlaybackStateUpdated = () => {
    console.log("Playback.js received state update event");
    updateNowPlaying("music");
    updateNowPlaying("ambience");
    updateVCButtons();
    updateToggleVisual("musicLoop", window.playbackState.music.loop);
    updateToggleVisual("musicShuffle", window.playbackState.music.shuffle);
    updatePlaybackButtons(window.playbackState.music.playing, window.playbackState.ambience.playing);
}

window.onReturnPlaylists = (pls) => {
    console.log(`Attempting to display ${JSON.stringify(pls)}`)
    playlists = pls
    populatePlaylistList()
}

window.onReturnAmbience = (amb) => {
    console.log(`Attempting to display ${JSON.stringify(amb)}`)
    ambience = amb
    populateAmbienceList()
}

window.onWebSocketConnected = () => {
    sendCommand("GET_PLAYLISTS");
    sendCommand("GET_AMBIENCE");
    sendCommand("GET_PLAYBACK_STATE");
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
    const isPlaying = window.playbackState[type].playing;
    const cmd = isPlaying ? "PAUSE" : "RESUME";

    sendCommand(cmd, { type });
    
}

// ===== Visual Updating =====
function updateNowPlaying(type) {
    const element = document.getElementById(
        type === "music" ? "musicNowPlaying" : "ambienceNowPlaying"
    );
    line1 = "";
    line2 = "None";
    
    if (type === "music" && window.playbackState.music.playing){
        line1 = `Playlist: ${window.playbackState.music.playlist_name} / `;
        line2 = `Title: ${window.playbackState.music.track_name}`;
    }else if (type === "ambience" && window.playbackState.ambience.playing){
        line1 = "";
        line2 = `${window.playbackState.ambience.name}`;
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
    const inVC = window.playbackState.in_vc;

    joinVCBtn.classList.toggle("active", inVC);
    leaveVCBtn.classList.toggle("active", !inVC);

    joinVCBtn.disabled = inVC;
    leaveVCBtn.disabled = !inVC;
}

function updatePlaybackButtons(musicPlaying, ambiencePlaying){
    const musicPlay = document.getElementById("musicPlayPause")
    const ambPlay = document.getElementById("ambiencePlayPause")
    
    if(musicPlaying){
        musicPlay.textContent = "Pause";
    }else{
        musicPlay.textContent = "Play";
    }
    
    if(ambiencePlaying){
        ambPlay.textContent = "Pause";
    }else{
        ambPlay.textContent = "Play";
    }
    
}