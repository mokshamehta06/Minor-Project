import { generateText, classifyData } from './utils/geminiHelper.js';

app.post('/api/classify', async (req, res) => {
  const { title, description } = req.body;
  const result = await classifyData(title, description);
  res.json(result);
});

app.get('/api/generate', async (req, res) => {
  const { prompt } = req.query;
  const response = await generateText(prompt);
  res.json({ response });
});