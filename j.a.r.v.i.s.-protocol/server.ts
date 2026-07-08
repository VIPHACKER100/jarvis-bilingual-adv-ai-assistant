import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error('Missing GEMINI_API_KEY environment variable');
        return res.status(500).json({ error: 'System error: Neural network offline. Missing API Key.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are J.A.R.V.I.S., a highly intelligent AI assistant. Keep your responses extremely concise, authoritative, and helpful. You speak to the user politely. If giving facts or numbers, state them clearly. Do not use markdown or emojis, as your response will be converted to speech.',
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: 'System malfunction processing query.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`J.A.R.V.I.S Core System online on port ${PORT}`);
  });
}

startServer();
