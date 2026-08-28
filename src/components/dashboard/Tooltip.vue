<script setup lang="ts">
import { computed } from "vue";
import { useServiceData } from "@/contexts/service-data-context";
type Health = "healthy" | "degraded" | "down";
const props = defineProps<{ hoveredNode: string | null; serviceHealth: Record<string, Health>; incidentStart: Record<string, number> }>();
const { clusterMap } = useServiceData();
const node = computed(() => props.hoveredNode ? clusterMap.services.find(service => service.id === props.hoveredNode) : null);
const health = computed<Health>(() => props.hoveredNode ? props.serviceHealth[props.hoveredNode] ?? "healthy" : "healthy");
const healthLabel = computed(() => ({ healthy: "Healthy", degraded: "Degraded", down: "Down" }[health.value]));
const healthColor = computed(() => ({ healthy: "hsl(145 70% 60%)", degraded: "hsl(38 92% 50%)", down: "hsl(350 90% 60%)" }[health.value]));
function elapsed(start?: number) {
  if (!start) return "0s";
  const seconds = Math.floor((Date.now() - start) / 1000);
  return seconds > 59 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}
</script>

<template>
  <div v-if="node" class="pointer-events-none absolute left-1/2 top-1/2 z-30 min-w-[230px] -translate-x-1/2 translate-y-[100px] rounded border border-card-border bg-card p-3 text-sm shadow-xl">
    <div class="mb-1 flex items-center justify-between">
      <div class="font-mono font-semibold text-primary">{{ node.name }}</div>
      <div class="text-[10px] font-semibold uppercase tracking-wider" :style="{ color: healthColor }"><span v-if="health === 'down'" class="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full" :style="{ backgroundColor: healthColor }" />{{ healthLabel }}</div>
    </div>
    <div class="mb-2 flex gap-2 text-xs text-muted-foreground"><span>{{ node.region }}</span><span>&bull;</span><span class="font-mono text-primary/70">{{ node.datacenter }}</span></div>
    <div v-if="health !== 'healthy' && incidentStart[node.id]" class="mb-2 rounded px-1.5 py-0.5 font-mono text-[10px]" :style="{ color: healthColor, backgroundColor: health === 'down' ? 'hsl(350 90% 60% / .12)' : 'hsl(38 92% 50% / .12)' }">Incident: {{ elapsed(incidentStart[node.id]) }}</div>
    <div class="mb-3 grid grid-cols-2 gap-1.5">
      <div class="rounded border border-card-border bg-background/60 p-1.5"><div class="mb-0.5 text-[9px] text-muted-foreground">▣ Services</div><div class="font-mono text-sm font-bold">{{ node.serviceCount }}</div></div>
      <div class="rounded border border-card-border bg-background/60 p-1.5"><div class="mb-0.5 text-[9px] text-muted-foreground">▤ Replicas</div><div class="font-mono text-sm font-bold">{{ node.totalReplicas }}</div></div>
    </div>
    <p class="mb-2 line-clamp-3 text-xs leading-snug text-foreground/80">{{ node.description }}</p>
    <div class="text-center text-[10px] text-muted-foreground">click to pin · see all services</div>
  </div>
</template>