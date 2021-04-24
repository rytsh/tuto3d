<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { debugging, informationData } from "@/store/store";
import Stats from "stats.js";

// Give infromation
informationData.set(`
# Jungle Basic

This example from https://threejs.org/examples/misc_controls_orbit.html

`);

let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;

const stats = new Stats();
let camera; let controls; let scene: THREE.Scene; let renderer: THREE.WebGLRenderer; let geometry; let material;

onMount(() => {
  debug.appendChild( stats.dom );

  resizeObserver.observe(canvas);

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xcccccc );
  scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

  renderer = new THREE.WebGLRenderer( { antialias: true, canvas: canvas } );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  camera = new THREE.PerspectiveCamera( 60 );
  camera.position.set( 400, 200, 0 );

  // controls

  controls = new OrbitControls( camera, canvas );
  controls.listenToKeyEvents( window ); // optional

  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  controls.minDistance = 100;
  controls.maxDistance = 500;

  controls.maxPolarAngle = Math.PI / 2;

  // world

  geometry = new THREE.CylinderGeometry( 0, 10, 30, 4, 1 );
  material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

  for ( let i = 0; i < 500; i ++ ) {
    const mesh = new THREE.Mesh( geometry, material );
    mesh.position.x = Math.random() * 1600 - 800;
    mesh.position.y = 0;
    mesh.position.z = Math.random() * 1600 - 800;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    scene.add( mesh );
  }

  // lights

  const dirLight1 = new THREE.DirectionalLight( 0xffffff );
  dirLight1.position.set( 1, 1, 1 );
  scene.add( dirLight1 );

  const dirLight2 = new THREE.DirectionalLight( 0x002288 );
  dirLight2.position.set( - 1, - 1, - 1 );
  scene.add( dirLight2 );

  const ambientLight = new THREE.AmbientLight( 0x222222 );
  scene.add( ambientLight );

  tick();
});


const dispose = () => {
  // scene.remove(mesh);
  scene.clear();
  geometry.dispose();
  material.dispose();
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
