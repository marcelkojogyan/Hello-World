import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Focus Reader v7.0 - Natural Read Mode + Voice Mode
// Fixed ORP positioning (red letter always at center)
// Natural pacing that feels like human reading
// Text-to-speech synchronized with word display
// PDF/EPUB/TXT import

const STORAGE_KEY = 'focus-reader-v7';

const loadData = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};

const FocusReaderV7 = () => {
  const saved = loadData(STORAGE_KEY, {});

  // Core
  const [text, setText] = useState('');
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(saved.wpm || 300);
  const [currentWpm, setCurrentWpm] = useState(saved.wpm || 300);

  // UI
  const [view, setView] = useState('home');
  const [showUI, setShowUI] = useState(false);
  const [uiOpacity, setUiOpacity] = useState(0);
  const [toast, setToast] = useState(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  // Settings
  const [dark, setDark] = useState(saved.dark ?? true);
  const [fontSize, setFontSize] = useState(saved.fontSize || 42);
  const [hue, setHue] = useState(saved.hue ?? 210);
  const [warmUp, setWarmUp] = useState(saved.warmUp ?? true);
  const [smoothTransitions, setSmoothTransitions] = useState(saved.smoothTransitions ?? true);

  // NEW: Reading modes
  const [readMode, setReadMode] = useState(saved.readMode || 'standard'); // 'standard', 'natural', 'speed'
  const [voiceEnabled, setVoiceEnabled] = useState(saved.voiceEnabled ?? false);
  const [voiceRate, setVoiceRate] = useState(saved.voiceRate || 1);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Display
  const [currentWord, setCurrentWord] = useState({ before: '', orp: '', after: '', type: 'word', raw: '' });
  const [transitioning, setTransitioning] = useState(false);

  // Session
  const [sessionStart, setSessionStart] = useState(null);
  const [complete, setComplete] = useState(false);
  const [rewinds, setRewinds] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const warmUpRef = useRef(null);
  const uiTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  // Colors
  const accent = `hsl(${hue}, 80%, 58%)`;
  const accentGlow = `hsla(${hue}, 80%, 58%, 0.5)`;
  const accentSoft = `hsla(${hue}, 80%, 58%, 0.12)`;

  // Theme
  const t = dark ? {
    bg: '#000000',
    surface: '#0a0a0a',
    card: '#111111',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.55)',
    subtle: 'rgba(255,255,255,0.25)',
    border: 'rgba(255,255,255,0.1)',
    glass: 'rgba(255,255,255,0.05)',
  } : {
    bg: '#ffffff',
    surface: '#f8f8f8',
    card: '#f0f0f0',
    text: '#000000',
    muted: 'rgba(0,0,0,0.55)',
    subtle: 'rgba(0,0,0,0.2)',
    border: 'rgba(0,0,0,0.08)',
    glass: 'rgba(0,0,0,0.03)',
  };

  // Samples
  const samples = [
    { title: 'The Art of Focus', words: 203, text: `The Art of Focus\n\nIn our distracted world, the ability to focus has become a superpower. Constant notifications, endless feeds, and competing demands fragment our attention. How can we reclaim our ability to concentrate?\n\nUnderstanding Attention\n\nAttention is a limited resource. Our brains can only consciously process a tiny fraction of the sensory information around us. Selective attention allows us to focus on what matters while filtering out distractions.\n\nThe Flow State\n\nWhen we achieve deep focus, we enter what psychologist Mihaly Csikszentmihalyi called flow. In this state, we become fully absorbed in our task. Time seems to pass differently. Our sense of self fades as we merge with the activity.\n\nBuilding Focus\n\nFocus is like a muscle that strengthens with practice. Start with short periods of concentrated work. Eliminate distractions by turning off notifications. Create a dedicated workspace. Take regular breaks to prevent mental fatigue.\n\nPractice\n\nUse this tool as focus practice. Keep your eyes fixed on the red letter. Let words flow through your mind. When attention wanders, gently return it. Each session builds your capacity for sustained attention.` },
    { title: 'Speed Reading Science', words: 312, text: `The Science of Speed Reading\n\nSpeed reading has fascinated researchers and learners for decades. The average adult reads between 200 and 250 words per minute, yet some claim to achieve rates exceeding 1000 words per minute. What does science tell us about these claims?\n\nHow We Read\n\nWhen reading traditionally, our eyes make small jumps called saccades, landing on words for brief fixations. About 80 percent of reading time involves these eye movements, while only 20 percent is spent actually processing content. This observation led to the development of Rapid Serial Visual Presentation, or RSVP.\n\nThe RSVP Method\n\nRSVP eliminates eye movements by presenting words one at a time in a fixed location. Research shows this can increase reading speed by approximately 33 percent without significant comprehension loss, at least for speeds up to 350 words per minute.\n\nThe Comprehension Trade-off\n\nStudies consistently show a speed-accuracy trade-off. Above 400 words per minute, comprehension begins to decline measurably. This happens because our brains need time to integrate information, make inferences, and connect new content with existing knowledge.\n\nPractical Recommendations\n\nBased on current research, find your optimal speed where comprehension remains high. Use RSVP for shorter texts and overviews rather than deep study material. Take regular breaks to reduce visual fatigue. Practice consistently to improve over time.\n\nThe key is finding your personal balance between speed and understanding.` },
    { title: 'Coffee Origins', words: 285, text: `The Remarkable History of Coffee\n\nCoffee is one of the most consumed beverages in the world, with over two billion cups drunk every day. But how did this humble bean become such a global phenomenon?\n\nOrigins in Ethiopia\n\nThe coffee plant originated in the Ethiopian highlands. Legend tells of a goat herder named Kaldi who noticed his goats became unusually energetic after eating berries from a certain tree. Curious, he tried the berries himself!\n\nA local monk, hearing of this discovery, made a drink from the berries to help stay awake during long hours of prayer. Word spread quickly, and coffee began its journey across the world.\n\nSpread to the Arab World\n\nBy the 15th century, coffee had reached Yemen. Coffee houses emerged across the Middle East, becoming centers of social activity and intellectual discussion. These establishments were called schools of the wise.\n\nArrival in Europe\n\nCoffee reached Europe in the 17th century, initially meeting resistance. Some called it the bitter invention of Satan! However, after Pope Clement VIII tasted it himself, he gave coffee his approval.\n\nModern Coffee Culture\n\nToday, coffee culture continues to evolve. The rise of specialty coffee has transformed expectations about quality and origin. Baristas are now considered artisans. Terms like single origin and third wave have entered common vocabulary.\n\nFrom Ethiopian highlands to your local café, coffee has traveled an extraordinary journey.` },
  ];

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        // Prefer English voices, especially premium ones
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);

        // Try to find a good default voice
        const preferred = englishVoices.find(v =>
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Google') ||
          v.name.includes('Premium')
        ) || englishVoices[0] || voices[0];

        if (preferred && !selectedVoice) {
          setSelectedVoice(preferred);
        }
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      wpm, dark, fontSize, hue, warmUp, smoothTransitions,
      readMode, voiceEnabled, voiceRate
    }));
  }, [wpm, dark, fontSize, hue, warmUp, smoothTransitions, readMode, voiceEnabled, voiceRate]);

  // Toast
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  // Parse text
  const parseText = useCallback((txt) => {
    if (!txt.trim()) return [];
    const result = [];
    const lines = txt.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (result.length && result[result.length - 1].type !== 'break') {
          result.push({ type: 'break', text: '' });
        }
        return;
      }

      // Headings
      const isHeading = trimmed.length < 60 && (
        /^[A-Z][^.!?]*$/.test(trimmed) && trimmed.split(' ').length <= 6
      );

      if (isHeading) {
        result.push({ type: 'heading', text: trimmed });
        return;
      }

      // Words with punctuation info
      trimmed.split(/\s+/).forEach((word, i, arr) => {
        const lastChar = word.slice(-1);
        const cleanWord = word.replace(/[.,!?;:'")\]]+$/, '');

        result.push({
          type: 'word',
          text: word,
          clean: cleanWord,
          // Punctuation analysis for natural mode
          hasComma: lastChar === ',',
          hasPeriod: lastChar === '.',
          hasQuestion: lastChar === '?',
          hasExclamation: lastChar === '!',
          hasSemicolon: lastChar === ';' || lastChar === ':',
          hasEllipsis: word.includes('...') || word.includes('…'),
          isEndOfParagraph: i === arr.length - 1,
          isShortWord: cleanWord.length <= 3,
          isLongWord: cleanWord.length >= 10,
          // Common words that should be quick
          isCommonWord: ['the', 'a', 'an', 'is', 'it', 'to', 'of', 'and', 'in', 'on', 'for', 'with', 'as', 'at', 'by'].includes(cleanWord.toLowerCase()),
        });
      });
    });

    return result;
  }, []);

  useEffect(() => {
    setWords(parseText(text));
  }, [text, parseText]);

  // ORP calculation
  const getORP = (word) => {
    const len = word.length;
    if (len <= 1) return 0;
    if (len === 2) return 0;
    if (len === 3) return 1;
    if (len <= 5) return 1;
    if (len <= 9) return 2;
    if (len <= 13) return 3;
    return Math.floor(len * 0.25);
  };

  // Update current word display
  useEffect(() => {
    const item = words[index];
    if (!item) {
      setCurrentWord({ before: '', orp: '', after: '', type: 'word', raw: '' });
      return;
    }

    if (item.type === 'break') {
      setCurrentWord({ before: '', orp: '·', after: '', type: 'break', raw: '' });
      return;
    }

    const text = item.text;
    const orpIdx = item.type === 'heading' ? Math.floor(text.length * 0.3) : getORP(text);

    setCurrentWord({
      before: text.slice(0, orpIdx),
      orp: text[orpIdx] || '',
      after: text.slice(orpIdx + 1),
      type: item.type,
      raw: text,
    });
  }, [index, words]);

  // NATURAL MODE: Calculate interval with human-like pacing
  const getNaturalInterval = useCallback((item) => {
    if (!item) return 200;

    // Base timing (slower than standard for natural feel)
    const baseMs = 180; // ~333 wpm base, but will vary

    if (item.type === 'break') {
      return 400; // Paragraph break - take a breath
    }

    if (item.type === 'heading') {
      return baseMs * 2 + (item.text.length * 30); // Headings read slower
    }

    let interval = baseMs;

    // Word length affects timing
    if (item.isShortWord && item.isCommonWord) {
      interval *= 0.6; // Quick common words
    } else if (item.isLongWord) {
      interval += (item.clean.length - 8) * 15; // Long words need more time
    }

    // Punctuation creates natural pauses (the key to natural feel)
    if (item.hasEllipsis) {
      interval += 600; // Ellipsis = thoughtful pause...
    } else if (item.hasPeriod) {
      interval += 350; // End of sentence - full stop, breath
    } else if (item.hasQuestion) {
      interval += 400; // Questions hang slightly longer?
    } else if (item.hasExclamation) {
      interval += 250; // Exclamation - brief emphatic stop!
    } else if (item.hasSemicolon) {
      interval += 280; // Semicolon/colon - moderate pause
    } else if (item.hasComma) {
      interval += 150; // Comma - brief pause
    }

    // End of paragraph gets extra pause
    if (item.isEndOfParagraph && !item.hasPeriod && !item.hasQuestion && !item.hasExclamation) {
      interval += 200;
    }

    return interval;
  }, []);

  // STANDARD MODE: Speed-based interval
  const getStandardInterval = useCallback((item) => {
    if (!item) return 60000 / currentWpm;

    let base = 60000 / currentWpm;

    if (item.type === 'break') return 120;
    if (item.type === 'heading') return base * 2.5;

    // Punctuation pauses (lighter than natural mode)
    if (item.hasPeriod || item.hasQuestion || item.hasExclamation) {
      base += 80;
    } else if (item.hasComma || item.hasSemicolon) {
      base += 40;
    }

    // Word length
    if (item.isLongWord) {
      base += (item.clean.length - 8) * 8;
    }

    return base;
  }, [currentWpm]);

  // SPEED MODE: Minimal pauses, fast reading
  const getSpeedInterval = useCallback((item) => {
    if (!item) return 60000 / currentWpm;

    let base = 60000 / currentWpm;

    if (item.type === 'break') return 60;
    if (item.type === 'heading') return base * 1.5;

    // Minimal punctuation pauses
    if (item.hasPeriod || item.hasQuestion || item.hasExclamation) {
      base += 30;
    }

    return base;
  }, [currentWpm]);

  // Get interval based on current mode
  const getInterval = useCallback((item) => {
    switch (readMode) {
      case 'natural':
        return getNaturalInterval(item);
      case 'speed':
        return getSpeedInterval(item);
      default:
        return getStandardInterval(item);
    }
  }, [readMode, getNaturalInterval, getSpeedInterval, getStandardInterval]);

  // Speak current word
  const speakWord = useCallback((word) => {
    if (!voiceEnabled || !synthRef.current || !word) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.voice = selectedVoice;
    utterance.rate = voiceRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [voiceEnabled, selectedVoice, voiceRate]);

  // Warm-up effect
  useEffect(() => {
    if (playing && warmUp && sessionStart && readMode !== 'natural') {
      const elapsed = Date.now() - sessionStart;
      if (elapsed < 15000) {
        const progress = 1 - Math.pow(1 - elapsed / 15000, 2);
        setCurrentWpm(Math.round(wpm * 0.5 + wpm * 0.5 * progress));
        warmUpRef.current = setTimeout(() => {}, 150);
      } else {
        setCurrentWpm(wpm);
      }
    } else if (!warmUp || readMode === 'natural') {
      setCurrentWpm(wpm);
    }
    return () => { if (warmUpRef.current) clearTimeout(warmUpRef.current); };
  }, [playing, warmUp, sessionStart, wpm, readMode]);

  // Main playback
  useEffect(() => {
    if (playing && words.length && view === 'reader') {
      const item = words[index];
      const interval = getInterval(item);

      // Speak the word if voice enabled
      if (item?.type === 'word' || item?.type === 'heading') {
        speakWord(item.text);
      }

      timerRef.current = setTimeout(() => {
        // Transition effect
        if (smoothTransitions) {
          setTransitioning(true);
          setTimeout(() => setTransitioning(false), 50);
        }

        setIndex(prev => {
          if (prev >= words.length - 1) {
            setPlaying(false);
            setComplete(true);
            if (synthRef.current) synthRef.current.cancel();
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, index, words, getInterval, view, smoothTransitions, speakWord]);

  // Stop speech when pausing or leaving
  useEffect(() => {
    if (!playing && synthRef.current) {
      synthRef.current.cancel();
    }
  }, [playing]);

  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const handle = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.code === 'Space' && view === 'reader') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowLeft' && view === 'reader') { e.preventDefault(); setIndex(p => Math.max(0, p - 1)); }
      else if (e.code === 'ArrowRight' && view === 'reader') { e.preventDefault(); setIndex(p => Math.min(words.length - 1, p + 1)); }
      else if (e.code === 'Escape') {
        e.preventDefault();
        if (view === 'reader') { setPlaying(false); setView('home'); }
        else if (view !== 'home') setView('home');
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [view, words.length]);

  // UI visibility
  const toggleUI = () => {
    if (showUI) {
      setUiOpacity(0);
      setTimeout(() => setShowUI(false), 250);
    } else {
      setShowUI(true);
      setTimeout(() => setUiOpacity(1), 10);
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
      uiTimerRef.current = setTimeout(() => {
        setUiOpacity(0);
        setTimeout(() => setShowUI(false), 250);
      }, 5000);
    }
  };

  // Actions
  const togglePlay = () => {
    if (!words.length) return;
    if (!playing && !sessionStart) {
      setSessionStart(Date.now());
      setRewinds(0);
      if (warmUp && readMode !== 'natural') setCurrentWpm(wpm * 0.5);
    }
    setPlaying(p => !p);
    setComplete(false);
  };

  const rewind = () => {
    const amount = readMode === 'natural' ? 8 : Math.round((currentWpm / 60) * 5);
    setIndex(p => Math.max(0, p - amount));
    setRewinds(r => r + 1);
    showToast('↺');
  };

  const startReading = (inputText) => {
    setText(inputText);
    setWords(parseText(inputText));
    setIndex(0);
    setSessionStart(null);
    setComplete(false);
    setFileName('');
    setView('reader');
    setTimeout(() => {
      setSessionStart(Date.now());
      if (warmUp && readMode !== 'natural') setCurrentWpm(wpm * 0.5);
      setPlaying(true);
    }, 400);
  };

  // File import
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let extracted = '';

      if (ext === 'txt') {
        extracted = await file.text();
      } else if (ext === 'pdf') {
        extracted = await extractPdf(file);
      } else if (ext === 'epub') {
        extracted = await extractEpub(file);
      }

      if (extracted.trim()) {
        setText(extracted);
        showToast(`Imported: ${file.name}`);
      } else {
        showToast('No text found');
      }
    } catch (err) {
      console.error(err);
      showToast('Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const extractPdf = async (file) => {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n\n';
    }
    return text;
  };

  const extractEpub = async (file) => {
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    let text = '';
    const htmlFiles = Object.keys(zip.files).filter(n => n.endsWith('.html') || n.endsWith('.xhtml')).sort();

    for (const name of htmlFiles) {
      const content = await zip.files[name].async('string');
      const cleaned = content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned) text += cleaned + '\n\n';
    }
    return text;
  };

  // Stats
  const wordCount = useMemo(() => words.filter(w => w.type === 'word').length, [words]);
  const currentWordNum = useMemo(() => words.slice(0, index + 1).filter(w => w.type === 'word').length, [words, index]);
  const progress = wordCount ? (currentWordNum / wordCount) * 100 : 0;
  const timeLeft = wordCount ? Math.ceil((wordCount - currentWordNum) / (readMode === 'natural' ? 200 : currentWpm)) : 0;

  // Mode descriptions
  const modeInfo = {
    standard: 'Balanced speed with natural pauses',
    natural: 'Human-like pacing, conversational feel',
    speed: 'Maximum speed, minimal pauses',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      color: t.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      transition: 'background 0.3s, color 0.3s',
    }}>
      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.epub" onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          background: t.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: '12px 24px',
          fontSize: 15,
          fontWeight: 500,
          zIndex: 1000,
        }}>
          {toast}
        </div>
      )}

      {/* HOME */}
      {view === 'home' && (
        <div style={{ minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Focus</h1>
            <button onClick={() => setView('settings')} style={{ width: 42, height: 42, borderRadius: 21, border: `1px solid ${t.border}`, background: t.glass, color: t.text, fontSize: 18, cursor: 'pointer' }}>⚙</button>
          </div>

          {/* Mode selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['standard', 'natural', 'speed'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setReadMode(mode)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: 12,
                    border: readMode === mode ? `2px solid ${accent}` : `1px solid ${t.border}`,
                    background: readMode === mode ? accentSoft : 'transparent',
                    color: readMode === mode ? accent : t.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode === 'natural' ? '🎭 Natural' : mode === 'speed' ? '⚡ Speed' : '📖 Standard'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: t.muted, textAlign: 'center', marginTop: 8 }}>
              {modeInfo[readMode]}
            </p>
          </div>

          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            style={{
              padding: '14px 16px',
              marginBottom: 16,
              borderRadius: 12,
              border: voiceEnabled ? `2px solid ${accent}` : `1px solid ${t.border}`,
              background: voiceEnabled ? accentSoft : 'transparent',
              color: voiceEnabled ? accent : t.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🔊</span>
            Voice {voiceEnabled ? 'On' : 'Off'}
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{
              padding: '14px 16px',
              marginBottom: 16,
              borderRadius: 12,
              border: `1px solid ${t.border}`,
              background: t.glass,
              color: t.text,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: importing ? 0.6 : 1,
            }}
          >
            📄 {importing ? 'Importing...' : 'Import PDF / EPUB / TXT'}
          </button>

          {/* Text input */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: t.glass,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            padding: 14,
            marginBottom: 16,
            minHeight: 160,
          }}>
            <textarea
              placeholder="Or paste text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontSize: 15, lineHeight: 1.7, resize: 'none', fontFamily: 'inherit' }}
            />
            {text.trim() && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${t.border}`, marginTop: 10 }}>
                <span style={{ fontSize: 13, color: t.muted }}>{text.trim().split(/\s+/).length} words</span>
                <button onClick={() => { setText(''); setFileName(''); }} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 13, cursor: 'pointer' }}>Clear</button>
              </div>
            )}
          </div>

          {/* Start */}
          {text.trim() && text.trim().split(/\s+/).length >= 5 && (
            <button
              onClick={() => startReading(text)}
              style={{
                width: '100%',
                padding: 16,
                marginBottom: 12,
                fontSize: 16,
                fontWeight: 600,
                border: 'none',
                borderRadius: 12,
                background: accent,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: `0 6px 20px ${accentGlow}`,
              }}
            >
              Start Reading
            </button>
          )}

          {/* Samples */}
          <div>
            <p style={{ fontSize: 11, color: t.subtle, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Samples</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {samples.map((s, i) => (
                <button
                  key={i}
                  onClick={() => startReading(s.text)}
                  style={{
                    padding: 14,
                    textAlign: 'left',
                    borderRadius: 12,
                    border: `1px solid ${t.border}`,
                    background: t.glass,
                    color: t.text,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{s.words} words</div>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: t.subtle, marginTop: 20 }}>
            Keep eyes on the <span style={{ color: accent }}>red letter</span> — it never moves
          </p>
        </div>
      )}

      {/* READER */}
      {view === 'reader' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }} onClick={toggleUI}>
          {/* Progress */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.subtle }}>
            <div style={{ height: '100%', width: `${progress}%`, background: accent, transition: 'width 0.15s' }} />
          </div>

          {/* Mode indicator */}
          <div style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: t.subtle,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {readMode} {voiceEnabled && '· 🔊'}
          </div>

          {/* Fixed ORP display */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            fontFamily: '"SF Mono", "Menlo", monospace',
            opacity: transitioning ? 0.3 : 1,
            transition: smoothTransitions ? 'opacity 0.05s' : 'none',
          }}>
            {/* Guide line */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: -50,
              bottom: -50,
              width: 1,
              background: `linear-gradient(to bottom, transparent, ${accent}25, transparent)`,
              transform: 'translateX(-50%)',
            }} />

            {currentWord.type === 'break' ? (
              <span style={{ color: t.subtle, fontSize: fontSize * 0.3 }}>·</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: currentWord.type === 'heading' ? t.muted : t.text, textAlign: 'right', minWidth: fontSize * 3.5 }}>
                  {currentWord.before}
                </span>
                <span style={{ color: accent, textShadow: `0 0 20px ${accentGlow}, 0 0 40px ${accentGlow}`, fontWeight: 600 }}>
                  {currentWord.orp}
                </span>
                <span style={{ color: currentWord.type === 'heading' ? t.muted : t.text, textAlign: 'left', minWidth: fontSize * 4.5 }}>
                  {currentWord.after}
                </span>
              </div>
            )}
          </div>

          {/* Complete */}
          {complete && (
            <div style={{ position: 'absolute', inset: 0, background: `${t.bg}f5`, backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Complete</h2>
              <p style={{ color: t.muted, marginBottom: 24 }}>{wordCount} words · {rewinds} rewinds</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setIndex(0); setComplete(false); setSessionStart(Date.now()); setPlaying(true); }} style={{ padding: '12px 24px', fontSize: 15, border: `1px solid ${t.border}`, borderRadius: 10, background: 'transparent', color: t.text, cursor: 'pointer' }}>Again</button>
                <button onClick={() => { setPlaying(false); setView('home'); }} style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 10, background: accent, color: '#fff', cursor: 'pointer' }}>Done</button>
              </div>
            </div>
          )}

          {/* Controls */}
          {showUI && !complete && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '50px 20px 28px', opacity: uiOpacity, transition: 'opacity 0.25s', pointerEvents: uiOpacity > 0 ? 'auto' : 'none' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => { setPlaying(false); setView('home'); }} style={{ padding: '10px 14px', fontSize: 14, border: `1px solid ${t.border}`, borderRadius: 10, background: t.glass, backdropFilter: 'blur(20px)', color: t.text, cursor: 'pointer' }}>← Exit</button>
                <div style={{ padding: '10px 14px', fontSize: 13, border: `1px solid ${t.border}`, borderRadius: 10, background: t.glass, backdropFilter: 'blur(20px)', color: t.muted }}>{currentWordNum}/{wordCount} · {timeLeft}m</div>
              </div>

              <div>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {readMode !== 'natural' && (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 300 }}>{currentWpm}</span>
                      <span style={{ fontSize: 15, color: t.muted, marginLeft: 6 }}>wpm</span>
                    </>
                  )}
                  {readMode === 'natural' && (
                    <span style={{ fontSize: 15, color: t.muted }}>Natural pacing</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <CtrlBtn onClick={() => setIndex(0)} t={t}>⏮</CtrlBtn>
                  <CtrlBtn onClick={rewind} t={t}>↺</CtrlBtn>
                  <CtrlBtn onClick={() => setIndex(p => Math.max(0, p - 1))} t={t}>◀</CtrlBtn>
                  <button onClick={togglePlay} style={{ width: 58, height: 58, borderRadius: 29, border: 'none', background: accent, color: '#fff', fontSize: 20, cursor: 'pointer', boxShadow: `0 6px 20px ${accentGlow}` }}>{playing ? '⏸' : '▶'}</button>
                  <CtrlBtn onClick={() => setIndex(p => Math.min(words.length - 1, p + 1))} t={t}>▶</CtrlBtn>
                  <CtrlBtn onClick={() => { setIndex(p => Math.min(words.length - 1, p + 8)); showToast('+'); }} t={t}>+</CtrlBtn>
                  <CtrlBtn onClick={() => setIndex(words.length - 1)} t={t}>⏭</CtrlBtn>
                </div>

                {readMode !== 'natural' && (
                  <>
                    <input type="range" min="150" max="600" step="25" value={wpm} onChange={(e) => { const v = Number(e.target.value); setWpm(v); if (!warmUp || !sessionStart) setCurrentWpm(v); }} style={{ width: '100%', height: 4, borderRadius: 2, appearance: 'none', background: `linear-gradient(to right, ${accent} ${(wpm - 150) / 4.5}%, ${t.subtle} ${(wpm - 150) / 4.5}%)`, cursor: 'pointer' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: t.subtle }}><span>150</span><span>600</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          {!showUI && !playing && !complete && (
            <div style={{ position: 'absolute', bottom: 28, fontSize: 13, color: t.subtle, animation: 'pulse 2s infinite' }}>Tap anywhere</div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {view === 'settings' && (
        <div style={{ minHeight: '100vh', padding: 20, paddingBottom: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Settings</h2>
            <button onClick={() => setView('home')} style={{ width: 40, height: 40, borderRadius: 20, border: `1px solid ${t.border}`, background: t.glass, color: t.text, fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>

          <Section title="Theme" t={t}>
            <div style={{ display: 'flex', gap: 10 }}>
              {[true, false].map(d => (
                <button key={String(d)} onClick={() => setDark(d)} style={{ flex: 1, padding: 14, borderRadius: 10, border: dark === d ? `2px solid ${accent}` : `1px solid ${t.border}`, background: dark === d ? accentSoft : 'transparent', color: dark === d ? accent : t.text, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>{d ? 'Dark' : 'Light'}</button>
              ))}
            </div>
          </Section>

          <Section title="Accent" t={t}>
            <div style={{ display: 'flex', gap: 10 }}>
              {[0, 30, 50, 120, 200, 270, 330].map(h => (
                <button key={h} onClick={() => setHue(h)} style={{ width: 36, height: 36, borderRadius: 18, border: hue === h ? `3px solid ${t.text}` : 'none', background: `hsl(${h}, 80%, 55%)`, cursor: 'pointer', transform: hue === h ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }} />
              ))}
            </div>
          </Section>

          <Section title="Font Size" value={`${fontSize}px`} t={t}>
            <input type="range" min="32" max="52" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: '100%', height: 4, borderRadius: 2, appearance: 'none', background: `linear-gradient(to right, ${accent} ${(fontSize - 32) / 0.2}%, ${t.subtle} ${(fontSize - 32) / 0.2}%)`, cursor: 'pointer' }} />
          </Section>

          <Section title="Default Speed" value={`${wpm} wpm`} t={t}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[200, 300, 400, 500].map(w => (
                <button key={w} onClick={() => { setWpm(w); setCurrentWpm(w); }} style={{ padding: '10px 18px', borderRadius: 8, border: wpm === w ? `2px solid ${accent}` : `1px solid ${t.border}`, background: wpm === w ? accentSoft : 'transparent', color: wpm === w ? accent : t.text, fontSize: 14, cursor: 'pointer' }}>{w}</button>
              ))}
            </div>
          </Section>

          <Section title="Voice" t={t}>
            <Toggle label="Enable voice" value={voiceEnabled} onChange={setVoiceEnabled} accent={accent} t={t} />
            {voiceEnabled && availableVoices.length > 0 && (
              <>
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, color: t.muted, marginBottom: 8 }}>Voice</p>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => setSelectedVoice(availableVoices.find(v => v.name === e.target.value))}
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: t.glass, color: t.text, fontSize: 14 }}
                  >
                    {availableVoices.map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: t.muted }}>Speed</span>
                    <span style={{ fontSize: 13, color: t.text }}>{voiceRate}x</span>
                  </div>
                  <input type="range" min="0.5" max="2" step="0.1" value={voiceRate} onChange={(e) => setVoiceRate(Number(e.target.value))} style={{ width: '100%', height: 4, borderRadius: 2, appearance: 'none', background: `linear-gradient(to right, ${accent} ${(voiceRate - 0.5) / 0.015}%, ${t.subtle} ${(voiceRate - 0.5) / 0.015}%)`, cursor: 'pointer' }} />
                </div>
              </>
            )}
          </Section>

          <Section title="Options" t={t}>
            <Toggle label="Smooth transitions" value={smoothTransitions} onChange={setSmoothTransitions} accent={accent} t={t} />
            <Toggle label="Warm-up speed" value={warmUp} onChange={setWarmUp} accent={accent} t={t} />
          </Section>

          <p style={{ textAlign: 'center', fontSize: 12, color: t.subtle, marginTop: 32 }}>Focus Reader v7.0</p>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        input[type="range"]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${accent}; cursor: pointer; }
        textarea::placeholder { color: ${t.subtle}; }
        select { appearance: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

// Components
const CtrlBtn = ({ children, onClick, t }) => (
  <button onClick={onClick} style={{ width: 42, height: 42, borderRadius: 21, border: `1px solid ${t.border}`, background: t.glass, backdropFilter: 'blur(20px)', color: t.text, fontSize: 15, cursor: 'pointer' }}>{children}</button>
);

const Section = ({ title, value, children, t }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: t.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      {value && <span style={{ fontSize: 13, color: t.text }}>{value}</span>}
    </div>
    {children}
  </div>
);

const Toggle = ({ label, value, onChange, accent, t }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
    <span style={{ fontSize: 15 }}>{label}</span>
    <button onClick={() => onChange(!value)} style={{ width: 48, height: 28, borderRadius: 14, border: 'none', background: value ? accent : t.subtle, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
      <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
    </button>
  </div>
);

export default FocusReaderV7;
