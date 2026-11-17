// NEON BASTION — procedural WebAudio sound effects, no assets.
export function createAudio() {
  return { ctx: null, muted: false, master: null };
}

export function ensureAudio(a) {
  if (!a || a.ctx) return;
  try {
    const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    a.ctx = new AC();
    a.master = a.ctx.createGain();
    a.master.gain.value = a.muted ? 0 : 0.35;
    a.master.connect(a.ctx.destination);
  } catch (e) {
    a.ctx = null;
    a.master = null;
  }
}

export function setMuted(a, m) {
  a.muted = !!m;
  if (a.master) a.master.gain.value = a.muted ? 0 : 0.35;
}

export function toggleMuted(a) {
  setMuted(a, !a.muted);
  return a.muted;
}

function blip(a, freq, dur, type = 'square', vol = 0.2, slideTo = null, startAt = 0) {
  if (!a.ctx || a.muted) return;
  const t0 = a.ctx.currentTime + startAt;
  const osc = a.ctx.createOscillator();
  const gain = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(a.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch (e) { /* no-op */ }
  };
}

export function shoot(a, kind) {
  if (!a.ctx || a.muted) return;
  switch (kind) {
    case 'pulse': blip(a, 880, 0.05, 'square', 0.12); break;
    case 'frost': blip(a, 520, 0.09, 'sine', 0.14, 300); break;
    case 'rail': blip(a, 180, 0.14, 'sawtooth', 0.18); break;
    case 'mortar': blip(a, 140, 0.18, 'triangle', 0.2); break;
    case 'tesla': blip(a, 1200, 0.08, 'square', 0.12, 300); break;
    default: blip(a, 660, 0.08, 'square', 0.12); break;
  }
}

export function explosion(a, big = false) {
  if (!a.ctx || a.muted) return;
  try {
    const dur = big ? 0.5 : 0.25;
    const vol = big ? 0.45 : 0.3;
    const len = Math.floor(a.ctx.sampleRate * dur);
    const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = a.ctx.createBufferSource();
    src.buffer = buf;
    const filter = a.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    const gain = a.ctx.createGain();
    const t0 = a.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(a.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    src.onended = () => {
      try {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) { /* no-op */ }
    };
  } catch (e) {
    /* no-op */
  }
}

export function coin(a) {
  if (!a.ctx || a.muted) return;
  blip(a, 1320, 0.06, 'sine', 0.15);
  setTimeout(() => {
    if (a.ctx && !a.muted) blip(a, 1760, 0.08, 'sine', 0.15);
  }, 60);
}

export function leak(a) {
  if (!a.ctx || a.muted) return;
  blip(a, 300, 0.4, 'sawtooth', 0.25, 80);
  blip(a, 980, 0.08, 'square', 0.12);
}

export function horn(a) {
  if (!a.ctx || a.muted) return;
  blip(a, 220, 0.18, 'square', 0.2);
  setTimeout(() => {
    if (a.ctx && !a.muted) blip(a, 330, 0.25, 'square', 0.2);
  }, 180);
}

export function victory(a) {
  if (!a.ctx || a.muted) return;
  const notes = [523, 659, 784, 1046];
  for (let i = 0; i < notes.length; i++) blip(a, notes[i], 0.14, 'sine', 0.2, null, i * 0.12);
}

export function defeat(a) {
  if (!a.ctx || a.muted) return;
  const notes = [392, 311, 233, 155];
  for (let i = 0; i < notes.length; i++) blip(a, notes[i], 0.22, 'triangle', 0.2, null, i * 0.18);
}

export function click(a) {
  blip(a, 1000, 0.03, 'square', 0.1);
}