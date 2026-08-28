<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{
  modelValue?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  class?: string;
  ariaLabel?: string;
}>(), { modelValue: 0, min: 0, max: 100, step: 1, disabled: false, class: "" });
const emit = defineEmits<{ "update:modelValue": [value: number | number[]] }>();
const value = computed(() => Array.isArray(props.modelValue) ? (props.modelValue[0] ?? props.min) : props.modelValue);
const classes = computed(() => cn("relative flex w-full touch-none select-none items-center", props.class));
</script>

<template>
  <input
    type="range"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :value="value"
    :disabled="props.disabled"
    :aria-label="props.ariaLabel"
    :class="classes"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>

<style scoped>
input {
  accent-color: hsl(var(--primary));
}
</style>