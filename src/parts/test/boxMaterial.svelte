<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

// Give infromation
informationData.set(`
# Box Material

\`\`\`js
// Materials and Textures
const textureLoader = new THREE.TextureLoader();
const materialWhite = textureLoader.load("assets/materials/matcaps/635D52_A9BCC0_B1AEA0_819598-64px.png");

materials["line"] = new THREE.LineBasicMaterial({ color: parameters.wireColor, transparent: true, opacity: 0.5 });
materials["mesh"] = new THREE.MeshMatcapMaterial({ color: parameters.color, matcap: materialWhite });

// Geometry
geometry = new THREE.BufferGeometry();

group = new THREE.Group();
group.add( new THREE.LineSegments( geometry, materials[0] ) );
group.add( new THREE.Mesh( geometry, materials[1] ) );

generateBox();

scene.add(group);
\`\`\`

And \`generateBox\` function

\`\`\`js
const generateBox = () => {
  group.children.forEach((child: any) => child.geometry.dispose());

  geometry = new THREE.BoxGeometry(
      parameters.width,
      parameters.height,
      parameters.depth,
      parameters.widthSegments,
      parameters.heightSegments,
      parameters.depthSegments);

  (group.children[0] as THREE.LineSegments).geometry = new THREE.WireframeGeometry( geometry );
  (group.children[1] as THREE.Mesh).geometry = geometry;
};
\`\`\`
`);

// Parameters
const parameters = {
  color: 0xffffff,
  wireColor: 0xffffff,
  clearColor: 0xffffff,
  width: 1,
  height: 1,
  depth: 1,
  widthSegments: 1,
  heightSegments: 1,
  depthSegments: 1,
};

// Define
let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;
let geometry: THREE.BufferGeometry;
const materials: Record<string, any> = {};
let group: THREE.Group;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

// Materials and Textures
const textureLoader = new THREE.TextureLoader();
const materialWhite = textureLoader.load("assets/materials/matcaps/635D52_A9BCC0_B1AEA0_819598-64px.png");

materials["line"] = new THREE.LineBasicMaterial({ color: parameters.wireColor, transparent: true, opacity: 0.5 });
materials["mesh"] = new THREE.MeshMatcapMaterial({ color: parameters.color, matcap: materialWhite });

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75);
camera.position.z = 3;
scene.add(camera);

// Axes Helper
const axesHelper = new THREE.AxesHelper(1);
scene.add(axesHelper);

// Geometry
const generateBox = () => {
  group.children.forEach((child: any) => child.geometry.dispose());

  geometry = new THREE.BoxGeometry(
      parameters.width,
      parameters.height,
      parameters.depth,
      parameters.widthSegments,
      parameters.heightSegments,
      parameters.depthSegments);

  (group.children[0] as THREE.LineSegments).geometry = new THREE.WireframeGeometry( geometry );
  (group.children[1] as THREE.Mesh).geometry = geometry;
};

geometry = new THREE.BufferGeometry();

group = new THREE.Group();
group.add( new THREE.LineSegments( geometry, materials["line"] ) );
group.add( new THREE.Mesh( geometry, materials["mesh"] ) );

generateBox();

scene.add(group);

// GUI
const gui = new GUI({ autoPlace: false });

const dimensions = gui.addFolder("dimensions");
dimensions.add(parameters, "height").min(1).max(5).step(0.01).onChange(generateBox);
dimensions.add(parameters, "width").min(1).max(5).step(0.01).onChange(generateBox);
dimensions.add(parameters, "depth").min(1).max(5).step(0.01).onChange(generateBox);
dimensions.add(parameters, "widthSegments").min(1).max(5).step(1).onChange(generateBox);
dimensions.add(parameters, "heightSegments").min(1).max(5).step(1).onChange(generateBox);
dimensions.add(parameters, "depthSegments").min(1).max(5).step(1).onChange(generateBox);

const position = gui.addFolder("positions");
position.add(group.position, "y").min(- 3).max(3).step(0.01);
position.add(group.position, "x").min(- 3).max(3).step(0.01);
position.add(group.position, "z").min(- 3).max(3).step(0.01);

gui.addColor(parameters, "color").onChange((value) => {
  (materials["mesh"] as THREE.MeshMatcapMaterial).color.set(value);
});
gui.addColor(parameters, "wireColor").onChange((value) => {
  (materials["line"] as THREE.LineBasicMaterial).color.set(value);
});
gui.addColor(parameters, "clearColor").onChange((value) => {
  renderer.setClearColor(value);
});

// Dispose
const dispose = () => {
  scene.clear();
  geometry.dispose();
  Object.values(materials).forEach((val) => val.dispose());
  gui.destroy();
  group.clear();
  renderer.dispose();
  controls.dispose();
  renderer.forceContextLoss();
};


// HTML element resize
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(parameters.clearColor);
  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);

  const tick = () => {
    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();
});

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
});

</script>

<div bind:this={debug} class="debug"/>
<canvas class="canvas" bind:this={canvas} tabindex="0"/>
