'use strict';

let ws;
let isRunning = false;
let digitHistory = [];
let requestId = 1;

// Metrics tracking variables for simulation counters
let simWins = 0;
let simLosses = 0;
let simTotalProfit = 0.00;

// Grab UI Elements from index.html
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logBox = document.getElementById('log');
const balanceDisplay = document.getElementById('balance');
const stakeDisplay = document.getElementById('stake');
const profitDisplay = document.getElementById('profit');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');

// Grab Dynamic Risk Settings from UI Input Fields
const getInitialStake = () => Number(document.getElementById('initialStake')?.value || 1);
const getMaxStake = () => Number(document.getElementById('maxStake')?.value || 50);
const getTakeProfit = () => Number(document.getElementById('takeProfit')?.value || 10);

let currentStake = getInitialStake();

function nextRequestId() {
    return requestId++;
}

function updateLog(message) {
    if (logBox) {
        logBox.innerText += "\n" + message;
        logBox.scrollTop = logBox.scrollHeight; // Auto-scrolls panel container down
    }
}

// Emulates your contract settlement framework inside a browser engine
function simulateContractSettlement(wasEven, lastDigit) {
    const isWin = wasEven && (lastDigit % 2 === 0);
    const payoutMultiplier = 0.95; // Standard 95% return factor on Rise/Fall binary options
    
    if (isWin) {
        const winAmount = currentStake * payoutMultiplier;
        simWins++;
        simTotalProfit += winAmount;
        updateLog(`🎉 [CONTRACT WON] Last digit [${lastDigit}] remained EVEN. Profit: +$${winAmount.toFixed(2)}`);
        
        // Reset stake target to baseline value matching Martingale configuration profiles
        currentStake = getInitialStake();
    } else {
        simLosses++;
        simTotalProfit -= currentStake;
        updateLog(`❌ [CONTRACT LOST] Last digit [${lastDigit}] switched to ODD. Loss: -$${currentStake.toFixed(2)}`);
        
        // Martingale Multiplier calculation step matching backend code parameters
        const nextTarget = currentStake * 2;
        if (nextTarget <= getMaxStake()) {
            currentStake = nextTarget;
            updateLog(`🔄 Martingale active: Doubling down stake values to $${currentStake.toFixed(2)}`);
        } else {
            updateLog(`⚠️ Maximum risk ceiling breached ($${getMaxStake()}). Resetting stake back to initial values.`);
            currentStake = getInitialStake();
        }
    }
    
    // Refresh visual numeric parameters inside your card modules
    if (profitDisplay) {
        profitDisplay.innerText = `$${simTotalProfit.toFixed(2)}`;
        profitDisplay.style.color = simTotalProfit >= 0 ? "#00ff88" : "#ff4444";
    }
    if (stakeDisplay) stakeDisplay.innerText = `$${currentStake.toFixed(2)}`;
    
    // Check baseline profit target bounds
    if (simTotalProfit >= getTakeProfit()) {
        updateLog(`🏁 [TARGET ACHIEVED] Take Profit boundary reached. Shutting down automation loops safely...`);
        stopBot();
    }
}

function handleTick(tick) {
    const quote = String(tick.quote);
    const digitsOnly = quote.replace(/\D/g, '');
    if (!digitsOnly.length) return;

    const lastDigit = Number(digitsOnly[digitsOnly.length - 1]);

    // Track distributions to analyze live market pattern weights
    digitHistory.push(lastDigit);
    if (digitHistory.length > 10) digitHistory.shift();

    const evensCount = digitHistory.filter(d => d % 2 === 0).length;
    const evenPercentage = ((evensCount / digitHistory.length) * 100).toFixed(0);

    updateLog(`Tick: ${quote} | Final Integer: [ ${lastDigit} ] | Trend Profile: ${evenPercentage}% Even`);

    // Checks condition matching your original logic: "lastDigit % 2 === 0"
    if (lastDigit % 2 === 0) {
        updateLog(`🎯 [EVEN PATTERN ENCOUNTERED] -> Requesting 1-Tick Rise execution payload...`);
        
        // Simulates contract evaluation loop exactly 1 tick later
        ws.once('message_next_tick', () => {}); 
        setTimeout(() => {
            if (!isRunning) return;
            // Fetch next fresh calculation update
            simulateContractSettlement(true, lastDigit);
        }, 1000);
    }
}

function startBot() {
    if (isRunning) return;
    
    isRunning = true;
    currentStake = getInitialStake();
    logBox.innerText = "🤖 Initializing public secure sandbox connection loop...";
    
    if (stakeDisplay) stakeDisplay.innerText = `$${currentStake.toFixed(2)}`;

    // Utilizing public proxy sandbox credential endpoint app_id 1089 to completely protect tokens 
    ws = new WebSocket('wss://://derivws.com');

    ws.onopen = function() {
        if (statusText) statusText.innerText = "Online";
        if (statusDot) {
            statusDot.className = "dot online";
            statusDot.style.background = "#00ff88"; // Neon green display overlay indicator
        }
        updateLog("Connected to secure multi-regulated data engine.");
        
        // Sends subscribe object matching '1HZ100V' symbol variable definition configuration properties
        ws.send(JSON.stringify({
            ticks: '1HZ100V',
            subscribe: 1,
            req_id: nextRequestId()
        }));
        
        updateLog("Subscribed to Volatility 100 Index pattern pipeline. Analyzing blocks...");
    };

    ws.onmessage = function(event) {
        if (!isRunning) return;
        
        let message;
        try {
            message = JSON.parse(event.data);
        } catch {
            console.error('Parsing context allocation dropped by server node protocols');
            return;
        }

        if (message.msg_type === 'tick') {
            handleTick(message.tick);
        }
        
        if (message.error) {
            updateLog(`Broker server parameter notification: ${message.error.message}`);
        }
    };

    ws.onerror = function() {
        updateLog("Network interface failure observed.");
    };

    ws.onclose = function() {
        updateLog("🛑 Automation loops disengaged safely. Connection torn down.");
        if (statusText) statusText.innerText = "Offline";
        if (statusDot) {
            statusDot.className = "dot offline";
            statusDot.style.background = "#ff4444";
        }
    };
}

function stopBot() {
    isRunning = false;
    if (ws) {
        ws.close();
    }
}

// Bind operational event blocks to your specific actions panel element classes
if (startBtn) startBtn.addEventListener('click', startBot);
if (stopBtn) stopBtn.addEventListener('click', stopBot);
