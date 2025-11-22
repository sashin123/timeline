import * as THREE from "three";

export function createEventMarker(item, timelineGroup) {
  const markerGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: item.color,
    metalness: 0.3,
    roughness: 0.4,
    emissive: item.color,
    emissiveIntensity: 0.5,
  });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(item.position, 5, 0);
  marker.castShadow = true;
  marker.userData = { item, type: "marker" };
  timelineGroup.add(marker);

  const lineGeometry = new THREE.CylinderGeometry(0.08, 0.08, 6, 16);
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0x90caf9,
    transparent: true,
    opacity: 0.8,
    metalness: 0.2,
    roughness: 0.8,
  });
  const line = new THREE.Mesh(lineGeometry, lineMaterial);
  line.position.set(item.position, 8, 0);
  timelineGroup.add(line);

  const ringGeometry = new THREE.TorusGeometry(2, 0.1, 16, 32);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: item.color,
    emissive: item.color,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(item.position, 5, 0);
  ring.rotation.x = Math.PI / 2;
  timelineGroup.add(ring);

  return { marker, line, ring, item };
}

export function clearMarkers(markersArray, timelineGroup) {
  markersArray.forEach(({ marker, line, ring }) => {
    timelineGroup.remove(marker);
    timelineGroup.remove(line);
    timelineGroup.remove(ring);
  });
  markersArray.length = 0;
}

export function updateMarkers(visibleItems, timelineGroup, markersRef) {
  clearMarkers(markersRef.current, timelineGroup);

  visibleItems.forEach((item) => {
    const markerData = createEventMarker(item, timelineGroup);
    markersRef.current.push(markerData);
  });

  console.log("Markers updated:", markersRef.current.length);
}
