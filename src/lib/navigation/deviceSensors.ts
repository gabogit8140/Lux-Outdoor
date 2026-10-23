/**
 * deviceSensors.ts
 * Gestion matérielle 100% hors-ligne du terminal mobile :
 * - Vibrations haptiques discrètes (vibreur du smartphone)
 * - Anti-mise en veille d'écran (Screen Wake Lock API standard)
 * - Audio beeps synthétisés localement via Web Audio API (aucun fichier à télécharger, 0 réseau)
 */

class DeviceSensorsManager {
  private wakeLockSentinel: any = null;
  private audioCtx: AudioContext | null = null;

  /**
   * Empêche l'extinction automatique de l'écran pendant le guidage en randonnée
   */
  public async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        return true;
      }
    } catch {
      // Ignorer si refusé ou non supporté
    }
    return false;
  }

  /**
   * Libère le verrou d'écran lorsque le guidage prend fin
   */
  public releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch {
      // Ignorer
    }
  }

  /**
   * Vibration haptique (ex: double pulsation d'alerte en cas de hors-sentier)
   */
  public vibrate(pattern: number | number[] = 200) {
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignorer si non supporté
    }
  }

  /**
   * Émet un bip sonore d'alerte généré localement par oscillateur audio matériel
   * (fonctionne 100% hors-ligne, sans aucun fichier audio ni API externe)
   */
  public playAlertBeep(type: 'warning' | 'turn' | 'success' = 'warning') {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'warning') {
        // Double bip aigu d'alerte hors-sentier (880 Hz -> 660 Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'turn') {
        // Ding doux de notification de manœuvre (587 Hz - Ré)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'success') {
        // Accord ascendant d'arrivée (523 Hz -> 659 Hz -> 784 Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Ignorer si audio bloqué par la politique du navigateur
    }
  }
}

export const deviceSensors = new DeviceSensorsManager();
