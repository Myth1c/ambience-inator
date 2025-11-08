// ============================
// GLOBAL AUTH OVERLAY CONTROLLER
// ============================

const authOverlay = {
    overlay: null,
    modalInput: null,
    btnSubmit: null,
    btnCancel: null,
    floatBtn: null,

    async init() {
        this.overlay = document.getElementById("auth-overlay");
        this.modalInput = document.getElementById("auth-input");
        this.btnSubmit = document.getElementById("auth-submit");
        this.btnCancel = document.getElementById("auth-cancel");
        this.floatBtn = document.getElementById("auth-float-btn");

        this.btnSubmit.onclick = () => this.submit();
        this.btnCancel.onclick = () => this.minimize();
        this.floatBtn.onclick = () => this.show();

        // Check immediately
        const authed = await authCheck();
        if (!authed) {
            this.show();
        } else {
            this.minimize(false); // minimize but no flash
        }
    },

    minimize(addFlash = true) {
        this.overlay.classList.add("hidden");
        this.floatBtn.classList.remove("hidden");

        if (addFlash) {
            this.floatBtn.classList.add("flash");
        } else {
            this.floatBtn.classList.remove("flash");
        }
    },

    show() {
        this.floatBtn.classList.add("hidden");
        this.overlay.classList.remove("hidden");    
        setTimeout(() => {
            document.getElementById("auth-input").focus();
        }, 10);
    },

    async submit() {
        const key = this.modalInput.value.trim();
        if (!key) return alert("Enter the key.");
        
        try{
            const res = await fetch("https://ambienceinator-web.onrender.com/auth_check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
                credentials: "include"
            });
            
            const data = await res.json();
            
            if (data.ok){
                
                this.minimize(false);
            }else{
                alert("Invalid auth key")
            }
            
        } catch(err){
            console.error("[AUTH] Error:", err);
            alert("Unable to contact authentication server");
        }
    }
};

document.addEventListener("keydown", (e) => {
    const overlay = document.getElementById("auth-overlay");
    if (overlay.classList.contains("hidden")) return; // modal not shown → ignore

    if (e.key === "Enter") {
        document.getElementById("auth-submit").click();
    }

    if (e.key === "Escape") {
        document.getElementById("auth-cancel").click();
    }
});

// Initialize on DOM load
window.addEventListener("DOMContentLoaded", () => authOverlay.init());
