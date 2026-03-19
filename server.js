require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load curriculum data once at startup
const curriculum = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'curriculum.json'), 'utf-8')
);

console.log(`[Curriculum] Loaded ${Object.keys(curriculum).length} classes`);

// In-memory note cache
const noteCache = new Map();

// OpenRouter free models (rotate if one hits quota)
const FREE_MODELS = [
  'openrouter/stepfun/step-3.5-flash:free', // primary
  'openrouter/hunter-alpha',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'cognitivecomputations/dolphin3.0-mistral-24b:free',
];

let currentModelIndex = 0;

async function generateWithAI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  
  for (let attempt = 0; attempt < FREE_MODELS.length; attempt++) {
    const model = FREE_MODELS[currentModelIndex];
    
    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lessonote.vercel.app',
        },
        timeout: 60000,
      });
      
      return response.data.choices[0].message.content;
    } catch (err) {
      console.log(`[AI] Model ${model} failed: ${err.message}`);
      currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;
      
      if (attempt === FREE_MODELS.length - 1) {
        throw new Error('All free models exhausted. Try again later.');
      }
    }
  }
}

// GET /api/curriculum - returns structure with topics for each term
app.get('/api/curriculum', (req, res) => {
  const structure = {};
  for (const cls of Object.keys(curriculum)) {
    structure[cls] = {};
    for (const subj of Object.keys(curriculum[cls])) {
      structure[cls][subj] = {};
      for (const term of Object.keys(curriculum[cls][subj])) {
        const weeks = curriculum[cls][subj][term];
        if (Array.isArray(weeks)) {
          structure[cls][subj][term] = weeks.map(w => {
            const topicNames = Object.keys(w.topics || {});
            return {
              week: w.week,
              topic: topicNames[0] || 'Untitled',
              hasContent: topicNames.some(t => {
                const content = w.topics[t];
                return content && content.trim().length > 0 && content.trim() !== '–';
              })
            };
          });
        } else {
          structure[cls][subj][term] = [];
        }
      }
    }
  }
  res.json(structure);
});

// GET /api/week?cls=JSS 1&subject=Mathematics&term=First Term&week=1
app.get('/api/week', (req, res) => {
  const { cls, subject, term, week } = req.query;
  try {
    const weeks = curriculum[cls]?.[subject]?.[term] || [];
    const data = weeks.find(w => String(w.week) === String(week));
    if (!data) return res.status(404).json({ error: 'Week not found' });
    res.json(data);
  } catch {
    res.status(404).json({ error: 'Week not found' });
  }
});

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const { cls, subject, term, week, topic } = req.body;
  if (!cls || !subject || !term || !week) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cacheKey = `${cls}||${subject}||${term}||${week}`;
  if (noteCache.has(cacheKey)) {
    return res.json({ note: noteCache.get(cacheKey), cached: true });
  }

  // Get week data from curriculum
  let weekData;
  try {
    const weeks = curriculum[cls]?.[subject]?.[term] || [];
    weekData = weeks.find(w => String(w.week) === String(week));
  } catch {
    return res.status(404).json({ error: 'Week data not found' });
  }
  
  if (!weekData) return res.status(404).json({ error: 'Week data not found' });

  const topics = weekData.topics || {};
  let topicContext = '';
  for (const [key, val] of Object.entries(topics)) {
    if (val && String(val).trim() && String(val).trim() !== '–') {
      topicContext += `${key}: ${val}\n`;
    }
  }
  if (!topicContext.trim()) topicContext = 'Revision / Examination week';

  const prompt = `You are an expert Nigerian secondary school teacher writing a detailed lesson note.

Class: ${cls}
Subject: ${subject}
Term: ${term}
Week: ${week}

Curriculum Content for this week:
${topicContext}

Write a comprehensive, well-structured lesson note using this exact format:

## LESSON NOTE

**Subject:** ${subject}
**Class:** ${cls}
**Term:** ${term}
**Week:** Week ${week}
**Duration:** 40 minutes

---

### 01 Learning Objectives
- Clear bullet points stating what students should achieve

### 02 Introduction
- Background and real-life context
- Simple explanation of why the topic is important

### 03 Key Concepts and Explanation
- Define the topic clearly
- Break into subtopics
- Explain each part in simple language
- Include examples inside explanations

### 04 Examples
- Multiple worked examples
- Step-by-step solutions

### 05 Class Activity or Discussion Questions
- Practice questions
- Can include group or individual tasks

### 06 Summary
- Recap key points
- Reinforce understanding

---

Follow the curriculum content exactly. Use simple language suitable for secondary school students. Be detailed but clear. Number sections exactly as shown: 01, 02, 03, 04, 05, 06. Do not skip any section. The note should look like real classroom notes students can read and study.`;

  try {
    const note = await generateWithAI(prompt);
    noteCache.set(cacheKey, note);
    res.json({ note, cached: false });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: 'Failed to generate note: ' + err.message });
  }
});

// GET /api/cache/stats
app.get('/api/cache/stats', (req, res) => {
  res.json({ cachedNotes: noteCache.size });
});

// Serve React build in production
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
