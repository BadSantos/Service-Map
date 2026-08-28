<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { Health, NetworkEdge } from "@/lib/service-data-model";
import { historicalLatency } from "@/lib/service-data-model";
import { useServiceData } from "@/contexts/service-data-context";
import EdgePopup from "@/components/dashboard/EdgePopup.vue";

const props = defineProps<{
  latencyThreshold: number;
  isPlaying: boolean;
  hoveredNode: string | null;
  selectedNode: string | null;
  serviceHealth: Record<string, Health>;
  historyMinutes: number;
}>();
const emit = defineEmits<{
  "update:hoveredNode": [id: string | null];
  "update:selectedNode": [id: string | null];
}>();
const { clusterMap } = useServiceData();
const mapRoot = ref<HTMLElement | null>(null);
const width = ref(1280);
const height = ref(720);
const rotation = ref<[number, number]>([-40, -45]);
const scale = ref(220);
const dragging = ref(false);
const dragStart = ref<{ x: number; y: number; rotation: [number, number] } | null>(null);
const mouse = ref({ x: 0, y: 0 });
const hoveredEdge = ref<string | null>(null);
const liveEdges = ref<NetworkEdge[]>(clusterMap.initialEdges.map(edge => ({ ...edge })));
const topology = ref<Topology | null>(null);
const isLive = computed(() => props.historyMinutes === 0);
const effectiveHealth = computed(() => isLive.value ? props.serviceHealth : {});
const edges = computed(() => isLive.value
  ? liveEdges.value
  : clusterMap.initialEdges.map(edge => ({ ...edge, currentLatencyMs: historicalLatency(edge, Date.now() - props.historyMinutes * 60 * 1000) })));
const visibleEdges = computed(() => edges.value.filter(edge => edge.currentLatencyMs >= props.latencyThreshold));
const hoveredEdgeData = computed(() => hoveredEdge.value ? edges.value.find(edge => edge.id === hoveredEdge.value) ?? null : null);

interface Topology {
  type: "Topology";
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: number[][][];
  objects: { countries: { type: "GeometryCollection"; geometries: Geometry[] } };
}
interface Geometry {
  type: "Polygon" | "MultiPolygon";
  arcs: number[][] | number[][][];
}
type Point = [number, number];

function decodeArcs(data: Topology) {
  const scaleTransform = data.transform?.scale ?? [1, 1];
  const translate = data.transform?.translate ?? [0, 0];
  return data.arcs.map(arc => {
    let x = 0; let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scaleTransform[0] + translate[0], y * scaleTransform[1] + translate[1]] as Point;
    });
  });
}
function ringPath(ring: number[], arcs: Point[][]) {
  const points = ring.flatMap(index => {
    const arc = arcs[index < 0 ? ~index : index] ?? [];
    return index < 0 ? [...arc].reverse() : arc;
  });
  const projected = points
    .map(point => project(point[0], point[1]))
    .filter((point): point is Point => point !== null);
  if (projected.length < 3) return "";
  return projected
    .map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(1)},${point[1].toFixed(1)}`)
    .join(" ") + " Z";
}
const decodedCountryPaths = computed(() => {
  if (!topology.value) return [];
  const arcs = decodeArcs(topology.value);
  return topology.value.objects.countries.geometries.flatMap(geometry => {
    const rings = geometry.type === "Polygon" ? geometry.arcs as number[][] : (geometry.arcs as number[][][]).flat();
    return rings.map(ring => ringPath(ring, arcs)).filter(Boolean);
  });
});

function project(lng: number, lat: number): Point | null {
  const lambda = (lng + rotation.value[0]) * Math.PI / 180;
  const phi = lat * Math.PI / 180;
  const phi0 = -rotation.value[1] * Math.PI / 180;
  const visible = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  if (visible < -0.05) return null;
  return [
    width.value / 2 + scale.value * Math.cos(phi) * Math.sin(lambda),
    height.value / 2 - scale.value * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
  ];
}
function pointFor(id: string) {
  const node = clusterMap.services.find(service => service.id === id);
  return node ? project(node.lng, node.lat) : null;
}
function edgePath(edge: NetworkEdge) {
  const source = pointFor(edge.sourceId); const target = pointFor(edge.targetId);
  if (!source || !target) return "";
  const mx = (source[0] + target[0]) / 2; const my = (source[1] + target[1]) / 2;
  const bend = Math.min(45, Math.hypot(target[0] - source[0], target[1] - source[1]) * .18);
  return `M ${source[0]} ${source[1]} Q ${mx} ${my - bend} ${target[0]} ${target[1]}`;
}
function edgeColor(edge: NetworkEdge) {
  const source = effectiveHealth.value[edge.sourceId] ?? "healthy";
  const target = effectiveHealth.value[edge.targetId] ?? "healthy";
  if (source === "down" || target === "down" || edge.currentLatencyMs > 150) return "hsl(350 90% 60%)";
  if (source === "degraded" || target === "degraded") return "hsl(38 92% 50%)";
  if (edge.currentLatencyMs > 80) return "hsl(290 100% 60%)";
  return "hsl(185 100% 50%)";
}
function edgeOpacity(edge: NetworkEdge) {
  const highlighted = hoveredEdge.value === edge.id || props.hoveredNode === edge.sourceId || props.hoveredNode === edge.targetId || props.selectedNode === edge.sourceId || props.selectedNode === edge.targetId;
  return ((props.hoveredNode || props.selectedNode) && !highlighted) || (hoveredEdge.value && hoveredEdge.value !== edge.id) ? .08 : 1;
}
function nodeColor(id: string) {
  return ({ healthy: "hsl(185 100% 50%)", degraded: "hsl(38 92% 50%)", down: "hsl(350 90% 60%)" }[effectiveHealth.value[id] ?? "healthy"]);
}
function graticulePath(fixedCoordinate: number, isLatitude: boolean) {
  const points: string[] = [];
  for (let value = -180; value <= 180; value += 5) {
    const point = project(
      isLatitude ? value : fixedCoordinate,
      isLatitude ? fixedCoordinate : value,
    );
    if (point) points.push(`${points.length ? "L" : "M"}${point[0].toFixed(1)},${point[1].toFixed(1)}`);
  }
  return points.join(" ");
}
function onDown(event: MouseEvent) {
  if ((event.target as Element).closest("button,a")) return;
  dragging.value = true;
  dragStart.value = { x: event.clientX, y: event.clientY, rotation: [...rotation.value] };
  hoveredEdge.value = null; emit("update:hoveredNode", null);
}
function onMove(event: MouseEvent) {
  const rect = mapRoot.value?.getBoundingClientRect();
  if (rect) mouse.value = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  if (!dragging.value || !dragStart.value) return;
  const sensitivity = 120 / scale.value;
  rotation.value = [dragStart.value.rotation[0] - (event.clientX - dragStart.value.x) * sensitivity, Math.max(-85, Math.min(85, dragStart.value.rotation[1] + (event.clientY - dragStart.value.y) * sensitivity))];
}
function onUp() { dragging.value = false; dragStart.value = null; }
function onWheel(event: WheelEvent) {
  event.preventDefault();
  scale.value = Math.max(120, Math.min(900, scale.value + (event.deltaY > 0 ? -25 : 25)));
}
function toggleNode(id: string) { emit("update:selectedNode", props.selectedNode === id ? null : id); }
let animationFrame = 0;
function animateTraffic() {
  liveEdges.value = liveEdges.value.map(edge => ({ ...edge, currentLatencyMs: edge.baseLatencyMs + Math.sin(Date.now() / 1000 + edge.distance) * 20 + Math.random() * 10 }));
  animationFrame = requestAnimationFrame(animateTraffic);
}
function resize() {
  if (!mapRoot.value) return;
  width.value = mapRoot.value.clientWidth || 1280;
  height.value = mapRoot.value.clientHeight || 720;
}
watch(() => [props.isPlaying, isLive.value], ([playing, live]) => {
  cancelAnimationFrame(animationFrame);
  if (playing && live) animationFrame = requestAnimationFrame(animateTraffic);
});
onMounted(async () => {
  resize(); window.addEventListener("resize", resize);
  const response = await fetch(`${import.meta.env.BASE_URL}countries-110m.json`);
  if (response.ok) topology.value = await response.json() as Topology;
});
onUnmounted(() => { cancelAnimationFrame(animationFrame); window.removeEventListener("resize", resize); });
</script>

<template>
  <div ref="mapRoot" class="relative h-full w-full select-none overflow-hidden bg-background" :style="{ cursor: dragging ? 'grabbing' : 'grab' }"
    @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp" @wheel="onWheel">
    <svg width="100%" height="100%" class="absolute inset-0" :viewBox="`0 0 ${width} ${height}`">
      <defs><radialGradient id="globe-ocean"><stop offset="0" stop-color="hsl(var(--map-ocean))" /><stop offset="1" stop-color="hsl(var(--map-ocean-border))" /></radialGradient></defs>
      <circle :cx="width / 2" :cy="height / 2" :r="scale" fill="url(#globe-ocean)" stroke="hsl(var(--map-ocean-border))" stroke-width=".8" />
      <path v-for="lat in [-60,-30,0,30,60]" :key="`lat-${lat}`" :d="graticulePath(lat, true)" fill="none" stroke="hsl(var(--map-grid))" stroke-width=".5" />
      <path v-for="lng in [-120,-60,0,60,120]" :key="`lng-${lng}`" :d="graticulePath(lng, false)" fill="none" stroke="hsl(var(--map-grid))" stroke-width=".5" />
      <path v-for="(path, index) in decodedCountryPaths" :key="`country-${index}`" :d="path" fill="hsl(var(--map-land))" stroke="hsl(var(--map-land-border))" stroke-width=".45" />
      <template v-for="edge in visibleEdges" :key="edge.id">
        <path :d="edgePath(edge)" fill="none" :stroke="edgeColor(edge)" :stroke-width="hoveredEdge === edge.id ? 3 : 1.5" :opacity="edgeOpacity(edge)" :class="edge.type === 'sync' ? 'edge-sync' : 'edge-async'" />
        <path :d="edgePath(edge)" fill="none" stroke="transparent" stroke-width="18" :style="{ pointerEvents: dragging ? 'none' : 'stroke' }" @mouseenter="!dragging && (hoveredEdge = edge.id)" @mouseleave="hoveredEdge = null" />
      </template>
      <g v-for="node in clusterMap.services" :key="node.id" :transform="`translate(${(pointFor(node.id)?.[0] ?? -100)},${(pointFor(node.id)?.[1] ?? -100)})`"
        :style="{ opacity: ((props.hoveredNode || props.selectedNode || hoveredEdge) && props.hoveredNode !== node.id && props.selectedNode !== node.id) ? .2 : 1, pointerEvents: dragging ? 'none' : 'auto' }"
        @mouseenter="emit('update:hoveredNode', node.id); hoveredEdge = null" @mouseleave="emit('update:hoveredNode', null)" @click="toggleNode(node.id)">
        <circle v-if="(effectiveHealth[node.id] ?? 'healthy') !== 'healthy'" r="8" fill="none" :stroke="nodeColor(node.id)" stroke-width="1.5" class="alarm-ring" />
        <circle :r="props.selectedNode === node.id ? 8 : 6" :fill="nodeColor(node.id)" stroke="hsl(var(--map-node-border))" stroke-width="1.5" :class="(effectiveHealth[node.id] ?? 'healthy') === 'healthy' ? 'node-pulse' : ''" />
        <text v-if="props.selectedNode === node.id || props.hoveredNode === node.id" y="-18" text-anchor="middle" :style="{ fontFamily: 'var(--app-font-mono)', fontSize: '11px', fill: 'hsl(var(--foreground))', pointerEvents: 'none' }">{{ node.name }}</text>
      </g>
    </svg>
    <div v-if="!dragging" class="pointer-events-none absolute bottom-20 right-6 text-[10px] text-muted-foreground/40">drag to rotate · scroll to zoom</div>
    <Transition name="topology-popup"><EdgePopup v-if="hoveredEdgeData && !dragging" :edge="hoveredEdgeData" :service-health="effectiveHealth" :mouse-x="mouse.x" :mouse-y="mouse.y" :container-width="width" :container-height="height" /></Transition>
  </div>
</template>

<style scoped>
.alarm-ring { animation: map-ring 1s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes map-ring { 0%, 100% { opacity: .8; transform: scale(1); } 50% { opacity: 0; transform: scale(2.5); } }
</style>