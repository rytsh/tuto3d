<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { debugging, informationData } from "@/store/store";
import Stats from "stats.js";

// Give infromation
informationData.set(`
# Galaxy

Particles with some math and random operations.  
I copied this example from threejs journey course.

`);

const stats = new Stats();

let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;

const parameters = {
  count: 1000,
  size: 0.02,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#ff6030",
  outsideColor: "#1b3984",
};

let geometry: THREE.BufferGeometry;
let material: THREE.PointsMaterial;
let points: THREE.Points;
let renderer: THREE.WebGLRenderer;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

let controls = null;

const generateGalaxy = () => {
  // Destroy old galaxy
  if (geometry) {
    geometry.dispose();
    material.dispose();
    scene.remove(points);
  }
  /**
  * Geometry
  */
  geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

    const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  /**
  * Material
  */
  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);
};

const gui = new GUI({ autoPlace: false });

gui.add(parameters, "count").min(100).max(1000000).step(100).onFinishChange(generateGalaxy);
gui.add(parameters, "size").min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy);
gui.add(parameters, "radius").min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy);
gui.add(parameters, "branches").min(2).max(20).step(1).onFinishChange(generateGalaxy);
gui.add(parameters, "spin").min(- 5).max(5).step(0.001).onFinishChange(generateGalaxy);
gui.add(parameters, "randomness").min(0).max(2).step(0.001).onFinishChange(generateGalaxy);
gui.add(parameters, "randomnessPower").min(1).max(10).step(0.001).onFinishChange(generateGalaxy);
gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

gui.close();

const dispose = () => {
  scene.clear();
  geometry.dispose();
  material.dispose();
  scene.clear();
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
  tickInc();
};

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      resize();
    }
  }
});

onMount(() => {
  debug.appendChild( stats.dom );
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75 );

  gui.domElement.style.float = "right";
  debug.appendChild(gui.domElement);

  generateGalaxy();

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  // Camera
  camera.position.z = 3;
  scene.add(camera);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  resizeObserver.observe(canvas);
  // resize();

  // Controls
  controls = new OrbitControls(camera, canvas);

  tick();
});


const tickInc = () => {
  stats.begin();
  // Render
  renderer.render(scene, camera);
  controls.update();

  stats.end();
};

const tick = () => {
  tickInc();
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
