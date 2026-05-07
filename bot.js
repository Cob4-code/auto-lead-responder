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
                    if (body.object !== 'page') return;

                      for (const entry of body.entry) {
                          for (const event of (entry.messaging || [])) {
                                if (!event.message || event.message.is_echo) continue;

                                      const senderId = event.sender.id;
                                            const userText = event.message.text;
                                                  if (!userText) continue;

                                                        try {
                                                                const response = await anthropic.messages.create({
                                                                          model: 'claude-sonnet-4-20250514',
                                                                                    max_tokens: 300,
                                                                                              system: `You are a friendly, helpful assistant responding to messages on behalf of a business owner on Facebook Marketplace and Instagram.
                                                                                              Keep replies concise (2-4 sentences), warm, and professional.
                                                                                              If someone asks about an item for sale, express interest in helping them.
                                                                                              If unsure, politely say the owner will follow up shortly.`,
                                                                                                        messages: [{ role: 'user', content: userText }],
                                                                                                                });
                                                                                                                
                                                                                                                        const reply = response.content[0].text;
                                                                                                                        
                                                                                                                                await axios.post(
                                                                                                                                          'https://graph.facebook.com/v19.0/me/messages',
                                                                                                                                                    { recipient: { id: senderId }, message: { text: reply } },
                                                                                                                                                              { params: { access_token: process.env.PAGE_ACCESS_TOKEN } }
                                                                                                                                                                      );
                                                                                                                                                                      
                                                                                                                                                                              console.log(`Replied to ${senderId}: ${reply}`);
                                                                                                                                                                                    } catch (err) {
                                                                                                                                                                                            console.error('Error:', err.message);
                                                                                                                                                                                                  }
                                                                                                                                                                                                      }
                                                                                                                                                                                                        }
                                                                                                                                                                                                        });
                                                                                                                                                                                                        
                                                                                                                                                                                                        app.listen(process.env.PORT || 3000, () => console.log('Bot running!'));
