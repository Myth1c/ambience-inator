// ===== auth.js =====

async function submitAuth() {
    
    const key = document.getElementById("authKey").value.trim();
    if (!key) return alert("Enter the key")
        
    // Verify key with server
    const res = await fetch("https://ambienceinator-web.onrender.com/auth_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        credentials: "include"
    });
    
    const data = await res.json()
    
    if (data.ok) {
        window.location.href = "./";
    } else {
        alert("Invalid key");
        localStorage.removeItem("ambience_auth_key");
    }
    
}