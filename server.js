'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const bot = require('./apex-bot');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(__dirname));

// Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Backend status
app.get('/api/status', (req, res) => {
    try {
        res.json(bot.getStatus());
    } catch (error) {
        console.error('Status error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Start bot
app.post('/api/bot/start', async (req, res) => {

    try {

        const {
            mode,
            initialStake,
            maxStake,
            takeProfit
        } = req.body || {};

        const selectedMode =
            String(mode || '').toLowerCase();

        if (
            selectedMode !== 'demo' &&
            selectedMode !== 'real'
        ) {
            return res.status(400).json({
                error: 'Mode must be DEMO or REAL.'
            });
        }

        const result = await bot.start({

            mode: selectedMode,

            initialStake:
                Number(initialStake),

            maxStake:
                Number(maxStake),

            takeProfit:
                Number(takeProfit)

        });

        res.json(result);

    } catch (error) {

        console.error(
            'Start error:',
            error
        );

        res.status(400).json({
            error: error.message
        });

    }
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {

    try {

        const result = bot.stop();

        res.json(result);

    } catch (error) {

        console.error(
            'Stop error:',
            error
        );

        res.status(500).json({
            error: error.message
        });

    }
});

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log(
            `Vaggertrade backend running on port ${PORT}`
        );

    }
);
