<template>
  <div class="auth-layout auth-background">
    <canvas ref="canvas" :class="['fixed inset-0 -z-10', { 'opacity-0': !isCanvasInitialized }]" />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

/*********************************************************************************************
 * OPEN CONSTELLATION CHAINS – v4
 * ------------------------------------------------------------------
 *  • Constellation = 3–7 *cores* arranged loosely on a ring, linked in
 *    an OPEN poly‑line (no first→last edge).
 *  • Each core owns 5 *satellites* in orbit.
 *  • Mouse interaction now works at the **node** level:
 *        – When the pointer approaches a core *or* satellite its own
 *          offset vector receives an impulse away from the cursor.
 *        – Offset decays each frame → elastic spring‑back.
 *  • Everything scaled up ~1.5× for better readability.
 *********************************************************************************************/

/***** Tunables *************************************************/
const GROUP_COUNT = 24 // number of constellations
const MIN_CORES_PER_GROUP = 2
const MAX_CORES_PER_GROUP = 5
const MIN_SAT_PER_CORE = 3
const MAX_SAT_PER_CORE = 7

const CORE_RADIUS = 8.0
const SAT_RADIUS = 4.0

const ORBIT_CORE_RADIUS = 90 // distance group centre → core
const ORBIT_SAT_RADIUS = 46
const ORBIT_JITTER = 8

// motion
const GROUP_BASE_SPEED = 0.03 // ambient drift px/frame
const CORE_ROT_SPEED = 0.0007 // rad/frame base

// interaction
const PUSH_DIST = 140 // influence radius (px)
const PUSH_FORCE = 3.2 // offset px impulse (scaled by closeness)
const OFFSET_DAMPING = 0.9 // how fast offsets decay back (0–1)
const HOVER_DIST = 80 // pulse radius

/***** Types *****************************************************/
interface Satellite {
  angle: number
  omega: number
  orbit: number
  hueShift: number
  offsetX: number
  offsetY: number
  x: number
  y: number
  r: number
}

interface Core {
  baseAngle: number
  rotDir: number
  hueShift: number
  satellites: Satellite[]
  offsetX: number
  offsetY: number
  x: number
  y: number
  r: number
}

interface Group {
  cx: number
  cy: number
  vx: number
  vy: number
  hue: number
  cores: Core[]
}

/***** State *****************************************************/
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let groups: Group[] = []
let animationId: number | null = null
const mouse = { x: -9999, y: -9999 }

const isCanvasInitialized = ref(false)
const showLayoutBackground = ref(true)

/***** Utils *****************************************************/
const rand = (a: number, b: number) => Math.random() * (b - a) + a

/***** Scene creation *******************************************/
function createScene(w: number, h: number) {
  groups = []

  // place groups in jittered grid
  const aspect = w / h
  const cols = Math.ceil(Math.sqrt(GROUP_COUNT * aspect))
  const rows = Math.ceil(GROUP_COUNT / cols)
  const cellW = w / cols
  const cellH = h / rows

  for (let i = 0; i < GROUP_COUNT; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = (col + 0.5) * cellW + rand(-cellW * 0.25, cellW * 0.25)
    const cy = (row + 0.5) * cellH + rand(-cellH * 0.25, cellH * 0.25)

    const coreCount = Math.floor(rand(MIN_CORES_PER_GROUP, MAX_CORES_PER_GROUP + 1))
    const hue = rand(0, 360)
    const cores: Core[] = []

    for (let c = 0; c < coreCount; c++) {
      const angle = ((Math.PI * 2) / coreCount) * c + rand(-0.4, 0.4)

      const satellites: Satellite[] = []
      for (let s = 0; s < Math.floor(rand(MAX_SAT_PER_CORE, MIN_SAT_PER_CORE + 1)); s++) {
        satellites.push({
          angle: rand(0, Math.PI * 2),
          omega: CORE_ROT_SPEED * rand(0.6, 1.4) * (Math.random() < 0.5 ? 1 : -1),
          orbit: ORBIT_SAT_RADIUS + rand(-ORBIT_JITTER, ORBIT_JITTER),
          hueShift: rand(-20, 20),
          offsetX: 0,
          offsetY: 0,
          x: 0,
          y: 0,
          r: SAT_RADIUS,
        })
      }

      cores.push({
        baseAngle: angle,
        rotDir: Math.random() < 0.5 ? 1 : -1,
        hueShift: rand(-15, 15),
        satellites,
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0,
        r: CORE_RADIUS,
      })
    }

    groups.push({
      cx,
      cy,
      vx: rand(-GROUP_BASE_SPEED, GROUP_BASE_SPEED),
      vy: rand(-GROUP_BASE_SPEED, GROUP_BASE_SPEED),
      hue,
      cores,
    })
  }
}

/***** Main loop *************************************************/
function step(w: number, h: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  for (const g of groups) {
    // background drift for group
    g.cx += g.vx
    g.cy += g.vy
    if (g.cx < -ORBIT_CORE_RADIUS) g.vx = Math.abs(g.vx)
    if (g.cx > w + ORBIT_CORE_RADIUS) g.vx = -Math.abs(g.vx)
    if (g.cy < -ORBIT_CORE_RADIUS) g.vy = Math.abs(g.vy)
    if (g.cy > h + ORBIT_CORE_RADIUS) g.vy = -Math.abs(g.vy)

    const coreCount = g.cores.length

    // --- update cores positions, interaction, draw open chain ---
    ctx.strokeStyle = `hsla(${g.hue},70%,68%,0.38)`
    ctx.lineWidth = 1.2
    ctx.beginPath()

    for (let idx = 0; idx < coreCount; idx++) {
      const core = g.cores[idx]
      core.baseAngle += CORE_ROT_SPEED * core.rotDir

      // base position on ring
      const bx = g.cx + Math.cos(core.baseAngle) * ORBIT_CORE_RADIUS
      const by = g.cy + Math.sin(core.baseAngle) * ORBIT_CORE_RADIUS

      // mouse push – per‑core
      applyPush(bx, by, core)

      // decay offset
      core.offsetX *= OFFSET_DAMPING
      core.offsetY *= OFFSET_DAMPING

      core.x = bx + core.offsetX
      core.y = by + core.offsetY

      // link to next core (open chain)
      if (idx < coreCount - 1) {
        const next = g.cores[idx + 1]
        const nx = g.cx + Math.cos(next.baseAngle) * ORBIT_CORE_RADIUS + next.offsetX
        const ny = g.cy + Math.sin(next.baseAngle) * ORBIT_CORE_RADIUS + next.offsetY
        ctx.moveTo(core.x, core.y)
        ctx.lineTo(nx, ny)
      }
    }
    ctx.stroke()

    // --- draw cores & satellites ---
    for (const core of g.cores) {
      const dcm = Math.hypot(core.x - mouse.x, core.y - mouse.y)
      const pulse = dcm < HOVER_DIST ? 1.4 : 1

      // core
      ctx.fillStyle = `hsl(${(g.hue + core.hueShift + 360) % 360},70%,60%)`
      ctx.beginPath()
      ctx.arc(core.x, core.y, core.r * pulse, 0, Math.PI * 2)
      ctx.fill()

      // satellites
      for (const sat of core.satellites) {
        sat.angle += sat.omega

        // base sat position relative to (possibly offset) core
        const sbx = core.x + Math.cos(sat.angle) * sat.orbit
        const sby = core.y + Math.sin(sat.angle) * sat.orbit

        applyPush(sbx, sby, sat)
        sat.offsetX *= OFFSET_DAMPING
        sat.offsetY *= OFFSET_DAMPING

        sat.x = sbx + sat.offsetX
        sat.y = sby + sat.offsetY

        const dsm = Math.hypot(sat.x - mouse.x, sat.y - mouse.y)
        const spulse = dsm < HOVER_DIST ? 1.3 : 1

        // spoke
        ctx.strokeStyle = `hsla(${g.hue},70%,75%,0.45)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(core.x, core.y)
        ctx.lineTo(sat.x, sat.y)
        ctx.stroke()

        // satellite
        ctx.fillStyle = `hsl(${(g.hue + core.hueShift + sat.hueShift + 360) % 360},70%,65%)`
        ctx.beginPath()
        ctx.arc(sat.x, sat.y, sat.r * spulse, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function applyPush(bx: number, by: number, node: { offsetX: number; offsetY: number }) {
  const dx = bx - mouse.x
  const dy = by - mouse.y
  const dist = Math.hypot(dx, dy)
  if (dist < PUSH_DIST && dist > 0.01) {
    const strength = (1 - dist / PUSH_DIST) * PUSH_FORCE
    node.offsetX += (dx / dist) * strength
    node.offsetY += (dy / dist) * strength
  }
}

/***** Canvas lifecycle *****************************************/
function resizeCanvas() {
  if (!canvas.value) return
  const dpr = window.devicePixelRatio || 1
  const { innerWidth: w, innerHeight: h } = window
  canvas.value.width = w * dpr
  canvas.value.height = h * dpr
  canvas.value.style.width = `${w}px`
  canvas.value.style.height = `${h}px`
  ctx?.scale(dpr, dpr)
  createScene(w, h)
}

function animate() {
  if (!canvas.value) return
  const w = canvas.value.width / (window.devicePixelRatio || 1)
  const h = canvas.value.height / (window.devicePixelRatio || 1)
  step(w, h)
  animationId = requestAnimationFrame(animate)
}

function onMouseMove(e: MouseEvent) {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')!

  resizeCanvas() // This also calls createScene
  isCanvasInitialized.value = true // Canvas is now sized and scene is ready

  // Delay hiding the layout background to match canvas fade-in
  setTimeout(() => {
    showLayoutBackground.value = false
  }, 300) // canvas transition-delay (0.15s) + transition-duration (0.15s) = 0.3s

  animationId = requestAnimationFrame(animate)
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', onMouseMove)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.auth-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding-top: 4rem;
}

.auth-background {
  background: radial-gradient(circle at center, rgb(46, 46, 82) 0%, rgb(19, 12, 45) 100%);
}

canvas {
  pointer-events: none;
  background: radial-gradient(circle at center, rgb(46, 46, 82) 0%, rgb(19, 12, 45) 100%);
  z-index: 1;
  transition: opacity 0.5s ease-out; /* Smooth fade-in */
}

.opacity-0 {
  opacity: 0;
}
</style>
