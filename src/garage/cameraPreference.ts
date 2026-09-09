let choice = true;
export function readCameraMaskChoice() {
  try {
    return sessionStorage.getItem("garage-camera-mask-v1") !== "false";
  } catch {
    return choice;
  }
}
export function saveCameraMaskChoice(value: boolean) {
  choice = value;
  try {
    sessionStorage.setItem("garage-camera-mask-v1", String(value));
  } catch {
    /* Keep the choice for this page. */
  }
}
