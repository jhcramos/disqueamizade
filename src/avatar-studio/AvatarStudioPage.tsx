import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WebGLNodesHandler } from 'three/addons/tsl/WebGLNodesHandler.js';
import { createAdultAvatar } from '../garage/adultAvatar';
import { AVATAR_PRESETS } from '../garage/avatarPresets';
import { applyStudioMaterials, disposeStudioObject } from './materials';
import './avatar-studio.css';

type View = 'both' | 'current' | 'tsl';
type Frame = 'body' | 'face';
type StudioControl = { rotate: (angle: number) => void; reset: () => void };

function Comparison({ preset, frame, view }: { preset: number; frame: Frame; view: View }) {
  const mount = useRef<HTMLDivElement>(null);
  const actions = useRef<StudioControl | null>(null);
  const [status, setStatus] = useState('Preparando os materiais…');
  const [error, setError] = useState(false);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    setStatus('Preparando os materiais…');
    setError(false);
    let renderer: T.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let environment: T.WebGLRenderTarget | undefined;
    const scenes: T.Scene[] = [];
    let pending = 0;
    let disposed = false;
    let failed = false;
    const fail = () => {
      failed = true;
      setError(true);
      setStatus('Não foi possível abrir o estúdio 3D neste aparelho. Tente recarregar a página.');
    };
    const cleanup = () => {
      disposed = true;
      cancelAnimationFrame(pending);
      observer?.disconnect();
      controls?.dispose();
      actions.current = null;
      scenes.forEach(disposeStudioObject);
      environment?.dispose();
      if (renderer) {
        renderer.domElement.removeEventListener('webglcontextlost', fail);
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setNodesHandler(new WebGLNodesHandler());
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.debug.onShaderError = fail;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.domElement.setAttribute('aria-label', 'Comparação 3D dos materiais do avatar. Arraste para girar os dois personagens.');
      renderer.domElement.addEventListener('webglcontextlost', fail);
      element.appendChild(renderer.domElement);
      const generator = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = generator.fromScene(room, .04);
      room.dispose();
      generator.dispose();
      const look = AVATAR_PRESETS[preset].appearance;
      for (let index = 0; index < 2; index++) {
        const scene = new T.Scene();
        scenes.push(scene);
        scene.background = new T.Color('#f2f0ed');
        scene.environment = environment.texture;
        scene.environmentIntensity = .6;
        scene.add(new T.HemisphereLight('#fff4e4', '#94745d', 1.25));
        const key = new T.DirectionalLight('#fff0db', 3.2);
        key.position.set(-3, 5, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(512, 512);
        key.shadow.camera.left = key.shadow.camera.bottom = -2;
        key.shadow.camera.right = key.shadow.camera.top = 2;
        key.shadow.normalBias = .025;
        scene.add(key);
        const fill = new T.DirectionalLight('#e4efff', 1.4);
        fill.position.set(3, 2, -2);
        scene.add(fill);
        const avatar = createAdultAvatar(preset, look);
        if (index === 1) applyStudioMaterials(avatar, look);
        avatar.traverse(object => { if (object instanceof T.Mesh) object.castShadow = true; });
        const bounds = new T.Box3().setFromObject(avatar);
        avatar.position.y = -bounds.min.y + .055;
        scene.add(avatar);
        const floor = new T.Mesh(new T.CircleGeometry(200, 48), new T.MeshStandardMaterial({ color: '#eee5d7', roughness: 1 }));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        const plinth = new T.Mesh(new T.CylinderGeometry(.7, .72, .05, 64), new T.MeshStandardMaterial({ color: '#dfd1bc', roughness: .9 }));
        plinth.position.y = .025;
        plinth.receiveShadow = true;
        scene.add(plinth);
      }
      const camera = new T.PerspectiveCamera(36, 1, .05, 500);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = false;
      controls.minPolarAngle = Math.PI * .2;
      controls.maxPolarAngle = Math.PI * .53;
      controls.minDistance = frame === 'face' ? 1.35 : 2.5;
      controls.maxDistance = 7;
      const reset = () => {
        controls!.target.set(0, frame === 'face' ? 1.72 : 1.1, 0);
        camera.position.set(frame === 'face' ? .65 : 1.55, frame === 'face' ? 1.9 : 1.65, frame === 'face' ? 2.05 : 4.55);
        controls!.update();
      };
      reset();
      let width = 1, height = 1;
      const draw = () => {
        pending = 0;
        if (disposed || failed || !renderer) return;
        try {
          const count = view === 'both' ? 2 : 1;
          const viewportWidth = width / count;
          camera.aspect = viewportWidth / height;
          camera.updateProjectionMatrix();
          renderer.setScissorTest(true);
          for (let i = 0; i < count; i++) {
            renderer.setViewport(i * viewportWidth, 0, viewportWidth, height);
            renderer.setScissor(i * viewportWidth, 0, viewportWidth, height);
            renderer.render(scenes[view === 'tsl' ? 1 : i], camera);
          }
          if (!failed) setStatus('');
        } catch { fail(); }
      };
      const schedule = () => { if (!pending && !disposed) pending = requestAnimationFrame(draw); };
      controls.addEventListener('change', schedule);
      actions.current = {
        reset: () => { reset(); schedule(); },
        rotate: angle => {
          const offset = camera.position.clone().sub(controls!.target);
          offset.applyAxisAngle(new T.Vector3(0, 1, 0), angle);
          camera.position.copy(controls!.target).add(offset);
          controls!.update();
          schedule();
        },
      };
      observer = new ResizeObserver(() => {
        width = element.clientWidth;
        height = element.clientHeight;
        renderer!.setSize(width, height);
        schedule();
      });
      observer.observe(element);
    } catch { fail(); }
    return cleanup;
  }, [preset, frame, view]);

  return <>
    <div className={`as-stage as-stage-${view}`}>
      <div ref={mount} className="as-canvas" />
      {view !== 'tsl' && <div className="as-label as-label-left"><span>01 / ORIGINAL</span><strong>Como está hoje</strong></div>}
      {view !== 'current' && <div className={`as-label ${view === 'both' ? 'as-label-right' : 'as-label-left'}`}><span>02 / EXPERIMENTO TSL</span><strong>Um novo acabamento</strong></div>}
      {view === 'both' && <div className="as-divider" />}
      {status && <div className={`as-status ${error ? 'as-error' : ''}`} role={error ? 'alert' : 'status'}>{status}</div>}
    </div>
      <div className="as-rotate"><button aria-label="Girar para a esquerda" onClick={() => actions.current?.rotate(-.35)}>↶</button><span>Arraste para girar</span><button aria-label="Girar para a direita" onClick={() => actions.current?.rotate(.35)}>↷</button><button onClick={() => actions.current?.reset()}>Reiniciar vista</button></div>
  </>;
}

export default function AvatarStudioPage() {
  const [preset, setPreset] = useState(0);
  const [frame, setFrame] = useState<Frame>('body');
  const [view, setView] = useState<View>('both');
  return <main className="avatar-studio">
    <header className="as-header"><Link to="/">disque amizade<span> / estúdio</span></Link><Link to="/garagem">Voltar à casa ↗</Link></header>
    <section className="as-intro"><div><p className="as-eyebrow">BLOCO POP · ESTUDO DE MATERIAIS</p><h1>O mesmo jeito.<br/><em>Um novo toque.</em></h1></div><p>Nosso personagem, visto de perto. <br/>Compare o acabamento atual com pele fosca, reflexos no cabelo e a textura sutil das roupas.</p></section>
    <section className="as-comparison" aria-label="Estúdio de comparação de avatares">
      <div className="as-toolbar"><div className="as-presets" aria-label="Escolha o personagem">{[0, 5, 1].map(index => <button key={index} aria-pressed={preset === index} onClick={() => setPreset(index)}>{AVATAR_PRESETS[index].name.split(' · ')[0]}</button>)}</div><div className="as-framing" aria-label="Enquadramento"><button aria-pressed={frame === 'body'} onClick={() => setFrame('body')}>Corpo inteiro</button><button aria-pressed={frame === 'face'} onClick={() => setFrame('face')}>Ver o rosto</button></div></div>
      <Comparison preset={preset} frame={frame} view={view}/>
      <div className="as-bottom"><p>Mesma forma, pose e iluminação. Apenas os materiais mudam.</p><div className="as-views" aria-label="Modo de comparação">{([['both', 'Lado a lado'], ['current', 'Original'], ['tsl', 'Novo']] as const).map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div></div>
    </section>
    <section className="as-notes"><article><span>01</span><h2>Pele com suavidade</h2><p>Acabamento fosco e reflexos controlados, preservando os tons de cada personagem.</p></article><article><span>02</span><h2>Cabelo com volume</h2><p>A luz destaca as mechas que já existem no modelo. O corte continua o mesmo.</p></article><article><span>03</span><h2>Roupa com textura</h2><p>Uma trama discreta na superfície e um brilho diferente do cabelo e dos olhos.</p></article></section>
    <footer className="as-footer">Prévia experimental em 3D real. O visual da casa ainda não foi alterado. O desempenho em celulares precisa ser avaliado antes da adoção.</footer>
  </main>;
}
