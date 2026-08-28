<script setup lang="ts">
import { computed } from "vue";
import Slider from "@/components/ui/slider.vue";
import Badge from "@/components/ui/badge.vue";

const props = withDefaults(defineProps<{ historyMinutes: number; embedded?: boolean }>(), { embedded: false });
const emit = defineEmits<{ "update:historyMinutes": [value: number] }>();
const totalMinutes = 24 * 60;
const sliderValue = computed(() => totalMinutes - props.historyMinutes);
const isLive = computed(() => props.historyMinutes === 0);
function formatHistoryTime(minutesAgo: number) {
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return date.toDateString() === new Date().toDateString() ? `Today ${time}` : `Yesterday ${time}`;
}
function change(value: number | number[]) {
  emit("update:historyMinutes", totalMinutes - Number(Array.isArray(value) ? value[0] : value));
}
</script>

<template>
  <div :class="props.embedded ? 'w-full space-y-2' : 'absolute bottom-6 left-1/2 z-10 flex min-w-[540px] -translate-x-1/2 items-center gap-4 rounded-lg border border-card-border bg-card/85 px-5 py-3 shadow-lg backdrop-blur-md'">
    <div class="flex items-center gap-3">
      <span class="text-sm text-muted-foreground" aria-hidden="true">◷</span>
      <span class="shrink-0 font-mono text-[10px] text-muted-foreground">-24h</span>
      <div class="relative flex-1">
        <div class="pointer-events-none absolute inset-x-0 -top-3 flex justify-between px-[1px]">
          <div v-for="i in 7" :key="i" class="flex flex-col items-center">
            <div class="h-1.5 w-px bg-card-border" />
            <span v-if="i > 1 && i < 7" class="mt-0.5 font-mono text-[8px] text-muted-foreground/50">-{{ (7 - i) * 4 }}h</span>
          </div>
        </div>
        <Slider :model-value="sliderValue" :min="0" :max="totalMinutes" :step="5" class="w-full" aria-label="Time window"
          @update:model-value="change" />
      </div>
      <span class="shrink-0 font-mono text-[10px] text-muted-foreground">now</span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="text-[10px] text-muted-foreground">Time window</span>
      <Badge v-if="isLive" class="px-2 py-0 font-mono text-[10px]" style="background-color:hsl(185 100% 50% / .15);border-color:hsl(185 100% 50% / .4);color:hsl(185 100% 50%)">LIVE</Badge>
      <span v-else class="text-xs font-mono text-foreground/80">{{ formatHistoryTime(props.historyMinutes) }}</span>
    </div>
  </div>
</template>