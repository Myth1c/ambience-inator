// ========================
// playback.js — Updated for new HTML (BEM structure)
// ========================

// Local cached data
let playlists = {};
let ambience = {};

// ========================
// ON PAGE LOAD
// ========================
window.onload = async () => {
    const authed = await authCheck();
    if (!authed) return;

    // ==== MUSIC BUTTONS ====
    document.getElementById("music-playpause").onclick = () => togglePlayback("music");
    document.getElementById("music-prev").onclick = () => sendCommand("PREVIOUS_SONG");
    document.getElementById("music-skip").onclick = () => sendCommand("NEXT_SONG");
    document.getElementById("music-shuffle").onclick = () =>
        sendCommand("SET_SHUFFLE", { enabled: !window.playbackState.music.shuffle });
    document.getElementById("music-loop").onclick = () =>
        sendCommand("SET_LOOP", { enabled: !window.playbackState.music.loop });

    document.getElementById("music-volume").oninput = e => {
        sendCommand("SET_VOLUME_MUSIC", { volume: parseInt(e.target.value) });
    };

    // ==== AMBIENCE BUTTONS ====
    document.getElementById("ambience-playpause").onclick = () => togglePlayback("ambience");

    document.getElementById("ambience-volume").oninput = e => {
        sendCommand("SET_VOLUME_AMBIENCE", { volume: parseInt(e.target.value) });
    };

    // ==== VC BUTTONS ====
    document.getElementById("vc-join").onclick = () => {
        if (!window.playbackState.in_vc) sendCommand("JOINVC");
    };

    document.getElementById("vc-leave").onclick = () => {
        if (window.playbackState.in_vc) sendCommand("LEAVEVC");
    };
};

// ========================
// WEBSOCKET CALLBACKS
// ========================
window.onPlaybackStateUpdated = () => {
    updateNowPlaying("music");
    updateNowPlaying("ambience");
    updateVCButtons();
    updateToggleVisual("music-loop", window.playbackState.music.loop);
    updateToggleVisual("music-shuffle", window.playbackState.music.shuffle);
    updatePlaybackButtons(window.playbackState.music.playing, window.playbackState.ambience.playing);
    autoSelectCurrentPlaylist();
};

window.onReturnPlaylists = (pls) => {
    playlists = pls;
    populatePlaylistList();
};

window.onReturnAmbience = (amb) => {
    ambience = amb;
    populateAmbienceList();
};

window.onWebSocketConnected = () => {
    sendCommand("GET_BOT_STATUS");
    sendCommand("GET_PLAYLISTS");
    sendCommand("GET_AMBIENCE");
    sendCommand("GET_PLAYBACK_STATE");
};

window.onReturnStatus = (status) => updatePlaybackAvailability(status);

function onReturnVCJoin() { updatePlaybackAvailability("online"); }
function onReturnVCLeft() { updatePlaybackAvailability("online"); }

// ====== UI Setup ======
function populatePlaylistList() {
    const container = document.getElementById("music-content");
    container.innerHTML = "";

    Object.keys(playlists).forEach(name => {
        const btn = document.createElement("button");
        btn.classList.add("playlist-item");
        btn.textContent = name;
        btn.onclick = () => {
            // Remove previous selection
            container.querySelectorAll("button.selected").forEach(el =>
                el.classList.remove("selected")
            );
            // Apply new selection
            btn.classList.add("selected");
            sendCommand("PLAY_PLAYLIST", { name });
        }
        container.appendChild(btn);
    });
}

function populateAmbienceList() {
    const container = document.getElementById("ambience-content");
    container.innerHTML = "";

    for (const [url, title] of Object.entries(ambience)) {
        const btn = document.createElement("button");
        btn.classList.add("playlist-item");
        btn.textContent = title;
        btn.onclick = () => {
            // Remove previous selection
            container.querySelectorAll("button.selected").forEach(el =>
                el.classList.remove("selected")
            );
            // Apply new selection
            btn.classList.add("selected");
            sendCommand("PLAY_AMBIENCE", { url, title });
        }
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
    if (type === "music") {
        const elPlaylist = document.getElementById("np-music-playlist");
        const elTrack = document.getElementById("np-music-track");

        if (!window.playbackState.music.playing) {
            elPlaylist.textContent = "Playlist: None";
            elTrack.textContent = "Track: None";
        } else {
            elPlaylist.textContent = `Playlist: ${window.playbackState.music.playlist_name}`;
            elTrack.textContent = `Track: ${window.playbackState.music.track_name}`;
        }
    }

    if (type === "ambience") {
        const elPlaylist = document.getElementById("np-ambience-playlist");
        const elTrack = document.getElementById("np-ambience-track");

        if (!window.playbackState.ambience.playing) {
            elPlaylist.textContent = "Playlist: None";
            elTrack.textContent = "Track: None";
        } else {
            elPlaylist.textContent = "Playlist: Ambience";
            elTrack.textContent = `Track: ${window.playbackState.ambience.name}`;
        }
    }
}

function updateToggleVisual(id, active) {
    const btn = document.getElementById(id);
    if (!btn) return;
    
    if (active){
        btn.classList.add("active-toggle")
    }else{
        btn.classList.remove("active-toggle")
    }
}

function updatePlaybackButtons(musicPlaying, ambiencePlaying) {
    document.getElementById("music-playpause").textContent = musicPlaying ? "Pause" : "Play";
    document.getElementById("ambience-playpause").textContent = ambiencePlaying ? "Pause" : "Play";
}

function updateVCButtons() {
    const join = document.getElementById("vc-join");
    const leave = document.getElementById("vc-leave");
    const inVC = window.playbackState.in_vc;

    join.disabled = inVC;
    leave.disabled = !inVC;
}

function updatePlaybackAvailability(state) {
    const online = state === "online";
    const inVC = window.playbackState.in_vc;

    const musicPanel = document.querySelector(".playback-panel--music");
    const ambiencePanel = document.querySelector(".playback-panel--ambience");
    const vcPanel = document.querySelector(".playback-vc");

    if (!online) {
        musicPanel.classList.add("disabled-panel");
        ambiencePanel.classList.add("disabled-panel");
        vcPanel.classList.add("disabled-panel");
        return;
    }

    vcPanel.classList.remove("disabled-panel");

    if (!inVC) {
        musicPanel.classList.add("disabled-panel");
        ambiencePanel.classList.add("disabled-panel");
    } else {
        musicPanel.classList.remove("disabled-panel");
        ambiencePanel.classList.remove("disabled-panel");
    }
}

function autoSelectCurrentPlaylist() {
    const currentMusic = playbackState.music.playlist_name;
    const musicContainer = document.getElementById("music-content");
    
    const currentAmbience = playbackState.ambience.name;
    const ambienceContainer = document.getElementById("ambience-content");
    
    if (currentMusic){
        musicContainer.querySelectorAll("button").forEach(btn => {
            if (btn.textContent === currentMusic) {
                btn.classList.add("selected");
            }
        });
    }
    if (currentAmbience){
        ambienceContainer.querySelectorAll("button").forEach(btn => {
            if (btn.textContent === currentAmbience) {
                btn.classList.add("selected");
            }
        });
    }
}