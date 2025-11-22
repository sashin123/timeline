export function createClickHandler(
  raycaster,
  camera,
  markersRef,
  zoomIn,
  renderer,
) {
  return (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera({ x, y }, camera);
    const clickableMarkers = markersRef.current.map((m) => m.marker);
    const intersects = raycaster.intersectObjects(clickableMarkers);

    if (intersects.length > 0) {
      const clickedMarker = intersects[0].object;
      const item = clickedMarker.userData.item;
      console.log("Clicked:", item.name, item.type);
      zoomIn(item);
    }
  };
}

export function createWheelHandler(targetCameraPos) {
  return (e) => {
    e.preventDefault();
    const delta = e.deltaX || e.deltaY;
    targetCameraPos.current.x += delta * 0.02;
    targetCameraPos.current.x = Math.max(
      -85,
      Math.min(85, targetCameraPos.current.x),
    );
  };
}

export function createMouseMoveHandler(
  raycaster,
  camera,
  markersRef,
  setHoveredMarker,
  renderer,
) {
  return (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera({ x, y }, camera);
    const clickableMarkers = markersRef.current.map((m) => m.marker);
    const intersects = raycaster.intersectObjects(clickableMarkers);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      setHoveredMarker(marker.userData.item.id);
      document.body.style.cursor = "pointer";
      marker.scale.set(1.2, 1.2, 1.2);
    } else {
      setHoveredMarker(null);
      document.body.style.cursor = "default";
      markersRef.current.forEach(({ marker }) => {
        marker.scale.set(1, 1, 1);
      });
    }
  };
}

export function createResizeHandler(camera, renderer, updateLabelPositions) {
  return () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateLabelPositions();
  };
}
