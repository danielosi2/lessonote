import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const API = '';

export default function App() {
  const [curriculum, setCurriculum] = useState(null);
  const [cls, setCls] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [noteMeta, setNoteMeta] = useState(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const [cacheStats, setCacheStats] = useState(null);
  const [copying, setCopying] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Check onboarding status
    const completed = localStorage.getItem('edunotesng-onboarding') === 'true';
    setOnboardingComplete(completed);

    fetch(API + '/api/curriculum')
      .then(r => {
        if (!r.ok) throw new Error(`Curriculum load failed: ${r.status}`);
        return r.json();
      })
      .then(data => {
        setCurriculum(data);
        // Load cache stats (non-critical)
        fetch(API + '/api/cache/stats')
          .then(r => r.json())
          .then(setCacheStats)
          .catch(err => {
            console.warn('[Cache stats]', err.message);
          });
      })
      .catch(err => {
        const errorMsg = 'Failed to load curriculum. Is the server running?';
        setError(errorMsg);
        console.error('[Curriculum load]', errorMsg, err);
      });
  }, []);

  // Cleanup: abort any pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const classes = curriculum ? Object.keys(curriculum) : [];
  const subjects = cls && curriculum ? Object.keys(curriculum[cls] || {}) : [];
  const terms = subject && curriculum?.[cls]?.[subject] ? Object.keys(curriculum[cls][subject]) : [];
  const topics = term && curriculum?.[cls]?.[subject]?.[term] ? curriculum[cls][subject][term] : [];

  const handleClassChange = (val) => {
    setCls(val);
    setSubject('');
    setTerm('');
    setNote('');
    setNoteMeta(null);
    setError('');
  };

  const handleSubjectChange = (val) => {
    setSubject(val);
    setTerm('');
    setNote('');
    setNoteMeta(null);
    setError('');
  };

  const handleTermChange = (val) => {
    setTerm(val);
    setNote('');
    setNoteMeta(null);
    setError('');
  };

  const generateForTopic = async (weekNum, topicName) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setNote('');
    setNoteMeta(null);
    setError('');
    try {
      const res = await fetch(API + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cls, subject, term, week: weekNum, topic: topicName }),
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();
      if (!res.ok) {
        // Rate limit / quota issues
        if (res.status === 429 || data.error?.includes('exhausted') || data.error?.includes('quota')) {
          throw new Error('Free limit reached. Please try again later.');
        }
        // Empty or invalid response
        if (!data.note || typeof data.note !== 'string' || data.note.trim() === '') {
          throw new Error('No content generated. Try again.');
        }
        throw new Error(data.error || 'Failed to generate lesson note.');
      }
      // Validate we got a note
      if (!data.note || typeof data.note !== 'string' || data.note.trim() === '') {
        throw new Error('No content generated. Try again.');
      }
      setNote(data.note);
      setCached(data.cached);
      setNoteMeta({ week: weekNum, topic: topicName });
      setCacheStats(prev => prev
        ? { ...prev, cachedNotes: data.cached ? prev.cachedNotes : prev.cachedNotes + 1 }
        : null
      );
    } catch (e) {
      // Ignore aborted errors
      if (e.name === 'AbortError') return;
      const errorMsg = e.message || 'Failed to generate lesson note. Please try again.';
      setError(errorMsg);
      console.error('[Generate error]', errorMsg, e);
    } finally {
      setLoading(false);
    }
  };

  const copyNote = async () => {
    await navigator.clipboard.writeText(note);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const downloadPDF = () => {
    window.print();
  };

  const completeOnboarding = () => {
    localStorage.setItem('edunotesng-onboarding', 'true');
    setOnboardingComplete(true);
  };

  const dismissError = () => {
    setError('');
  };

  // If onboarding not complete, show onboarding screen
  if (!onboardingComplete) {
    return (
      <div className="app onboarding">
        <div className="onboarding-card">
          <div className="onboarding-icon">📚</div>
          <h1>Welcome to edunotesng</h1>
          <p className="onboarding-subtitle">AI-Powered Lesson Notes for Nigerian Secondary Schools</p>
          
          <div className="onboarding-features">
            <div className="feature">
              <span>🎯</span>
              <div>
                <strong>NERDC Curriculum</strong>
                <p>Full coverage of JSS1–SSS3 subjects and weekly topics</p>
              </div>
            </div>
            <div className="feature">
              <span>🤖</span>
              <div>
                <strong>Smart AI Generation</strong>
                <p>Creates detailed, structured lesson notes in seconds</p>
              </div>
            </div>
            <div className="feature">
              <span>📄</span>
              <div>
                <strong>Download & Share</strong>
                <p>Export notes as PDF or copy to clipboard</p>
              </div>
            </div>
            <div className="feature">
              <span>⚡</span>
              <div>
                <strong>Instant Access</strong>
                <p>No registration required — just select and generate</p>
              </div>
            </div>
          </div>

          <button className="onboarding-cta" onClick={completeOnboarding}>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <div>
              <h1>edunotesng</h1>
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
          <p className="card-sub">
            Select your class, subject, and term — then pick a topic to generate a lesson note.
          </p>

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
          </div>

          {error && (
            <div className="error-msg">
              <span>{error}</span>
              <button className="error-dismiss" onClick={dismissError}>×</button>
            </div>
          )}
        </div>

        {/* Topic List */}
        {term && topics.length > 0 && !loading && !note && (
          <div className="card topics-card">
            <h2 className="card-title">
              {subject} — {term}
            </h2>
            <p className="card-sub">Click any topic to generate a lesson note</p>
            <div className="topic-list">
              {topics.map((t, i) => (
                <button
                  key={i}
                  className="topic-item"
                  onClick={() => generateForTopic(t.week, t.topic)}
                >
                  <span className="topic-week">Week {t.week}</span>
                  <span className="topic-name">{t.topic}</span>
                  {t.hasContent && <span className="topic-badge">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card loading-card">
            <div className="loading-spinner"></div>
            <h3>Generating lesson note...</h3>
            <p>AI is writing your note. This takes 15–30 seconds.</p>
          </div>
        )}

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
                  {noteMeta && <span className="tag">Week {noteMeta.week} — {noteMeta.topic}</span>}
                  {cached && <span className="tag cached">⚡ Cached</span>}
                </div>
              </div>
              <div className="note-actions">
                <button className="back-btn" onClick={() => { setNote(''); setNoteMeta(null); }}>
                  ← Back to topics
                </button>
                <button className="copy-btn" onClick={copyNote}>
                  {copying ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button className="pdf-btn" onClick={downloadPDF}>
                  📄 PDF
                </button>
              </div>
            </div>
            <div className="note-body">
              <ReactMarkdown>{note}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!term && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>Ready to generate</h3>
            <p>Select your class, subject, and term above to see available topics.</p>
            <div className="features">
              <div className="feature"><span>📖</span><p>NERDC curriculum aligned</p></div>
              <div className="feature"><span>⚡</span><p>Smart caching — generate once</p></div>
              <div className="feature"><span>🤖</span><p>Powered by OpenRouter AI</p></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
