# Web timeline

## Description

Brief description

## CloudBackground Component

An interactive canvas-based animation that creates a floating particle effect with mouse interaction.

### How It Works

**Particle System:**

- Creates 50 particles with random positions, velocities, sizes, and opacities
- Each particle drifts slowly across the screen with continuous wrap-around at edges
- Particles are drawn as circles with semi-transparent blue colors

**Mouse Interaction:**

- Tracks mouse position via props from parent component
- Particles within 150px of cursor are pushed away using distance-based force calculation
- Force strength decreases with distance, creating a natural repulsion effect

**Visual Connections:**

- Draws lines between particles within 100px of each other
- Line opacity fades based on distance, creating a constellation effect

**Technical Implementation:**

- Uses `useRef` to store particle data and animation ID without triggering re-renders
- `requestAnimationFrame` drives the 60fps animation loop
- Canvas is cleared and redrawn each frame
- Responds to window resize events
- Cleanup on unmount prevents memory leaks

**Math Used:**

- Pythagorean theorem for distance calculation: `√(dx² + dy²)`
- Vector math for directional forces
- Linear interpolation for opacity based on distance

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```
