import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import EventLabel from './EventLabel'

// Define event data at module level so it's accessible everywhere
const eventData = [
  { position: -75, label: 'Hadean', color: 0x8b0000 },
  { position: -50, label: 'Archean', color: 0xff4500 },
  { position: -25, label: 'Proterozoic', color: 0xff8c00 },
  { position: 0, label: 'Paleozoic', color: 0x32cd32 },
  { position: 25, label: 'Mesozoic', color: 0x1e90ff },
  { position: 50, label: 'Cenozoic', color: 0x9370db },
  { position: 75, label: 'Present', color: 0xff1493 }
]

function TimelineScene() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const scrollPositionRef = useRef(-75)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [eventLabels, setEventLabels] = useState([])

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    
    // Create gradient sky
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
    
    const texture = new THREE.CanvasTexture(canvas)
    scene.background = texture

    // Subtle fog
    scene.fog = new THREE.Fog(0xffffff, 50, 200)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(-75, 10, 30)
    camera.lookAt(-75, 5, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.6)
    sunLight.position.set(50, 50, 50)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    // Clouds
    const cloudGroup = new THREE.Group()
    
    const cloudCanvas = document.createElement('canvas')
    cloudCanvas.width = 256
    cloudCanvas.height = 256
    const cloudCtx = cloudCanvas.getContext('2d')
    const cloudGradient = cloudCtx.createRadialGradient(128, 128, 0, 128, 128, 128)
    cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    cloudGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
    cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    cloudCtx.fillStyle = cloudGradient
    cloudCtx.fillRect(0, 0, 256, 256)
    
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas)
    const cloudMaterial = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    })

    for (let i = 0; i < 30; i++) {
      const sprite = new THREE.Sprite(cloudMaterial)
      sprite.position.set(
        Math.random() * 200 - 100,
        Math.random() * 30 + 10,
        Math.random() * 100 - 80
      )
      const scale = Math.random() * 15 + 10
      sprite.scale.set(scale, scale * 0.6, 1)
      cloudGroup.add(sprite)
    }
    scene.add(cloudGroup)

    // Timeline
    const timelineGroup = new THREE.Group()
    
    // Main timeline bar
    const timelineGeometry = new THREE.BoxGeometry(180, 0.1, 0.1)
    const timelineMaterial = new THREE.MeshStandardMaterial({
      color: 0xbdbdbd,
      metalness: 0.2,
      roughness: 0.8
    })
    const timelinePath = new THREE.Mesh(timelineGeometry, timelineMaterial)
    timelinePath.position.set(0, 5, 0)
    timelinePath.castShadow = true
    timelineGroup.add(timelinePath)

    // Create events
    console.log('Creating events:', eventData.length)

    eventData.forEach((event, index) => {
      console.log(`Creating event ${index}: ${event.label} at position ${event.position}`)
      
      // Marker sphere
      const markerGeometry = new THREE.SphereGeometry(1.5, 32, 32)
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: event.color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: event.color,
        emissiveIntensity: 0.5
      })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(event.position, 5, 0)
      marker.castShadow = true
      marker.userData = { label: event.label } // Store label data
      timelineGroup.add(marker)

      // Connecting line
      const lineGeometry = new THREE.CylinderGeometry(0.08, 0.08, 6, 16)
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0x90caf9,
        transparent: true,
        opacity: 0.8,
        metalness: 0.2,
        roughness: 0.8
      })
      const line = new THREE.Mesh(lineGeometry, lineMaterial)
      line.position.set(event.position, 8, 0)
      timelineGroup.add(line)

      // Glowing ring
      const ringGeometry = new THREE.TorusGeometry(2, 0.1, 16, 32)
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: event.color,
        emissive: event.color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.set(event.position, 5, 0)
      ring.rotation.x = Math.PI / 2
      timelineGroup.add(ring)
    })

    scene.add(timelineGroup)
    console.log('Timeline group children:', timelineGroup.children.length)

    // Store refs
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Function to update label positions
    const updateLabelPositions = () => {
      const labels = eventData.map(event => {
        const vector = new THREE.Vector3(event.position, 5, 0)
        vector.project(camera)
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight
        
        // Check if event is in view
        const isVisible = vector.z < 1 && Math.abs(vector.x) < 1.5
        
        return {
          label: event.label,
          x: x - window.innerWidth / 2,
          y: y - window.innerHeight / 2,
          isVisible
        }
      })
      
      setEventLabels(labels)
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Subtle cloud movement
      cloudGroup.children.forEach((cloud, i) => {
        cloud.position.x += Math.sin(Date.now() * 0.0001 + i) * 0.002
        cloud.material.rotation += 0.0001
      })

      // Camera follows scroll position smoothly
      const targetX = scrollPositionRef.current
      camera.position.x += (targetX - camera.position.x) * 0.05
      
      // Camera looks at the current position
      const lookAtTarget = new THREE.Vector3(targetX, 5, 0)
      const currentLookAt = new THREE.Vector3()
      camera.getWorldDirection(currentLookAt)
      currentLookAt.multiplyScalar(10).add(camera.position)
      currentLookAt.lerp(lookAtTarget, 0.05)
      camera.lookAt(currentLookAt)

      // Mouse parallax effect
      const targetRotationY = mouseRef.current.x * 0.02
      const targetRotationX = mouseRef.current.y * 0.02
      camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05
      camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05

      // Update labels
      updateLabelPositions()

      renderer.render(scene, camera)
    }
    animate()

    // Handle scroll
    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaX || e.deltaY
      scrollPositionRef.current += delta * 0.02
      scrollPositionRef.current = Math.max(-85, Math.min(85, scrollPositionRef.current))
    }

    // Handle mouse movement
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('mousemove', handleMouseMove)

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      updateLabelPositions()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100vh',
          cursor: 'grab'
        }} 
      />
      {eventLabels.map((label, index) => (
        <EventLabel
          key={index}
          label={label.label}
          position={label.x}
          isVisible={label.isVisible}
        />
      ))}
    </>
  )
}

export default TimelineScene
