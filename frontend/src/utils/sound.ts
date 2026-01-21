export const SOUNDS = {
  success: "data:audio/wav;base64,UklGRl9vT1dAVX..." // Placeholder, I will use a real short base64 string
};

// Simple beep for now, can be replaced with better sounds
// Short "Ding"
const SUCCESS_SOUND = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

// Level Up (Fanfare-ish)
const LEVEL_UP_SOUND = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

export function playSound(type: 'success' | 'levelup' | 'delete') {
  const audio = new Audio();
  
  // Real base64 for a short "pop" sound
  if (type === 'success') {
    audio.src = "https://actions.google.com/sounds/v1/cartoon/pop.ogg"; 
  } else if (type === 'levelup') {
    audio.src = "https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg"; // Just a placeholder url, better to use real files if possible.
  } else if (type === 'delete') {
    audio.src = "https://actions.google.com/sounds/v1/cartoon/swoosh_1.ogg";
  }

  // Since we can't reliably use external URLs due to CORS/Network, I will use generated oscillator beeps.
  // It's safer and zero-dependency.
  playOscillator(type);
}

function playOscillator(type: 'success' | 'levelup' | 'delete') {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'success') {
    // High pitch ding
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === 'levelup') {
    // Major chord arpeggio
    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.value = 0.1;
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.1 + i * 0.1 + 0.5);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.5);
    });
  } else if (type === 'delete') {
    // White noise swoosh or low pitch drop
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
}

export function vibrate(pattern: number | number[] = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
