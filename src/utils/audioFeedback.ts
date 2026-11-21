export interface ChimePlayResult {
  played: boolean;
  reason: 'played' | 'muted' | 'unsupported';
  timestampEpochMs: number;
}

const AUDIO_PREF_KEY = 'focus_os_audio_feedback_enabled_v1';

export function loadAudioFeedbackEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(AUDIO_PREF_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function saveAudioFeedbackEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIO_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Plays a subtle, low-volume two-tone ascending chime via Web Audio API
 * when an active study mission hits its target duration.
 */
export function playMissionCompleteChime(enabled: boolean): ChimePlayResult {
  const timestampEpochMs = Date.now();
  if (!enabled) {
    return { played: false, reason: 'muted', timestampEpochMs };
  }
  if (typeof window === 'undefined') {
    return { played: false, reason: 'unsupported', timestampEpochMs };
  }

  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    return { played: false, reason: 'unsupported', timestampEpochMs };
  }

  try {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime;
    const notes = [
      { freq: 880, offset: 0, duration: 0.14 },
      { freq: 1174.66, offset: 0.14, duration: 0.22 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, startTime + note.offset);

      gain.gain.setValueAtTime(0.0001, startTime + note.offset);
      gain.gain.exponentialRampToValueAtTime(0.075, startTime + note.offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.offset + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + note.offset);
      osc.stop(startTime + note.offset + note.duration + 0.02);
    }

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 600);

    return { played: true, reason: 'played', timestampEpochMs };
  } catch {
    return { played: false, reason: 'unsupported', timestampEpochMs };
  }
}
