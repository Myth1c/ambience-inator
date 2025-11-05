// ===== setup.js =====

window.onload = async () => {
    
    const authed = await authCheck();
    if (!authed) return;

    document.getElementById("saveBtn").onclick = () => {
        const vc = document.getElementById("vcInput").value;
        const tc = document.getElementById("tcInput").value;
        sendCommand("SETUP_SAVE", {
            voice_channel_id: vc,
            text_channel_id: tc
        });
        
        statusMessage = document.getElementById("statusMessage");
        
        showStatus("Saving bot configuration...", "success", statusMessage);
    };
    
    document.getElementById("updateQueueBtn").onclick = () => {
        sendCommand("UPDATE_QUEUE_MESSAGE");
    };

    document.getElementById("updateUILinkBtn").onclick = () => {
        sendCommand("UPDATE_UI_LINK");
    };

}

