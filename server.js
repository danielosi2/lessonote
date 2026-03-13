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

// In-memory note cache
const noteCache = new Map();

// OpenRouter free models (rotate if one hits quota)
const FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

let currentModelIndex = 0;

async function generateWithAI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  
  // Try each free model
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
      });
      
      return response.data.choices[0].message.content;
    } catch (err) {
      console.log(`[AI] Model ${model} failed: ${err.message}`);
      // Rotate to next model
      currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;
      
      // If this was the last model, throw error
      if (attempt === FREE_MODELS.length - 1) {
        throw new Error('All free models exhausted. Try again later.');
      }
    }
  }
}

// Helper: get weeks array for class/subject/term
function getWeeks(cls, subject, term) {
  try {
    return curriculum[cls][subject][term] || [];
  } catch {
    return [];
  }
}

// Helper: get single week entry by week number
function getWeekData(cls, subject, term, weekNum) {
  const weeks = getWeeks(cls, subject, term);
  return weeks.find(w => String(w.week) === String(weekNum)) || null;
}

// GET /api/curriculum - structure: classes > subjects > terms > [week numbers]
app.get('/api/curriculum', (req, res) => {
  const structure = {};
  for (const cls of Object.keys(curriculum)) {
    structure[cls] = {};
    for (const subj of Object.keys(curriculum[cls])) {
      structure[cls][subj] = {};
      for (const term of Object.keys(curriculum[cls][subj])) {
        const weeks = curriculum[cls][subj][term];
        structure[cls][subj][term] = Array.isArray(weeks)
          ? weeks.map(w => w.week)
          : [];
      }
    }
  }
  res.json(structure);
});

// GET /api/week?cls=JSS1&subject=Mathematics&term=First Term&week=1
app.get('/api/week', (req, res) => {
  const { cls, subject, term, week } = req.query;
  const data = getWeekData(cls, subject, term, week);
  if (!data) return res.status(404).json({ error: 'Week not found' });
  res.json(data);
});

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const { cls, subject, term, week } = req.body;
  if (!cls || !subject || !term || !week) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cacheKey = cls + '||' + subject + '||' + term + '||' + week;
  if (noteCache.has(cacheKey)) {
    return res.json({ note: noteCache.get(cacheKey), cached: true });
  }

  const weekData = getWeekData(cls, subject, term, week);
  if (!weekData) return res.status(404).json({ error: 'Week data not found' });

  const topics = weekData.topics || {};
  let topicContext = '';
  for (const [key, val] of Object.entries(topics)) {
    if (val && String(val).trim()) {
      topicContext += key + ': ' + val + '\n';
    }
  }
  if (!topicContext.trim()) topicContext = 'Revision / Examination week';

  const prompt = 'You are an expert Nigerian secondary school teacher writing a detailed lesson note.\n\n'
    + 'Class: ' + cls + '\n'
    + 'Subject: ' + subject + '\n'
    + 'Term: ' + term + '\n'
    + 'Week: ' + week + '\n\n'
    + 'Curriculum Content for this week:\n' + topicContext + '\n'
    + 'Write a comprehensive, well-structured lesson note using this exact format:\n\n'
    + '## LESSON NOTE\n\n'
    + '**Subject:** ' + subject + '\n'
    + '**Class:** ' + cls + '\n'
    + '**Term:** ' + term + '\n'
    + '**Week:** Week ' + week + '\n'
    + '**Duration:** 40 minutes\n\n'
    + '---\n\n'
    + '### Topic(s)\n'
    + '(State the topic(s) clearly from the curriculum content)\n\n'
    + '### Learning Objectives\n'
    + 'By the end of this lesson, students should be able to:\n'
    + '(List 3-5 clear, measurable objectives)\n\n'
    + '### Materials/Resources\n'
    + '(List relevant teaching aids, textbooks, charts etc.)\n\n'
    + '### Previous Knowledge\n'
    + '(What students already know that connects to this lesson)\n\n'
    + '### Introduction / Set Induction (5 minutes)\n'
    + '(An engaging opening activity or question to capture attention)\n\n'
    + '### Lesson Development (25 minutes)\n\n'
    + '**Step 1:**\n(Teacher activity and student activity)\n\n'
    + '**Step 2:**\n(Teacher activity and student activity)\n\n'
    + '**Step 3:**\n(Teacher activity and student activity)\n\n'
    + '### Evaluation / Class Assessment\n'
    + '(5-7 questions to test understanding)\n\n'
    + '### Conclusion / Summary (5 minutes)\n'
    + '(Wrap up key points of the lesson)\n\n'
    + '### Assignment\n'
    + '(A meaningful homework task)\n\n'
    + '---\n\n'
    + 'Make the note practical, detailed, and appropriate for Nigerian secondary school students following the NERDC curriculum.';

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
app.listen(PORT, () => console.log('Server running on port ' + PORT));
