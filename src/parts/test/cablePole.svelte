<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData } from "@/store/store";

import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

// Give infromation
informationData.set(`
# Cable Pole

Exported just with normals and skinned in animation tab also compressions.
`);

// Define
let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;
// const materials: Array<THREE.MeshPhongMaterial> = [];
const group = new THREE.Group();
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

// Click events
let objectClicked: THREE.Mesh;
let objectClickedColor: string;
let objectMove: THREE.Mesh;
let rMenu: HTMLDivElement;

// TransformControls
let transformControl: TransformControls;

const material = new Map();

// Parameters
const parameters = {
  color: 0xffffff,
  background: 0xffffff,
  effectController: {
    exposure: 0.5,
  },
  fog: {
    fogColor: 0xdcdcdc,
    near: 1,
    far: 100,
  },
};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcccccc );
scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

// Loaders
// Draco Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./assets/lib/draco/");

// GLTF Loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Camera
const camera = new THREE.PerspectiveCamera(75);
camera.position.z = 1;
camera.position.y = 1.5;
camera.position.x = 2;
camera.position.multiplyScalar(5);

scene.add(camera);

// Materials and Textures
const textureLoader = new THREE.TextureLoader();
const matcapMat = textureLoader.load("assets/materials/matcaps/3E3E3E_AEAEAE_848484_777777-64px.png");
material.set("matcap", new THREE.MeshMatcapMaterial( { matcap: matcapMat } ));
material.set("basic", new THREE.MeshBasicMaterial( { color: 0xffffff } ));

// GROUND
const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );

const ground = new THREE.Mesh( groundGeo, material.get("basic") );
ground.position.y = 0;
ground.rotation.x = - Math.PI / 2;
ground.receiveShadow = true;
scene.add( ground );

// Objects
const gltfLoadFile = (gltf: GLTF) => {
  const model = gltf.scene;

  model.traverse((val) => {
    if ((<any>val).isMesh || (<any>val).isSkinnedMesh) {
      (<any>val).material = new THREE.MeshMatcapMaterial( {
        matcap: matcapMat,
      } );
    }

    val.frustumCulled = false;
  });
  model.position.setY(4);
  group.add(model);
  scene.add(group);

  // skeleton helper
  const skeleton = new THREE.SkeletonHelper( model );
  skeleton.visible = true;
  group.add( skeleton );
};

gltfLoader.load("./assets/3d/boneBox.glb", gltfLoadFile);

// Raycaster
const raycaster = new THREE.Raycaster();

// GUI
const gui = new GUI({ autoPlace: false });
{
  gui.close();

  gui.addColor(parameters, "background").onChange(() => {
    scene.background = new THREE.Color(parameters.background);
  });

  const renderGui = gui.addFolder("render");
  renderGui.add( parameters.effectController, "exposure", 0, 1, 0.0001 ).onChange( (value)=> renderer.toneMappingExposure = value );

  const fogGui = gui.addFolder("fog");
  fogGui.addColor(parameters.fog, "fogColor").onChange(() => scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far ));
  fogGui.add(parameters.fog, "far", 0, 500, 1).onChange(() => scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far ));
  fogGui.add(parameters.fog, "near", 0, 500, 1).onChange(() => scene.fog = new THREE.Fog( parameters.fog.fogColor, parameters.fog.near, parameters.fog.far ));
}

// HTML element resize
const resize = () => {
  camera.aspect = (canvas.offsetWidth / canvas.offsetHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
};

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      resize();
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
  if (objectMove) {
    objectClickedColor = "#" + (objectClicked.material as THREE.MeshMatcapMaterial).color.getHexString();
  }
  // Check Menu size
  let checkH = (canvas.getBoundingClientRect().height - mouseR.y) - rMenu.getBoundingClientRect().height;
  checkH = checkH >= 0 ? 0 : checkH;
  let checkW = (canvas.getBoundingClientRect().width - mouseR.x) - rMenu.getBoundingClientRect().width;
  checkW = checkW >= 0 ? 0 : checkW;
  rMenu.style.left = `${mouseR.x + checkW}px`;
  rMenu.style.top = `${mouseR.y + checkH}px`;
  rMenu.classList.remove("nvisible");
};

const onDownPosition = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();

const catchMouseClick = (e: MouseEvent) => {
  const objectnow = objectMove;

  onDownPosition.x = e.clientX;
  onDownPosition.y = e.clientY;

  if ((e.button - 2) < 0) {
    if (!rMenu.classList.contains("nvisible")) {
      rMenu.classList.add("nvisible");
    }
  }

  if (e.button == 0) {
    if ( objectnow && objectnow !== transformControl.object ) {
      transformControl.attach(objectnow);
    }
  }
};

const catchMouseClickUp = (e: MouseEvent) => {
  onUpPosition.x = e.clientX;
  onUpPosition.y = e.clientY;

  if (onDownPosition.distanceTo( onUpPosition ) === 0 && !objectMove ) transformControl.detach();
};

// Change color
const colorChange = (color: string) => {
  if (objectClicked) {
    (objectClicked.material as THREE.MeshMatcapMaterial).color.setStyle(color);
  }
};

// Call every color change
$: {
  colorChange(objectClickedColor);
}

// Dispose
const dispose = () => {
  scene.clear();
  // geometry.dispose();
  material.forEach((v)=> v.dispose());
  gui.destroy();
  group.clear();
  renderer.dispose();
  controls.dispose();
  transformControl.dispose();
  renderer.forceContextLoss();
};


// MOUNT
onMount(() => {
  debug.appendChild(gui.domElement);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.BasicShadowMap;
  // renderer.outputEncoding = THREE.sRGBEncoding;
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // renderer.toneMappingExposure = parameters.effectController.exposure;

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  // controls.minDistance = 2;
  // controls.maxDistance = 10;

  controls.maxPolarAngle = Math.PI / 2 - 0.1;

  // Transform Control
  transformControl = new TransformControls( camera, renderer.domElement );
  transformControl.addEventListener( "dragging-changed", (event) => {
    controls.enabled = ! event.value;
  });
  scene.add( transformControl );

  canvas.addEventListener("pointermove", catchMouseMove);
  canvas.addEventListener("contextmenu", catchMouseRClick);
  canvas.addEventListener("pointerdown", catchMouseClick);
  canvas.addEventListener("pointerup", catchMouseClickUp);

  // Tick
  const clock = new THREE.Clock();

  const tick = () => {
    controls.update();

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(group.children, true);
    objectMove = intersects[0]?.object.parent as THREE.Mesh;

    group.getObjectByName("BoneBox")?.position.setY(Math.sin(clock.getElapsedTime()) * 2 + 5);

    // Render
    renderer.render(scene, camera);
  };

  renderer.setAnimationLoop(tick);
});

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
<div class="wrapper">
  <div class="rmenu nvisible" bind:this={rMenu}>
    {#if objectClicked}
    <span>{objectClicked.name}</span>
    <label for="head">Head</label>
    <input type="color" id="head" name="head" bind:value={objectClickedColor}>
    {:else}
      <span>Nothing here</span>
    {/if}
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

.wrapper {
  height: 100%;
  overflow: auto;
  position: relative;
  width: 100%;
}
</style>
