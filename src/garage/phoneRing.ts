// A quiet mechanical double bell, synthesized locally without downloading audio.
const buffers = new WeakMap<BaseAudioContext, AudioBuffer>();
export function playPhoneRing(context: AudioContext): () => void {
  if (context.state !== 'running') return () => {};
  let buffer = buffers.get(context);
  if (!buffer) {
    buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 1.9), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (const start of [0, .95]) {
      for (let strike = 0; strike < 13; strike++) {
        const onset = start + strike * .047;
        const pitch = strike % 2 ? 1060 : 860;
        for (let i = 0; i < context.sampleRate * .17; i++) {
          const index = Math.round(onset * context.sampleRate) + i;
          if (index >= samples.length) break;
          const t = i / context.sampleRate;
          const envelope = Math.min(1, t / .002) * Math.exp(-t * 35);
          samples[index] += envelope * (
            Math.sin(2 * Math.PI * pitch * t) * .65 +
            Math.sin(2 * Math.PI * pitch * 1.49 * t) * .24 +
            Math.sin(2 * Math.PI * pitch * 2.13 * t) * .11
          );
        }
      }
    }
    let peak = 1;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    for (let i = 0; i < samples.length; i++) samples[i] /= peak;
    buffers.set(context, buffer);
  }
  const source = context.createBufferSource(), volume = context.createGain();
  source.buffer = buffer;
  volume.gain.value = .025;
  source.connect(volume);
  volume.connect(context.destination);
  const disconnect = () => { source.disconnect(); volume.disconnect(); };
  source.onended = disconnect;
  source.start();
  return () => { source.stop(); disconnect(); };
}
