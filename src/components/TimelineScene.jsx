import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import EventLabel from "./EventLabel";
import { timelineData } from "../data/timelineData";
import { useTimelineZoom } from "../hooks/useTimelineZoom";

function TimelineScene() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef({ x: 0, y: 0, clientX: 0, clientY: 0 });
  const [eventLabels, setEventLabels] = useState([]);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const markersRef = useRef([]);
  const targetCameraPos = useRef({ x: -75, z: 30 });

  const {
    zoomLevel,
    visibleItems,
    breadcrumbs,
    targetPosition,
    zoomIn,
    zoomOut,
    canZoomOut,
  } = useTimelineZoom(timelineData);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();

    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#e3f2fd");
    gradient.addColorStop(0.5, "#ffffff");
    gradient.addColorStop(1, "#f5f5f5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;
    scene.fog = new THREE.Fog(0xffffff, 50, 200);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(-75, 10, 30);
    camera.lookAt(-75, 5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.6);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Clouds
    const cloudGroup = new THREE.Group();
    const cloudCanvas = document.createElement("canvas");
    cloudCanvas.width = 256;
    cloudCanvas.height = 256;
    const cloudCtx = cloudCanvas.getContext("2d");
    const cloudGradient = cloudCtx.createRadialGradient(
      128,
      128,
      0,
      128,
      128,
      128,
    );
    cloudGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    cloudGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
    cloudGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    cloudCtx.fillStyle = cloudGradient;
    cloudCtx.fillRect(0, 0, 256, 256);

    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudMaterial = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    for (let i = 0; i < 30; i++) {
      const sprite = new THREE.Sprite(cloudMaterial);
      sprite.position.set(
        Math.random() * 200 - 100,
        Math.random() * 30 + 10,
        Math.random() * 100 - 80,
      );
      const scale = Math.random() * 15 + 10;
      sprite.scale.set(scale, scale * 0.6, 1);
      cloudGroup.add(sprite);
    }
    scene.add(cloudGroup);

    // Timeline
    const timelineGroup = new THREE.Group();
    const timelineGeometry = new THREE.BoxGeometry(180, 0.1, 0.1);
    const timelineMaterial = new THREE.MeshStandardMaterial({
      color: 0xbdbdbd,
      metalness: 0.2,
      roughness: 0.8,
    });
    const timelinePath = new THREE.Mesh(timelineGeometry, timelineMaterial);
    timelinePath.position.set(0, 5, 0);
    timelinePath.castShadow = true;
    timelineGroup.add(timelinePath);
    scene.add(timelineGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const updateLabelPositions = () => {
      const labels = visibleItems.map((item) => {
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
      setEventLabels(labels);
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      cloudGroup.children.forEach((cloud, i) => {
        cloud.position.x += Math.sin(Date.now() * 0.0001 + i) * 0.002;
        cloud.material.rotation += 0.0001;
      });

      // Smooth camera movement
      camera.position.x +=
        (targetCameraPos.current.x - camera.position.x) * 0.05;
      camera.position.z +=
        (targetCameraPos.current.z - camera.position.z) * 0.05;

      const lookAtTarget = new THREE.Vector3(targetCameraPos.current.x, 5, 0);
      camera.lookAt(lookAtTarget);

      // Mouse parallax
      //const parallaxX = mouseRef.current.x * 0.01;
      //const parallaxY = mouseRef.current.y * 0.01;
      //camera.position.x += parallaxX * 0.1;
      //camera.position.y += parallaxY * 0.1;

      updateLabelPositions();
      renderer.render(scene, camera);
    };
    animate();

    // Click handler
    const handleClick = (e) => {
      console.log("Canvas clicked");
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera({ x, y }, camera);
      const clickableMarkers = markersRef.current.map((m) => m.marker);
      const intersects =
        raycasterRef.current.intersectObjects(clickableMarkers);

      console.log("Raycaster intersects:", intersects);
      if (intersects.length > 0) {
        const clickedMarker = intersects[0].object;
        const item = clickedMarker.userData.item;
        console.log("Clicked:", item.name, item.type);
        zoomIn(item);
      }
    };

    // Scroll handler for horizontal navigation
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaX || e.deltaY;
      targetCameraPos.current.x += delta * 0.02;
      targetCameraPos.current.x = Math.max(
        -85,
        Math.min(85, targetCameraPos.current.x),
      );
    };

    // Hover handler
    const handleMouseMove = (e) => {
      mouseRef.current.clientX = e.clientX;
      mouseRef.current.clientY = e.clientY;
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

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

    renderer.domElement.addEventListener("click", handleClick);
    console.log("Click event listener added");
    console.log("Click event listener removed");
    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    renderer.domElement.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateLabelPositions();
    };
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
  }, [visibleItems, zoomIn]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const timelineGroup = scene.children.find(
      (child) => child.type === "Group",
    );

    if (!timelineGroup) return;
    console.log("Visible items updated:", visibleItems);
    // Clear old markers
    markersRef.current.forEach(({ marker, line, ring }) => {
      timelineGroup.remove(marker);
      timelineGroup.remove(line);
      timelineGroup.remove(ring);
    });
    markersRef.current = [];

    // Create new markers
    visibleItems.forEach((item) => {
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

      markersRef.current.push({ marker, line, ring, item });
    });

    console.log("Markers updated:", markersRef.current.length);
  }, [visibleItems]);

  // Update camera when zoom changes
  useEffect(() => {
    if (targetPosition !== null) {
      targetCameraPos.current = { x: targetPosition, z: 15 };
    } else {
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
