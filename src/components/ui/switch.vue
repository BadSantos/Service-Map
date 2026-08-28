<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
const props = withDefaults(defineProps<{
  modelValue?: boolean;
  disabled?: boolean;
  class?: string;
  id?: string;
  ariaLabel?: string;
}>(), { modelValue: false, disabled: false, class: "" });
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const classes = computed(() => cn(
  "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  props.modelValue ? "bg-primary" : "bg-input",
  props.class,
));
</script>

<template>
  <button
    :id="props.id"
    type="button"
    role="switch"
    :aria-checked="props.modelValue"
    :aria-label="props.ariaLabel"
    :disabled="props.disabled"
    :class="classes"
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <span
      class="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform"
      :class="props.modelValue ? 'translate-x-4' : 'translate-x-0'"
    />
  </button>
</template>