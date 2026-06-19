'use client';

import { useState, useEffect, useRef } from 'react';
import { getTasting } from './actions';

const voiceMap: { [key: string]: string } = {
  santiago: 'en-US-BrianNeural',
  shakespeare: 'en-GB-ThomasNeural',
  snoop: 'en-US-JacobNeural',
  cunk: 'en-GB-MiaNeural',
};

const personaNames: { [key: string]: string } = {
  santiago: 'Santiago',
  shakespeare: 'William',
  snoop: 'Snoop',
  cunk: 'Philomena',
};

export default function Santiago() {
  const [wineName, setWineName] = useState('');
  const [vintage, setVintage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingText, setLoadingText] = useState('Santiago is in the cellar');
  const [showNotes, setShowNotes] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [persona, setPersona] = useState('santiago');
  const [mode, setMode] = useState<'savor' | 'sip'>('savor');
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioBlob = useRef<Blob | null>(null);

  useEffect(() => {
    document.title = 'Santiago the Somm';
    // Load Font Awesome for icons
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(faLink);

    // Load flag-icons for country flags
    const flagLink = document.createElement('link');
    flagLink.rel = 'stylesheet';
    flagLink.href = 'https://cdn.jsdelivr.net/npm/flag-icons@6.14.0/css/flag-icons.min.css';
    document.head.appendChild(flagLink);

    // Add styles for select dropdown and spin animation
    const style = document.createElement('style');
    style.textContent = `
      select {
        background-color: #1a1a2e !important;
        color: #e8e4d9 !important;
      }
      select option {
        background-color: #1a1a2e !important;
        color: #e8e4d9 !important;
      }
      select option:checked {
        background-color: #534AB7 !important;
        color: #e8e4d9 !important;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .sandy-spinner {
        animation: spin 2s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const firstName = personaNames[persona].toUpperCase();
    const messages = [
      `${firstName} IS IN THE CELLAR`,
      `${firstName} FOUND A BOTTLE`,
      `${firstName} IS DECANTING`,
      `${firstName} IS TASTING`,
      `${firstName} IS COMPOSING NOTES`,
      `${firstName} IS ALMOST READY...`
    ];

    const interval = mode === 'sip' ? 500 : 2000;
    const timeouts = messages.map((msg, index) =>
      setTimeout(() => setLoadingText(msg), index * interval)
    );

    return () => timeouts.forEach(timeout => clearTimeout(timeout));
  }, [isLoading, persona]);


  const beginTasting = async () => {
    if (!wineName.trim()) {
      return;
    }

    setIsLoading(true);
    setResponse('');
    stopSpeech();

    try {
      // Get tasting notes
      const textContent = await getTasting(wineName, vintage, persona, mode);

      // Generate audio
      const voice = voiceMap[persona];
      const ttsResp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent, voice }),
      });

      if (!ttsResp.ok) throw new Error('TTS request failed');

      const blob = await ttsResp.blob();
      audioBlob.current = blob;

      // Both done, show the page
      setResponse(textContent);
    } catch (err: any) {
      console.error('Tasting error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playSpeech = () => {
    if (!audioBlob.current || !audioRef.current) return;

    const url = URL.createObjectURL(audioBlob.current);
    audioRef.current.src = url;
    audioRef.current.playbackRate = speechRate;
    audioRef.current.play();
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const pauseSpeech = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const stopSpeech = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const resetForm = () => {
    stopSpeech();
    setWineName('');
    setVintage('');
    setResponse('');
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={{
            fontSize: '32px',
            marginBottom: '10px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <span className="fi fi-fr"></span>
            <span className="fi fi-it"></span>
            <span className="fi fi-es"></span>
            <span className="fi fi-de"></span>
            <span className="fi fi-pt"></span>
            <span className="fi fi-us"></span>
            <span className="fi fi-au"></span>
            <span className="fi fi-ar"></span>
          </div>
          <div style={{...styles.title, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
            <span>Santiago the Somm</span>
            <img
              src="/sandy.jpg"
              alt="Sandy"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>
          <div style={styles.subtitle}>Your AI Wine Guide*</div>
        </header>


        <audio
          ref={audioRef}
          onEnded={() => {
            setIsSpeaking(false);
            setIsPaused(false);
          }}
          onPause={() => setIsPaused(true)}
          onPlay={() => {
            setIsSpeaking(true);
            setIsPaused(false);
          }}
          style={{display: 'none'}}
        />

        {!response ? (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Wine Name</label>
              <input
                type="text"
                value={wineName}
                onChange={(e) => setWineName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && beginTasting()}
                placeholder="e.g., Château Margaux, Barolo, Riesling"
                style={styles.input}
                disabled={isLoading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Vintage Year (Optional)</label>
              <input
                type="text"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && beginTasting()}
                placeholder="e.g., 2015"
                maxLength={4}
                style={styles.input}
                disabled={isLoading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select your somm</label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                style={styles.input}
                disabled={isLoading}
              >
                <option value="santiago">Santiago</option>
                <option value="shakespeare">William Shakespeare</option>
                <option value="snoop">Snoop Dog</option>
                <option value="cunk">Philomena Cunk</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tasting Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'savor' | 'sip')}
                style={styles.input}
                disabled={isLoading}
              >
                <option value="savor">Savor (500-word deep dive)</option>
                <option value="sip">Sip (50-word quick taste)</option>
              </select>
            </div>

            <button onClick={beginTasting} disabled={isLoading} style={styles.button}>
              {isLoading ? (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                  <span>{loadingText}</span>
                  <img
                    src="/sandy.jpg"
                    alt="Loading"
                    className="sandy-spinner"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ) : 'Begin Tasting'}
            </button>

            <div style={styles.footer}>
              * Available in person for bachelorette parties and bar mitzvahs
            </div>
          </div>
        ) : (
          <div>
            <div style={styles.speechControls}>
              <button
                onClick={() => isSpeaking ? pauseSpeech() : playSpeech()}
                style={styles.speechBtn}
              >
                <i className={`fa-solid ${isPaused ? 'fa-play' : isSpeaking ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button onClick={stopSpeech} disabled={!isSpeaking} style={styles.speechBtn}>
                <i className="fa-solid fa-stop"></i>
              </button>
              <select
                value={speechRate.toString()}
                onChange={(e) => {
                  const newRate = parseFloat(e.target.value);
                  setSpeechRate(newRate);
                  if (audioRef.current) {
                    audioRef.current.playbackRate = newRate;
                  }
                }}
                style={styles.speedSelect}
              >
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {isSpeaking && <div style={styles.speechStatus}>🔊 Now Playing...</div>}

            <button
              onClick={() => setShowNotes(!showNotes)}
              style={{
                ...styles.button,
                marginTop: '20px',
                background: showNotes ? '#6d5dd4' : '#534AB7'
              }}
            >
              {showNotes ? '📖 Hide Notes' : '📖 View Notes'}
            </button>

            {showNotes && (
              <div style={styles.tastingResponse}>
                {response.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            <button
              onClick={resetForm}
              style={{
                ...styles.button,
                marginTop: '30px',
                background: '#534AB7'
              }}
            >
              Start a new tasting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  body: {
    fontFamily: "'Georgia', 'Garamond', serif",
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    color: '#e8e4d9',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  container: {
    width: '100%',
    maxWidth: '700px',
    background: 'rgba(20, 20, 35, 0.95)',
    border: '1px solid #534AB7',
    borderRadius: '12px',
    padding: '60px 50px',
    boxShadow: '0 20px 60px rgba(83, 74, 183, 0.15)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '50px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 300,
    letterSpacing: '2px',
    color: '#e8e4d9',
    marginBottom: '8px',
  },
  tagline: {
    fontSize: '16px',
    letterSpacing: '0.5px',
    fontStyle: 'italic',
    color: 'rgba(232, 228, 217, 0.7)',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '14px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #534AB7',
    borderRadius: '6px',
    color: '#e8e4d9',
    fontFamily: "'Georgia', serif",
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  button: {
    padding: '14px 32px',
    background: '#534AB7',
    border: 'none',
    borderRadius: '6px',
    color: '#e8e4d9',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    width: '100%',
    cursor: 'pointer',
  },
  speechControls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    justifyContent: 'center',
  },
  speechBtn: {
    padding: '12px 24px',
    fontSize: '12px',
    background: 'rgba(83, 74, 183, 0.2)',
    border: '1px solid #534AB7',
    color: '#e8e4d9',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  speedSelect: {
    padding: '10px 14px',
    fontSize: '16px',
    background: '#1a1a2e',
    border: '1px solid #534AB7',
    color: '#e8e4d9',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties & { 'option:checked': any; 'option': any },
  speechStatus: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#534AB7',
    marginBottom: '20px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  tastingResponse: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#e8e4d9',
    marginBottom: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontStyle: 'normal',
  },
  resetLink: {
    textAlign: 'center' as const,
    marginTop: '30px',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '20px',
    fontSize: '14px',
    color: '#ffffff',
    letterSpacing: '0.5px',
    fontStyle: 'italic',
  },
};
