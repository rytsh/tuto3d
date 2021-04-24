<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sky } from "three/examples/jsm/objects/Sky";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

// Give infromation
informationData.set(`
# Box with Shadows

Lights
\`\`\`js
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

dirLight.shadow.mapSize.width = 256;
dirLight.shadow.mapSize.height = 256;

const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
scene.add( dirLightHelper );
\`\`\`

Change box material to effect from lights
\`\`\`js
materials["mesh"] = new THREE.MeshStandardMaterial({ color: parameters.color, metalness: 0.9, roughness: 0.2 });
\`\`\`

Enable castShadow in box mesh
\`\`\`js
(group.children[0] as THREE.Mesh).castShadow = true;
\`\`\`

Enable receiveShadow in ground plane
\`\`\`js
ground.receiveShadow = true;
\`\`\`

Enable shadow in renderer
\`\`\`js
renderer.shadowMap.enabled = true;
\`\`\`

Fog to scene

\`\`\`js
scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far );
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
// const textureLoader = new THREE.TextureLoader();
// const materialWhite = textureLoader.load("assets/materials/matcaps/635D52_A9BCC0_B1AEA0_819598-64px.png");

// materials["mesh"] = new THREE.MeshMatcapMaterial({ color: parameters.color, matcap: materialWhite });
materials["mesh"] = new THREE.MeshStandardMaterial({ color: parameters.color, metalness: 0.9, roughness: 0.2 });

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color().setHSL( 0.6, 0, 1 );
scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far );

// SKY
const sky = new Sky();
sky.scale.setScalar( 450000 );
scene.add( sky );

const uniforms = sky.material.uniforms;
uniforms["turbidity"].value = parameters.effectController.turbidity;
uniforms["rayleigh"].value = parameters.effectController.rayleigh;
uniforms["mieCoefficient"].value = parameters.effectController.mieCoefficient;
uniforms["mieDirectionalG"].value = parameters.effectController.mieDirectionalG;

const sun = new THREE.Vector3();
const sunChangePos = () => {
  const phi = THREE.MathUtils.degToRad( 90 - parameters.effectController.elevation );
  const theta = THREE.MathUtils.degToRad( parameters.effectController.azimuth );

  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms["sunPosition"].value.copy( sun );
};
sunChangePos();

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

dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;

// const d = 50;

// dirLight.shadow.camera.left = - d;
// dirLight.shadow.camera.right = d;
// dirLight.shadow.camera.top = d;
// dirLight.shadow.camera.bottom = - d;

// dirLight.shadow.camera.far = 3500;
// dirLight.shadow.bias = - 0.0001;

const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 1 );
scene.add( dirLightHelper );

// Camera
const camera = new THREE.PerspectiveCamera(75);
camera.position.z = 3;
camera.position.y = 1;
camera.position.x = 1;
scene.add(camera);

// Axes Helper
const axesHelper = new THREE.AxesHelper(1);
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

// GUI
const gui = new GUI({ autoPlace: false });

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

const skyGui = gui.addFolder("sky");
skyGui.add( parameters.effectController, "turbidity", 0.0, 20.0, 0.1 ).onChange( (value)=> uniforms["turbidity"].value = value );
skyGui.add( parameters.effectController, "rayleigh", 0.0, 4, 0.001 ).onChange( (value)=> uniforms["rayleigh"].value = value );
skyGui.add( parameters.effectController, "mieCoefficient", 0.0, 0.1, 0.001 ).onChange( (value)=> uniforms["mieCoefficient"].value = value );
skyGui.add( parameters.effectController, "mieDirectionalG", 0.0, 1, 0.001 ).onChange( (value)=> uniforms["mieDirectionalG"].value = value );
skyGui.add( parameters.effectController, "elevation", 0, 90, 0.1 ).onChange( sunChangePos );
skyGui.add( parameters.effectController, "azimuth", - 180, 180, 0.1 ).onChange( sunChangePos );
skyGui.add( parameters.effectController, "exposure", 0, 1, 0.0001 ).onChange( (value)=> renderer.toneMappingExposure = value );

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
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = parameters.effectController.exposure;

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
