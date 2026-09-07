export async function acquireGarageMedia(
  kind: "audio" | "video",
): Promise<MediaStream> {
  if (
    import.meta.env.DEV &&
    new URLSearchParams(location.search).get("testMedia") === "1"
  ) {
    const { syntheticMedia } = await import("../../tests/garage-media-fixture");
    return syntheticMedia(kind);
  }
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error(
      "Seu navegador não permite acessar a câmera nesta conexão.",
    );
  return navigator.mediaDevices.getUserMedia(
    kind === "video"
      ? {
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: false,
        }
      : { audio: true, video: false },
  );
}
