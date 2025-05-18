// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 GPT-based chatbot function
async function askChatGPT(messages) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // or 'gpt-4o-mini' if available
    messages: [
      {
        role: "system",
        content: "You are an assistant helping Latino parents understand the rules and regulations of LAUSD non-traditional high schools. Respond in Spanish or English as appropriate, with clear and empathetic explanations."
      },
      ...messages // ← append user & assistant message history here
    ],
  });
  return completion.choices[0].message.content;
}

// ➕ Create a new chat
router.post('/', async (req, res) => {
  try {
    const chat = new Chat({ title: req.body.title, messages: [] });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// 📨 Send message and get response from GPT
router.post('/:chatId/message', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userMessage } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Add user message
    chat.messages.push({ sender: 'user', content: userMessage });

    // Prepare messages for GPT
    const formattedMessages = chat.messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Get GPT response
    const botReply = await askChatGPT(formattedMessages);

    // Add bot response
    chat.messages.push({ sender: 'bot', content: botReply });

    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 📄 Get all chats
router.get('/', async (req, res) => {
  const chats = await Chat.find().sort({ createdAt: -1 });
  res.json(chats);
});

// 🔍 Get one chat
router.get('/:chatId', async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) return res.status(404).json({ error: 'Not found' });
  res.json(chat);
});

// 🗑️ Delete chat
router.delete('/:chatId', async (req, res) => {
  await Chat.findByIdAndDelete(req.params.chatId);
  res.json({ message: 'Deleted' });
});

module.exports = router;
