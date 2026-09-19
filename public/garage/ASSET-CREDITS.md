# Assets

- garage-background.webp: generated with OpenAI ImageGen for this Disque Amizade prototype, based on the user-approved concept. Pre-rendered scenery, not a 3D mesh.
- avatars/character-*.glb and avatars/Textures/colormap.png: Kenney Mini Characters (2024), CC0. https://kenney.nl/assets/mini-characters . Original license: avatars/LICENSE.txt. Provisional animated models, not the custom adult characters in the concept image.
- Avatar thumbnails are rendered at runtime from those GLB models.
- Interface icons: existing lucide-react dependency.
- living-background.webp: generated with OpenAI ImageGen as a matching 1980s Brazilian living room, using the garage image as reference. Pre-rendered scene, no people baked into the asset.

- bar-background.webp: OpenAI built-in ImageGen, matching the existing living-room/bar art. Final prompt: retain the warm 1980s isometric bar, shelves, jukebox and three counter stools; replace the seating with exactly three round tables with four separate chairs each, with open walking corridors and no people/UI. Saved project asset: public/garage/bar-background.webp.
- Current live avatars and thumbnails: project-authored procedural Three.js geometry in src/garage/adultAvatar.ts, with the Vinyl Club direction selected by the user. The earlier Kenney thumbnail/runtime description above is superseded; those source assets remain credited and retained.
