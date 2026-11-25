import type { AdhanSoundKey } from '../types/app';

const ADHAN_AUDIO_URLS: Record<AdhanSoundKey, string> = {
  makkah: '/audio/adhan-makkah.mp3',
  madina: '/audio/adhan-madina.mp3',
  alaqsa: '/audio/adhan-alaqsa.mp3',
  mishary: '/audio/adhan-mishary.mp3',
  chime: '/audio/adhan-makkah.mp3',
};

class SafarAlarmEngine {
  private audioEl: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private chimeTimer: number | null = null;
  private unlocked = false;

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public unlockAudio(): boolean {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        if (!this.audioCtx) {
          this.audioCtx = new Ctx();
        }
        if (this.audioCtx.state === 'suspended') {
          void this.audioCtx.resume();
        }
        // Play silent 1-sample buffer to permanently unlock audio output on mobile browsers
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      }
      this.unlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  public stopAll(): void {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch {
        // ignore
      }
      this.audioEl = null;
    }
    if (this.chimeTimer !== null) {
      window.clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }

  private playSynthMelodicChime(mode: 'adhan' | 'alarm'): void {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!this.audioCtx) {
        this.audioCtx = new Ctx();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      // Hijaz / serene harmonic progression for Adhan chime, bright triad for tasks
      const notes =
        mode === 'adhan'
          ? [293.66, 311.13, 369.99, 392.0, 440.0, 392.0, 369.99, 293.66]
          : [523.25, 659.25, 783.99, 659.25, 783.99];

      const playPhrase = () => {
        const start = ctx.currentTime + 0.03;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = mode === 'adhan' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, start + idx * 0.36);

          gain.gain.setValueAtTime(0.0001, start + idx * 0.36);
          gain.gain.exponentialRampToValueAtTime(0.22, start + idx * 0.36 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + idx * 0.36 + 0.34);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start + idx * 0.36);
          osc.stop(start + idx * 0.36 + 0.35);
        });
      };

      playPhrase();
      let repeats = 0;
      this.chimeTimer = window.setInterval(() => {
        repeats += 1;
        if (repeats >= (mode === 'adhan' ? 5 : 3)) {
          if (this.chimeTimer !== null) {
            window.clearInterval(this.chimeTimer);
            this.chimeTimer = null;
          }
          return;
        }
        playPhrase();
      }, notes.length * 380 + 600);
    } catch {
      // ignore if audio context unavailable
    }
  }

  public async playAdhan(sound: AdhanSoundKey = 'makkah'): Promise<void> {
    this.stopAll();
    this.triggerVibration();

    const url = ADHAN_AUDIO_URLS[sound] || ADHAN_AUDIO_URLS.makkah;
    try {
      const audio = new Audio(url);
      audio.volume = 1.0;
      this.audioEl = audio;
      audio.onerror = () => {
        // Fallback to local vocal makkah adhan if selected voice failed
        if (this.audioEl === audio && url !== ADHAN_AUDIO_URLS.makkah) {
          const fallbackAudio = new Audio(ADHAN_AUDIO_URLS.makkah);
          fallbackAudio.volume = 1.0;
          this.audioEl = fallbackAudio;
          void fallbackAudio.play().catch(() => {});
        }
      };
      await audio.play();
    } catch {
      // Autoplay restriction or audio failure fallback to secondary vocal
      try {
        const fallbackAudio = new Audio(ADHAN_AUDIO_URLS.makkah);
        fallbackAudio.volume = 1.0;
        this.audioEl = fallbackAudio;
        await fallbackAudio.play();
      } catch {
        // Audio output muted/blocked until user interaction
      }
    }
  }

  public playTaskAlarm(): void {
    this.stopAll();
    this.triggerVibration();
    this.playSynthMelodicChime('alarm');
  }

  private triggerVibration(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([350, 180, 350, 180, 500]);
      } catch {
        // ignore
      }
    }
  }

  public async sendSystemNotification(title: string, body: string, tag: string): Promise<boolean> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return false;
    }
    try {
      if ('serviceWorker' in navigator) {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((res) => setTimeout(() => res(null), 1200)),
        ]);
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag,
            renotify: true,
            requireInteraction: true,
          } as NotificationOptions);
          return true;
        }
      }
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag,
      });
      return true;
    } catch {
      return false;
    }
  }

  public async requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof Notification === 'undefined') {
      return 'unsupported';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }
}

export const alarmEngine = new SafarAlarmEngine();
