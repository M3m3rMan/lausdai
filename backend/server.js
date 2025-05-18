// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost', 'http://10.25.254.185'], // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Chat Model
const Chat = mongoose.model('Chat', new mongoose.Schema({
  userId: String,
  title: String,
  messages: [{
    sender: { type: String, enum: ['user', 'bot'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}));

// OpenAI Integration
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chatbot Function
async function askChatGPT(messages, context = "LAUSD_non_traditional_high_school") {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // or 'gpt-4' if available
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant for LAUSD parents. Provide clear information about ${context} in Spanish or English as needed. Be empathetic and professional.`
      },
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ],
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
}

// Chat Routes
app.post('/api/conversations', async (req, res) => {
  try {
    const { userId, initialMessage, language } = req.body;
    const newChat = new Chat({
      userId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: initialMessage ? [{
        sender: 'bot',
        content: initialMessage
      }] : []
    });
    await newChat.save();
    res.json({ insertedId: newChat._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:chatId/messages', async (req, res) => {
  try {
    const { text, sender, language } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    // Add user message
    chat.messages.push({ sender, content: text });
    await chat.save();
    
    if (sender === 'user') {
      // Get AI response
      const botReply = await askChatGPT(chat.messages);
      chat.messages.push({ sender: 'bot', content: botReply });
      await chat.save();
    }
    
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/conversations', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(chats.map(chat => ({
      id: chat._id,
      userId: chat.userId,
      name: chat.title,
      createdAt: chat.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:chatId/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat.messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});






























// // server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// // Enhanced CORS configuration
// app.use(cors({
//   origin: ['http://localhost', 'http://10.25.254.185'], // Add your frontend URLs
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('✅ MongoDB connected successfully'))
// .catch(err => console.error('❌ MongoDB connection error:', err));

// // Health Check Endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'healthy',
//     database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
//   });
// });

// // Import and use chat routes
// const chatRoutes = require('./routes/chatRoutes');
// app.use('/api/chats', chatRoutes);

// // Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.error('🚨 Error:', err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`🔗 http://localhost:${PORT}`);
// });






// server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error(err));

// // Basic routes
// app.get('/', (req, res) => {
//   res.send('Parent Guide API');
// });

// // School routes
// const schoolRouter = require('./routes/schools');
// app.use('/api/schools', schoolRouter);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));













// require('dotenv').config();
// const express = require('express');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const cors = require('cors');
// const axios = require('axios');
// const mongoDB = require('mongodb');

// // Configuration
// const PORT = process.env.PORT || 8000;
// const MONGODB_URI = process.env.MONGODB_URI;
// const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Client Setup
// const client = new MongoClient(MONGODB_URI, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// // Database Collections
// let db, conversationsCollection, usersCollection;

// // Connect to MongoDB and start server
// async function initializeServer() {
//   try {
//     await client.connect();
//     db = client.db('lausd_chatbot');
//     conversationsCollection = db.collection('conversations');
//     usersCollection = db.collection('users');
    
//     console.log("✅ Connected to MongoDB!");

//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   }
// }

// // API Routes
// app.post('/api/conversations', async (req, res) => {
//   try {
//     const { userId, initialMessage } = req.body;
    
//     if (!userId || !initialMessage) {
//       return res.status(400).json({ error: 'userId and initialMessage are required' });
//     }
    
//     const newConversation = {
//       userId,
//       messages: [{
//         text: initialMessage,
//         sender: 'user',
//         timestamp: new Date(),
//         language: 'es'
//       }],
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       language: 'es'
//     };

//     const result = await conversationsCollection.insertOne(newConversation);
//     res.status(201).json({
//       ...result,
//       conversation: newConversation
//     });
//   } catch (err) {
//     console.error('Error creating conversation:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/conversations/:id/messages', async (req, res) => {
//   try {
//     const conversationId = req.params.id;
//     const { text, sender = 'user', language = 'es' } = req.body;

//     if (!text) {
//       return res.status(400).json({ error: 'Message text is required' });
//     }

//     const newMessage = {
//       text,
//       sender,
//       timestamp: new Date(),
//       language
//     };

//     const result = await conversationsCollection.updateOne(
//       { _id: new ObjectId(conversationId) },
//       { 
//         $push: { messages: newMessage },
//         $set: { updatedAt: new Date(), language }
//       }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ error: 'Conversation not found' });
//     }

//     res.status(200).json({
//       ...result,
//       message: newMessage
//     });
//   } catch (err) {
//     console.error('Error adding message:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.get('/api/conversations/:id', async (req, res) => {
//   try {
//     const conversation = await conversationsCollection.findOne({
//       _id: new ObjectId(req.params.id)
//     });
    
//     if (!conversation) {
//       return res.status(404).json({ error: 'Conversation not found' });
//     }
    
//     res.status(200).json(conversation);
//   } catch (err) {
//     console.error('Error fetching conversation:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.get('/api/users/:userId/conversations', async (req, res) => {
//   try {
//     const conversations = await conversationsCollection.find({
//       userId: req.params.userId
//     }).sort({ updatedAt: -1 }).toArray();
    
//     res.status(200).json(conversations);
//   } catch (err) {
//     console.error('Error fetching user conversations:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // AI Processing Endpoint
// app.post('/api/ai/process', async (req, res) => {
//   try {
//     const { message, conversationId } = req.body;
    
//     if (!message || !conversationId) {
//       return res.status(400).json({ error: 'message and conversationId are required' });
//     }

//     // Call Python API with timeout
//     const response = await axios.post(
//       `${PYTHON_API_URL}/process-text`,
//       {
//         text: message,
//         target_language: 'es'
//       },
//       { timeout: 10000 } // 10 seconds timeout
//     );

//     const aiResponse = {
//       text: response.data.translation,
//       sender: 'ai',
//       timestamp: new Date(),
//       language: 'es'
//     };

//     // Save to conversation
//     const result = await conversationsCollection.updateOne(
//       { _id: new ObjectId(conversationId) },
//       { 
//         $push: { messages: aiResponse },
//         $set: { updatedAt: new Date() }
//       }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ error: 'Conversation not found' });
//     }

//     res.status(200).json(aiResponse);
//   } catch (error) {
//     console.error('AI processing error:', error);
    
//     if (error.code === 'ECONNABORTED') {
//       return res.status(504).json({ error: 'AI service timeout' });
//     }
    
//     res.status(500).json({ 
//       error: 'AI processing failed',
//       details: error.response?.data || error.message 
//     });
//   }
// });

// // Health Check Endpoint
// app.get('/health', async (req, res) => {
//   try {
//     // Check MongoDB connection
//     await client.db().admin().ping();
//     res.json({ 
//       status: 'healthy',
//       mongoDB: 'connected',
//       pythonAPI: PYTHON_API_URL
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       status: 'unhealthy',
//       error: err.message 
//     });
//   }
// });

// // Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err.stack);
//   res.status(500).json({ 
//     error: 'Internal server error',
//     message: err.message 
//   });
// });

// // Graceful Shutdown
// process.on('SIGINT', async () => {
//   try {
//     await client.close();
//     console.log('MongoDB connection closed');
//     process.exit(0);
//   } catch (err) {
//     console.error('Error during shutdown:', err);
//     process.exit(1);
//   }
// });

// // Initialize the server
// initializeServer().catch(err => {
//   console.error('Server initialization failed:', err);
//   process.exit(1);
// });