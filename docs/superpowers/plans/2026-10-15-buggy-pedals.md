# Buggy pedals and engine audio

Requested: accelerator, brake and engine sound when accelerating.

Implemented two hold buttons for drivers, preserving joystick/keyboard movement and reverse. Brake overrides every throttle source and uses existing vehicle deceleration. Pointer release/cancel, focus loss, disabled state and dismount clear pedal input. Passengers cannot access pedals.

A local Web Audio engine uses two filtered oscillators, low gain and smoothed RPM based on speed and accelerator state. It starts only after a user gesture, can be muted, goes silent in the background and closes on dismount. No audio downloads, microphone access or extra network messages.

Verification: TypeScript and full production build passed; 12 domain/network tests passed. Browser regression with independent sessions verifies passenger synchronization, mobile joystick, pedal acceleration, brake priority over keyboard, blur release, audio gesture initialization, mute and audio disposal. Mobile screenshot inspected. No production release is included in this change.
