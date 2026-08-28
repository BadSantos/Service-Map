<script setup lang="ts">
import { computed, ref } from "vue";
import Badge from "@/components/ui/badge.vue";
import { useServiceData } from "@/contexts/service-data-context";
import type { CatalogDependency, CatalogEntity } from "@/lib/service-data-model";

export type TopologyViewLevel = "service" | "internal" | "external";

const props = defineProps<{
  selectedSvc: string | null;
  viewLevel: TopologyViewLevel;
  filterType: "all" | "http" | "external" | "internal" | "server";
}>();

const emit = defineEmits<{
  "update:selectedSvc": [value: string | null];
}>();

const { catalog } = useServiceData();
const nodeWidth = 160;
const nodeHeight = 44;
const font = "var(--app-font-mono)";

const pan = ref({ x: 40, y: 40 });
const zoom = ref(0.85);
const isDragging = ref(false);
const dragStart = ref<{ mx: number; my: number; tx: number; ty: number } | null>(null);
const hoveredNode = ref<string | null>(null);
const hoveredEdge = ref<string | null>(null);

type NodeGroup = "clients" | "services" | "servers" | "external";
type PositionedNode = { x: number; y: number; entity: CatalogEntity };

const groupedNodes = computed<Record<NodeGroup, CatalogEntity[]>>(() => {
  const groups: Record<NodeGroup, CatalogEntity[]> = {
    clients: [], services: [], servers: [], external: [],
  };
  for (const entity of catalog.entities) {
    if (entity.kind === "mobile_app" || entity.kind === "desktop_product") groups.clients.push(entity);
    else if (entity.kind === "service") groups.services.push(entity);
    else if (entity.kind === "server") groups.servers.push(entity);
    else if (entity.kind === "external_vendor" || entity.kind === "inferred_external") groups.external.push(entity);
  }
  return groups;
});

const visibleGroups = computed<NodeGroup[]>(() => {
  if (props.viewLevel === "service") return ["clients", "services"];
  if (props.viewLevel === "internal") return ["services", "servers"];
  return ["clients", "services", "external"];
});

const layout = computed<Record<string, PositionedNode>>(() => {
  const positions: Record<string, PositionedNode> = {};
  const configs: Record<NodeGroup, { x: number; cols: number }> = {
    clients: { x: 40, cols: 1 },
    services: { x: 260, cols: 3 },
    servers: { x: 880, cols: 2 },
    external: { x: 1300, cols: 1 },
  };
  for (const group of visibleGroups.value) {
    const config = configs[group];
    groupedNodes.value[group].forEach((entity, index) => {
      positions[entity.id] = {
        x: config.x + (index % config.cols) * (nodeWidth + 40),
        y: 80 + Math.floor(index / config.cols) * (nodeHeight + 20),
        entity,
      };
    });
  }
  return positions;
});

const edges = computed(() => catalog.dependencies.filter((dependency) =>
  Boolean(layout.value[dependency.sourceId] && layout.value[dependency.targetId])
  && (props.filterType === "all" || dependency.type === props.filterType),
));

const selectedEntity = computed(() => props.selectedSvc ? layout.value[props.selectedSvc]?.entity ?? null : null);
const selectedBuilds = computed(() => selectedEntity.value
  ? catalog.builds.filter((build) => build.productId === selectedEntity.value?.id)
  : []);
const outboundDependencies = computed(() => selectedEntity.value
  ? catalog.dependencies.filter((dependency) => dependency.sourceId === selectedEntity.value?.id)
  : []);
const inboundDependencies = computed(() => selectedEntity.value
  ? catalog.dependencies.filter((dependency) => dependency.targetId === selectedEntity.value?.id)
  : []);

function getEdgePath(sx: number, sy: number, tx: number, ty: number) {
  const x1 = sx + nodeWidth;
  const y1 = sy + nodeHeight / 2;
  const x2 = tx;
  const y2 = ty + nodeHeight / 2;
  if (x1 > x2 + 40) {
    const offset = Math.max(Math.abs(sx - (tx + nodeWidth)) * 0.4, 40);
    return `M ${sx} ${y1} C ${sx - offset} ${y1}, ${tx + nodeWidth + offset} ${y2}, ${tx + nodeWidth} ${y2}`;
  }
  const offset = Math.max(Math.abs(x1 - x2) * 0.4, 40);
  return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
}

function edgeStyle(type: string) {
  if (type === "http") return { stroke: "hsl(185 100% 50%)", dash: undefined, marker: "url(#topo-arrow-http)" };
  if (type === "internal") return { stroke: "hsl(290 100% 70%)", dash: "6 4", marker: "url(#topo-arrow-internal)" };
  if (type === "server") return { stroke: "hsl(145 70% 50%)", dash: "4 3", marker: "url(#topo-arrow-server)" };
  if (type === "external") return { stroke: "hsl(215 20% 50%)", dash: "8 4", marker: "url(#topo-arrow-external)" };
  return { stroke: "hsl(215 20% 40%)", dash: undefined, marker: "url(#topo-arrow-default)" };
}

function kindColor(kind: string) {
  if (kind === "server") return "hsl(145 70% 40%)";
  if (kind === "mobile_app" || kind === "desktop_product") return "hsl(290 60% 60%)";
  if (kind === "external_vendor" || kind === "inferred_external") return "hsl(35 90% 55%)";
  return "hsl(215 30% 45%)";
}

function kindLabel(kind: string) {
  return kind.replace("_", " ").toUpperCase();
}

function edgeOpacity(dependency: CatalogDependency) {
  const connected = hoveredNode.value === dependency.sourceId || hoveredNode.value === dependency.targetId;
  if (hoveredNode.value && !connected) return 0.05;
  return hoveredEdge.value === dependency.id || connected ? 1 : 0.4;
}

function edgeLabelPosition(dependency: CatalogDependency) {
  const source = layout.value[dependency.sourceId];
  const target = layout.value[dependency.targetId];
  const backwards = source.x + nodeWidth > target.x + 40;
  return {
    x: backwards ? (source.x + target.x + nodeWidth) / 2 : (source.x + nodeWidth + target.x) / 2,
    y: (source.y + nodeHeight / 2 + target.y + nodeHeight / 2) / 2,
  };
}

function peer(dependency: CatalogDependency, direction: "in" | "out") {
  const id = direction === "out" ? dependency.targetId : dependency.sourceId;
  return catalog.entities.find((entity) => entity.id === id)?.name ?? id;
}

function onMouseDown(event: MouseEvent) {
  if ((event.target as Element).closest("[data-node]")) return;
  isDragging.value = true;
  dragStart.value = { mx: event.clientX, my: event.clientY, tx: pan.value.x, ty: pan.value.y };
}
function onMouseMove(event: MouseEvent) {
  if (!isDragging.value || !dragStart.value) return;
  pan.value = {
    x: dragStart.value.tx + event.clientX - dragStart.value.mx,
    y: dragStart.value.ty + event.clientY - dragStart.value.my,
  };
}
function stopDragging() {
  isDragging.value = false;
  dragStart.value = null;
}
function onWheel(event: WheelEvent) {
  event.preventDefault();
  zoom.value = Math.max(0.15, Math.min(3, zoom.value * (event.deltaY > 0 ? 0.88 : 1.14)));
}
function toggleNode(id: string) {
  emit("update:selectedSvc", props.selectedSvc === id ? null : id);
}
</script>

<template>
  <div class="relative h-full w-full select-none overflow-hidden bg-background"
    :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
    @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="stopDragging" @mouseleave="stopDragging" @wheel="onWheel">
    <svg width="100%" height="100%" class="absolute inset-0">
      <defs>
        <marker v-for="marker in [
          ['http', 'hsl(185 100% 50%)', 8, 6, 7, 3], ['internal', 'hsl(290 100% 70%)', 8, 6, 7, 3],
          ['server', 'hsl(145 70% 50%)', 6, 5, 5, 2.5], ['external', 'hsl(215 20% 50%)', 8, 6, 7, 3],
          ['default', 'hsl(215 20% 40%)', 8, 6, 7, 3],
        ]" :id="`topo-arrow-${marker[0]}`" :key="String(marker[0])" :marker-width="marker[2]" :marker-height="marker[3]" :ref-x="marker[4]" :ref-y="marker[5]" orient="auto">
          <polygon :points="`0 0, ${marker[2]} ${Number(marker[3]) / 2}, 0 ${marker[3]}`" :fill="String(marker[1])" />
        </marker>
      </defs>
      <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
        <text v-if="visibleGroups.includes('clients')" x="120" y="30" text-anchor="middle" :style="{ fontSize: '11px', fontFamily: font, fill: 'hsl(215 20% 40%)', letterSpacing: '0.1em', fontWeight: 700 }">PRODUCTS &amp; APPS</text>
        <text v-if="visibleGroups.includes('services')" x="540" y="30" text-anchor="middle" :style="{ fontSize: '11px', fontFamily: font, fill: 'hsl(215 20% 40%)', letterSpacing: '0.1em', fontWeight: 700 }">INTERNAL SERVICES</text>
        <text v-if="visibleGroups.includes('servers')" x="1060" y="30" text-anchor="middle" :style="{ fontSize: '11px', fontFamily: font, fill: 'hsl(215 20% 40%)', letterSpacing: '0.1em', fontWeight: 700 }">INFRASTRUCTURE</text>
        <text v-if="visibleGroups.includes('external')" x="1380" y="30" text-anchor="middle" :style="{ fontSize: '11px', fontFamily: font, fill: 'hsl(215 20% 40%)', letterSpacing: '0.1em', fontWeight: 700 }">EXTERNAL VENDORS</text>

        <g v-for="dependency in edges" :key="dependency.id" :opacity="edgeOpacity(dependency)">
          <path :d="getEdgePath(layout[dependency.sourceId].x, layout[dependency.sourceId].y, layout[dependency.targetId].x, layout[dependency.targetId].y)" fill="none" stroke="transparent" stroke-width="16"
            :style="{ cursor: 'crosshair', pointerEvents: isDragging ? 'none' : 'stroke' }" @mouseenter="hoveredEdge = dependency.id" @mouseleave="hoveredEdge = null" />
          <path :d="getEdgePath(layout[dependency.sourceId].x, layout[dependency.sourceId].y, layout[dependency.targetId].x, layout[dependency.targetId].y)" fill="none"
            :stroke="edgeStyle(dependency.type).stroke" :stroke-width="hoveredEdge === dependency.id ? 2.5 : 1.5" :stroke-dasharray="edgeStyle(dependency.type).dash" :marker-end="edgeStyle(dependency.type).marker" style="pointer-events: none" />
          <g v-if="hoveredEdge === dependency.id" style="pointer-events: none">
            <rect :x="edgeLabelPosition(dependency).x - 60" :y="edgeLabelPosition(dependency).y - 12" width="120" height="24" rx="4" fill="hsl(var(--popover))" stroke="hsl(var(--popover-border))" />
            <text :x="edgeLabelPosition(dependency).x" :y="edgeLabelPosition(dependency).y + 4" text-anchor="middle" :style="{ fontSize: '9.5px', fontFamily: font, fill: 'hsl(var(--foreground))', fontWeight: 600 }">{{ dependency.type.toUpperCase() }}</text>
          </g>
        </g>

        <g v-for="(position, id) in layout" :key="id" data-node="true" :data-testid="`node-${id}`"
          :style="{ cursor: 'pointer', opacity: hoveredNode && hoveredNode !== id && props.selectedSvc !== id ? 0.25 : 1 }"
          @mouseenter="hoveredNode = id" @mouseleave="hoveredNode = null" @click="toggleNode(id)">
          <rect v-if="hoveredNode === id || props.selectedSvc === id || (hoveredEdge && edges.some((edge) => edge.id === hoveredEdge && (edge.sourceId === id || edge.targetId === id)))"
            :x="position.x - 4" :y="position.y - 4" :width="nodeWidth + 8" :height="nodeHeight + 8" rx="8" fill="none"
            :stroke="props.selectedSvc === id ? 'hsl(185 100% 55%)' : kindColor(position.entity.kind)" stroke-width="1.5" opacity=".6" />
          <rect :x="position.x" :y="position.y" :width="nodeWidth" :height="nodeHeight" rx="6"
            :fill="props.selectedSvc === id ? 'hsl(var(--secondary))' : 'hsl(var(--card))'"
            :stroke="hoveredNode === id || props.selectedSvc === id || hoveredEdge ? kindColor(position.entity.kind) : 'hsl(var(--card-border))'" :stroke-width="props.selectedSvc === id ? 1.5 : 1" />
          <circle :cx="position.x + 14" :cy="position.y + nodeHeight / 2" r="4" :fill="kindColor(position.entity.kind)" />
          <text :x="position.x + 26" :y="position.y + nodeHeight / 2 + 1" :style="{ fontSize: '11.5px', fontFamily: font, fill: 'hsl(var(--foreground))', fontWeight: 600, pointerEvents: 'none' }">{{ position.entity.name.length > 18 ? `${position.entity.name.slice(0, 16)}…` : position.entity.name }}</text>
          <text :x="position.x + 26" :y="position.y + nodeHeight / 2 + 13" :style="{ fontSize: '8px', fontFamily: font, fill: position.entity.status && position.entity.status !== 'active' ? 'hsl(350 90% 60%)' : 'hsl(var(--muted-foreground))', pointerEvents: 'none' }">{{ position.entity.status && position.entity.status !== "active" ? position.entity.status.toUpperCase() : kindLabel(position.entity.kind) }}</text>
        </g>
      </g>
    </svg>

    <Transition name="topology-popup">
      <aside v-if="selectedEntity" class="absolute bottom-6 right-3 z-20 w-[calc(100vw-1.5rem)] max-w-[420px] rounded-xl border border-card-border bg-card/95 px-5 py-4 shadow-2xl backdrop-blur-md sm:right-6" @mousedown.stop @wheel.stop>
        <div class="mb-2 flex items-start justify-between gap-2">
          <div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: kindColor(selectedEntity.kind) }" /><span class="font-mono text-sm font-bold text-foreground" data-testid="text-selected-node-name">{{ selectedEntity.name }}</span></div>
          <button class="mt-0.5 text-xs leading-none text-muted-foreground hover:text-foreground" data-testid="button-close-node" @click="emit('update:selectedSvc', null)">✕</button>
        </div>
        <div class="mb-3 flex gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"><span>{{ selectedEntity.kind.replace("_", " ") }}</span><span v-if="selectedEntity.team">· TEAM: {{ selectedEntity.team }}</span></div>
        <p v-if="selectedEntity.description" class="mb-4 text-xs leading-relaxed text-muted-foreground">{{ selectedEntity.description }}</p>
        <div class="max-h-[400px] space-y-4 overflow-y-auto pb-2 pr-2">
          <div class="flex flex-wrap gap-2 text-[10px]">
            <Badge v-if="selectedEntity.location" variant="outline" class="bg-background">Loc: {{ selectedEntity.location }}</Badge><Badge v-if="selectedEntity.trafficLimit" variant="outline" class="bg-background">Traffic: {{ selectedEntity.trafficLimit }}</Badge>
            <Badge v-for="brand in selectedEntity.brands" :key="`brand-${brand}`" variant="secondary" class="bg-secondary/50">Brand: {{ brand }}</Badge><Badge v-for="datacenter in selectedEntity.datacenters" :key="`dc-${datacenter}`" variant="outline" class="border-primary/30 bg-primary/5 text-primary/80">{{ datacenter }}</Badge><Badge v-for="ip in selectedEntity.ips" :key="`ip-${ip}`" variant="outline" class="bg-background font-mono">{{ ip }}</Badge>
          </div>
          <div v-if="selectedEntity.note" class="rounded border border-border/50 bg-muted/30 p-2 text-xs text-muted-foreground"><span class="font-semibold text-foreground/70">Note: </span>{{ selectedEntity.note }}</div>
          <section v-if="selectedEntity.urls.length"><h3 class="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Endpoints</h3><div class="flex flex-col gap-1"><div v-for="url in selectedEntity.urls" :key="`${url.kind}-${url.url}`" class="flex items-center gap-2 text-[10px] font-mono"><span class="rounded bg-primary/10 px-1 py-0.5 text-primary/70">{{ url.kind }}</span><a :href="url.url" target="_blank" rel="noreferrer" class="truncate text-muted-foreground underline underline-offset-2 hover:text-primary">{{ url.url.replace("https://", "") }}</a></div></div></section>
          <section v-if="selectedBuilds.length"><h3 class="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Product Builds</h3><div class="space-y-1"><div v-for="build in selectedBuilds" :key="build.id" class="flex items-center justify-between rounded border border-card-border/60 bg-background/50 px-2 py-1.5 text-[10px] font-mono"><span class="truncate font-semibold text-primary">{{ build.name }}</span><div class="ml-2 flex shrink-0 items-center gap-2 text-muted-foreground"><span class="uppercase">{{ build.os }}</span><span class="uppercase">{{ build.brand }}</span><span :class="build.status === 'active' ? 'text-emerald-500' : 'text-amber-500'">{{ build.status }}</span></div></div></div></section>
          <section v-if="outboundDependencies.length"><h3 class="mb-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>Outbound Dependencies</span><span class="rounded bg-card-border/40 px-1 font-mono">{{ outboundDependencies.length }}</span></h3><div class="space-y-1.5"><div v-for="dependency in outboundDependencies" :key="dependency.id" class="rounded border border-card-border/60 bg-background/50 px-2 py-1.5 text-[10px]"><div class="mb-1 flex items-center justify-between"><span class="mr-2 truncate font-semibold text-foreground" :title="peer(dependency, 'out')">{{ peer(dependency, "out") }}</span><span class="shrink-0 rounded bg-primary/10 px-1 font-mono text-[9px] uppercase text-primary/80">{{ dependency.type }}</span></div><div v-if="dependency.host || dependency.endpoint" class="mb-0.5 truncate font-mono text-muted-foreground/80">{{ dependency.host ?? "" }}{{ dependency.endpoint ?? "" }}</div><div v-if="dependency.minVersion || dependency.maxVersion" class="font-mono text-[9px] text-muted-foreground/70">v: {{ dependency.minVersion ?? "*" }} - {{ dependency.maxVersion ?? "*" }}</div><div v-if="dependency.endpoints.length" class="mt-1 flex flex-wrap gap-1"><span v-for="endpoint in dependency.endpoints" :key="endpoint" class="max-w-full truncate rounded bg-muted px-1 py-px font-mono text-[9px] text-muted-foreground">{{ endpoint }}</span></div></div></div></section>
          <section v-if="inboundDependencies.length"><h3 class="mb-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>Inbound Dependencies</span><span class="rounded bg-card-border/40 px-1 font-mono">{{ inboundDependencies.length }}</span></h3><div class="space-y-1.5"><div v-for="dependency in inboundDependencies" :key="dependency.id" class="rounded border border-card-border/60 bg-background/50 px-2 py-1.5 text-[10px]"><div class="mb-1 flex items-center justify-between"><span class="mr-2 truncate font-semibold text-foreground" :title="peer(dependency, 'in')">{{ peer(dependency, "in") }}</span><span class="shrink-0 rounded bg-primary/10 px-1 font-mono text-[9px] uppercase text-primary/80">{{ dependency.type }}</span></div><div v-if="dependency.host || dependency.endpoint" class="truncate font-mono text-muted-foreground/80">{{ dependency.host ?? "" }}{{ dependency.endpoint ?? "" }}</div></div></div></section>
          <div v-if="selectedEntity.links.length" class="flex flex-wrap gap-3 border-t border-card-border/50 pt-2"><a v-for="link in selectedEntity.links" :key="`${link.kind}-${link.url}`" :href="link.url" target="_blank" rel="noopener noreferrer" class="text-xs capitalize text-primary/80 underline underline-offset-2 hover:text-primary">{{ link.kind }} →</a></div>
        </div>
      </aside>
    </Transition>
    <div class="pointer-events-none absolute bottom-6 left-6 select-none rounded bg-background/50 px-2 py-1 text-[10px] text-muted-foreground/50 backdrop-blur-sm">drag to pan · scroll to zoom · click node for details</div>
  </div>
</template>

<style scoped>
.topology-popup-enter-active, .topology-popup-leave-active { transition: opacity .15s ease, transform .15s ease; }
.topology-popup-enter-from, .topology-popup-leave-to { opacity: 0; transform: translateY(10px) scale(.97); }
</style>