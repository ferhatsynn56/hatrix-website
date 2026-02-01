import * as THREE from "three";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

let _patched = false;

export function ensureBVHPatched() {
  if (_patched) return;
  _patched = true;

  THREE.Mesh.prototype.raycast = acceleratedRaycast;
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
}
