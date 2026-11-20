// Quiet synthesized bells only. Audio is opt-in and no media leaves the device.
export class Audio {
  constructor() { this.enabled = false; this.context = null; }
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) { this.enabled = false; return false; }
      this.context ??= new Context();
      await this.context.resume();
      this.chime([523.25, 659.25, 783.99]);
    }
    return this.enabled;
  }
  chime(notes = [880], volume = 0.045) {
    if (!this.enabled || !this.context) return;
    notes.forEach((frequency, i) => {
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      const start = this.context.currentTime + i * 0.10;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + 0.012); gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      oscillator.connect(gain); gain.connect(this.context.destination); oscillator.start(start); oscillator.stop(start + 1.2);
    });
  }
  event(name) {
    if (name === 'mote_picked') this.chime([740 + (this.context?.currentTime % 3) * 80], 0.025);
    if (name === 'lantern_lit') this.chime([392, 493.88, 587.33, 783.99]);
    if (name === 'pulse') this.chime([220, 440, 880], 0.03);
    if (name === 'player_hit') this.chime([174.61, 130.81], 0.035);
  }
}
