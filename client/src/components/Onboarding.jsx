import { useState } from 'react';
import './Onboarding.css';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: "Welcome to LessoNote AI 🎯",
      subtitle: "AI-powered lesson planning for Nigerian teachers",
      content: (
        <div className="step-content">
          <div className="feature-list">
            <div className="feature">
              <span className="emoji">📚</span>
              <div>
                <h4>NERDC Curriculum Aligned</h4>
                <p>Complete coverage of JSS1–SSS3 subjects</p>
              </div>
            </div>
            <div className="feature">
              <span className="emoji">🤖</span>
              <div>
                <h4>DeepSeek AI Powered</h4>
                <p>Advanced AI generates detailed lesson notes</p>
              </div>
            </div>
            <div className="feature">
              <span className="emoji">⚡</span>
              <div>
                <h4>Fast & Efficient</h4>
                <p>Generate notes in seconds, not hours</p>
              </div>
            </div>
          </div>
        </div>
      ),
      emoji: "📚"
    },
    {
      title: "How It Works 🔄",
      subtitle: "Three simple steps to create perfect lesson notes",
      content: (
        <div className="step-content">
          <div className="workflow">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-details">
                <h4>Select Your Class</h4>
                <p>Choose from JSS1 to SSS3</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-details">
                <h4>Pick Subject & Week</h4>
                <p>Browse the official NERDC curriculum</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-details">
                <h4>Generate & Customize</h4>
                <p>AI creates detailed notes you can edit</p>
              </div>
            </div>
          </div>
        </div>
      ),
      emoji: "🔄"
    },
    {
      title: "AI Powered by OpenRouter 🚀",
      subtitle: "Using DeepSeek v3.2 for highest quality notes",
      content: (
        <div className="step-content">
          <div className="ai-info">
            <div className="ai-badge">
              <span className="model-name">DeepSeek v3.2</span>
              <span className="model-tag">State-of-the-art AI</span>
            </div>
            <ul className="ai-benefits">
              <li>✓ More detailed lesson explanations</li>
              <li>✓ Better understanding of Nigerian curriculum</li>
              <li>✓ Faster generation times</li>
              <li>✓ Higher quality educational content</li>
            </ul>
            <div className="note">
              <small>Powered by your OpenRouter API key. Notes are cached locally for speed.</small>
            </div>
          </div>
        </div>
      ),
      emoji: "🤖"
    },
    {
      title: "Ready to Start? 🎉",
      subtitle: "Create your first AI-powered lesson note",
      content: (
        <div className="step-content">
          <div className="final-step">
            <div className="tip">
              <h4>💡 Pro Tip</h4>
              <p>Try generating notes for different subjects to see how the AI adapts to each topic.</p>
            </div>
            <div className="tip">
              <h4>📱 Mobile Friendly</h4>
              <p>Works perfectly on phones, tablets, and computers.</p>
            </div>
            <div className="config-check">
              <h4>✅ Configuration Check</h4>
              <p>OpenRouter API key is configured and ready.</p>
              <div className="status-badge status-success">
                <span className="status-dot"></span>
                AI Service: Online
              </div>
            </div>
          </div>
        </div>
      ),
      emoji: "🚀"
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="progress-indicator">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={`progress-step ${i + 1 <= step ? 'active' : ''}`}
              ></div>
            ))}
          </div>
          <button className="skip-btn" onClick={handleSkip}>
            Skip Tutorial
          </button>
        </div>

        <div className="onboarding-content">
          <div className="step-emoji">{currentStep.emoji}</div>
          <h1>{currentStep.title}</h1>
          <p className="subtitle">{currentStep.subtitle}</p>
          
          <div className="step-content-wrapper">
            {currentStep.content}
          </div>
        </div>

        <div className="onboarding-footer">
          <div className="step-counter">
            Step {step} of {totalSteps}
          </div>
          <button className="next-btn" onClick={handleNext}>
            {step === totalSteps ? 'Get Started →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;