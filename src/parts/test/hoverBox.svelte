<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

// Give infromation
informationData.set(`
# Hover Box

\`\`\`js
// Raycaster
const raycaster = new THREE.Raycaster();

// Mouse
const mouse = new THREE.Vector2(-1, -1);

const catchMouseMove = (e: MouseEvent) => {
  mouse.x = e.clientX - canvas.getBoundingClientRect().left;
  mouse.y = e.clientY - canvas.getBoundingClientRect().top;
  mouse.x = mouse.x / canvas.clientWidth * 2 - 1;
  mouse.y = - (mouse.y / canvas.clientHeight) * 2 + 1;
};

const tick = () => {
    ...

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(group.children);

    for (const intersect of intersects) {
      console.log(intersect);
      const material = (intersect.object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.color.set("#0000ff");
    }
    for (const object of group.children) {
      if (!intersects.find((intersect) => intersect.object === object)) {
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.color.set("#ff0000");
      }
    }
    
    ...


  ...

  canvas.addEventListener("mousemove", catchMouseMove);
  ...
  canvas.removeEventListener("mousemove", catchMouseMove);
\`\`\`
`);

// Define
let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;
let geometry: THREE.BufferGeometry;
const materials: Record<string, any> = {};
let group: THREE.Group;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

// Parameters
const parameters = {
  color: 0xffffff,
  background: 0xffffff,
  width: 1,
  height: 1,
  depth: 1,
  widthSegments: 1,
  heightSegments: 1,
  depthSegments: 1,
  effectController: {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: 0.5,
  },
  lights: {
    hemisphereLightOn: true,
    hemisphereLightColor: 0xffffff,
    hemisphereGroundColor: 0xffffff,
    hemisphereIntensity: 1,
    dirLightOn: true,
    dirLightColor: 0xffffff,
    dirLightIntensity: 6,
  },
  fog: {
    fogColor: 0xdcdcdc,
    near: 1,
    far: 100,
  },
};

// Materials and Textures
materials["mesh"] = new THREE.MeshStandardMaterial({ color: "#ff0000" });

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcccccc );
scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

// LIGHTS
const hemiLight = new THREE.HemisphereLight( parameters.lights.hemisphereLightColor, parameters.lights.hemisphereGroundColor, parameters.lights.hemisphereIntensity );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
scene.add( hemiLightHelper );

//

const dirLight = new THREE.DirectionalLight( parameters.lights.dirLightColor, parameters.lights.dirLightIntensity );
dirLight.position.set( - 1, 1.75, 1 );
dirLight.position.multiplyScalar( 20 );
scene.add( dirLight );


dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 512;
dirLight.shadow.mapSize.height = 512;

dirLight.shadow.radius = 2;

const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
scene.add( dirLightHelper );

// Camera
const camera = new THREE.PerspectiveCamera(75);
camera.position.z = 1;
camera.position.y = 1;
camera.position.x = 1;

scene.add(camera);

// Axes Helper
const axesHelper = new THREE.AxesHelper(1);
axesHelper.visible = false;
scene.add(axesHelper);

// GROUND
const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
groundMat.color.setHSL( 0.095, 1, 0.75 );

const ground = new THREE.Mesh( groundGeo, groundMat );
ground.position.y = 0;
ground.rotation.x = - Math.PI / 2;
ground.receiveShadow = true;
scene.add( ground );

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
  (group.children[0] as THREE.Mesh).geometry = geometry;
  group.position.y = parameters.height / 2;
};

geometry = new THREE.BufferGeometry();

group = new THREE.Group();
group.add( new THREE.Mesh( geometry, materials["mesh"] ) );
(group.children[0] as THREE.Mesh).castShadow = true;

generateBox();

scene.add(group);

// Raycaster
const raycaster = new THREE.Raycaster();

// GUI
const gui = new GUI({ autoPlace: false });
{
  gui.close();

  gui.add(axesHelper, "visible").name("axes helper visible");
  gui.addColor(parameters, "color").onChange(() => {
    (materials["mesh"] as THREE.MeshMatcapMaterial).color.set(parameters.color);
  });
  gui.addColor(parameters, "background").onChange(() => {
    scene.background = new THREE.Color(parameters.background);
  });

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

  const renderGui = gui.addFolder("render");
  renderGui.add( parameters.effectController, "exposure", 0, 1, 0.0001 ).onChange( (value)=> renderer.toneMappingExposure = value );

  const lightsGui = gui.addFolder("lights");
  lightsGui.add(parameters.lights, "dirLightOn").onChange((value) => dirLight.visible = value);
  lightsGui.addColor(parameters.lights, "dirLightColor").onChange((value) => dirLight.color.set(value));
  lightsGui.add(parameters.lights, "dirLightIntensity", 0, 20, 0.01).onChange((value) => dirLight.intensity = value);

  lightsGui.add(parameters.lights, "hemisphereLightOn").onChange((value) => hemiLight.visible = value);
  lightsGui.add(parameters.lights, "hemisphereIntensity", 0, 20, 0.01).onChange((value) => hemiLight.intensity = value);
  lightsGui.addColor(parameters.lights, "hemisphereLightColor").onChange((value) => hemiLight.color.set(value));
  lightsGui.addColor(parameters.lights, "hemisphereGroundColor").onChange((value) => hemiLight.groundColor.set(value));

  const fogGui = gui.addFolder("fog");
  fogGui.addColor(parameters.fog, "fogColor").onChange(() => scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far ));
  fogGui.add(parameters.fog, "far", 0, 500, 1).onChange(() => scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far ));
  fogGui.add(parameters.fog, "near", 0, 500, 1).onChange(() => scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far ));
}

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
};

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      resize();
      tickInc();
    }
  }
});

// Mouse
const mouse = new THREE.Vector2(-1, -1);

const catchMouseMove = (e: MouseEvent) => {
  mouse.x = e.clientX - canvas.getBoundingClientRect().left;
  mouse.y = e.clientY - canvas.getBoundingClientRect().top;
  mouse.x = mouse.x / canvas.clientWidth * 2 - 1;
  mouse.y = - (mouse.y / canvas.clientHeight) * 2 + 1;
};

// MOUNT
onMount(() => {
  debug.appendChild(gui.domElement);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  // console.log(canvas.offsetLeft, canvas.offsetTop, canvas.clientLeft, canvas.clientTop);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = parameters.effectController.exposure;

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  controls.minDistance = 2;
  controls.maxDistance = 10;

  controls.maxPolarAngle = Math.PI / 2 - 0.1;

  canvas.addEventListener("mousemove", catchMouseMove);

  const tick = () => {
    tickInc();

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();
});

const tickInc = () => {
  controls.update();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(group.children);

  for (const intersect of intersects) {
    // console.log(intersect);
    const material = (intersect.object as THREE.Mesh).material as THREE.MeshBasicMaterial;
    material.color.set("#0000ff");
  }
  for (const object of group.children) {
    if (!intersects.find((intersect) => intersect.object === object)) {
      const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.color.set("#ff0000");
    }
  }
  // Render
  renderer.render(scene, camera);
};

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
  canvas.removeEventListener("mousemove", catchMouseMove);
});

</script>

<div bind:this={debug} class="debug">
  <div class="info-mouse">
    <span>ClientX: {mouse.x.toFixed(2)}</span>
    <span>ClientY: {mouse.y.toFixed(2)}</span>
  </div>
</div>
<canvas class="canvas" bind:this={canvas} tabindex="0"/>

<style lang="scss">
.info-mouse {
  color: #000;
  pointer-events: none;

  > span {
    display: block;
  }
}
</style>
