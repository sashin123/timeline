# Zoom Interaction System

## Overview

Hierarchical navigation system allowing users to drill down from eons → periods → events via click interaction.

## Architecture

### Data Structure

```
timelineData (array)
├── Eon (type: 'eon')
│   └── children (periods)
│       └── Period (type: 'period')
│           └── children (events)
│               └── Event (type: 'event')
```

### Zoom State Management (`useTimelineZoom` hook)

- **zoomLevel**: Current view level (eon/period/event)
- **activePath**: Array tracking navigation path (e.g., ['paleozoic', 'cambrian'])
- **targetPosition**: Camera target X position
- **visibleItems**: Items to render at current zoom level

### Interaction Flow

1. User clicks marker sphere
2. Raycaster detects 3D intersection
3. `zoomIn(item)` updates state
4. Markers re-render for new zoom level
5. Camera animates to target position

## Implementation Details

### Raycasting (Click Detection)

```javascript
raycaster.setFromCamera(mouseCoords, camera)
intersects = raycaster.intersectObjects(markers)
if (intersects.length > 0) → click detected
```

- Converts 2D mouse coords to 3D ray
- Tests intersection with marker meshes
- Triggers zoom on first hit

### Camera Animation

```javascript
targetCameraPos = { x: position, z: zoomLevel ? 15 : 30 };
camera.position.lerp(target, 0.05); // Smooth easing
```

- **Eon view**: z=30 (far), x=-75 (start)
- **Period/Event view**: z=15 (closer), x=clicked position
- Lerp factor 0.05 = smooth 20-frame transition

### Dynamic Marker Rendering

- `createMarkers(items)` recreates all markers when zoom changes
- Clears old markers from scene
- Adds new markers based on `visibleItems`
- Each marker stores `userData.item` with full data

### Hover Effects

- Raycaster tests on mousemove
- Hovered marker scales to 1.2x
- Cursor changes to pointer
- All markers reset when hover ends

## Navigation Controls

- **Click marker**: Zoom in one level
- **Back button**: Zoom out one level (disabled at root)
- **Breadcrumbs**: Show current path (e.g., "Paleozoic > Cambrian")

## Performance Notes

- Markers recreated on zoom (not hidden/shown) to avoid memory buildup
- Raycasting runs on click and mousemove only
- Lerp animation runs at 60fps but is computationally cheap
