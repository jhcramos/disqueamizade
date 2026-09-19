// Development-only transport fixture. Never accesses the user's camera/microphone.
export function syntheticMedia(kind: "audio" | "video"): MediaStream {
  if (kind === "audio") {
    const context = new AudioContext(),
      source = context.createOscillator(),
      gain = context.createGain(),
      output = context.createMediaStreamDestination();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(output);
    source.start();
    const track = output.stream.getAudioTracks()[0],
      stop = track.stop.bind(track);
    track.stop = () => {
      source.stop();
      void context.close();
      stop();
    };
    return output.stream;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d")!;
  const draw = () => {
    context.fillStyle = "#315f58";
    context.fillRect(0, 0, 640, 360);
    context.fillStyle = "#fff5de";
    context.font = "28px sans-serif";
    context.fillText("TESTE DE TRANSMISSÃO", 100, 160);
    context.font = "18px sans-serif";
    context.fillText("Mídia sintética — nenhuma webcam acessada", 100, 200);
    context.fillRect((Date.now() / 10) % 620, 290, 20, 20);
  };
  draw();
  const timer = setInterval(draw, 100),
    stream = canvas.captureStream(10),
    track = stream.getVideoTracks()[0],
    stop = track.stop.bind(track);
  track.stop = () => {
    clearInterval(timer);
    stop();
  };
  return stream;
}
