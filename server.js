'use strict';

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DERIV_WS_URL = 'wss://://derivws.com';
const APP_ID = process.env.DERIV_APP_ID || '10101'; 

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "PASTE_YOUR_KEY_HERE";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "PASTE_YOUR_SECRET_HERE";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "174379"; 
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "bfb272ea231d23714b6563608497763619c68de1b2e4f0a7ef3d5567b6b19a7e";

let ws = null;
let running = false;
let tradeInProgress = false;

let baseStake = 2;
let currentStake = 2;
let takeProfit = 10;
let sessionProfit = 0;

const logs = [];

function log(message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(line);
    logs.unshift(line);
    if (logs.length > 50) logs.pop();
}

async function generateMpesaToken(req, res, next) {
    const authBuffer = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await axios.get('https://safaricom.co.ke', {
            headers: { Authorization: `Basic ${authBuffer}` }
        });
        req.mpesaToken = response.data.access_token;
        next();
    } catch (error) {
        log("Safaricom Authorization Token Generation Refused.");
        res.status(500).json({ error: "Failed to authenticate Daraja handshake credentials." });
    }
}

app.post('/api/mpesa/stkpush', generateMpesaToken, async (req, res) => {
    let { phone, amount } = req.body;

    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);

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
        CallBackURL: "https://onrender.com", 
        AccountReference: "Vaggertrade",
        TransactionDesc: "Wallet Automation Deposit Funding"
    };

    try {
        const safaricomResponse = await axios.post(
            'https://safaricom.co.ke',
            stkPayload,
            { headers: { Authorization: `Bearer ${req.mpesaToken}` } }
        );
        res.status(200).json(safaricomResponse.data);
    } catch (err) {
        res.status(400).json(err.response ? err.response.data : { error: "Gateway router interface connection error." });
    }
});

app.post('/api/mpesa/callback', (req, res) => {
    log("Inbound cashier push receipt validation string parsed from Safaricom networks.");
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

function cleanupSocket() {
    running = false;
    tradeInProgress = false;
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    ws = null;
}

app.listen(PORT, () => {
    log(`Vaggertrade Engine premium backend router networks operational on port: ${PORT}`);
});
