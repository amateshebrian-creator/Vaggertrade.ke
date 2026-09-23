'use strict';

const WebSocket = require('ws');

const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3';

const APP_ID = process.env.DERIV_APP_ID;

const SYMBOL = '1HZ100V';

let ws = null;
let requestId = 1;
const pending = new Map();

let running = false;
let connecting = false;
let tradeInProgress = false;
let activeContractId = null;

let mode = 'demo';

let baseStake = 2;
let currentStake = 2;
let maxStake = 5000;
let takeProfit = 10;

let sessionProfit = 0;
let accountBalance = 0;
let currency = 'USD';

const logs = [];


/* =========================
   LOGGING
========================= */

function log(message) {

    const line =
        `[${new Date().toLocaleTimeString()}] ${message}`;

    console.log(line);

    logs.unshift(line);

    if (logs.length > 50) {
        logs.pop();
    }
}


/* =========================
   ACCOUNT CREDENTIALS
========================= */

function getCredentials(selectedMode) {

    const selected =
        String(selectedMode || '').toLowerCase();

    if (
        selected !== 'demo' &&
        selected !== 'real'
    ) {
        throw new Error(
            'Mode must be DEMO or REAL.'
        );
    }

    const token =
        selected === 'demo'
            ? process.env.DERIV_DEMO_TOKEN
            : process.env.DERIV_REAL_TOKEN;

    const accountId =
        selected === 'demo'
            ? process.env.DERIV_DEMO_ACCOUNT_ID
            : process.env.DERIV_REAL_ACCOUNT_ID;

    if (!APP_ID) {
        throw new Error(
            'DERIV_APP_ID is not configured.'
        );
    }

    if (!token) {
        throw new Error(
            `DERIV_${selected.toUpperCase()}_TOKEN is not configured.`
        );
    }

    if (!accountId) {
        throw new Error(
            `DERIV_${selected.toUpperCase()}_ACCOUNT_ID is not configured.`
        );
    }

    return {
        token,
        accountId
    };
}


/* =========================
   CLEANUP
========================= */

function cleanupSocket() {

    if (ws) {

        try {
            ws.removeAllListeners();
            ws.close();
        } catch (_) {}

    }

    ws = null;

    connecting = false;
    tradeInProgress = false;
    activeContractId = null;

    for (const [, item] of pending) {

        clearTimeout(item.timeout);

        item.reject(
            new Error(
                'WebSocket connection closed.'
            )
        );
    }

    pending.clear();
}


/* =========================
   DER
