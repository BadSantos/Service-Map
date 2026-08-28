<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import type { ViewLevel } from "@/lib/url-state";
import { useUrlState } from "@/composables/use-url-state";
import { useServiceData } from "@/contexts/service-data-context";
import ThemeToggle from "@/components/theme-toggle.vue";
import Button from "@/components/ui/button.vue";
import Label from "@/components/ui/label.vue";
import ToggleGroup from "@/components/ui/toggle-group.vue";
import ToggleGroupItem from "@/components/ui/toggle-group-item.vue";

type FilterType = "all" | "http" | "external" | "internal" | "server";
const props = defineProps<{
  viewLevel: ViewLevel;
  filterType: FilterType;
  isPlaying: boolean;
}>();
const emit = defineEmits<{
  "update:viewLevel": [value: ViewLevel];
  "update:filterType": [value: FilterType];
  "update:isPlaying": [value: boolean];
}>();
const { catalog } = useServiceData();
const { copyShareableLink } = useUrlState();
const copied = ref(false);
const levels: { value: ViewLevel; label: string }[] = [
  { value: "cluster", label: "Cluster" },
  { value: "service", label: "Services" },
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
];

async function handleCopy() {
  if (await copyShareableLink()) {
    copied.value = true;
    window.setTimeout(() => { copied.value = false; }, 1500);
  }
}
</script>

<template>
  <div class="absolute left-1/2 top-14 z-10 flex max-w-[96vw] -translate-x-1/2 flex-nowrap items-center gap-4 overflow-x-auto whitespace-nowrap rounded-lg border border-card-border bg-card/80 p-3 shadow-lg backdrop-blur-md">
    <template v-if="props.viewLevel === 'cluster'">
      <Button variant="ghost" size="icon" class="h-8 w-8" data-testid="button-toggle-simulation"
        :aria-label="props.isPlaying ? 'Pause simulation' : 'Play simulation'"
        @click="emit('update:isPlaying', !props.isPlaying)">
        <span class="text-base leading-none">{{ props.isPlaying ? "Ⅱ" : "▶" }}</span>
      </Button>
      <div class="h-8 w-px bg-card-border" />
    </template>

    <div class="flex items-center gap-2">
      <Label class="mr-1 text-xs text-muted-foreground">View</Label>
      <ToggleGroup :model-value="props.viewLevel" size="sm" data-testid="toggle-view-level"
        @update:model-value="value => value && emit('update:viewLevel', value as ViewLevel)">
        <ToggleGroupItem v-for="level in levels" :key="level.value" :value="level.value" class="text-xs"
          :data-testid="`view-level-${level.value}`">{{ level.label }}</ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="h-8 w-px bg-card-border" />
    <template v-if="props.viewLevel !== 'cluster'">
      <div class="flex items-center gap-2">
        <Label class="mr-1 text-xs text-muted-foreground">Type</Label>
        <ToggleGroup :model-value="props.filterType" size="sm" data-testid="toggle-filter-type"
          @update:model-value="value => value && emit('update:filterType', value as FilterType)">
          <ToggleGroupItem v-for="kind in ['all', 'http', 'server', 'internal', 'external']" :key="kind"
            :value="kind" class="text-xs" :data-testid="`filter-type-${kind}`">{{ kind.toUpperCase() }}</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div class="h-8 w-px bg-card-border" />
    </template>

    <RouterLink to="/services" data-testid="link-catalog"
      class="flex h-8 items-center gap-1.5 rounded-md bg-secondary/50 px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80">
      <span aria-hidden="true">▦</span> Catalog
    </RouterLink>
    <div class="h-8 w-px bg-card-border" />
    <Button variant="ghost" size="sm" class="h-8 gap-1.5 text-xs" title="Copy shareable link" data-testid="button-share" @click="handleCopy">
      <span :class="copied ? 'text-primary' : ''">{{ copied ? "✓ Copied" : "↗ Share" }}</span>
    </Button>
    <ThemeToggle />
    <div class="hidden h-8 w-px bg-card-border lg:block" />
    <div class="hidden items-center gap-3 rounded bg-card-border/20 px-3 py-1.5 font-mono text-[10px] text-muted-foreground lg:flex" data-testid="layer-summary">
      <span :title="'Services'">{{ catalog.layerSummary.services }} SVCS</span>
      <span :title="'Servers'">{{ catalog.layerSummary.servers }} SRVS</span>
      <span :title="'External Vendors & Endpoints'">{{ catalog.layerSummary.externalVendors + catalog.layerSummary.inferredExternalEndpoints }} EXT</span>
      <span :title="'Products & Builds'">{{ catalog.layerSummary.products }} PRODS <span class="opacity-50">({{ catalog.layerSummary.builds }} builds)</span></span>
    </div>
  </div>
</template>