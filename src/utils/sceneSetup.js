import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();

  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#e3f2fd");
  gradient.addColorStop(0.5, "#ffffff");
  gradient.addColorStop(1, "#f5f5f5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);

  const texture = new THREE.CanvasTexture(canvas);
  scene.background = texture;
  scene.fog = new THREE.Fog(0xffffff, 50, 200);

  return scene;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(-75, 10, 30);
  camera.lookAt(-75, 5, 0);
  return camera;
}

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.6);
  sunLight.position.set(50, 50, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;

  return { ambientLight, sunLight };
}

export function createClouds() {
  const cloudGroup = new THREE.Group();

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const cloudTexture = new THREE.CanvasTexture(canvas);
  const cloudMaterial = new THREE.SpriteMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });

  for (let i = 0; i < 30; i++) {
    const sprite = new THREE.Sprite(cloudMaterial);
    sprite.position.set(
      Math.random() * 200 - 100,
      Math.random() * 30 + 10,
      Math.random() * 100 - 80,
    );
    const scale = Math.random() * 15 + 10;
    sprite.scale.set(scale, scale * 0.6, 1);
    cloudGroup.add(sprite);
  }

  return cloudGroup;
}

export function createTimelineBar() {
  const timelineGroup = new THREE.Group();
  const timelineGeometry = new THREE.BoxGeometry(180, 0.1, 0.1);
  const timelineMaterial = new THREE.MeshStandardMaterial({
    color: 0xbdbdbd,
    metalness: 0.2,
    roughness: 0.8,
  });
  const timelinePath = new THREE.Mesh(timelineGeometry, timelineMaterial);
  timelinePath.position.set(0, 5, 0);
  timelinePath.castShadow = true;
  timelineGroup.add(timelinePath);

  return timelineGroup;
}
