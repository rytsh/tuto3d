interface typeAssest {
  name?: string,
  info: string,
  URL: string,
  size?: string,
  author: string,
  dateModified?: string,
}

const mAssets: typeAssest[] =
[
  {
    name: "craneRTG.blend",
    info: "Blender file of modifiable RTG",
    URL: "./assets/draw/craneRTG.blend",
    author: "Eray",
  },
  {
    info: "Blender file of coils and crane",
    URL: "./assets/draw/craneCoils.blend",
    author: "Eray",
  },
  {
    info: "GLB file, web optimized",
    URL: "./assets/3d/craneRTG.glb",
    author: "Eray",
  },
  {
    info: "Test object GLB file, web optimized",
    URL: "./assets/3d/electpole.glb",
    author: "Eray",
  },
  {
    info: "Test object GLB file, web optimized",
    URL: "./assets/3d/tree.glb",
    author: "Eray",
  },
  {
    info: "Test object GLB file, web optimized",
    URL: "./assets/3d/treec.glb",
    author: "Eray",
  },
];


export { mAssets };
export type { typeAssest };
