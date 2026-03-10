const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const curriculum = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'curriculum.json'), 'utf-8')
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cls, subject, term, week } = req.body;
  if (!cls || !subject || !term || !week) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let weekData;
  try {
    const weeks = curriculum[cls][subject][term];
    weekData = weeks.find(w => String(w.week) === String(week));
  } catch {
    return res.status(404).json({ error: 'Week data not found' });
  }
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
    const result = await model.generateContent(prompt);
    const note = result.response.text();
    res.json({ note, cached: false });
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ error: 'Failed to generate note: ' + err.message });
  }
};
