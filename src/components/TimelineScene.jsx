import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import EventLabel from "./EventLabel";
import { timelineData } from "../data/timelineData";
import { useTimeLineZoom } from "../hooks/useTimeLineZoom";
import {
  createScene,
  createCamera,
  createRenderer,
  createLights,
  createClouds,
  createTimelineBar,
} from "../utils/sceneSetup";
import { updateMarkers } from "../utils/markerFactory";
import {
  createClickHandler,
  createWheelHandler,
  createMouseMoveHandler,
  createResizeHandler,
} from "../utils/eventHandlers";
import { calculateLabelPositions } from "../utils/labelUtils";

function TimelineScene() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const timelineGroupRef = useRef(null);
  const cloudGroupRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const [eventLabels, setEventLabels] = useState([]);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const markersRef = useRef([]);
  const targetCameraPos = useRef({ x: -75, z: 30 });

  // Store handlers in refs so they can access latest markersRef
  const handlersRef = useRef({});

  const {
    zoomLevel,
    visibleItems,
    breadcrumbs,
    targetPosition,
    zoomIn,
    zoomOut,
    canZoomOut,
  } = useTimeLineZoom(timelineData);

  // Main scene setup (runs once)
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(containerRef.current);
    const { ambientLight, sunLight } = createLights();
    const cloudGroup = createClouds();
    const timelineGroup = createTimelineBar();

    scene.add(ambientLight);
    scene.add(sunLight);
    scene.add(cloudGroup);
    scene.add(timelineGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    timelineGroupRef.current = timelineGroup;
    cloudGroupRef.current = cloudGroup;

    const updateLabelPositions = () => {
      const labels = calculateLabelPositions(markersRef, camera);
      setEventLabels(labels);
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      cloudGroup.children.forEach((cloud, i) => {
        cloud.position.x += Math.sin(Date.now() * 0.0001 + i) * 0.002;
        cloud.material.rotation += 0.0001;
      });

      camera.position.x +=
        (targetCameraPos.current.x - camera.position.x) * 0.05;
      camera.position.z +=
        (targetCameraPos.current.z - camera.position.z) * 0.05;

      const lookAtTarget = new THREE.Vector3(targetCameraPos.current.x, 5, 0);
      camera.lookAt(lookAtTarget);

      updateLabelPositions();
      renderer.render(scene, camera);
    };
    animate();

    // Create wrapper functions that always use current markersRef
    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera({ x, y }, camera);
      const clickableMarkers = markersRef.current.map((m) => m.marker);
      const intersects =
        raycasterRef.current.intersectObjects(clickableMarkers);

      if (intersects.length > 0) {
        const clickedMarker = intersects[0].object;
        const item = clickedMarker.userData.item;
        console.log("Clicked:", item.name, item.type);
        zoomIn(item);
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaX || e.deltaY;
      targetCameraPos.current.x += delta * 0.02;
      targetCameraPos.current.x = Math.max(
        -85,
        Math.min(85, targetCameraPos.current.x),
      );
    };

    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera({ x, y }, camera);
      const clickableMarkers = markersRef.current.map((m) => m.marker);
      const intersects =
        raycasterRef.current.intersectObjects(clickableMarkers);

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

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateLabelPositions();
    };

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      document.body.style.cursor = "default";
    };
  }, [zoomIn]);

  // Update markers when visibleItems changes
  useEffect(() => {
    const timelineGroup = timelineGroupRef.current;
    if (!timelineGroup) return;

    console.log("Updating markers for:", visibleItems.length, "items");
    updateMarkers(visibleItems, timelineGroup, markersRef);
  }, [visibleItems, zoomLevel]);

  // Update camera when zoom changes
  useEffect(() => {
    if (targetPosition !== null) {
      console.log("Zooming to position:", targetPosition);
      targetCameraPos.current = { x: targetPosition, z: 15 };
    } else {
      console.log("Zooming out to default");
      targetCameraPos.current = { x: -75, z: 30 };
    }
  }, [targetPosition]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />

      {eventLabels.map((label, index) => (
        <EventLabel
          key={index}
          label={label.label}
          position={label.x}
          isVisible={label.isVisible}
        />
      ))}

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.9)",
          padding: "15px",
          borderRadius: "8px",
          fontFamily: "monospace",
          zIndex: 1000,
        }}
      >
        <div>
          <strong>Zoom:</strong> {zoomLevel}
        </div>
        <div>
          <strong>Items:</strong> {visibleItems.length}
        </div>
        <div>
          <strong>Markers:</strong> {markersRef.current.length}
        </div>
        <div>
          <strong>Path:</strong>{" "}
          {breadcrumbs.map((b) => b.name).join(" > ") || "Root"}
        </div>
        <button
          onClick={zoomOut}
          disabled={!canZoomOut}
          style={{
            marginTop: "10px",
            padding: "5px 10px",
            cursor: canZoomOut ? "pointer" : "not-allowed",
          }}
        >
          ← Back
        </button>
      </div>
    </>
  );
}

export default TimelineScene;
