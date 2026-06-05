import { useRef, useCallback, useEffect } from 'react';
import { Howl, Howler } from 'howler';
import * as Tone from 'tone';

// ── Tone.js sound generators (không cần file MP3) ────────────────────────────

const createSounds = () => {
  /**
   * Âm thanh pickup: click nhẹ + giai điệu ngắn
   */
  const playPickup = async () => {
    await Tone.start();
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      volume: -18,
    }).toDestination();
    synth.triggerAttackRelease('C5', '32n');
    setTimeout(() => synth.dispose(), 500);
  };

  /**
   * Âm thanh snap đúng: chord vui
   */
  const playSnap = async () => {
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
      volume: -14,
    }).toDestination();
    synth.triggerAttackRelease(['E4', 'G4', 'B4'], '8n');
    setTimeout(() => synth.dispose(), 1000);
  };

  /**
   * Âm thanh sai: tiếng bộp thấp
   */
  const playWrong = async () => {
    await Tone.start();
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
      volume: -20,
    }).toDestination();
    const filter = new Tone.Filter(400, 'lowpass').toDestination();
    synth.connect(filter);
    synth.triggerAttackRelease('A2', '16n');
    setTimeout(() => { synth.dispose(); filter.dispose(); }, 500);
  };

  /**
   * Âm thanh thắng: fanfare vui
   */
  const playWin = async () => {
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.4 },
      volume: -10,
    }).toDestination();

    const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination();
    synth.connect(reverb);

    // Fanfare arpeggio
    const notes = [
      { note: 'C4', time: 0 },
      { note: 'E4', time: 0.15 },
      { note: 'G4', time: 0.3 },
      { note: ['C4', 'E4', 'G4', 'C5'], time: 0.5 },
    ];

    notes.forEach(({ note, time }) => {
      setTimeout(() => {
        synth.triggerAttackRelease(note as string | string[], '4n');
      }, time * 1000);
    });

    setTimeout(() => { synth.dispose(); reverb.dispose(); }, 3000);
  };

  return { playPickup, playSnap, playWrong, playWin };
};

// Singleton để tránh tạo nhiều instance
let soundsInstance: ReturnType<typeof createSounds> | null = null;

/**
 * useGameSound — React hook quản lý âm thanh game
 * Dùng Tone.js để sinh âm thanh programmatically (không cần file MP3)
 *
 * @example
 * const { playSnap, playWrong, playWin, playPickup } = useGameSound();
 */
export const useGameSound = () => {
  const soundsRef = useRef<ReturnType<typeof createSounds> | null>(null);
  const enabledRef = useRef(true);

  useEffect(() => {
    if (!soundsInstance) {
      soundsInstance = createSounds();
    }
    soundsRef.current = soundsInstance;

    return () => {
      // Không dispose singleton khi unmount
    };
  }, []);

  const playPickup = useCallback(() => {
    if (!enabledRef.current || !soundsRef.current) return;
    soundsRef.current.playPickup().catch(() => {/* ignore autoplay policy */});
  }, []);

  const playSnap = useCallback(() => {
    if (!enabledRef.current || !soundsRef.current) return;
    soundsRef.current.playSnap().catch(() => {});
  }, []);

  const playWrong = useCallback(() => {
    if (!enabledRef.current || !soundsRef.current) return;
    soundsRef.current.playWrong().catch(() => {});
  }, []);

  const playWin = useCallback(() => {
    if (!enabledRef.current || !soundsRef.current) return;
    soundsRef.current.playWin().catch(() => {});
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { playPickup, playSnap, playWrong, playWin, setEnabled };
};
