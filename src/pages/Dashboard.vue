<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useServiceData } from "@/contexts/service-data-context";
import { useUrlState } from "@/composables/use-url-state";
import type { Health } from "@/lib/service-data-model";
import type { ViewLevel } from "@/lib/url-state";
import FilterBar from "@/components/dashboard/FilterBar.vue";
import WorldMap from "@/components/dashboard/WorldMap.vue";
import TopologyGraph from "@/components/dashboard/TopologyGraph.vue";
import Legend from "@/components/dashboard/Legend.vue";
import Tooltip from "@/components/dashboard/Tooltip.vue";
import SidePanel from "@/components/dashboard/SidePanel.vue";

type FilterType = "all" | "http" | "external" | "internal" | "server";
const { clusterMap } = useServiceData();
const { state: urlState, setState } = useUrlState();
const viewLevel = ref<ViewLevel>(urlState.view);
const filterType = ref<FilterType>(urlState.type);
const latencyThreshold = ref(urlState.lat);
const historyMinutes = ref(urlState.t);
const selectedNode = ref<string | null>(urlState.node);
const selectedTopoSvc = ref<string | null>(urlState.svc);
const isPlaying = ref(false);
const hoveredNode = ref<string | null>(null);
const serviceHealth = ref<Record<string, Health>>({});
const incidentStart = ref<Record<string, number>>({});
const elapsed = ref<Record<string, number>>({});
const degradeTicks: Record<string, number> = {};
const downTicks: Record<string, number> = {};
const downDuration: Record<string, number> = {};
let ticksUntilNextDegrade = 12;
let simulationTimer: number | undefined;
const isLive = computed(() => historyMinutes.value === 0);
const downServices = computed(() => clusterMap.services.filter(service => (serviceHealth.value[service.id] ?? "healthy") === "down"));
const degradedServices = computed(() => clusterMap.services.filter(service => (serviceHealth.value[service.id] ?? "healthy") === "degraded"));
const visibleHealth = computed(() => isLive.value ? serviceHealth.value : {});
const visibleIncident = computed(() => isLive.value ? incidentStart.value : {});

watch([viewLevel, filterType, latencyThreshold, historyMinutes, selectedNode, selectedTopoSvc], () => {
  setState({
    view: viewLevel.value,
    type: filterType.value,
    lat: latencyThreshold.value,
    t: historyMinutes.value,
    node: selectedNode.value,
    svc: selectedTopoSvc.value,
  });
});
watch(() => urlState.view, value => { if (value !== viewLevel.value) viewLevel.value = value; });
watch(() => urlState.type, value => { if (value !== filterType.value) filterType.value = value; });
watch(() => urlState.lat, value => { if (value !== latencyThreshold.value) latencyThreshold.value = value; });
watch(() => urlState.t, value => { if (value !== historyMinutes.value) historyMinutes.value = value; });
watch(() => urlState.node, value => { if (value !== selectedNode.value) selectedNode.value = value; });
watch(() => urlState.svc, value => { if (value !== selectedTopoSvc.value) selectedTopoSvc.value = value; });

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}
function simulateTick() {
  const now = Date.now();
  const health = { ...serviceHealth.value };
  const incidents = { ...incidentStart.value };
  let changed = false;
  ticksUntilNextDegrade -= 1;
  if (ticksUntilNextDegrade <= 0) {
    const healthy = clusterMap.services.filter(service => (health[service.id] ?? "healthy") === "healthy");
    if (healthy.length) {
      const count = Math.random() < .35 ? 2 : 1;
      shuffle(healthy).slice(0, count).forEach(service => {
        health[service.id] = "degraded";
        incidents[service.id] = now;
        degradeTicks[service.id] = 0;
      });
      changed = true;
    }
    ticksUntilNextDegrade = 10 + Math.floor(Math.random() * 6);
  }
  clusterMap.services.forEach(service => {
    const current = health[service.id] ?? "healthy";
    if (current === "degraded") {
      degradeTicks[service.id] = (degradeTicks[service.id] ?? 0) + 1;
      if (degradeTicks[service.id] >= 10) {
        if (Math.random() < .3) {
          health[service.id] = "down";
          downTicks[service.id] = 0;
          downDuration[service.id] = 15 + Math.floor(Math.random() * 6);
        } else {
          health[service.id] = "healthy";
          delete incidents[service.id];
        }
        delete degradeTicks[service.id];
        changed = true;
      }
    } else if (current === "down") {
      downTicks[service.id] = (downTicks[service.id] ?? 0) + 1;
      if (downTicks[service.id] >= (downDuration[service.id] ?? 15)) {
        health[service.id] = "healthy";
        delete incidents[service.id];
        delete downTicks[service.id];
        delete downDuration[service.id];
        changed = true;
      }
    }
  });
  if (changed) {
    serviceHealth.value = health;
    incidentStart.value = incidents;
  }
  const nextElapsed: Record<string, number> = {};
  Object.keys(incidents).forEach(id => { nextElapsed[id] = Math.floor((now - incidents[id]) / 1000); });
  elapsed.value = nextElapsed;
}
watch([isPlaying, isLive], ([playing, live]) => {
  if (simulationTimer !== undefined) window.clearInterval(simulationTimer);
  simulationTimer = undefined;
  if (playing && live) simulationTimer = window.setInterval(simulateTick, 1000);
});
onUnmounted(() => { if (simulationTimer !== undefined) window.clearInterval(simulationTimer); });
function formatElapsed(seconds: number) {
  return seconds > 59 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}
</script>

<template>
  <div class="relative flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
    <div class="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style="background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" />
    <div class="relative z-10 flex-none pt-12">
      <FilterBar :view-level="viewLevel" :filter-type="filterType" :is-playing="isPlaying"
        @update:view-level="viewLevel = $event" @update:filter-type="filterType = $event" @update:is-playing="isPlaying = $event" />
      <Transition name="banner">
        <div v-if="isLive" :key="downServices.length ? 'down' : degradedServices.length ? 'degraded' : 'healthy'" role="status" aria-live="polite"
          class="fixed inset-x-0 top-0 z-30 border-b px-4 py-2 shadow-sm backdrop-blur-md"
          :class="downServices.length ? 'border-destructive/40 bg-destructive/10' : degradedServices.length ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/35 bg-emerald-500/10'">
          <div class="mx-auto flex min-h-7 max-w-[1400px] items-center gap-2.5">
            <template v-if="downServices.length">
              <span class="h-2 w-2 shrink-0 animate-pulse rounded-full bg-destructive" /><span class="text-xs font-semibold uppercase tracking-wider text-destructive">⚠ Active Incident</span>
              <div class="flex flex-wrap gap-2"><div v-for="service in downServices" :key="service.id" class="flex items-center gap-1.5 rounded border border-destructive/40 bg-destructive/20 px-2 py-0.5 text-xs"><span class="font-mono text-destructive">{{ service.name }}</span><span class="text-muted-foreground">{{ service.team }}</span><span v-if="elapsed[service.id] !== undefined" class="font-mono text-destructive/80">{{ formatElapsed(elapsed[service.id]) }}</span></div></div>
            </template>
            <template v-else-if="degradedServices.length"><span class="text-xs text-amber-500">◉</span><span class="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Degraded Services</span><span class="text-xs text-muted-foreground">{{ degradedServices.length }} service{{ degradedServices.length === 1 ? "" : "s" }} recovering</span></template>
            <template v-else><span class="text-xs text-emerald-500">✓</span><span class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">All Systems Operational</span><span class="text-xs text-muted-foreground">{{ clusterMap.services.length }} services healthy</span></template>
          </div>
        </div>
      </Transition>
    </div>
    <div class="relative min-h-0 flex-1">
      <Transition name="view" mode="out-in">
        <div v-if="viewLevel === 'cluster'" key="globe" class="absolute inset-0"><WorldMap :latency-threshold="latencyThreshold" :is-playing="isPlaying" :hovered-node="hoveredNode" :selected-node="selectedNode" :service-health="visibleHealth" :history-minutes="historyMinutes" @update:hovered-node="hoveredNode = $event" @update:selected-node="selectedNode = $event" /></div>
        <div v-else :key="`topo-${viewLevel}`" class="absolute inset-0"><TopologyGraph :view-level="viewLevel" :filter-type="filterType" :selected-svc="selectedTopoSvc" @update:selected-svc="selectedTopoSvc = $event" /></div>
      </Transition>
    </div>
    <Legend v-if="viewLevel === 'cluster'" :is-playing="isPlaying" :latency-threshold="latencyThreshold" :history-minutes="historyMinutes" @update:latency-threshold="latencyThreshold = $event" @update:history-minutes="historyMinutes = $event" />
    <Tooltip :hovered-node="hoveredNode" :service-health="visibleHealth" :incident-start="visibleIncident" />
    <SidePanel :selected-node="selectedNode" :service-health="visibleHealth" :incident-start="visibleIncident" @close="selectedNode = null" @select-service="selectedTopoSvc = $event; viewLevel = 'service'; selectedNode = null" />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active, .view-enter-active, .view-leave-active { transition: opacity .2s ease, transform .2s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-18px); }
.view-enter-from, .view-leave-to { opacity: 0; }
</style>