// models/Chat.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: String, // "user" or "bot"
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  title: String,
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
