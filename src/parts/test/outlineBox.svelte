<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

// Give infromation
informationData.set(`
# Hover Box with outline

This example uses same algorithm with 
https://threejs.org/examples/webgl_postprocessing_outline.html

For using black color select __NormalBlending__
`);

// Define
let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;
let geometry: THREE.BufferGeometry;
const materials: Array<THREE.MeshStandardMaterial> = [];
let group: THREE.Group;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

// Click events
let objectClicked: THREE.Mesh;
let objectClickedColor: string;
let objectMove: THREE.Mesh;
let rMenu: HTMLDivElement;

// Post Processing
let composer: EffectComposer;
let outlinePass: OutlinePass;

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
  outline: {
    edgeStrength: 3.0,
    edgeGlow: 0.0,
    edgeThickness: 1.0,
    pulsePeriod: 0,
    rotate: false,
    usePatternTexture: true,
    visibleEdgeColor: "#ffffff",
    hiddenEdgeColor: "#190a05",
    blending: "AdditiveBlending",
  },
};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcccccc );
scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

// Materials and textures
const textureLoader = new THREE.TextureLoader();

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
camera.position.z = -5;
camera.position.y = 10;
camera.position.x = 8;

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
  group.clear();
  geometry = new THREE.BoxGeometry(
      parameters.width,
      parameters.height,
      parameters.depth,
      parameters.widthSegments,
      parameters.heightSegments,
      parameters.depthSegments);

  for (let i = -5; i < 5; i++) {
    materials[i] = new THREE.MeshStandardMaterial({ color: "#ff0000" });
    const mesh = new THREE.Mesh( geometry, materials[i] );
    mesh.name = `Box ${i}`;
    mesh.castShadow = true;
    mesh.position.z -= i * 2;
    mesh.position.y = parameters.height / 2;
    group.add(mesh);
  }
};

group = new THREE.Group();

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

  // outline
  gui.add(parameters.outline, "edgeStrength", 0.01, 10 ).onChange((value)=> outlinePass.edgeStrength = Number( value ));
  gui.add(parameters.outline, "edgeGlow", 0.0, 1 ).onChange((value)=> outlinePass.edgeGlow = Number( value ));
  gui.add(parameters.outline, "edgeThickness", 1, 4 ).onChange((value) => outlinePass.edgeThickness = Number( value ));
  gui.add(parameters.outline, "pulsePeriod", 0.0, 5 ).onChange((value) => outlinePass.pulsePeriod = Number( value ));
  gui.add(parameters.outline, "usePatternTexture" ).onChange((value) => outlinePass.usePatternTexture = value);
  gui.addColor(parameters.outline, "visibleEdgeColor" ).onChange((value) => outlinePass.visibleEdgeColor.set(value));
  gui.addColor(parameters.outline, "hiddenEdgeColor" ).onChange((value) => outlinePass.hiddenEdgeColor.set(value));

  gui.add(parameters.outline, "blending", [
    "AdditiveBlending",
    "SubtractiveBlending",
    "NormalBlending",
    "NoBlending",
  ]).onChange((value: string) => {
    outlinePass.overlayMaterial.blending = THREE[value];
  });
}

// HTML element resize
const resize = () => {
  // Update sizes
  if ($debugging.resize) {
    console.log("resize");
  }
  camera.aspect = (canvas.offsetWidth / canvas.offsetHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  composer.setSize(canvas.offsetWidth, canvas.offsetHeight);
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
const mouseR = new THREE.Vector2(-1, -1);

const catchMouseMove = (e: MouseEvent) => {
  mouseR.x = e.clientX - canvas.getBoundingClientRect().left;
  mouseR.y = e.clientY - canvas.getBoundingClientRect().top;
  mouse.x = mouseR.x / canvas.clientWidth * 2 - 1;
  mouse.y = - (mouseR.y / canvas.clientHeight) * 2 + 1;
};

// Catch Mouse Click
const catchMouseRClick = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
  objectClicked = objectMove;
  console.log(e.button, objectClicked);
  if (objectMove) {
    objectClickedColor = "#" + (objectClicked.material as THREE.MeshStandardMaterial).color.getHexString();
  }
  rMenu.classList.remove("nvisible");
  rMenu.style.left = `${mouseR.x}px`;
  rMenu.style.top = `${mouseR.y}px`;
};

const catchMouseClick = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
  console.log("Mouse clicked", e.button);
  if ((e.button - 2) < 0) {
    if (!rMenu.classList.contains("nvisible")) {
      rMenu.classList.add("nvisible");
    }
  }
};

// Change color
const colorChange = (color: string) => {
  if (objectClicked) {
    (objectClicked.material as THREE.MeshStandardMaterial).color.setStyle(color);
  }
};

// Call every color change
$: {
  colorChange(objectClickedColor);
}

// Materials
// const outlineMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );

// let outLine: THREE.Mesh;
// let recordPrev: THREE.Mesh;
// const dashedBox = (objectX: THREE.Mesh) => {
//   if (objectX == recordPrev) {
//     return;
//   }
//   recordPrev = objectX;

//   console.log("runn");
//   if (objectX) {
//     outLine = new THREE.Mesh( objectX.geometry, outlineMaterial);
//     outLine.name = "Outline";
//     outLine.position.set(objectX.position.x, objectX.position.y, objectX.position.z);
//     outLine.scale.multiplyScalar(1.05);
//     scene.add(outLine);
//   } else {
//     scene.remove(outLine);
//   }
// };

let recordPrev: THREE.Mesh;
const outlineMesh = (objectX: THREE.Mesh) => {
  if (objectX == recordPrev) {
    return;
  }
  recordPrev = objectX;

  console.log("runn");
  outlinePass.selectedObjects = recordPrev ? [recordPrev] : [];
};

$: {
  outlineMesh(objectMove);
}

// Dispose
const dispose = () => {
  scene.clear();
  geometry.dispose();
  materials.forEach((val) => val.dispose());
  // outlineMaterial.dispose();
  gui.destroy();
  group.clear();
  renderer.dispose();
  outlinePass.dispose();
  controls.dispose();
  renderer.forceContextLoss();
};


// MOUNT
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
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  controls.minDistance = 2;
  controls.maxDistance = 10;

  controls.maxPolarAngle = Math.PI / 2 - 0.1;

  canvas.addEventListener("pointermove", catchMouseMove);
  canvas.addEventListener("contextmenu", catchMouseRClick);
  canvas.addEventListener("pointerdown", catchMouseClick);

  // Outline Postprocessing
  composer = new EffectComposer( renderer );

  const renderPass = new RenderPass( scene, camera );
  composer.addPass( renderPass );

  const wh = canvas.getBoundingClientRect();
  outlinePass = new OutlinePass( new THREE.Vector2( wh.width, wh.height ), scene, camera );
  composer.addPass( outlinePass );

  textureLoader.load("assets/materials/textures/tri_pattern.jpg", (texture) => {
    outlinePass.patternTexture = texture;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    outlinePass.usePatternTexture = parameters.outline.usePatternTexture;
  });

  // outlinePass.edgeDetectionMaterial.onBeforeCompile = (shader) => {
  //   shader.fragmentShader = shader.fragmentShader.replace(
  //       "gl_FragColor = vec4(edgeColor, 1.0) * vec4(d);",
  //       "gl_FragColor = vec4(vec3(0.0, 0.0, 0.0), 1.0) * vec4(d);"
  //   );
  // };

  // revert white to black

  // Tick
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
  objectMove = intersects[0]?.object as THREE.Mesh;

  // Render
  composer.render();
};

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
  canvas.removeEventListener("pointermove", catchMouseMove);
});

</script>

<div bind:this={debug} class="debug">
  <div class="info-mouse">
    <span>ClientX: {mouse.x.toFixed(2)}</span>
    <span>ClientY: {mouse.y.toFixed(2)}</span>
  </div>
</div>
<div class="rmenu nvisible" bind:this={rMenu}>
  {#if objectClicked}
  <span>{objectClicked.name}</span>
  <label for="head">Head</label>
  <input type="color" id="head" name="head" bind:value={objectClickedColor}>
  {:else}
    <span>Nothing here</span>
  {/if}
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

.rmenu {
  background-color: var(--white);
  border: 1px solid var(--black);
  display: block;
  padding: 10px;
  position: absolute;
  z-index: 1;

  label {
    display: inline;
  }

  > span {
    display: block;
  }
}
</style>
