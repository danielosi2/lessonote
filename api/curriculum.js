const fs = require('fs');
const path = require('path');

// Default curriculum data (used as fallback if curriculum.json doesn't exist)
const defaultCurriculum = {
  "JSS 1": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Number Bases": "Introduction to number bases (base 2, 8, 10)", "Counting": "Counting in thousands" } },
        { "week": 2, "topics": { "Whole Numbers": "Ordering and rounding whole numbers" } },
        { "week": 3, "topics": "" }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Fractions": "Proper and improper fractions" } }
      ],
      "Third Term": [
        { "week": 1, "topics": { "Revision": "Review of first and second term work" } }
      ]
    },
    "English Language": {
      "First Term": [
        { "week": 1, "topics": { "Speech": "Vowels and consonants", "Composition": "Paragraph writing" } },
        { "week": 2, "topics": { "Grammar": "Nouns and pronouns" } }
      ]
    }
  },
  "JSS 2": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Algebra": "Simple equations" } },
        { "week": 2, "topics": { "Geometry": "Angles and triangles" } }
      ]
    }
  },
  "SS 1": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Number Bases": "Base 2, 8, 10 conversion" } },
        { "week": 2, "topics": { "Exponents": "Laws of exponents" } },
        { "week": 3, "topics": { "Logarithms": "Introduction to logarithms" } }
      ],
      "Second Term": [
        { "week": 1, "topics": { "Trigonometry": "Introduction to trigonometric ratios" } }
      ]
    },
    "Physics": {
      "First Term": [
        { "week": 1, "topics": { "Measurement": "Length, mass, time" } },
        { "week": 2, "topics": { "Motion": "Speed and velocity" } }
      ]
    },
    "Chemistry": {
      "First Term": [
        { "week": 1, "topics": { "Matter": "States of matter" } }
      ]
    },
    "Biology": {
      "First Term": [
        { "week": 1, "topics": { "Cell": "Cell structure and organization" } }
      ]
    }
  },
  "SS 2": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Algebraic Processes": "Factorization" } },
        { "week": 2, "topics": { "Geometry": "Circle theorems" } }
      ]
    }
  },
  "SS 3": {
    "Mathematics": {
      "First Term": [
        { "week": 1, "topics": { "Revision": "WAEC preparation review" } }
      ]
    }
  }
};

// Try to load curriculum.json, fall back to default if it doesn't exist
let curriculum;
try {
  curriculum = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'curriculum.json'), 'utf-8')
  );
} catch (e) {
  curriculum = defaultCurriculum;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
};