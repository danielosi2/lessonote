# LessoNote

AI-powered lesson note generator for Nigerian secondary school teachers and students. Built on the verified NERDC scheme of work (JSS1-SSS3).

## Stack

- **Frontend:** React 18 + Vite (dark UI, ReactMarkdown for note rendering)
- **Backend:** Node.js + Express
- **AI:** DeepSeek v3.2 via OpenRouter (Enhanced quality & reliability)
- **Curriculum:** 118 subjects, 6 class levels, 4,177 week entries from official NERDC scheme of work
- **Onboarding:** Interactive multi-step tutorial with configuration check

## Setup

### 1. Install dependencies

    # Backend
    npm install

    # Frontend
    cd client && npm install

### 2. Configure environment

    cp .env.example .env
    # Edit .env and add your OPENROUTER_API_KEY

Get your OpenRouter API key at: https://openrouter.ai/keys

### 3. Run in development

    # Terminal 1 - backend (port 3001)
    npm run dev

    # Terminal 2 - frontend (port 5173)
    cd client && npm run dev

Open http://localhost:5173

### 4. Build for production

    cd client && npm run build
    cd .. && npm start

The Express server serves the React build at http://localhost:3001

## How it works

1. Select **Class Level** (JSS1-SSS3)
2. Select **Subject** (e.g. Mathematics, English Studies)
3. Select **Term** (First, Second, Third)
4. Select **Week** - a preview of that week's curriculum topics appears
5. Click **Generate Lesson Note** - Gemini generates a full structured note
6. Copy the note with one click

## Features

- **Enhanced AI:** DeepSeek v3.2 for higher quality lesson notes
- **Interactive Onboarding:** Multi-step tutorial with AI configuration check
- **NERDC Curriculum:** Complete coverage with 4,177 week entries
- **Smart Caching:** In-memory caching for faster repeat access
- **Mobile Responsive:** Works perfectly on all devices
- **Export Options:** Copy to clipboard or download as PDF
- **Fallback System:** Automatic fallback if primary AI model is unavailable

## Environment Variables

    OPENROUTER_API_KEY=your_openrouter_api_key_here
    PORT=5000
    OPENROUTER_MODEL=deepseek/deepseek-v3.2
    FALLBACK_MODEL=google/gemma-3-27b-it:free
