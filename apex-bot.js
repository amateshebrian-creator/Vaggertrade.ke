'use strict';

const WebSocket = require('ws');

const API_BASE = 'https://api.derivws.com';

const APP_ID = process.env.DERIV_APP_ID;
const AUTH_TOKEN = process.env.DERIV_TOKEN;
const ACCOUNT_ID = process.env.DERIV_ACCOUNT_ID;

const SYMBOL = '1HZ100V';

let ws = null;
let requestId = 1;
const pending = new Map();

let running = false;
let connecting = false;
let tradeInProgress = false;
let activeContractId = null;

let baseStake = 2;
let currentStake = 2;
let maxStake = 5000;
let takeProfit = 10;

let sessionProfit = 0;
let accountBalance = 0;

const logs = [];


/* =========================
   LOGGING
========================= */

function log(message) {

    const line =
        `[${new Date().toLocaleTimeString()}] ${message}`;

    console.log(line);
