<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

// Give infromation
informationData.set(`
# Box

\`\`\`js
geometry = new THREE.BoxGeometry(1, 1, 1);
material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
mesh = new THREE.Mesh(geometry, material);
\`\`\`

`);

let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;

let geometry = null;
let material = null;
let mesh: THREE.Mesh;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75);

const gui = new GUI({ autoPlace: false });

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
  // Render
  renderer.render(scene, camera);
};

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      resize();
    }
  }
});

onMount(() => {
  debug.appendChild(gui.domElement);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  geometry = new THREE.BoxGeometry(10, 12, 5);
  material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Camera
  camera.position.z = 15;
  // scene.add(camera);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.listenToKeyEvents(canvas);

  tick();
});

const tick = () => {
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
});

</script>

<div bind:this={debug} class="debug"/>
<canvas class="canvas" bind:this={canvas} tabindex="0"/>
