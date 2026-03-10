import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const API = '';

export default function App() {
  const [curriculum, setCurriculum] = useState(null);
  const [cls, setCls] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('');
  const [week, setWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const [cacheStats, setCacheStats] = useState(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetch(API + '/api/curriculum')
      .then(r => r.json())
      .then(data => {
        setCurriculum(data);
        fetch(API + '/api/cache/stats').then(r => r.json()).then(setCacheStats);
      })
      .catch(() => setError('Failed to load curriculum. Is the server running?'));
  }, []);

  const classes = curriculum ? Object.keys(curriculum) : [];
  const subjects = cls && curriculum ? Object.keys(curriculum[cls]) : [];
  const terms = subject && curriculum?.[cls]?.[subject] ? Object.keys(curriculum[cls][subject]) : [];
  const weeks = term && curriculum?.[cls]?.[subject]?.[term] ? curriculum[cls][subject][term] : [];

  const handleClassChange = (val) => { setCls(val); setSubject(''); setTerm(''); setWeek(''); setNote(''); setError(''); };
  const handleSubjectChange = (val) => { setSubject(val); setTerm(''); setWeek(''); setNote(''); setError(''); };
  const handleTermChange = (val) => { setTerm(val); setWeek(''); setNote(''); setError(''); };
  const handleWeekChange = (val) => { setWeek(val); setNote(''); setError(''); };

  const generate = async () => {
    if (!cls || !subject || !term || !week) {
      setError('Please select all fields before generating.');
      return;
    }
    setLoading(true);
    setNote('');
    setError('');
    try {
      const res = await fetch(API + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cls, subject, term, week })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setNote(data.note);
      setCached(data.cached);
      setCacheStats(prev => prev ? { ...prev, cachedNotes: data.cached ? prev.cachedNotes : prev.cachedNotes + 1 } : null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyNote = async () => {
    await navigator.clipboard.writeText(note);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const isReady = cls && subject && term && week;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <div>
              <h1>LessoNote</h1>
              <p>AI-Powered Lesson Note Generator</p>
            </div>
          </div>
          {cacheStats && (
            <div className="cache-badge">
              <span className="dot green"></span>
              {cacheStats.cachedNotes} notes cached
            </div>
          )}
        </div>
      </header>

      <main className="main">
        {/* Selection Panel */}
        <div className="card selector-card">
          <h2 className="card-title">Generate Lesson Note</h2>
          <p className="card-sub">Select your class, subject, term, and week to generate a comprehensive lesson note.</p>

          <div className="selectors">
            {/* Class */}
            <div className="select-group">
              <label>Class</label>
              <div className="select-wrap">
                <select value={cls} onChange={e => handleClassChange(e.target.value)} disabled={!curriculum}>
                  <option value="">Select class...</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="select-group">
              <label>Subject</label>
              <div className="select-wrap">
                <select value={subject} onChange={e => handleSubjectChange(e.target.value)} disabled={!cls}>
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Term */}
            <div className="select-group">
              <label>Term</label>
              <div className="select-wrap">
                <select value={term} onChange={e => handleTermChange(e.target.value)} disabled={!subject}>
                  <option value="">Select term...</option>
                  {terms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Week */}
            <div className="select-group">
              <label>Week</label>
              <div className="select-wrap">
                <select value={week} onChange={e => handleWeekChange(e.target.value)} disabled={!term}>
                  <option value="">Select week...</option>
                  {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className={'generate-btn' + (loading ? ' loading' : '') + (!isReady ? ' disabled' : '')}
            onClick={generate}
            disabled={loading || !isReady}
          >
            {loading ? (
              <><span className="spinner"></span> Generating with Gemini 2.5 Flash...</>
            ) : (
              <><span>✨</span> Generate Lesson Note</>
            )}
          </button>
        </div>

        {/* Note Output */}
        {note && (
          <div className="card note-card">
            <div className="note-header">
              <div className="note-meta">
                <h2>Lesson Note</h2>
                <div className="note-tags">
                  <span className="tag">{cls}</span>
                  <span className="tag">{subject}</span>
                  <span className="tag">{term}</span>
                  <span className="tag">Week {week}</span>
                  {cached && <span className="tag cached">⚡ Cached</span>}
                </div>
              </div>
              <button className="copy-btn" onClick={copyNote}>
                {copying ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="note-body">
              <ReactMarkdown>{note}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!note && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>Ready to generate</h3>
            <p>Select your class, subject, term and week above, then click Generate.</p>
            <div className="features">
              <div className="feature"><span>📖</span><p>NERDC curriculum aligned</p></div>
              <div className="feature"><span>⚡</span><p>Smart caching — generate once</p></div>
              <div className="feature"><span>🤖</span><p>Powered by Gemini 2.5 Flash</p></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
