<script lang="ts">
import { ResizeObserver } from "@juggle/resize-observer";
import { onDestroy, onMount } from "svelte";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { informationData, debugging } from "@/store/store";

import fragment from "@/shaders/control/fragment.glsl?raw";
import vertex from "@/shaders/control/vertex.glsl?raw";

// Give infromation
informationData.set(`
# Line and Angle

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

// Materials and Textures
const textureLoader = new THREE.TextureLoader();
const matcapMat = textureLoader.load("assets/materials/matcaps/3E3E3E_AEAEAE_848484_777777-64px.png");

let box: THREE.Mesh;
let box2: THREE.Mesh;
let tube: THREE.Mesh;

let skeletonHelper: THREE.SkeletonHelper;
let skeleton: THREE.Skeleton;

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

const createBones = ( height, count ) => {
  const bones = [];

  let prevBone = new THREE.Bone();
  bones.push( prevBone );
  prevBone.position.y = - height/2;

  for ( let i = 0; i < count; i ++ ) {
    const bone = new THREE.Bone();
    bone.position.y = height;
    bones.push( bone );
    prevBone.add( bone );
    prevBone = bone;
  }

  return bones;
};

onMount(() => {
  debug.appendChild(gui.domElement);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  material.set("line", new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 4,
  }));


  const points = [
    new THREE.Vector3( 0, 50, 0 ),
    new THREE.Vector3( 0, 0, 0 ),
  ];

  // const points2 = new Float32Array([
  //   0, 50, 0,
  //   0, 0, 0,
  // ]);

  // const bufferAtt = new THREE.BufferAttribute(points2, 3);
  // geometry[0] = new THREE.BufferGeometry();
  // geometry[0].setAttribute("position", bufferAtt);

  // cable = new THREE.CatmullRomCurve3( points );
  // geometry[0] = new THREE.TubeGeometry( cable, 1, 1, 6, false );
  // scene.add( new THREE.Mesh( geometry[0], material ) );

  geometry.set("cable", new THREE.BufferGeometry().setFromPoints( points ));

  const line = new THREE.Line( geometry.get("cable"), material.get("line") );
  line.position.setX(-20);
  scene.add(line);

  // box
  geometry.set("box", new THREE.BoxGeometry( 10, 10, 10 ));
  material.set("basic", new THREE.MeshMatcapMaterial( { matcap: matcapMat, side: THREE.DoubleSide } ));
  box = new THREE.Mesh( geometry.get("box"), material.get("basic") );
  box.position.setY(-5);
  box.position.setX(-20);
  scene.add( box );

  // Secod Method with bones
  {
    const bones = createBones(50, 1);

    geometry.set("cable2", new THREE.CylinderGeometry(
        2, // radiusTop
        2, // radiusBottom
        50, // height
        6, // radiusSegments
        2, // heightSegments
        true // openEnded
    ));

    // create the skin indices and skin weights
    const position = geometry.get("cable2").attributes.position;

    const vertex = new THREE.Vector3();

    const skinIndices = [];
    const skinWeights = [];

    for ( let i = 0; i < position.count; i ++ ) {
      vertex.fromBufferAttribute( position, i );

      // compute skinIndex and skinWeight based on some configuration data

      const y = ( vertex.y + 25 );

      const skinIndex = Math.floor( y / 50 );
      const skinWeight = ( y % 50 ) / 50;

      skinIndices.push( skinIndex, skinIndex + 1, 0, 0 );
      skinWeights.push( 1 - skinWeight, skinWeight, 0, 0 );
    }

    geometry.get("cable2").setAttribute( "skinIndex", new THREE.Uint16BufferAttribute( skinIndices, 4 ) );
    geometry.get("cable2").setAttribute( "skinWeight", new THREE.Float32BufferAttribute( skinWeights, 4 ) );

    // create skinned mesh and skeleton

    // material.set("basic2", new THREE.MeshBasicMaterial( {
    //   color: 0x156289,
    //   side: THREE.DoubleSide,
    // } ));

    const mesh = new THREE.SkinnedMesh( geometry.get("cable2"), material.get("basic") );
    skeleton = new THREE.Skeleton( bones );

    // see example from THREE.Skeleton
    const rootBone = skeleton.bones[0];
    // rootBone.position.setY(0);
    mesh.add( rootBone );

    // bind the skeleton to the mesh
    mesh.bind( skeleton );
    rootBone.rotateX(THREE.MathUtils.degToRad(180));
    rootBone.position.setY(50);

    mesh.position.setX(20);
    // mesh.position.setY(50);

    // mesh.scale.multiplyScalar( 1 );

    scene.add(mesh);

    skeletonHelper = new THREE.SkeletonHelper( mesh );
    (skeletonHelper.material as any).linewidth = 2;
    scene.add( skeletonHelper );
  }
  // box2
  box2 = new THREE.Mesh( geometry.get("box"), material.get("basic") );
  box2.position.setY(-5);
  box2.position.setX(20);
  scene.add( box2 );

  // edge
  geometry.set("edge", new THREE.BoxGeometry( 100, 100, 100, 4, 4, 4 ));
  const edges2 = new THREE.EdgesGeometry( geometry.get("edge") );
  const line2 = new THREE.LineSegments( edges2, new THREE.LineBasicMaterial( { color: 0xffffff } ) );
  scene.add( line2 );

  // tube
  material.set("shader", new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.FrontSide,
  }));
  // geometry.set("tube", new THREE.BufferGeometry().setFromPoints( points ));
  geometry.set("tube", new THREE.CylinderGeometry(6, 6, 100, 6, 6, true));
  tube = new THREE.Mesh(geometry.get("tube"), material.get("shader"));
  tube.rotateZ(THREE.MathUtils.degToRad(90));
  tube.position.setY(50);
  scene.add(tube);

  // Camera
  camera.position.z = 80;
  camera.position.x = 30;
  camera.position.y = 55;
  scene.add(camera);

  resizeObserver.observe(canvas);

  // Controls
  controls = new OrbitControls(camera, canvas);

  // controls.addEventListener("change", ()=>render());

  renderer.setAnimationLoop(render);
});

const updateLine = (val: number) => {
  (geometry.get("cable") as THREE.BufferGeometry).attributes.position.setY(1, val);
  (geometry.get("cable") as THREE.BufferGeometry).attributes.position.needsUpdate = true;

  skeleton.bones[1].position.setY(50-val);
};

const clock = new THREE.Clock();
const render = () => {
  const elapsedTime = clock.getElapsedTime();
  const val = Math.sin(elapsedTime) * 20;

  box.position.setY(val);
  box2.position.setY(val);
  updateLine(val);
  // Render
  renderer.render(scene, camera);
};

onDestroy(()=>{
  dispose();
  resizeObserver.unobserve(canvas);
});

</script>

<div bind:this={debug} class="debug"/>
<canvas class="canvas" bind:this={canvas} tabindex="0"/>
