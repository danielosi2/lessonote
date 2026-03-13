require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Embedded curriculum data (NERDC scheme of work)
const curriculum = {
  "JSS 1": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Number Bases": "Introduction to number bases (base 2, 8, 10)", "Counting": "Counting in thousands" } },
        { "week": 2, "topics": { "Whole Numbers": "Ordering and rounding whole numbers" } },
        { "week": 3, "topics": { "Fractions": "Introduction to fractions" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Fractions": "Proper and improper fractions" } },
        { "week": 2, "topics": { "Decimals": "Addition and subtraction of decimals" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Review of first and second term work" } }
      ]
    },
    "English Language": {
      "First Term": [
        { "week": 1, "topics": { "Speech": "Vowels and consonants", "Composition": "Paragraph writing" } },
        { "week": 2, "topics": { "Grammar": "Nouns and pronouns" } },
        { "week": 3, "topics": { "Comprehension": "Reading for main ideas" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Grammar": "Verbs and tenses" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    }
  },
  "JSS 2": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Algebra": "Simple equations" } },
        { "week": 2, "topics": { "Geometry": "Angles and triangles" } },
        { "week": 3, "topics": { "Statistics": "Data collection and representation" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Algebra": "Inequalities" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    }
  },
  "JSS 3": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Algebra": "Simultaneous equations" } },
        { "week": 2, "topics": { "Geometry": "Circle theorems" } },
        { "week": 3, "topics": { "Trigonometry": "Basic trigonometric ratios" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Statistics": "Probability" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "WAEC preparation" } }
      ]
    }
  },
  "SSS 1": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Number Bases": "Base 2, 8, 10 conversion" } },
        { "week": 2, "topics": { "Exponents": "Laws of exponents" } },
        { "week": 3, "topics": { "Logarithms": "Introduction to logarithms" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Trigonometry": "Trigonometric ratios" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    },
    "Physics": {
      "First Term": [
        { "week": 1, "topics": { "Measurement": "Length, mass, time, SI units" } },
        { "week": 2, "topics": { "Motion": "Speed, velocity, acceleration" } },
        { "week": 3, "topics": { "Force": "Types of forces, Newton's laws" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Energy": "Forms of energy, conservation" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    },
    "Chemistry": {
      "First Term": [
        { "week": 1, "topics": { "Matter": "States of matter, changes" } },
        { "week": 2, "topics": { "Atomic Structure": "Protons, neutrons, electrons" } },
        { "week": 3, "topics": { "Periodic Table": "Organization and trends" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Chemical Bonding": "Ionic and covalent bonds" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    },
    "Biology": {
      "First Term": [
        { "week": 1, "topics": { "Cell": "Cell structure and organization" } },
        { "week": 2, "topics": { "Cell": "Cell functions and division" } },
        { "week": 3, "topics": { "Ecology": "Ecosystems and habitats" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Nutrition": "Types of nutrition" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    }
  },
  "SSS 2": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Algebraic Processes": "Factorization" } },
        { "week": 2, "topics": { "Geometry": "Circle theorems" } },
        { "week": 3, "topics": { "Statistics": "Measures of central tendency" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Trigonometry": "Sine and cosine rules" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Term review" } }
      ]
    }
  },
  "SSS 3": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Revision": "WAEC/NECO preparation" } },
        { "week": 2, "topics": { "Statistics": "Probability and statistics" } },
        { "week": 3, "topics": { "Calculus": "Introduction to differentiation" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Revision": "External exam preparation" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Final exam preparation" } }
      ]
    }
  }
};

// In-memory note cache
const noteCache = new Map();

// OpenRouter free models (rotate if one hits quota)
const FREE_MODELS = [
  'openrouter/hunter-alpha',
  'stepfun/step-3.5-flash:free',
  'arcee-ai/trinity-large-preview:free',
  'openrouter/free',
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

// API Routes

// GET /api/curriculum
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

// GET /api/week
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
});

// GET /api/cache/stats
app.get('/api/cache/stats', (req, res) => {
  res.json({ cachedNotes: noteCache.size });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
