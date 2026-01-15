# Focus Reader v7.0

An advanced speed reading application built with React that uses Rapid Serial Visual Presentation (RSVP) technology to help you read faster and more efficiently.

## Features

### Reading Modes
- **Standard Mode**: Balanced speed with natural pauses
- **Natural Mode**: Human-like pacing with conversational feel
- **Speed Mode**: Maximum speed with minimal pauses

### Advanced Capabilities
- **ORP Technology**: Optimal Recognition Point positioning keeps the red letter centered
- **Text-to-Speech**: Voice narration synchronized with word display
- **File Import**: Support for PDF, EPUB, and TXT files
- **Customizable Settings**: Adjust font size, theme, accent colors, and reading speed (150-600 WPM)
- **Warm-up Feature**: Gradually increases reading speed at session start
- **Progress Tracking**: Session statistics including word count and rewinds

### User Interface
- Dark and light themes
- Smooth transitions
- Responsive design
- Keyboard shortcuts for reader control
- Sample texts included for quick testing

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

## Usage

1. **Select a Reading Mode**: Choose between Standard, Natural, or Speed mode
2. **Import or Paste Text**: Upload a file (PDF/EPUB/TXT) or paste text directly
3. **Start Reading**: Click "Start Reading" and focus on the red letter
4. **Control Playback**: Use on-screen controls or keyboard shortcuts

### Keyboard Shortcuts (in reader view)
- `Space`: Play/Pause
- `←`: Previous word
- `→`: Next word
- `Esc`: Exit to home

## Technology Stack

- React 18
- Vite
- Web Speech API (for text-to-speech)
- PDF.js (for PDF import)
- JSZip (for EPUB import)

## How It Works

Focus Reader uses RSVP (Rapid Serial Visual Presentation) technology to display words one at a time at a fixed position. This eliminates eye movement (saccades), which accounts for about 80% of reading time, allowing you to read faster while maintaining comprehension.

The Optimal Recognition Point (ORP) - highlighted in red - is positioned at the ideal location in each word for fastest recognition, and it always stays centered on screen.

## License

MIT
