<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

// Give infromation
informationData.set(`
# Bone

Bone example from https://threejs.org/docs/scenes/bones-browser.html

This is usable in cable systems.

`);

let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;

const geometry = new Map();
const material = new Map();
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcccccc );
const camera = new THREE.PerspectiveCamera(75);

const gui = new GUI({ autoPlace: false });

const dispose = () => {
  scene.clear();
  geometry.forEach((v)=> v.dispose());
  material.forEach((v)=> v.dispose());
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
      render();
    }
  }
});

onMount(() => {
  debug.appendChild(gui.domElement);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  initBones();

  // Camera
  camera.position.z = 50;
  camera.position.x = 0;
  camera.position.y = 0;
  scene.add(camera);

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);

  renderer.setAnimationLoop(render);
});

const clock = new THREE.Clock();
const render = () => {
  const elapsedTime = clock.getElapsedTime();
  const val = Math.sin(elapsedTime) * 20;
  (mesh.skeleton.bones[1].position as THREE.Vector3).setY(val);
  // Render
  renderer.render(scene, camera);
};

let mesh;
let bones;
let skeletonHelper;

const createGeometry = ( sizing ) => {
  const geometry = new THREE.CylinderGeometry(
      5, // radiusTop
      5, // radiusBottom
      sizing.height, // height
      6, // radiusSegments
      sizing.segmentCount * 3, // heightSegments
      true // openEnded
  );

  const position = geometry.attributes.position;

  const vertex = new THREE.Vector3();

  const skinIndices = [];
  const skinWeights = [];

  for ( let i = 0; i < position.count; i ++ ) {
    vertex.fromBufferAttribute( position, i );

    const y = ( vertex.y + sizing.halfHeight );

    const skinIndex = Math.floor( y / sizing.segmentHeight );
    const skinWeight = ( y % sizing.segmentHeight ) / sizing.segmentHeight;

    skinIndices.push( skinIndex, skinIndex + 1, 0, 0 );
    skinWeights.push( 1 - skinWeight, skinWeight, 0, 0 );
  }

  geometry.setAttribute( "skinIndex", new THREE.Uint16BufferAttribute( skinIndices, 4 ) );
  geometry.setAttribute( "skinWeight", new THREE.Float32BufferAttribute( skinWeights, 4 ) );

  return geometry;
};

const createBones = ( sizing ) => {
  bones = [];

  let prevBone = new THREE.Bone();
  bones.push( prevBone );
  prevBone.position.y = - sizing.halfHeight;

  for ( let i = 0; i < sizing.segmentCount; i ++ ) {
    const bone = new THREE.Bone();
    bone.position.y = sizing.segmentHeight;
    bones.push( bone );
    prevBone.add( bone );
    prevBone = bone;
  }

  return bones;
};

const createMesh = ( geometry, bones ) => {
  const material = new THREE.MeshBasicMaterial( {
    color: 0x156289,
    side: THREE.DoubleSide,
  } );

  const mesh = new THREE.SkinnedMesh( geometry, material );
  const skeleton = new THREE.Skeleton( bones );

  mesh.add( bones[0] );

  mesh.bind( skeleton );

  skeletonHelper = new THREE.SkeletonHelper( mesh );
  skeletonHelper.material.linewidth = 2;
  scene.add( skeletonHelper );

  return mesh;
};

const initBones = () => {
  const segmentHeight = 80;
  const segmentCount = 1;
  const height = segmentHeight * segmentCount;
  const halfHeight = height * 0.5;

  const sizing = {
    segmentHeight: segmentHeight,
    segmentCount: segmentCount,
    height: height,
    halfHeight: halfHeight,
  };

  const geometry = createGeometry( sizing );
  const bones = createBones( sizing );
  mesh = createMesh( geometry, bones );

  mesh.scale.multiplyScalar( 1 );
  mesh.position.setY(sizing.halfHeight);
  scene.add( mesh );
};

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
});

</script>

<div bind:this={debug} class="debug"/>
<canvas class="canvas" bind:this={canvas} tabindex="0"/>
