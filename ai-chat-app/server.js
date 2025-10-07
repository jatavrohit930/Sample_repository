// server.js - Node.js Backend for AI Chat with Image Analysis
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for images
app.use(express.static('.')); // Serve frontend files from root

// Conversation history store
const conversations = new Map();

// AI Response endpoint with image support
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, apiKey, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Initialize Gemini AI with user's API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);

    let result;
    let aiResponse;

    // Handle image + text or just text
    if (image) {
      // For images, we send a single prompt (not using chat history for image analysis)
      const imagePart = {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      };

      const prompt = message || "What's in this image? Describe it in detail.";
      result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      aiResponse = response.text();

      // Add to history without image data to save memory
      history.push(
        { role: "user", parts: [{ text: `[Image uploaded] ${prompt}` }] },
        { role: "model", parts: [{ text: aiResponse }] }
      );

    } else {
      // Text-only chat with history
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        },
      });

      result = await chat.sendMessage(message);
      const response = await result.response;
      aiResponse = response.text();

      // Update history
      history.push(
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: aiResponse }] }
      );
    }

    // Keep only last 20 messages to avoid token limits
    if (history.length > 20) {
      conversations.set(sessionId, history.slice(-20));
    }

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
      errorMessage = 'Invalid API Key. Please check your key and try again.';
    } else if (error.message.includes('models/gemini')) {
      errorMessage = 'Model not available. Please try again or check your API key.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later or check your API limits.';
    } else if (error.message.includes('image')) {
      errorMessage = 'Image processing error: ' + error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Clear conversation history
app.post('/api/clear', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && conversations.has(sessionId)) {
    conversations.delete(sessionId);
  }
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', conversations: conversations.size });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`💡 Open http://localhost:${PORT} in your browser`);
  console.log(`📸 Image analysis enabled!`);
});