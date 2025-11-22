import * as THREE from "three";

export function calculateLabelPositions(markersRef, camera) {
  return markersRef.current.map(({ item }) => {
    const vector = new THREE.Vector3(item.position, 5, 0);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
    const isVisible = vector.z < 1 && Math.abs(vector.x) < 1.5;

    return {
      label: item.name,
      x: x - window.innerWidth / 2,
      y: y - window.innerHeight / 2,
      isVisible,
    };
  });
}
