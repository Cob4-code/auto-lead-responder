require('dotenv').config();
const express = require('express');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Webhook verification
app.get('/webhook', (req, res) => {
        if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
                    res.send(req.query['hub.challenge']);
        } else {
                    res.sendStatus(403);
        }
});

// Receive messages
app.post('/webhook', async (req, res) => {
        res.sendStatus(200);

             const body = req.body;
const platform = body.object;
if (platform !== 'page' && platform !== 'instagram') return;
console.log(`[${platform.toUpperCase()}] Webhook received:`, JSON.stringify(body, null, 2));

                     const entries = body.entry || [];
            for (const entry of entries) {
                            const messaging = entry.messaging || [];
                            for (const event of messaging) {
                                                if (!event.message || event.message.is_echo) continue;

                                const senderId = event.sender.id;
                                                    const userText = event.message.text;
                                                    if (!userText) continue;

                                console.log(`Message from ${senderId}: ${userText}`);

                                try {
                                                            const response = await anthropic.messages.create({
                                                                                                model: 'claude-haiku-4-5-20251001',
                                                                                                max_tokens: 300,
                                                                                                system: `You are a friendly assistant for Regal Auto Sales, a used car dealership. Keep replies concise (2-4 sentences), warm, and professional. Help customers with questions about vehicles, pricing, and availability. If unsure, say the owner will follow up shortly.`,
                                                                                                messages: [{ role: 'user', content: userText }],
                                                            });

                                                        const reply = response.content[0].text;

                                                        await axios.post(
                                                                                        `https://graph.facebook.com/v20.0/me/messages`,
                                                            { recipient: { id: senderId }, message: { text: reply } },
                                                            { params: { access_token: process.env.PAGE_ACCESS_TOKEN } }
                                                                                    );

                                                        console.log(`Replied to ${senderId}: ${reply}`);
                                } catch (err) {
                                                        console.error('Error:', err.response ? JSON.stringify(err.response.data) : err.message);
                                }
                            }
            }
});

app.listen(process.env.PORT || 3000, () => console.log('Bot running!'));
