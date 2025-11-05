// ===== playback.js =====

let playlists = {};
let ambience = {};

window.onload = async () => {
    const authed = await authCheck();
    if (!authed) return;

    connectWebSocket(handlePlaybackMessage);
    console.log("[Playback] WS Connected");

    sendCommand("GET_PLAYLISTS");
    sendCommand("GET_AMBIENCE");
    sendCommand("GET_PLAYBACK_STATE");

    // Main controls
    document.getElementById("musicPlayPause").onclick = () => togglePlayback("music");
    document.getElementById("ambiencePlayPause").onclick = () => togglePlayback("ambience");

    document.getElementById("musicSkip").onclick = () => sendCommand("NEXT_SONG");
    document.getElementById("musicPrev").onclick = () => sendCommand("PREVIOUS_SONG");
    document.getElementById("musicShuffle").onclick = toggleShuffle;
    document.getElementById("musicLoop").onclick = toggleLoop;

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
        resetPlaybackState();
    };
};

window.onPlaybackStateUpdated = (ps) => {
    updateNowPlaying("music", ps.music.playlist_name, ps.music.track_name);
    updateNowPlaying("ambience", "Ambience", ps.ambience.name);
    updateVCButtons();
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
