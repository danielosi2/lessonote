# LessoNote

AI-powered lesson note generator for Nigerian secondary school teachers and students. Built on the verified NERDC scheme of work (JSS1-SSS3).

## Stack

- **Frontend:** React 18 + Vite (dark UI, ReactMarkdown for note rendering)
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.0 Flash
- **Curriculum:** 118 subjects, 6 class levels, 4,177 week entries from official NERDC scheme of work

## Setup

### 1. Install dependencies

    # Backend
    npm install

    # Frontend
    cd client && npm install

### 2. Configure environment

    cp .env.example .env
    # Edit .env and add your GEMINI_API_KEY

Get a free Gemini API key at: https://aistudio.google.com/app/apikey

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

- NERDC curriculum-aligned topics for every week
- Topic preview before generating
- In-memory caching - each note is only generated once per session
- Clean dark UI, mobile responsive
- Works offline for browsing curriculum (only AI generation needs internet)

## Environment Variables

    GEMINI_API_KEY=your_gemini_api_key_here
    PORT=3001
