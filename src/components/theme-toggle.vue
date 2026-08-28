<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "@/composables/use-theme";
import Switch from "@/components/ui/switch.vue";

const { isLight, setTheme } = useTheme();
const label = computed(() => isLight.value ? "Switch to dark theme" : "Switch to light theme");
</script>

<template>
  <div class="flex items-center gap-2" :title="label">
    <span class="text-xs text-muted-foreground" aria-hidden="true">☼</span>
    <Switch
      :model-value="isLight"
      :aria-label="label"
      @update:model-value="setTheme($event ? 'light' : 'dark')"
    />
    <span class="text-xs text-muted-foreground" aria-hidden="true">☾</span>
  </div>
</template>