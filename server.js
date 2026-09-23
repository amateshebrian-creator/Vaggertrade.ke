const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 🟢 SAFARICOM DARAJA API CONFIGURATION CREDENTIALS
const MPESA_CONSUMER_KEY = "PASTE_YOUR_DARAJA_CONSUMER_KEY_HERE";
const MPESA_CONSUMER_SECRET = "PASTE_YOUR_DARAJA_CONSUMER_SECRET_HERE";
const MPESA_SHORTCODE = "174379"; // Default sandbox test paybill till shortcode
const MPESA_PASSKEY = "bfb272ea231d23714b6563608497763619c68de1b2e4f0a7ef3d5567b6b19a7e";
const CALLBACK_URL = "https://yourdomain.com"; // Your live server endpoint link

/**
 * Middleware layer to handle dynamic Safaricom OAuth Access Token updates
 */
async function generateMpesaToken(req, res, next) {
    const authBuffer = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await axios.get('https://safaricom.co.ke', {
            headers: { Authorization: `Basic ${authBuffer}` }
        });
        req.mpesaToken = response.data.access_token;
        next();
    } catch (error) {
        res.status(500).json({ error: "Failed to authenticate Daraja handshake credentials tokens safely." });
    }
}

/**
 * Main STK Push Inflow Controller
 * Standardizes formatting and fires the real network call to prompt users' phones
 */
app.post('/api/mpesa/stkpush', generateMpesaToken, async (req, res) => {
    let { phone, amount } = req.body;

    // Clean format normalization to Kenyan country indicator codes: 254...
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);

    // Dynamic currency converter routing (e.g. 1 USD = approx 130 KES conversion mapping setup)
    const totalAmountKes = Math.round(amount * 130);

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkPayload = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: totalAmountKes,
        PartyA: phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: "Vaggertrade",
        TransactionDesc: "Wallet Automation Deposit Funding"
    };

    try {
        const safaricomResponse = await axios.post(
            'https://safaricom.co.ke', // Change endpoint string when migrating to production
            stkPayload,
            { headers: { Authorization: `Bearer ${req.mpesaToken}` } }
        );
        res.status(200).json(safaricomResponse.data);
    } catch (err) {
        res.status(400).json(err.response ? err.response.data : { error: "Gateway router interface timed out." });
    }
});

app.listen(3000, () => console.log('M-Pesa STK backend router processing active on port 3000.'));
                                                   
