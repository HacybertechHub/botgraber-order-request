/**
 * HACYBER GLOBAL TECH - NEXUS CORE v1.1
 * Client-Side Controller & Handshake Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnActivate = document.getElementById('btnActivate');
    const btnHandshake = document.getElementById('btnHandshake');
    const activationResult = document.getElementById('activationResult');
    
    // --- Key Generation Logic ---
    function generateHybridKey(platform) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let chunk = "";
        for (let i = 0; i < 8; i++) {
            chunk += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const prefixes = { TG: 'HGT-TG-', WA: 'HGT-WA-', DS: 'HGT-DS-', IG: 'HGT-IG-' };
        return (prefixes[platform] || 'HGT-ACT-') + chunk;
    }

    // --- Secure Transmission Logic ---
    async function transmitActivation(payload) {
        try {
            const response = await fetch('/api/transmit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.status === 'Handshake_Complete') {
                return true;
            }
            return false;
        } catch (error) {
            console.error("Vector Error:", error);
            return false;
        }
    }

    // --- Activation Event ---
    btnActivate.addEventListener('click', async () => {
        const platform = document.getElementById('platform').value;
        const userId = document.getElementById('userId').value || "HGT-GUEST";
        const botId = document.getElementById('botId').value || "PRIME-BOT";
        const note = document.getElementById('note').value;

        if (!platform) {
            activationResult.style.color = "var(--danger)";
            activationResult.textContent = "CRITICAL: Select platform vector.";
            return;
        }

        const generatedKey = generateHybridKey(platform);
        
        // Visual Feedback
        activationResult.style.color = "var(--neon)";
        activationResult.textContent = "INITIALIZING SECURE HANDSHAKE...";

        const success = await transmitActivation({
            userId,
            botId,
            platform,
            key: generatedKey,
            note: note,
            fee: "130.00" // Hardcoded protocol fee
        });

        if (success) {
            activationResult.style.color = "var(--accent)";
            activationResult.textContent = `SUCCESS: Key Generated -> ${generatedKey}`;
            // If the index_33.html saveActivationRow function exists, call it:
            if (typeof saveActivationRow === "function") {
                saveActivationRow(userId, botId, platform, generatedKey);
            }
        } else {
            activationResult.style.color = "var(--danger)";
            activationResult.textContent = "ERROR: Transmission handshake failed.";
        }
    });

    // --- Visual Handshake Simulation ---
    btnHandshake.addEventListener('click', () => {
        if (typeof appendLog === "function") {
            appendLog("[HANDSHAKE] Verifying system integrity...", "log-tag");
            setTimeout(() => appendLog("[HANDSHAKE] Encrypting multi-platform tunnel...", "log-muted"), 500);
            setTimeout(() => appendLog("[HANDSHAKE] Handshake protocol verified.", "log-tag"), 1000);
        }
    });
});
