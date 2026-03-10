const fs = require('fs');
const path = require('path');

const curriculum = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'curriculum.json'), 'utf-8')
);

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
