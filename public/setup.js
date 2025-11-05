// ===== setup.js =====

window.onload = async () => {
    
    const authed = await authCheck();
    if (!authed) return;

    connectWebSocket(handlePlaybackMessage);

    document.getElementById("saveBtn").onclick = () => {
        const vc = document.getElementById("vcInput").value;
        const tc = document.getElementById("tcInput").value;
        sendCommand("SETUP_SAVE", {
            voice_channel_id: vc,
            text_channel_id: tc
        });
        
        showStatus("Saving bot configuration...", "success", document.getElementById("statusMessage"));
    };
    
    document.getElementById("updateQueueBtn").onclick = () => {
        sendCommand("UPDATE_QUEUE_MESSAGE");
    };

    document.getElementById("updateUILinkBtn").onclick = () => {
        sendCommand("UPDATE_UI_LINK");
    };

}

