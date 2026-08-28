<script setup lang="ts">
import { computed } from "vue";
import type { NetworkEdge, Health } from "@/lib/service-data-model";
import { useServiceData } from "@/contexts/service-data-context";
import Badge from "@/components/ui/badge.vue";
const props = defineProps<{
  edge: NetworkEdge;
  serviceHealth: Record<string, Health>;
  mouseX: number;
  mouseY: number;
  containerWidth: number;
  containerHeight: number;
}>();
const { clusterMap } = useServiceData();
const source = computed(() => clusterMap.services.find(service => service.id === props.edge.sourceId));
const target = computed(() => clusterMap.services.find(service => service.id === props.edge.targetId));
const srcHealth = computed(() => props.serviceHealth[props.edge.sourceId] ?? "healthy");
const tgtHealth = computed(() => props.serviceHealth[props.edge.targetId] ?? "healthy");
const healthColor = (health: Health) => ({ healthy: "hsl(145 70% 60%)", degraded: "hsl(38 92% 50%)", down: "hsl(350 90% 60%)" }[health]);
const latencyColor = computed(() => props.edge.currentLatencyMs > 150 ? "hsl(350 90% 60%)" : props.edge.currentLatencyMs > 80 ? "hsl(290 100% 60%)" : "hsl(185 100% 50%)");
const latencyLabel = computed(() => props.edge.currentLatencyMs > 150 ? "High" : props.edge.currentLatencyMs > 80 ? "Medium" : "Low");
const left = computed(() => {
  const width = 300;
  const gap = 16;
  const right = props.mouseX + gap + width > props.containerWidth - gap ? props.mouseX - width - gap : props.mouseX + gap;
  return Math.max(gap, right);
});
const top = computed(() => Math.max(16, Math.min(props.containerHeight - 276, props.mouseY - 130)));
const affected = computed(() => srcHealth.value !== "healthy" || tgtHealth.value !== "healthy");
const errorColor = computed(() => props.edge.errorRate > .05 ? "hsl(350 90% 60%)" : props.edge.errorRate > .01 ? "hsl(38 92% 50%)" : "hsl(145 70% 60%)");
</script>

<template>
  <div v-if="source && target" class="pointer-events-none absolute z-40 w-[300px] transition-all duration-150" :style="{ left: `${left}px`, top: `${top}px` }">
    <div class="overflow-hidden rounded-lg border border-card-border bg-card shadow-2xl">
      <div class="space-y-1 border-b border-card-border bg-background/60 px-3 py-2.5">
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="h-4 px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider" :style="{ borderColor: props.edge.type === 'sync' ? 'hsl(185 100% 50% / .5)' : 'hsl(290 100% 60% / .5)', color: props.edge.type === 'sync' ? 'hsl(185 100% 50%)' : 'hsl(290 100% 60%)' }">{{ props.edge.type === "sync" ? "ϟ" : "◌" }} {{ props.edge.type }}</Badge>
          <span class="text-[10px] text-muted-foreground">{{ props.edge.type === "sync" ? "Synchronous call" : "Async message" }}</span>
        </div>
        <p class="font-mono text-[10px] leading-snug text-foreground/80">{{ props.edge.label }}</p>
      </div>
      <div class="space-y-3 p-3">
        <div class="flex items-center gap-1.5">
          <div class="min-w-0 flex-1"><div class="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">From</div><div class="truncate font-mono text-xs font-semibold" :style="{ color: healthColor(srcHealth) }">{{ source.name }}</div><div class="truncate text-[9px] text-muted-foreground">{{ source.datacenter }} · {{ source.region }}</div></div>
          <span class="shrink-0 text-muted-foreground">→</span>
          <div class="min-w-0 flex-1 text-right"><div class="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">To</div><div class="truncate font-mono text-xs font-semibold" :style="{ color: healthColor(tgtHealth) }">{{ target.name }}</div><div class="truncate text-[9px] text-muted-foreground">{{ target.datacenter }} · {{ target.region }}</div></div>
        </div>
        <div v-if="affected" class="flex items-center gap-1.5 rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] text-destructive">⚠ {{ srcHealth === "down" || tgtHealth === "down" ? "One or more datacenters are down" : "Degraded performance detected" }}</div>
        <div class="grid grid-cols-3 gap-1.5">
          <div class="col-span-3 rounded border border-card-border bg-background/60 p-2"><div class="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground"><span>◷ Latency</span><span :style="{ color: latencyColor }">{{ latencyLabel }}</span></div><div class="flex items-baseline gap-1"><span class="font-mono text-base font-bold leading-none" :style="{ color: latencyColor }">{{ Math.round(props.edge.currentLatencyMs) }}</span><span class="text-[10px] text-muted-foreground">ms</span><span class="ml-auto text-[9px] text-muted-foreground">base {{ Math.round(props.edge.baseLatencyMs) }}ms</span></div><div class="mt-1 h-1 w-full overflow-hidden rounded-full bg-card-border"><div class="h-full rounded-full" :style="{ width: `${Math.min(100, props.edge.currentLatencyMs / 2)}%`, backgroundColor: latencyColor }" /></div></div>
          <div class="rounded border border-card-border bg-background/60 p-2"><div class="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">Activity</div><div class="font-mono text-sm font-bold leading-none">{{ props.edge.rps }} <span class="text-[9px] font-normal">RPS</span></div></div>
          <div class="col-span-2 rounded border border-card-border bg-background/60 p-2"><div class="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">Error Rate</div><div class="font-mono text-sm font-bold leading-none" :style="{ color: errorColor }">{{ (props.edge.errorRate * 100).toFixed(2) }}%</div></div>
        </div>
        <div class="flex items-center justify-between border-t border-card-border pt-2 text-[9px] text-muted-foreground"><span :style="{ color: healthColor(srcHealth) }">● {{ srcHealth }}</span><span>·</span><span :style="{ color: healthColor(tgtHealth) }">● {{ tgtHealth }}</span></div>
      </div>
    </div>
  </div>
</template>