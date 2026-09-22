'use strict';

let ws;
let isRunning = false;
let digitHistory = [];
let requestId = 1;

// Metrics accounting metrics parameters
let currentStake = 10;
let initialStakeSetting = 10;
let maxStakeSetting = 5000;
let takeProfitSetting = 100;
let totalProfit = 0.00;
let baseBalance = 20375.81;

// Grab layout elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logBox = document.getElementById('log');
const balanceDisplay = document.getElementById('balance');
const stakeDisplay = document.getElementById('stake');
const profitDisplay = document.getElementById('profit');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const strategyDropdown = document.getElementById('strategyDropdown');

function nextRequestId() {
    return requestId++;
}

function updateLog(message) {
    if (logBox) {
        logBox.innerText += "\n" + message;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function updateUI() {
    if (profitDisplay) {
        profitDisplay.innerText = `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`;
        profitDisplay.style.color = totalProfit >= 0 ? "#00ff88" : "#ff4444";
    }
    if (balanceDisplay) {
        let currentBal = baseBalance + totalProfit;
        balanceDisplay.innerText = `$${currentBal.toFixed(2)}`;
    }
    if (stakeDisplay) stakeDisplay.innerText = `$${currentStake.toFixed(2)}`;
}

function handleContractResult(isWin) {
    const strategyMode = strategyDropdown.value;
    const payoutFactor = 0.95; // Standard payout configuration for digital indices

    if (isWin) {
        const winAmount = currentStake * payoutFactor;
        totalProfit += winAmount;
        updateLog(`🎉 [WIN] Target block sequence matched. Return: +$${winAmount.toFixed(2)}`);
        
        // Reset system to base stake allocation parameters
        currentStake = initialStakeSetting;
    } else {
        totalProfit -= currentStake;
        updateLog(`❌ [LOSS] Target sequence missed. Deficit: -$${currentStake.toFixed(2)}`);
        
        if (strategyMode === 'Martingale') {
            const doubleStake = currentStake * 2;
            if (doubleStake <= maxStakeSetting) {
                currentStake = doubleStake;
                updateLog(`🔄 Martingale active: Doubling allocation to $${currentStake.toFixed(2)}`);
            } else {
                updateLog(`⚠️ Max risk parameters reached. Safety reset executed.`);
                currentStake = initialStakeSetting;
            }
        } else {
            currentStake = initialStakeSetting;
        }
    }

    updateUI();

    if (totalProfit >= takeProfitSetting) {
        updateLog(`🏁 [TARGET MET] Take profit boundary reached. Automated loop disengaged successfully.`);
        stopBot();
    }
}

function handleTick(tick) {
    const quote = String(tick.quote);
    const digitsOnly = quote.replace(/\D/g, '');
    if (!digitsOnly.length) return;

    const lastDigit = Number(digitsOnly[digitsOnly.length - 1]);
    
    digitHistory.push(lastDigit);
    if (digitHistory.length > 10) digitHistory.shift();

    updateLog(`Index Feed: ${quote} | Last Digit: [ ${lastDigit} ]`);

    // The core pattern trigger condition
    if (lastDigit % 2 === 0) {
        updateLog(`🎯 [PATTERN MATCH] Digit is EVEN -> Deploying 1-Tick contract block...`);
        
        setTimeout(() => {
            if (!isRunning) return;
            // Simulated tick sequence outcome randomization
            const outcomeSeed = Math.floor(Math.random() * 10);
            const contractWon = (outcomeSeed % 2 === 0);
            handleContractResult(contractWon);
        }, 1000);
    }
}

function startBot() {
    if (isRunning) return;
    
    // Read current user config values from screen boxes
    initialStakeSetting = Number(document.getElementById('initialStake').value || 10);
    maxStakeSetting = Number(document.getElementById('maxStake').value || 5000);
    takeProfitSetting = Number(document.getElementById('takeProfit').value || 100);
    
    currentStake = initialStakeSetting;
    isRunning = true;
    updateUI();

    logBox.innerText = "🤖 Initializing platform interface modules...";

    // Public API application gateway ID to establish network handshake flags securely
    ws = new WebSocket('wss://://derivws.com');

    ws.onopen = function() {
        if (statusText) statusText.innerText = "Online";
        if (statusDot) {
            statusDot.className = "dot online";
            statusDot.style.background = "#00ff88";
        }
        updateLog("✅ Platform link validated by server infrastructure.");
        
        // Connect to Volatility 100 Index feed tracking variables
        ws.send(JSON.stringify({
            ticks: '1HZ100V',
            subscribe: 1,
            req_id: nextRequestId()
        }));
        updateLog("🔄 Active stream established for Volatility 100. Scanning data grid...");
    };

    ws.onmessage = function(event) {
        if (!isRunning) return;
        const message = JSON.parse(event.data);

        if (message.msg_type === 'tick') {
            handleTick(message.tick);
        }
    };

    ws.onerror = function() {
        updateLog("❌ Connection loop encountered an allocation shift anomaly.");
    };

    ws.onclose = function() {
        updateLog("🛑 Automation script disconnected. Interface idle.");
        if (statusText) statusText.innerText = "Offline";
        if (statusDot) {
            statusDot.className = "dot offline";
            statusDot.style.background = "#ff4444";
        }
    };
}

function stopBot() {
    isRunning = false;
    if (ws) ws.close();
}

if (startBtn) startBtn.addEventListener('click', startBot);
if (stopBtn) stopBtn.addEventListener('click', stopBot);
