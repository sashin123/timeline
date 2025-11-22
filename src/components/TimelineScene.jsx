import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import EventLabel from './EventLabel'
import { timelineData } from '../data/timelineData'
import { useTimeLineZoom } from '../hooks/useTimeLineZoom'

// Flatten all items for persistent markers
function flattenTimelineData(data) {
  const items = []
  data.forEach(eon => {
    items.push(eon)
    if (eon.children) {
      eon.children.forEach(period => {
        items.push(period)
        if (period.children) {
          period.children.forEach(event => {
            items.push(event)
          })
        }
      })
    }
  })
  return items
}

function TimelineScene() {
  const containerRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const allMarkersRef = useRef([]) // Store ALL markers permanently
  const targetCameraPos = useRef({ x: -75, z: 30 })
  const raycasterRef = useRef(new THREE.Raycaster())
  const [eventLabels, setEventLabels] = useState([])

  const {
    zoomLevel,
    visibleItems,
    breadcrumbs,
    targetPosition,
    zoomIn,
    zoomOut,
    canZoomOut,
  } = useTimeLineZoom(timelineData)

  // Scene setup - runs ONCE
  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    
    // Sky
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#e3f2fd')
    gradient.addColorStop(0.5, '#ffffff')
    gradient.addColorStop(1, '#f5f5f5')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)
    
    scene.background = new THREE.CanvasTexture(canvas)
    scene.fog = new THREE.Fog(0xffffff, 50, 200)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-75, 10, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.6)
    sunLight.position.set(50, 50, 50)
    scene.add(sunLight)

    // Clouds
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
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas)

    for (let i = 0; i < 30; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }))
      sprite.position.set(Math.random() * 200 - 100, Math.random() * 30 + 10, Math.random() * 100 - 80)
      const scale = Math.random() * 15 + 10
      sprite.scale.set(scale, scale * 0.6, 1)
      cloudGroup.add(sprite)
    }
    scene.add(cloudGroup)

    // Timeline bar
    const timelineGeo = new THREE.BoxGeometry(180, 0.1, 0.1)
    const timelineMat = new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
    const timelinePath = new THREE.Mesh(timelineGeo, timelineMat)
    timelinePath.position.set(0, 5, 0)
    scene.add(timelinePath)

    // Create ALL markers once and store them
    const allItems = flattenTimelineData(timelineData)
    allItems.forEach((item) => {
      const markerGeo = new THREE.SphereGeometry(1.5, 32, 32)
      const markerMat = new THREE.MeshStandardMaterial({
        color: item.color,
        emissive: item.color,
        emissiveIntensity: 0.5,
      })
      const marker = new THREE.Mesh(markerGeo, markerMat)
      marker.position.set(item.position, 5, 0)
      marker.userData = { item }
      marker.visible = false // Start hidden
      scene.add(marker)

      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.8 })
      )
      line.position.set(item.position, 8, 0)
      line.visible = false
      scene.add(line)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.1, 16, 32),
        new THREE.MeshStandardMaterial({
          color: item.color,
          emissive: item.color,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.7,
        })
      )
      ring.position.set(item.position, 5, 0)
      ring.rotation.x = Math.PI / 2
      ring.visible = false
      scene.add(ring)

      allMarkersRef.current.push({ marker, line, ring, item })
    })

    cameraRef.current = camera
    rendererRef.current = renderer

    // Animation
    const animate = () => {
      requestAnimationFrame(animate)
      cloudGroup.children.forEach((cloud, i) => {
        cloud.position.x += Math.sin(Date.now() * 0.0001 + i) * 0.002
      })
      camera.position.x += (targetCameraPos.current.x - camera.position.x) * 0.05
      camera.position.z += (targetCameraPos.current.z - camera.position.z) * 0.05
      camera.lookAt(targetCameraPos.current.x, 5, 0)
      
      // Update labels
      const visibleMarkers = allMarkersRef.current.filter(m => m.marker.visible)
      const labels = visibleMarkers.map(({ item }) => {
        const vector = new THREE.Vector3(item.position, 5, 0)
        vector.project(camera)
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight
        const isVisible = vector.z < 1 && Math.abs(vector.x) < 1.5
        return { label: item.name, x: x - window.innerWidth / 2, y: y - window.innerHeight / 2, isVisible }
      })
      setEventLabels(labels)
      
      renderer.render(scene, camera)
    }
    animate()

    // Click handler
    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera({ x, y }, camera)
      
      const visibleMarkers = allMarkersRef.current.filter(m => m.marker.visible).map(m => m.marker)
      const intersects = raycasterRef.current.intersectObjects(visibleMarkers)
      
      if (intersects.length > 0) {
        const item = intersects[0].object.userData.item
        console.log('Clicked:', item.name, item.type)
        zoomIn(item)
      }
    }

    // Scroll
    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaX || e.deltaY
      targetCameraPos.current.x += delta * 0.02
      targetCameraPos.current.x = Math.max(-85, Math.min(85, targetCameraPos.current.x))
    }

    // Hover
    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera({ x, y }, camera)
      
      const visibleMarkers = allMarkersRef.current.filter(m => m.marker.visible).map(m => m.marker)
      const intersects = raycasterRef.current.intersectObjects(visibleMarkers)
      
      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer'
        intersects[0].object.scale.set(1.2, 1.2, 1.2)
      } else {
        document.body.style.cursor = 'default'
        allMarkersRef.current.forEach(({ marker }) => marker.scale.set(1, 1, 1))
      }
    }

    renderer.domElement.addEventListener('click', handleClick)
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false })
    renderer.domElement.addEventListener('mousemove', handleMouseMove)

    return () => {
      renderer.domElement.removeEventListener('click', handleClick)
      renderer.domElement.removeEventListener('wheel', handleWheel)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement)
      renderer.dispose()
      document.body.style.cursor = 'default'
    }
  }, [zoomIn])

  // Toggle marker visibility based on visibleItems
  useEffect(() => {
    const visibleIds = new Set(visibleItems.map(item => item.id))
    allMarkersRef.current.forEach(({ marker, line, ring, item }) => {
      const shouldBeVisible = visibleIds.has(item.id)
      marker.visible = shouldBeVisible
      line.visible = shouldBeVisible
      ring.visible = shouldBeVisible
    })
    console.log('Visible markers:', visibleIds.size)
  }, [visibleItems])

  // Update camera on zoom
  useEffect(() => {
    if (targetPosition !== null) {
      targetCameraPos.current = { x: targetPosition, z: 15 }
    } else {
      targetCameraPos.current = { x: -75, z: 30 }
    }
  }, [targetPosition])

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
      {eventLabels.map((label, idx) => (
        <EventLabel key={idx} label={label.label} position={label.x} isVisible={label.isVisible} />
      ))}
      <div style={{
        position: 'absolute', bottom: '20px', left: '20px',
        background: 'rgba(255,255,255,0.9)', padding: '15px',
        borderRadius: '8px', zIndex: 1000
      }}>
        <div><strong>Zoom:</strong> {zoomLevel}</div>
        <div><strong>Items:</strong> {visibleItems.length}</div>
        <div><strong>Path:</strong> {breadcrumbs.map(b => b.name).join(' > ') || 'Root'}</div>
        <button onClick={zoomOut} disabled={!canZoomOut} 
          style={{ marginTop: '10px', padding: '5px 10px', cursor: canZoomOut ? 'pointer' : 'not-allowed' }}>
          ← Back
        </button>
      </div>
    </>
  )
}

export default TimelineScene
