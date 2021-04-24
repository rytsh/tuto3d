import * as THREE from "three";

/**
 * Count attributes of THREE.OBJECT3D objects
 *
 * @param group - An Object3D
 * @returns [objects, vertices, triangles]
 *
 * @beta
 */
const countObjects = (group: THREE.Group) => {
  let objects = 0; let vertices = 0; let triangles = 0;

  for ( let i = 0, l = group.children.length; i < l; i ++ ) {
    const object = group.children[i];

    object.traverseVisible((object) => {
      objects++;
      if ( object instanceof THREE.Mesh ) {
        const geometry = object.geometry as THREE.BufferGeometry;

        vertices += geometry.attributes.position.count;
        if ( geometry.index !== null ) {
          triangles += geometry.index.count / 3;
        } else {
          triangles += geometry.attributes.position.count / 3;
        }
      }
    } );
  }

  return [objects, vertices, triangles];
};


export { countObjects };
