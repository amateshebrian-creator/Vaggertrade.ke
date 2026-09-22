// 1. Open a secure connection to Deriv's public data server
const ws = new WebSocket('wss://://derivws.com');
; // 1089 is the default free testing app ID
const startBtn = document.getElementById('start-btn');

const startBtn = document.getElementById('start-btn'); // Change to match your HTML button ID
const logBox = document.querySelector('.Live Activity console placeholder'); // Change to your log box class/ID

// 2. Listen for a successful server connection
ws.onopen = function() {
    console.log("Connected to Deriv data stream.");
};

// 3. When the user clicks "Start Bot", request live prices for the Volatility 100 Index
function startPriceStream() {
    ws.send(JSON.stringify({
        "ticks": "R_100" // This requests the Volatility 100 (1s) Index tick stream
    }));
    updateLog("🔄 Bot connected. Streaming live market ticks...");
}

// 4. Capture the incoming prices and display them in your terminal box
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.tick) {
        const currentPrice = data.tick.quote;
        const epochTime = data.tick.epoch;
        
        // Grab the very last digit of the price
        const lastDigit = currentPrice.toString().slice(-1);
        
        updateLog(`📈 Price: ${currentPrice} | Last Digit: ${lastDigit}`);
    }
};

// Helper function to print text into your website's black console box
function updateLog(message) {
    // This updates the text layout inside your terminal box
    console.log(message); 
}
