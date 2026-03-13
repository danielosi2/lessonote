const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load curriculum
const curriculum = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'curriculum.json'), 'utf-8')
);

// In-memory cache (won't persist between function invocations)
const noteCache = new Map();

// OpenRouter free models
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
      currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;
      
      if (attempt === FREE_MODELS.length - 1) {
        throw new Error('All free models exhausted. Try again later.');
      }
    }
  }
}

function getWeekData(cls, subject, term, weekNum) {
  try {
    const weeks = curriculum[cls][subject][term];
    return weeks.find(w => String(w.week) === String(weekNum)) || null;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cls, subject, term, week } = req.body;
  if (!cls || !subject || !term || !week) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cacheKey = `${cls}||${subject}||${term}||${week}`;
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

### Topic(s)
(State the topic(s) clearly from the curriculum content)

### Learning Objectives
By the end of this lesson, students should be able to:
(List 3-5 clear, measurable objectives)

### Materials/Resources
(List relevant teaching aids, textbooks, charts etc.)

### Previous Knowledge
(What students already know that connects to this lesson)

### Introduction / Set Induction (5 minutes)
(An engaging opening activity or question to capture attention)

### Lesson Development (25 minutes)

**Step 1:**
(Teacher activity and student activity)

**Step 2:**
(Teacher activity and student activity)

**Step 3:**
(Teacher activity and student activity)

### Evaluation / Class Assessment
(5-7 questions to test understanding)

### Conclusion / Summary (5 minutes)
(Wrap up key points of the lesson)

### Assignment
(A meaningful homework task)

---

Make the note practical, detailed, and appropriate for Nigerian secondary school students following the NERDC curriculum.`;

  try {
    const note = await generateWithAI(prompt);
    noteCache.set(cacheKey, note);
    res.json({ note, cached: false });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: 'Failed to generate note: ' + err.message });
  }
};
