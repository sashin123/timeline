import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import EventLabel from "./EventLabel";
import { timelineData } from "../data/timelineData";
import { useTimeLineZoom } from "../hooks/useTimeLineZoom";

function TimelineScene() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const timelineGroupRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef({ x: 0, y: 0 });
  const [eventLabels, setEventLabels] = useState([]);
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
  } = useTimeLineZoom(timelineData);

  // Scene setup - runs once
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();

    // Sky
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    scene.add(sunLight);

 // Clouds - Create unique materials for each sprite
const cloudGroup = new THREE.Group()
const cloudCanvas = document.createElement('canvas')
cloudCanvas.width = 256
cloudCanvas.height = 256
const cloudCtx = cloudCanvas.getContext('2d')
const cloudGrad = cloudCtx.createRadialGradient(128, 128, 0, 128, 128, 128)
cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
cloudGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
cloudCtx.fillStyle = cloudGrad
cloudCtx.fillRect(0, 0, 256, 256)

for (let i = 0; i < 30; i++) {
  // Create SEPARATE texture for each cloud
  const texture = new THREE.CanvasTexture(cloudCanvas)
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(Math.random() * 200 - 100, Math.random() * 30 + 10, Math.random() * 100 - 80)
  const scale = Math.random() * 15 + 10
  sprite.scale.set(scale, scale * 0.6, 1)
  cloudGroup.add(sprite)
}
scene.add(cloudGroup)

    // Timeline
    const timelineGroup = new THREE.Group();
    const timelineGeo = new THREE.BoxGeometry(180, 0.1, 0.1);
    const timelineMat = new THREE.MeshStandardMaterial({
      color: 0xbdbdbd,
      metalness: 0.2,
      roughness: 0.8,
    });
    const timelinePath = new THREE.Mesh(timelineGeo, timelineMat);
    timelinePath.position.set(0, 5, 0);
    timelinePath.castShadow = true;
    timelineGroup.add(timelinePath);
    scene.add(timelineGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    timelineGroupRef.current = timelineGroup;

    const updateLabels = () => {
      const labels = markersRef.current.map(({ item }) => {
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

    // Animation
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
      camera.lookAt(targetCameraPos.current.x, 5, 0);
      updateLabels();
      renderer.render(scene, camera);
    };
    animate();

    // Click handler
    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera({ x, y }, camera);
      const clickable = markersRef.current.map((m) => m.marker);
      const intersects = raycasterRef.current.intersectObjects(clickable);
      if (intersects.length > 0) {
        const item = intersects[0].object.userData.item;
        console.log("Clicked:", item.name);
        zoomIn(item);
      }
    };

    // Scroll handler
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
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera({ x, y }, camera);
      const clickable = markersRef.current.map((m) => m.marker);
      const intersects = raycasterRef.current.intersectObjects(clickable);
      if (intersects.length > 0) {
        document.body.style.cursor = "pointer";
        intersects[0].object.scale.set(1.2, 1.2, 1.2);
      } else {
        document.body.style.cursor = "default";
        markersRef.current.forEach(({ marker }) => marker.scale.set(1, 1, 1));
      }
    };

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    renderer.domElement.addEventListener("mousemove", handleMouseMove);

    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
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

    // Remove old markers (WITHOUT disposing)
    markersRef.current.forEach(({ marker, line, ring }) => {
      timelineGroup.remove(marker);
      timelineGroup.remove(line);
      timelineGroup.remove(ring);
    });
    markersRef.current = [];

    // Create new markers
    visibleItems.forEach((item) => {
      const markerGeo = new THREE.SphereGeometry(1.5, 32, 32);
      const markerMat = new THREE.MeshStandardMaterial({
        color: item.color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: item.color,
        emissiveIntensity: 0.5,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(item.position, 5, 0);
      marker.castShadow = true;
      marker.userData = { item };
      timelineGroup.add(marker);

      const lineGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 16);
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0x90caf9,
        transparent: true,
        opacity: 0.8,
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(item.position, 8, 0);
      timelineGroup.add(line);

      const ringGeo = new THREE.TorusGeometry(2, 0.1, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: item.color,
        emissive: item.color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(item.position, 5, 0);
      ring.rotation.x = Math.PI / 2;
      timelineGroup.add(ring);

      markersRef.current.push({ marker, line, ring, item });
    });

    console.log("Markers created:", markersRef.current.length);
  }, [visibleItems]);

  // Update camera on zoom
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

