<script setup lang="ts">
import { computed } from "vue";
import type { DcService, Health } from "@/lib/service-data-model";
import { useServiceData } from "@/contexts/service-data-context";
import Badge from "@/components/ui/badge.vue";
import Button from "@/components/ui/button.vue";
const props = defineProps<{ selectedNode: string | null; serviceHealth: Record<string, Health>; incidentStart: Record<string, number> }>();
const emit = defineEmits<{ close: []; selectService: [name: string] }>();
const { clusterMap } = useServiceData();
const node = computed(() => props.selectedNode ? clusterMap.services.find(service => service.id === props.selectedNode) : null);
const health = computed<Health>(() => props.selectedNode ? props.serviceHealth[props.selectedNode] ?? "healthy" : "healthy");
function elapsed(start?: number) {
  if (!start) return "0s";
  const seconds = Math.floor((Date.now() - start) / 1000);
  return seconds > 59 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}
</script>

<template>
  <aside v-if="node" class="absolute bottom-6 right-3 top-6 z-20 flex w-[calc(100vw-1.5rem)] max-w-[320px] flex-col rounded-xl border border-card-border bg-card/90 shadow-2xl backdrop-blur-md sm:right-6" @wheel.stop>
    <div class="border-b border-card-border p-4">
      <div class="flex items-start justify-between">
        <div><h2 class="flex items-center gap-2 font-mono text-lg font-semibold"><span class="text-primary">◈</span>{{ node.name }}</h2><div class="mt-1 flex gap-2 text-xs text-muted-foreground"><span>{{ node.region }}</span><span>&bull;</span><span class="font-mono">{{ node.datacenter }}</span></div></div>
        <Button variant="ghost" size="icon" class="h-6 w-6" aria-label="Close details" @click="emit('close')">&times;</Button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2"><Badge variant="outline" class="text-xs">{{ node.kind }}</Badge><Badge v-if="health === 'down'" variant="destructive" class="text-xs animate-pulse">● Down</Badge><Badge v-else-if="health === 'degraded'" class="text-xs" style="background-color:hsl(38 92% 50% / .2);border-color:hsl(38 92% 50% / .5);color:hsl(38 92% 50%)">Degraded</Badge><Badge v-else variant="secondary" class="text-xs" style="background-color:hsl(145 60% 30% / .3);border-color:hsl(145 60% 40% / .4);color:hsl(145 70% 60%)">Healthy</Badge></div>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <div class="space-y-3 rounded border border-card-border bg-background/40 p-3">
          <p class="text-xs leading-relaxed text-foreground/90">{{ node.description }}</p>
          <div v-if="health !== 'healthy' && incidentStart[node.id]" class="rounded px-2 py-1 font-mono text-[10px]" :style="{ color: health === 'down' ? 'hsl(350 90% 60%)' : 'hsl(38 92% 50%)', backgroundColor: health === 'down' ? 'hsl(350 90% 60% / .1)' : 'hsl(38 92% 50% / .1)' }">Incident: {{ elapsed(incidentStart[node.id]) }}</div>
          <div class="grid grid-cols-2 gap-2 border-t border-card-border pt-2"><div><span class="text-[10px] text-muted-foreground">▣ Services</span><strong class="ml-2 font-mono text-xs text-primary">{{ node.serviceCount }}</strong></div><div><span class="text-[10px] text-muted-foreground">▤ Pods</span><strong class="ml-2 font-mono text-xs text-primary">{{ node.totalReplicas }}</strong></div></div>
          <a :href="node.elkUrl" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between rounded border border-primary/40 bg-primary/10 px-2 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20">↗ Kibana · All logs <span>▣</span></a>
        </div>
        <section><h3 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">▣ Deployed Services <span class="ml-auto font-mono text-[10px]">{{ node.serviceCount }}</span></h3><div class="space-y-2"><div v-for="service in node.dcServices" :key="service.name" class="space-y-1.5 rounded border border-card-border bg-background/40 p-2 transition-colors hover:border-primary/50 hover:bg-primary/5" role="button" tabindex="0" @click="emit('selectService', service.name)" @keydown.enter="emit('selectService', service.name)" @keydown.space.prevent="emit('selectService', service.name)"><div class="flex items-center justify-between gap-2"><span class="truncate font-mono text-xs font-semibold text-primary">{{ service.name }}</span><div class="flex shrink-0 gap-1"><Badge variant="outline" class="h-4 px-1 py-0 font-mono text-[9px]" style="color:hsl(185 100% 50%);border-color:hsl(185 100% 50% / .4)">{{ service.version }}</Badge><Badge variant="secondary" class="h-4 px-1 py-0 text-[9px]">×{{ service.replicas }}</Badge></div></div><p v-if="service.description" class="line-clamp-2 text-xs text-muted-foreground">{{ service.description }}</p><div v-if="service.ingresses.length" class="flex flex-wrap gap-1"><a v-for="url in service.ingresses.slice(0, 2)" :key="url" :href="url" target="_blank" rel="noopener noreferrer" class="max-w-[140px] truncate text-[9px] text-muted-foreground/70 hover:text-primary" @click.stop>{{ url.replace("https://", "") }}</a><span v-if="service.ingresses.length > 2" class="text-[9px] text-muted-foreground/50">+{{ service.ingresses.length - 2 }}</span></div><div class="flex gap-2 pt-0.5"><a :href="service.elkUrl" target="_blank" rel="noopener noreferrer" class="text-[9px] text-primary/70 hover:text-primary" @click.stop>↗ Kibana</a><a :href="service.gitRepo" target="_blank" rel="noopener noreferrer" class="text-[9px] text-muted-foreground hover:text-foreground" @click.stop>⌘ GitLab</a></div></div></div></section>
      </div>
    </div>
  </aside>
</template>