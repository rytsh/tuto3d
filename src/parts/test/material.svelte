<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { debugging, informationData } from "@/store/store";

// Give infromation
informationData.set(`
# Material

https://github.com/nidorx/matcaps  
https://observablehq.com/@makio135/matcaps?ui=classic

\`\`\`js
// Textures
const textureLoader = new THREE.TextureLoader();

const materialMetalic = textureLoader.load("assets/materials/matcaps/3E3E3E_AEAEAE_848484_777777-64px.png");

// Geomerty
geometry = new THREE.BoxGeometry(1, 1, 1);
material = new THREE.MeshMatcapMaterial({ matcap: materialMetalic });
mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// ClearColor
renderer.setClearColor("#ccc", 1);

\`\`\`

`);

let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;

let geometry = null;
let material = null;
let mesh: THREE.Mesh;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

// GUI for debugging
const gui = new GUI({ autoPlace: false });

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75);
camera.position.z = 3;
scene.add(camera);

// Textures
const textureLoader = new THREE.TextureLoader();

const materialMetalic = textureLoader.load("assets/materials/matcaps/3E3E3E_AEAEAE_848484_777777-64px.png");

// Geomerty
geometry = new THREE.BoxGeometry(1, 1, 1);
material = new THREE.MeshMatcapMaterial({ matcap: materialMetalic });
mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const dispose = () => {
  scene.clear();
  geometry.dispose();
  material.dispose();
  gui.destroy();
  renderer.dispose();
  controls.dispose();
  renderer.forceContextLoss();
};

const resize = () => {
  // Update sizes
  if ($debugging.resize) {
    console.log("resize");
  }
  camera.aspect = (canvas.offsetWidth / canvas.offsetHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
};

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      resize();
      // Render
      renderer.render(scene, camera);
    }
  }
});

const tick = () => {
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

onMount(() => {
  debug.appendChild(gui.domElement);

  // Controls
  controls = new OrbitControls(camera, canvas);

  // Render
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor("#ccc", 1);

  resizeObserver.observe(canvas);
  tick();
});

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
});

</script>

<div bind:this={debug} class="debug"/>
<canvas class="canvas" bind:this={canvas} tabindex="0"/>
