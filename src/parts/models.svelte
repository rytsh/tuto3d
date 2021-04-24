<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";
import { models } from "@/helper/modelList";
import DragDrop from "@/components/dragdrop.svelte";
import Stats from "stats.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module";

import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import { ViewHelper } from "@/helper/objects/viewHelper";
import { countObjects } from "@/helper/objects/count";

// Give infromation
informationData.set(`
# Models

Use own models to see how is looking.

Shortcuts

\`\`\`
f: look to selected object
s: console log scene
l: console log selected
del: delete selected
w, e, r: transform control change
p: parent select one by one
+, -: transform size
q: transform world/local
shift: snap
spacebar: enable-disable transform
c: change camera type Perspective/OrthographicCamera
\`\`\`
`);

// Model page parameters
// const modelURL = "";
let modelsDiv: HTMLDivElement;
let rMenu: HTMLDivElement;

const statGroup = {
  objects: 0,
  vertices: 0,
  triangles: 0,
  frametime: 0,
};

const stats = new Stats();

// THREEJS START
// Define
let debug: HTMLDivElement;
let canvas: HTMLCanvasElement;
let show: HTMLDivElement;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

// TransformControls
let transformControl: TransformControls;
let snapControl = false;

// Raycaster
const raycaster = new THREE.Raycaster();
let objectMove: THREE.Object3D;
let objectClickedParent: THREE.Object3D;
let objectClickedColor: string;

// Parameters
const parameters = {
  background: 0xcccccc,
  effectController: {
    exposure: 0.5,
    toneMapping: "ACESFilmicToneMapping",
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
  config: {
    parentSelect: false,
  },
};

// LOADERS
// Texture Loader
// const textureLoader = new THREE.TextureLoader();

// Draco Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./assets/lib/draco/");

// GLTF Loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
// gltfLoader.setMeshoptDecoder(MeshoptDecoder);

// Enable Cache
THREE.Cache.enabled = true;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcccccc );
scene.fog = new THREE.FogExp2( parameters.fog.fogColor, 0.001 );

// Group
const group = new THREE.Group();
group.name = "extra";
scene.add(group);

// LIGHTS
const hemiLight = new THREE.HemisphereLight( parameters.lights.hemisphereLightColor, parameters.lights.hemisphereGroundColor, parameters.lights.hemisphereIntensity );
hemiLight.position.set( 0, 20, 0 );
hemiLight.name = "threejs-hemi";
scene.add( hemiLight );

const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
hemiLightHelper.name = "threejs-hemiHelper";
scene.add( hemiLightHelper );

// Ambient Light
// const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
// ambientLight.position.set( 0, 20, 0 );
// scene.add( ambientLight );


const dirLight = new THREE.DirectionalLight( parameters.lights.dirLightColor, parameters.lights.dirLightIntensity );
dirLight.position.set( - 1, 1.75, 1 );
dirLight.position.multiplyScalar( 20 );
dirLight.name = "threejs-dirLight";
scene.add( dirLight );

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 256;
dirLight.shadow.mapSize.height = 256;

const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
dirLightHelper.name = "threejs-dirLightHelper";
scene.add( dirLightHelper );

// Camera
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

const cameraP = new THREE.PerspectiveCamera(75, 1, 0.01, 2000);
const cameraOrtho = new THREE.OrthographicCamera(0, 0, 5, -5);

camera = cameraP;
camera.position.z = 5;
camera.position.y = 5;
camera.position.x = 5;


// Axes Helper
const axesHelper = new THREE.AxesHelper(1);
axesHelper.visible = false;
axesHelper.name = "threejs-axesHelper";
scene.add(axesHelper);

// GRID HELPER
const size = 5;
const divisions = 10;

const gridHelper = new THREE.GridHelper( size, divisions );
gridHelper.name = "threejs-gridHelper";
scene.add( gridHelper );

// GUI
const gui = new GUI({ autoPlace: false, closeOnTop: true });
gui.close();

gui.add(axesHelper, "visible").name("axes helper visible");
gui.addColor(parameters, "background").onChange(() => {
  scene.background = new THREE.Color(parameters.background);
});

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

gui.add(parameters.effectController, "toneMapping", [
  "ACESFilmicToneMapping",
  "NoToneMapping",
  "LinearToneMapping",
  "ReinhardToneMapping",
  "CineonToneMapping",
]).onChange((value: string) => {
  renderer.toneMapping = THREE[value];
});
// LOADER
const gltfLoadFile = (gltf: GLTF) => {
  const model = gltf.scene;
  group.add(model);
  scene.add(group);

  // cast shadow
  // TODO add transparent shadow plane
  // model.traverse(( object ) => {
  //   if ( (object as any).isMesh ) object.castShadow = true;
  // } );

  // skeleton helper
  const skeleton = new THREE.SkeletonHelper( model );
  skeleton.visible = true;
  group.add( skeleton );
  countGroup();
};

const fileHandle = (event) => {
  const modelFile = event.detail.file;
  gltfLoader.parse(modelFile, undefined, gltfLoadFile);
};


const showModel = (modelFile: string) => {
  gltfLoader.load(modelFile, gltfLoadFile);
};

const catchLink = (e) => {
  const modelFile = (e.target as HTMLSpanElement).dataset.loc;
  if (modelFile) {
    showModel(modelFile);
  }
};

// Count items
const countGroup = () => {
  [statGroup.objects, statGroup.vertices, statGroup.triangles] = countObjects(group);
};

// Rmenu
const rMenuView = (v: boolean) => {
  if (v) {
    rMenu.classList.remove("nvisible");
  } else {
    if (!rMenu.classList.contains("nvisible")) {
      rMenu.classList.add("nvisible");
    }
  }
};

// TransformControlView
const boxHelper = new THREE.BoxHelper(undefined, 0xffff00);
(<any>boxHelper.material).depthTest = false;
boxHelper.visible = false;
scene.add(boxHelper);

const tControlView = (v: boolean, objectC: THREE.Object3D) => {
  if (v) {
    transformControl.attach(objectC);
    boxHelper.setFromObject(objectC);
    boxHelper.visible = true;
  } else {
    boxHelper.visible = false;
    transformControl.detach();
    objectClickedParent = undefined;
  }
};

// Mouse
const mouse = new THREE.Vector2(-1, -1);
const mouseR = new THREE.Vector2(-1, -1);
const onDownPosition = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();

const catchMouseMove = (e: MouseEvent) => {
  mouseR.x = e.clientX - canvas.getBoundingClientRect().left;
  mouseR.y = e.clientY - canvas.getBoundingClientRect().top;
  mouse.x = mouseR.x / canvas.clientWidth * 2 - 1;
  mouse.y = - (mouseR.y / canvas.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(group.children, true);
  objectMove = intersects[0]?.object as THREE.Object3D;
};


const catchMouseClick = (e: MouseEvent) => {
  onDownPosition.x = e.clientX;
  onDownPosition.y = e.clientY;
};


const catchMouseRClick = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();

  if (objectClickedParent) {
    objectClickedColor = "#" + ((objectClickedParent as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHexString();
  }

  // Check Menu size
  let checkH = (canvas.getBoundingClientRect().height - mouseR.y) - rMenu.getBoundingClientRect().height;
  checkH = checkH >= 0 ? 0 : checkH;
  let checkW = (canvas.getBoundingClientRect().width - mouseR.x) - rMenu.getBoundingClientRect().width;
  checkW = checkW >= 0 ? 0 : checkW;
  rMenu.style.left = `${mouseR.x + checkW}px`;
  rMenu.style.top = `${mouseR.y + checkH}px`;
};

const catchMouseClickUp = (e: MouseEvent) => {
  onUpPosition.x = e.clientX;
  onUpPosition.y = e.clientY;

  if (onDownPosition.distanceTo( onUpPosition ) === 0) {
    if (!objectMove ) {
      tControlView(false, undefined);
    }

    if (e.button == 2) {
      rMenuView(true);
    }

    const objectnow = objectMove;
    parentSelect(objectnow, +(!parameters.config.parentSelect) - 1);

    if (e.button == 0) {
      if ( objectnow && objectnow !== transformControl.object ) {
        tControlView(true, objectnow);
      }
      rMenuView(false);
    }
  }
};

// Reset Camera
const resetCam = () => {
  controls.target.set(0, 0, 0);
  camera.position.set(5, 5, 5);
};

// Orbit target focus
const orbitTarget = () => {
  if (objectClickedParent) {
    controls.target.set(
        objectClickedParent.position.x,
        objectClickedParent.position.y,
        objectClickedParent.position.z
    );
    camera.position.set(
        objectClickedParent.position.x + 5,
        objectClickedParent.position.y + 5,
        objectClickedParent.position.z + 5
    );
  } else {
    resetCam();
  }
};

// Parent Select
const parentSelect = (objectnow: THREE.Object3D, many: number) => {
  let count = 0;
  // traverse
  if (objectnow) {
    while (objectnow?.parent !== group && count < many) {
      objectnow = objectnow.parent;
      count = many < 0 ? count : count + 1;
    }

    if (objectClickedParent != objectnow) {
      objectClickedParent = objectnow;
      tControlView(true, objectnow);
    }
  }
};


// Change color
const changeColor = (e: Event) => {
  ((objectClickedParent as THREE.Mesh)?.material as any).color.setStyle((<HTMLInputElement>e.target).value);
};

// Clone object
const cloneObject = (objectC: THREE.Object3D) => {
  const cloned = objectC.clone();

  group.add(cloned);

  // select new object
  objectClickedParent = cloned;
  rMenuView(false);
  tControlView(true, cloned);
  countGroup();
};

// ClearScene
const clearScene = (object: THREE.Object3D = undefined) => {
  if (object) {
    object.parent.remove(object);
  } else {
    group.clear();
  }
  tControlView(false, undefined);
  countGroup();
};

let viewHelper: any;

onMount(() => {
  // Adding stats
  debug.appendChild( stats.dom );

  // Model selections
  modelsDiv.addEventListener("click", catchLink);

  // Add GUI
  gui.domElement.style.bottom = "0";
  debug.appendChild(gui.domElement);

  // Render
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    stencil: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE[parameters.effectController.toneMapping];
  renderer.toneMappingExposure = parameters.effectController.exposure;

  // renderer.gammaFactor = 2.2;

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  // controls.minDistance = 2;
  // controls.maxDistance = 10;

  // controls.maxPolarAngle = Math.PI / 2 - 0.1;

  // Transform Control
  transformControl = new TransformControls( camera, renderer.domElement );
  transformControl.addEventListener( "dragging-changed", (event) => {
    controls.enabled = ! event.value;
  });
  transformControl.name = "threejs-transform";
  scene.add( transformControl );

  // Gizmo viewHelper
  viewHelper = new ViewHelper(camera, show, controls, true);

  // mouse
  canvas.addEventListener("pointermove", catchMouseMove);
  canvas.addEventListener("pointerdown", catchMouseClick);
  canvas.addEventListener("pointerup", catchMouseClickUp);
  canvas.addEventListener("contextmenu", catchMouseRClick);

  // catch key event
  canvas.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Shift":
        if (!snapControl) {
          snapControl = true;
          transformControl.setTranslationSnap(size / divisions);
          transformControl.setRotationSnap(THREE.MathUtils.degToRad(5));
          transformControl.setScaleSnap(0.25);
        }
        break;
    }
  });

  // catch key event
  canvas.addEventListener("keyup", (event) => {
    switch (event.key) {
      case "f":
        orbitTarget();
        break;
      case "s":
        console.log(scene);
        console.log(cameraP);
        console.log(cameraOrtho);
        console.log(controls);
        console.log(renderer);
        break;
      case "Delete":
        if (objectClickedParent) {
          clearScene(objectClickedParent);
        }
        break;
      case "l":
        console.log(objectClickedParent);
        break;
      case "q":
        transformControl.setSpace(transformControl.space == "local" ? "world" : "local");
        break;
      case "w":
        transformControl.mode = "translate";
        break;
      case "e":
        transformControl.mode = "rotate";
        break;
      case "r":
        transformControl.mode = "scale";
        break;
      case "p":
        parentSelect(objectClickedParent, 1);
        break;
      case "Shift":
        snapControl = false;
        transformControl.setTranslationSnap( null );
        transformControl.setRotationSnap( null );
        transformControl.setScaleSnap( null );
        break;
      case "+":
        transformControl.setSize( transformControl.size + 0.1 );
        break;
      case "-":
        transformControl.setSize( Math.max( transformControl.size - 0.1, 0.1 ) );
        break;
      case "x":
        transformControl.showX = ! transformControl.showX;
        break;
      case "y":
        transformControl.showY = ! transformControl.showY;
        break;
      case "z":
        transformControl.showZ = ! transformControl.showZ;
        break;
      case " ": // Spacebar
        transformControl.enabled = ! transformControl.enabled;
        break;
      case "c":
        {
          const position = camera.position.clone();

          camera = camera == cameraOrtho ? cameraP : cameraOrtho;
          camera.position.copy(position);

          controls.object = camera;
          transformControl.camera = camera;

          camera.lookAt(
              controls.target.x,
              controls.target.y,
              controls.target.z
          );
        }
        break;
    }
  });

  rMenu.addEventListener("contextmenu", (e)=>e.preventDefault());

  renderer.setAnimationLoop(animate);
});

const render = () => {
  renderer.setViewport( 0, 0, canvas?.offsetWidth, canvas?.offsetHeight );
  renderer.render(scene, camera);
  renderer.autoClear = false;
  viewHelper.render( renderer );
  renderer.autoClear = true;
};

const animate = () => {
  // boxhelper position
  boxHelper?.update();
  // update controls
  controls.update();

  render();
  stats.update();
};

// HTML element resize
const resize = () => {
  // Update sizes
  if ($debugging.resize) {
    console.log("resize");
  }

  const aspect = (canvas.offsetWidth / canvas.offsetHeight);

  cameraP.aspect = aspect;
  cameraP.updateProjectionMatrix();

  cameraOrtho.left = cameraOrtho.bottom * aspect;
  cameraOrtho.right = cameraOrtho.top * aspect;
  cameraOrtho.updateProjectionMatrix();

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


// Dispose
const dispose = () => {
  // scene.clear();
  // geometry.dispose();
  // Object.values(materials).forEach((val) => val.dispose());
  gui.destroy();
  renderer.dispose();
  controls.dispose();
  transformControl.dispose();
  renderer.forceContextLoss();
};

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
});

</script>

<div class="f frow">
  <div class="f fcol m-main">
    <div class="m-show" bind:this={show}>
      <div bind:this={debug} class="debug debugm">
        <div class="b-info">
          <span>{snapControl ? "Snap Enabled": ""}</span>
          <span>objects {statGroup.objects}</span>
          <span>vertices {statGroup.vertices}</span>
          <span>triangles {statGroup.triangles}</span>
          <!-- <span>frametime {statGroup.frametime}</span> -->
        </div>
      </div>
      <div class="wrapper">
        <div class="rmenu nvisible" bind:this={rMenu}>
          {#if objectClickedParent}
            <span>{objectClickedParent.name}</span>
            <label for="head">Color</label>
            <input type="color" id="head" name="head" value={objectClickedColor} on:input={changeColor}>
            <button type="button" class="d" on:click={() => cloneObject(objectClickedParent)}>Clone</button>
          {:else}
            <span>Nothing here</span>
          {/if}
        </div>
      </div>
      <canvas class="canvas" bind:this={canvas} tabindex="0"/>
    </div>
    <div class="m-props" bind:this={modelsDiv}>
      <span class="m-title">Select Model</span>
      <div class="selection">
      {#each models as model}
        <details>
          <summary>{model.category}</summary>
          <ul>
          {#each model.items as item}
            <li><span data-loc={item.loc} class="clickable" title={item.loc}>{item.name}</span> - {item.loc}</li>
          {/each}
          </ul>
        </details>
      {/each}
      <hr/>
      <!-- <div>
        <input bind:value={modelURL} placeholder="URL of .glb/.gltf file">
        <button type="button" on:click|stopPropagation={() => showModel(modelURL)}>Get</button>
      </div> -->
      <div>
        <button type="button" on:click={() => clearScene()}>Clear Scene</button>
      </div>
      <hr/>
      <DragDrop on:fileHandle={fileHandle}/>
      <hr/>
      </div>
    </div>
  </div>
  <div class="m-footer">
    <span>Mouse X: {mouse.x.toFixed(2)} Y: {mouse.y.toFixed(2)}</span>
    |
    <span>Name: {objectMove?.name}</span>
    |
    <span>Clicked Parent Name: {objectClickedParent?.name}</span>
  </div>
</div>

<style lang="scss">
.f {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;

  &.frow {
    flex-direction: column;
    height: 100%;
    max-height: 100%;
  }
}

.m-main {
  align-content: flex-end;
  flex-wrap: wrap;
  height: 100%;
}

.m-show {
  flex-grow: 6;
  height: 100%;
  min-width: 300px;
  position: relative;
}

.m-props {
  border-left: solid 1px var(--border);
  box-sizing: border-box;
  flex-basis: 0;
  flex-grow: 1;
  min-width: 250px;
}

.m-footer {
  border-top: solid 1px var(--border);
  box-sizing: border-box;
  height: 50px;
  padding: 10px;
}

.m-title {
  background-color: var(--text);
  color: var(--layer);
  display: block;
  padding: 0 5px;
}

details > ul {
  margin-block-end: 0;
  margin-block-start: 0;
  padding-inline-start: 10px;

  > li {
    list-style: square;
    list-style-position: inside;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.selection {
  padding: 5px;
}

.clickable {
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: var(--red);
  }
}

.b-info {
  bottom: 0;
  opacity: 0.5;
  padding-bottom: 4px;
  padding-left: 4px;
  pointer-events: none;

  > span {
    display: block;
  }
}

.rmenu {
  background-color: var(--white);
  border: 1px solid var(--black);
  display: block;
  padding: 4px;
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
