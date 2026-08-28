<script setup lang="ts">
import { useServiceData } from "@/contexts/service-data-context";
import Label from "@/components/ui/label.vue";
import Slider from "@/components/ui/slider.vue";
import TimeSlider from "@/components/dashboard/TimeSlider.vue";
const props = defineProps<{ isPlaying: boolean; latencyThreshold: number; historyMinutes: number }>();
const emit = defineEmits<{
  "update:latencyThreshold": [value: number];
  "update:historyMinutes": [value: number];
}>();
const { clusterMap } = useServiceData();
function numberValue(value: number | number[]) { return Number(Array.isArray(value) ? value[0] : value); }
</script>

<template>
  <div class="absolute bottom-6 left-6 z-10 flex max-w-[calc(100vw-3rem)] flex-col items-start gap-3 sm:flex-row sm:items-end">
    <div class="pointer-events-none w-64 rounded-lg border border-card-border bg-card/80 p-4 shadow-lg backdrop-blur-md">
      <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datacenters · Services</h3>
      <div class="space-y-2">
        <div v-for="node in clusterMap.services" :key="node.id" class="flex items-center justify-between text-xs">
          <div class="flex flex-col"><span class="font-mono text-foreground/90">{{ node.name }}</span><span class="text-[10px] text-muted-foreground">{{ node.region }}</span></div>
          <div class="flex flex-col items-end gap-0.5"><span class="font-mono text-primary">{{ node.serviceCount }} svc</span><span class="text-[10px] text-muted-foreground">{{ node.totalReplicas }} pods</span></div>
        </div>
      </div>
    </div>
    <div v-if="props.isPlaying" class="w-[calc(100vw-3rem)] max-w-[360px] rounded-lg border border-card-border bg-card/85 p-4 shadow-lg backdrop-blur-md">
      <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service Latency</h3>
      <div class="pointer-events-auto space-y-3">
        <div class="flex items-center gap-3">
          <Label class="w-24 shrink-0 text-[10px] text-muted-foreground">Min latency</Label>
          <Slider :model-value="props.latencyThreshold" :max="200" aria-label="Minimum latency"
            @update:model-value="emit('update:latencyThreshold', numberValue($event))" />
          <span class="w-10 text-right font-mono text-xs">{{ props.latencyThreshold }}ms</span>
        </div>
        <div class="h-px w-full bg-card-border" />
        <div class="space-y-2 text-xs text-muted-foreground">
          <div class="flex items-center gap-2"><div class="h-[2px] w-4 bg-primary" />Low (&lt;80ms)</div>
          <div class="flex items-center gap-2"><div class="h-[2px] w-4 bg-accent" />Medium (80–150ms)</div>
          <div class="flex items-center gap-2"><div class="h-[2px] w-4 bg-destructive" />High (&gt;150ms)</div>
        </div>
        <div class="h-px w-full bg-card-border" />
        <div class="space-y-2 text-xs text-muted-foreground">
          <div class="flex items-center gap-2"><svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" stroke-dasharray="4" /></svg>Sync Call</div>
          <div class="flex items-center gap-2"><svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" stroke-dasharray="2 4" /></svg>Async Event</div>
        </div>
        <div class="h-px w-full bg-card-border" />
        <TimeSlider :history-minutes="props.historyMinutes" embedded @update:history-minutes="emit('update:historyMinutes', $event)" />
      </div>
    </div>
  </div>
</template>