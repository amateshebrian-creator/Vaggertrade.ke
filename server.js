'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const bot = require('./apex-bot');

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

app.use(express.json());

/*
 * Backend health check
 */
app.get('/', (req, res) => {
    res.json({
        service: 'Vaggertrade Backend',
        status: 'online',
        message: 'Backend is running.'
    });
});


/*
 * Dashboard status
 */
app.get('/api/status', (req, res) => {

    res.json(
        bot.getStatus()
    );

});


/*
 * Start trading bot
 */
app.post('/api/bot/start', async (req, res) => {

    try {

        const result =
            await bot.start({

                initialStake:
                    req.body.initialStake,

                maxStake:
                    req.body.maxStake,

                takeProfit:
                    req.body.takeProfit

            });

        res.json(result);

    } catch (error) {

        console.error(
            'Start error:',
            error
        );

        res.status(400).json({

            error:
                error.message

        });

    }

});


/*
 * Stop trading bot
 */
app.post('/api/bot/stop', (req, res) => {

    try {

        const result =
            bot.stop();

        res.json(result);

    } catch (error) {

        console.error(
            'Stop error:',
            error
        );

        res.status(500).json({

            error:
                error.message

        });

    }

});


/*
 * Start server
 */
app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log(
            `Vaggertrade backend running on port ${PORT}`
        );

    }
);
