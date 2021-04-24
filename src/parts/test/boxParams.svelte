<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

// Give infromation
informationData.set(`
# Box with Parameters

\`\`\`js
geometry = new THREE.BufferGeometry();
materials[0] = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
materials[1] = new THREE.MeshBasicMaterial({ color: parameters.color });

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

let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;

let geometry: THREE.BufferGeometry;
const materials = [];
let group: THREE.Group;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75);

const gui = new GUI({ autoPlace: false });

const parameters = {
  color: 0xff0000,
  wireColor: 0xffffff,
  width: 1,
  height: 1,
  depth: 1,
  widthSegments: 1,
  heightSegments: 1,
  depthSegments: 1,
};

const dispose = () => {
  scene.clear();
  geometry.dispose();
  materials.forEach((val) => val.dispose());
  gui.destroy();
  group.clear();
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

onMount(() => {
  debug.appendChild(gui.domElement);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  geometry = new THREE.BufferGeometry();
  materials[0] = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
  materials[1] = new THREE.MeshBasicMaterial({ color: parameters.color });

  group = new THREE.Group();
  group.add( new THREE.LineSegments( geometry, materials[0] ) );
  group.add( new THREE.Mesh( geometry, materials[1] ) );

  generateBox();

  scene.add(group);

  // Camera
  camera.position.z = 3;
  scene.add(camera);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);

  /**
 * Axes Helper
 */
  const axesHelper = new THREE.AxesHelper(1);
  scene.add(axesHelper);

  // GUI
  gui.add(materials[1], "wireframe");
  gui.add(parameters, "height").min(1).max(5).step(0.01).onChange(generateBox);
  gui.add(parameters, "width").min(1).max(5).step(0.01).onChange(generateBox);
  gui.add(parameters, "depth").min(1).max(5).step(0.01).onChange(generateBox);
  gui.add(parameters, "widthSegments").min(1).max(5).step(1).onChange(generateBox);
  gui.add(parameters, "heightSegments").min(1).max(5).step(1).onChange(generateBox);
  gui.add(parameters, "depthSegments").min(1).max(5).step(1).onChange(generateBox);

  const position = gui.addFolder("positions");
  position.add(group.position, "y").min(- 3).max(3).step(0.01);
  position.add(group.position, "x").min(- 3).max(3).step(0.01);

  gui.addColor(parameters, "color").onChange(() => {
    materials[1].color.set(parameters.color);
  });
  gui.addColor(parameters, "wireColor").onChange(() => {
    materials[0].color.set(parameters.wireColor);
  });

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
