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
# Scalable objects

We can achieve this with vertex group movement or bones movement.

Vertex group's cannot detecting by gltf so just used bones but use it in small parts not all crane.

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
  lights: {
    hemisphereLightOn: true,
    hemisphereLightColor: 0xffffff,
    hemisphereGroundColor: 0xffffff,
    hemisphereIntensity: 0.5,
    dirLightOn: true,
    dirLightColor: 0xfffbe8,
    dirLightIntensity: 3.2,
  },
  fog: {
    fogColor: 0xdcdcdc,
    near: 1,
    far: 100,
  },
  modelColor: 0xffffff,
};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcccccc );
scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

// Add group
scene.add(group);

// LIGHTS
const hemiLight = new THREE.HemisphereLight( parameters.lights.hemisphereLightColor, parameters.lights.hemisphereGroundColor, parameters.lights.hemisphereIntensity );
hemiLight.position.set( 0, 20, 0 );
hemiLight.name = "threejs-hemi";
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( parameters.lights.dirLightColor, parameters.lights.dirLightIntensity );
dirLight.position.set( - 1, 1.75, 1 );
dirLight.position.multiplyScalar( 20 );
dirLight.name = "threejs-dirLight";
scene.add( dirLight );

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 256;
dirLight.shadow.mapSize.height = 256;

// Loaders
// Draco Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./assets/lib/draco/");

// GLTF Loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Camera
const camera = new THREE.PerspectiveCamera(50);
camera.position.z = 3;
camera.position.y = 5;
camera.position.x = 8;
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

// GUI
const gui = new GUI({ autoPlace: false });
{
  // gui.close();

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


// Objects
const gltfLoadFile = (groupName: string) => (gltf: GLTF) => {
  const model = gltf.scene;

  // SkeletonUtils.clone

  // const model = SkeletonUtils.clone(gltf.scene);

  // model.traverse((val) => {
  //   if ((<any>val).isMesh || (<any>val).isSkinnedMesh) {
  //     (<any>val).material = new THREE.MeshMatcapMaterial( {
  //       matcap: matcapMat,
  //       color: (val.name == "ARMG") ? "red" : undefined,
  //     } );
  //   }

  //   // val.frustumCulled = false;
  // });
  model.traverse((val) => {
    if ((val as any)?.isSkinnedMesh) {
      val.frustumCulled = false;
    }
  });
  // model.position.setY(4);
  // const groupForModel = new THREE.Object3D();
  // groupForModel.name = groupName;

  // groupForModel.add(...model.children);
  group.add(...model.children);

  console.log(group);

  // skeleton helper
  const skeleton = new THREE.SkeletonHelper( group );
  skeleton.visible = true;
  group.add( skeleton );

  // add scalable slider

  parameters.modelColor = ((group.getObjectByName("ARMG") as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHex();
  gui.addColor(parameters, "modelColor").onChange((val) => ((group.getObjectByName("ARMG") as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(val));

  const scale = gui.addFolder("scale");
  scale.open();
  // console.log(group.getObjectByName("BoneX"));

  scale.add(group.getObjectByName("BoneX").position, "x", -100, 100, 1);
  // gui.add(group.getObjectByName("BoneX").position, "y", -10, 10, 1);
  // gui.add(group.getObjectByName("BoneX").position, "z", -10, 10, 1);

  // gui.add(group.getObjectByName("BoneY").position, "x", -10, 10, 1);
  // gui.add(group.getObjectByName("BoneY").position, "y", -10, 10, 1);
  scale.add(group.getObjectByName("BoneY").position, "z", -100, 100, 1);

  // gui.add(group.getObjectByName("BoneZ").position, "x", -10, 10, 1);
  scale.add(group.getObjectByName("BoneZ").position, "y", -100, 100, 1);
  // gui.add(group.getObjectByName("BoneZ").position, "z", -10, 10, 1);

  scale.add(group.getObjectByName("Bone").position, "z", -100, 100, 1);

  const boneTrolleyY = gui.addFolder("BoneTrolleyY");
  // boneTrolleyY.add(group.getObjectByName("BoneTrolleyY").position, "x", -100, 100, 1);
  // boneTrolleyY.add(group.getObjectByName("BoneTrolleyY").position, "y", -100, 100, 1);
  boneTrolleyY.add(group.getObjectByName("BoneTrolleyY").position, "z", -100, 100, 1);

  const boneTrolley = gui.addFolder("TrolleyAxes");
  boneTrolley.add(group.getObjectByName("TrolleyAxes").position, "x", -100, 100, 1);
  boneTrolley.add(group.getObjectByName("TrolleyAxes").position, "y", -100, 100, 1);
  boneTrolley.add(group.getObjectByName("TrolleyAxes").position, "z", -100, 100, 1);

  const boneHoistZ = gui.addFolder("BoneHoistZ");
  boneHoistZ.add(group.getObjectByName("BoneHoistZ").position, "y", -30, 30, 0.1);
  boneHoistZ.add(group.getObjectByName("BoneHoist").position, "y", -30, 30, 0.1).name("BoneHoist");


  const boneHoistMain = gui.addFolder("HoistAxes");
  const boneHoistMainP = boneHoistMain.addFolder("Position");
  boneHoistMainP.add(group.getObjectByName("HoistAxes").position, "x", -100, 100, 1);
  boneHoistMainP.add(group.getObjectByName("HoistAxes").position, "y", -100, 100, 1);
  boneHoistMainP.add(group.getObjectByName("HoistAxes").position, "z", -100, 100, 1);

  const boneHoistMainPH = boneHoistMain.addFolder("HoistPosition");
  boneHoistMainPH.add(group.getObjectByName("Hoist").position, "x", -100, 100, 1);
  boneHoistMainPH.add(group.getObjectByName("Hoist").position, "y", -100, 100, 1);
  boneHoistMainPH.add(group.getObjectByName("Hoist").position, "z", -100, 100, 1);

  const boneHoistMainR = boneHoistMain.addFolder("Rotation");
  boneHoistMainR.add({ x: 0 }, "x", -180, 180, 1).onChange((val) => group.getObjectByName("HoistAxes").rotation.x = THREE.MathUtils.degToRad(val));
  boneHoistMainR.add({ y: 0 }, "y", -180, 180, 1).onChange((val) => group.getObjectByName("HoistAxes").rotation.y = THREE.MathUtils.degToRad(val));
  boneHoistMainR.add({ z: 0 }, "z", -180, 180, 1).onChange((val) => group.getObjectByName("HoistAxes").rotation.z = THREE.MathUtils.degToRad(val));

  const groupGui = gui.addFolder(groupName);
  groupGui.add(group.getObjectByName(groupName).position, "x", -100, 100, 1);
  groupGui.add(group.getObjectByName(groupName).position, "y", -100, 100, 1);
  groupGui.add(group.getObjectByName(groupName).position, "z", -100, 100, 1);
};

gltfLoader.load("./assets/3d/craneRTG.glb", gltfLoadFile("Axes"));

// Raycaster
const raycaster = new THREE.Raycaster();


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
      render();
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

  // Render
  // const clock = new THREE.Clock()

  renderer.setAnimationLoop(render);
});

const render = () => {
  controls.update();

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(group.children, true);
  objectMove = intersects[0]?.object.parent as THREE.Mesh;

  // group.getObjectByName("BoneBox")?.position.setY(Math.sin(clock.getElapsedTime()) * 2 + 5);

  // Render
  renderer.render(scene, camera);
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
