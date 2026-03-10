const fs = require('fs');
const path = require('path');

const curriculum = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'curriculum.json'), 'utf-8')
);

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { cls, subject, term, week } = req.query;
  try {
    const weeks = curriculum[cls][subject][term];
    const data = weeks.find(w => String(w.week) === String(week));
    if (!data) return res.status(404).json({ error: 'Week not found' });
    res.json(data);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
};
