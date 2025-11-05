let ws;
let currentPlaylist = null;
let playlists = {};
let selectedSongUrl = null;
let editMode = "music";

window.onload = () => {
    //ws = new WebSocket(`wss://localhost:8080/ws`);  // if local dev
    ws = new WebSocket(`wss://ambienceinator-web.onrender.com/ws`) // (if hosted backend)

    ws.onopen = () => {
        console.log("[Playlist] WS Connected");
        sendCommand("GET_PLAYLISTS")
    };

    ws.onmessage = (msg) => handleMessage(msg);
    
    // Mode Toggle Buttons
    document.getElementById("musicModeBtn").onclick = () => switchMode("music");
    document.getElementById("ambienceModeBtn").onclick = () => switchMode("ambience");
    
    // 
    document.getElementById("newPlaylistBtn").onclick = createNewPlaylist;
    document.getElementById("addSongBtn").onclick = addSong;
    document.getElementById("removeSongBtn").onclick = removeSong;
    document.getElementById("saveBtn").onclick = saveChanges;
};

function switchMode(mode) {
    if (editMode === mode) return;

    editMode = mode;
    currentPlaylist = null;
    clearSelection();

    // Highlight correct button
    const musicBtn = document.getElementById("musicModeBtn");
    const ambienceBtn = document.getElementById("ambienceModeBtn");
    const highlight = document.querySelector(".mode-highlight");

    if (mode === "music") {
        musicBtn.classList.add("active");
        ambienceBtn.classList.remove("active");
        highlight.style.left = "0";
    } else {
        ambienceBtn.classList.add("active");
        musicBtn.classList.remove("active");
        highlight.style.left = "50%";
    }

    // Logic for enabling/disabling playlists
    const select = document.getElementById("playlistSelect");
    const newBtn = document.getElementById("newPlaylistBtn");
    const titleEl = document.getElementById("playlistTitle");

    playlists = {};
    document.getElementById("songList").innerHTML = "";

    if (mode === "music") {
        select.disabled = false;
        newBtn.disabled = false;
        select.innerHTML = '<option value="" disabled selected>-- Choose a playlist --</option>';
        titleEl.textContent = "Select or create a playlist";
        sendCommand("GET_PLAYLISTS")
    } else {
        select.disabled = true;
        newBtn.disabled = true;
        select.innerHTML = '<option value="Ambience" selected>Ambience</option>';
        titleEl.textContent = "Ambience Tracks";
        sendCommand("GET_AMBIENCE")
    }
}


function handleMessage(msg) {
    const data = JSON.parse(msg.data);
    console.log("[Playlist] Received:", data);

    if (data.command === "PLAYLISTS_DATA") {
        console.log("[Playlist] Loading playlists:", Object.keys(data.playlists));
        playlists = data.playlists;
        populatePlaylistSelect();
    }
    
    if (data.command === "AMBIENCE_DATA") {
        // Treat ambience as a single playlist
        playlists = { Ambience: data.ambience };
        currentPlaylist = "Ambience";

        // Ensure the dropdown updates and disables
        const select = document.getElementById("playlistSelect");
        select.value = "Ambience";
        select.disabled = true;
        document.getElementById("newPlaylistBtn").disabled = true;
        
        // Now actually load it into the panel
        loadPlaylist("Ambience");
        showStatus("Ambience loaded.", "success");
    }
    
    if (data.command === "PLAYLIST_SAVED") {
        showStatus(`Saved playlist: ${data.name}`, "success");
    }
    
    if (data.command === "AMBIENCE_SAVED") {
        showStatus(`Saved ambience with (${data.count} entries)`, "success");
    }
    
}

function populatePlaylistSelect() {
    const select = document.getElementById("playlistSelect");
    select.innerHTML = '<option value="" disabled selected>-- Choose a playlist --</option>';

    Object.keys(playlists).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    select.onchange = () => {
        const name = select.value;
        loadPlaylist(name);
    };
}

function loadPlaylist(name) {
    currentPlaylist = name;
    document.getElementById("playlistTitle").textContent = name;
    const list = document.getElementById("songList");
    list.innerHTML = "";

    const playlist = playlists[name];
    if (!playlist) {
        console.warn(`[Playlist] No data found for ${name}`);
        return;
    }
    
    // Works for both nested (music) and flat (ambience)
    for (const [url, title] of Object.entries(playlist)) {
        const li = document.createElement("li");
        li.textContent = `${title} | (${url})`;
        li.onclick = (e) => {
            // Deselect previous
            document.querySelectorAll("#songList li.selected").forEach(el => el.classList.remove("selected"));

            // Toggle selection
            if (li.classList.contains("selected")) {
                clearSelection();
                return;
            }

            li.classList.add("selected");
            selectedSongUrl = url;

            // Fill input fields
            document.getElementById("songUrl").value = url;
            document.getElementById("songTitle").value = title;
            document.getElementById("addSongBtn").textContent = "Edit Song";

        };
        list.appendChild(li);
    }
}

function createNewPlaylist() {
    const name = prompt("Enter new playlist name:");
    if (!name) return;

    playlists[name] = {};
    populatePlaylistSelect();
    document.getElementById("playlistSelect").value = name;
    loadPlaylist(name);
}

function addSong() {
    if (!currentPlaylist) return alert("Select a playlist first.");
    
    const url = document.getElementById("songUrl").value.trim();
    const title = document.getElementById("songTitle").value.trim();
    if (!url || !title) return alert("Enter both URL and title.");

    const playlist = playlists[currentPlaylist];
    
    // If editing an existing song
    if (selectedSongUrl && playlist[selectedSongUrl]){
        // If URL changed, delete old one
        if(selectedSongUrl !== url) delete playlist[selectedSongUrl];
        playlist[url] = title;
    }else{
        // Add new song
        playlist[url] = title;
    }
    
    // Refresh UI
    loadPlaylist(currentPlaylist)
    
    // Reset fields
    clearSelection();
}

function clearSelection() {
    selectedSongUrl = null;
    document.querySelectorAll("#songList li.selected").forEach(el => el.classList.remove("selected"));
    document.getElementById("songUrl").value = "";
    document.getElementById("songTitle").value = "";
    document.getElementById("addSongBtn").textContent = "Add Song";
}

function removeSong() {
    if (!currentPlaylist) return alert("Select a playlist first.");
    if (!selectedSongUrl) return alert("Select a song to remove first.");

    delete playlists[currentPlaylist][selectedSongUrl];
    loadPlaylist(currentPlaylist);
    clearSelection();
}

function saveChanges() {
    if(editMode === "music"){
        if (!currentPlaylist){
            showStatus("Select a playlist first.", "warning");
            return;
        }
        sendCommand("SAVE_PLAYLIST", {
            name: currentPlaylist,
            data: playlists[currentPlaylist]            
        })
        showStatus(`Saving "${currentPlaylist}"...`, "success")
    }else{
        sendCommand("SAVE_AMBIENCE", {
            data: playlists["Ambience"]          
        })
        showStatus("Saving Ambience...", "success")
    }
    
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

// Deselect if clicking outside the list or controls
document.addEventListener("click", (e) => {
    const clickedInsideList = e.target.closest("#songList");
    const clickedInsideControls = e.target.closest(".song-controls");
    if (!clickedInsideList && !clickedInsideControls) {
        // Remove the visual highlight as well
        document.querySelectorAll("#songList li.selected").forEach(el => el.classList.remove("selected"));
        clearSelection();
    }
});

// ====== WebSocket Command Sender ======
function sendCommand(command, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, ...data }));
    } else {
        console.warn("[Playback] WS not connected");
    }
}