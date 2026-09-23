import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /THREE|WebGL|shader|uniform/i.test(message.text())) errors.push(message.text());
});
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
await page.route(`${base}/material-test-harness`, route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0"></body></html>' }));
try {
  await page.goto(`${base}/material-test-harness`);
  const result = await page.evaluate(async () => {
    const source = await (await fetch('/src/garage3d/avatarFinish.ts')).text();
    const threeUrl = source.match(/from ["']([^"']*three\.js[^"']*)["']/)?.[1];
    if (!threeUrl) throw new Error('Vite must serve source modules for this integration test');
    const T = await import(threeUrl);
    const { applyAvatarMaterials, disposeAvatarObject, installAvatarNodeMaterials } = await import('/src/garage3d/avatarFinish.ts');
    const { createAdultAvatar, animateAdult } = await import('/src/garage/adultAvatar.ts');
    const { applyBodyPose } = await import('/src/garage3d/motion/rig.ts');
    const { neutralPose } = await import('/src/garage3d/motion/pose.ts');
    const { presetAppearance } = await import('/src/garage/avatarPresets.ts');
    const renderer = new T.WebGLRenderer({ antialias: true });
    const scope = installAvatarNodeMaterials(renderer);
    renderer.setSize(1200, 800);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    document.body.append(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color('#f4ede0');
    scene.add(new T.HemisphereLight('#fff0d4', '#9a8064', 2.4));
    const sun = new T.DirectionalLight('#ffdbab', 3.2);
    sun.position.set(-3, 9, 5); sun.castShadow = true;
    sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
    scene.add(sun);
    const floor = new T.Mesh(new T.BoxGeometry(12, .1, 8), new T.MeshStandardMaterial({ color: '#cfa16f' }));
    floor.position.y = -.1; floor.receiveShadow = true; scene.add(floor);
    const camera = new T.PerspectiveCamera(40, 1.5, .1, 100);
    camera.position.set(10, 10, 15); camera.lookAt(0, .7, 0);
    const models = [];
    let sourceMeshes = 0, finishedMeshes = 0;
    for (let i = 0; i < 20; i++) {
      const index = i % 10, appearance = presetAppearance(index), model = createAdultAvatar(index, appearance);
      model.traverse(o => { if (o.isMesh) sourceMeshes++; });
      const beforeBounds = new T.Box3().setFromObject(model, true);
      const named = []; model.traverse(o => { if (o.name) named.push(o); });
      applyAvatarMaterials(model, appearance, index, scope);
      model.traverse(o => { if (o.isMesh) finishedMeshes++; });
      const afterBounds = new T.Box3().setFromObject(model, true);
      if (beforeBounds.min.distanceTo(afterBounds.min) > .00001 || beforeBounds.max.distanceTo(afterBounds.max) > .00001) throw new Error('Batching changed avatar geometry bounds');
      for (const hook of named) if (!model.getObjectById(hook.id)) throw new Error('Batching removed a named animation hook');
      applyAvatarMaterials(model, appearance, index, scope); // applying twice must not leak owners
      model.position.set((i % 5 - 2) * 1.8, 0, (Math.floor(i / 5) - 1.5) * 1.8);
      model.traverse(o => { if (o.isMesh) o.castShadow = true; });
      models.push(model); scene.add(model);
    }
    animateAdult(models[0], false, 0, true, 1);
    if (Math.abs(models[0].getObjectByName('adult-leg-left-knee').rotation.x - Math.PI / 2) > .0001) throw new Error('Seated knee animation lost');
    const pose = neutralPose(); pose.left.forward = -.8; pose.left.elbowForward = -.5;
    applyBodyPose(models[1], pose);
    if (models[1].getObjectByName('motion-arm-left').rotation.x !== -.8 || models[1].getObjectByName('adult-arm-left-elbow').rotation.x !== -.5) throw new Error('Camera gesture articulation lost');
    const materials = new Set();
    models.forEach(model => model.traverse(o => { if (o.isMesh) materials.add(o.material); }));
    let disposals = 0;
    materials.forEach(material => material.addEventListener('dispose', () => disposals++));
    for (let i = 0; i < 3; i++) { renderer.render(scene, camera); await new Promise(requestAnimationFrame); }
    const glError = renderer.getContext().getError();
    const previewRenderer = new T.WebGLRenderer({ antialias: true });
    const previewScope = installAvatarNodeMaterials(previewRenderer);
    previewRenderer.setSize(400, 400);
    const previewScene = new T.Scene();
    previewScene.add(new T.HemisphereLight('#ffffff', '#777777', 3));
    const preview = createAdultAvatar(0, presetAppearance(0));
    applyAvatarMaterials(preview, presetAppearance(0), 0, previewScope);
    previewScene.add(preview);
    for (let i = 0; i < 3; i++) {
      previewRenderer.render(previewScene, camera);
      renderer.render(scene, camera);
    }
    const secondRendererError = previewRenderer.getContext().getError();
    previewScene.remove(preview); disposeAvatarObject(preview); previewRenderer.dispose();
    const secondRendererDisposals = disposals;

    for (const model of models.slice(0, 10)) { scene.remove(model); disposeAvatarObject(model); }
    const halfwayDisposals = disposals;
    renderer.render(scene, camera);
    const afterRemovalError = renderer.getContext().getError();
    const container = new T.Group();
    models.slice(10).forEach(model => container.add(model));
    disposeAvatarObject(container);
    disposeAvatarObject(container); // parent cleanup is safe after child cleanup
    const finalDisposals = disposals;
    const fresh = createAdultAvatar(0, presetAppearance(0));
    applyAvatarMaterials(fresh, presetAppearance(0), 0, scope); scene.add(fresh);
    renderer.render(scene, camera);
    const afterRecreateError = renderer.getContext().getError();
    scene.remove(fresh); disposeAvatarObject(fresh); disposeAvatarObject(floor);
    renderer.dispose();
    return { sourceMeshes, finishedMeshes, secondRendererError, secondRendererDisposals, materialCount: materials.size, halfwayDisposals, finalDisposals, glError, afterRemovalError, afterRecreateError };
  });
  assert.ok(result.finishedMeshes < result.sourceMeshes * .6, 'Batching reduces draw meshes while retaining articulation');
  assert.ok(result.materialCount <= 6, 'Five surfaces plus double-sided hair shared across all 20 appearances');
  assert.equal(result.secondRendererError, 0, 'The studio and house can use independent renderers');
  assert.equal(result.secondRendererDisposals, 0, 'Disposing one renderer avatar preserves materials in the other');
  assert.equal(result.halfwayDisposals, 0, 'Removing half the visitors preserves shared materials');
  assert.equal(result.finalDisposals, result.materialCount, 'Last owner frees each material exactly once');
  assert.equal(result.glError, 0, '20 avatars render with shadows within GPU buffer limits');
  assert.equal(result.afterRemovalError, 0, 'Remaining avatars render after others leave');
  assert.equal(result.afterRecreateError, 0, 'Pool rebuilds after cleanup');
  assert.deepEqual(errors, [], 'No shader, uniform limit or JavaScript errors');
  console.log('PASS: 20 avatars, six shared TSL material variants, independent renderers, shadows, partial removal and full recreation', result);
} finally { await browser.close(); }
