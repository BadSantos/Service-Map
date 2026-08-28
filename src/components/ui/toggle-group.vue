<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { provideToggleGroup, type ToggleValue } from "./toggle-group";

const props = withDefaults(defineProps<{
  modelValue?: ToggleValue;
  multiple?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  class?: string;
}>(), { modelValue: undefined, multiple: false, variant: "default", size: "default", class: "" });
const emit = defineEmits<{ "update:modelValue": [value: ToggleValue] }>();
const value = ref<ToggleValue>(props.modelValue);
watch(() => props.modelValue, (next) => { value.value = next; });
const toggle = (item: string) => {
  if (props.multiple) {
    const current = Array.isArray(value.value) ? value.value : [];
    value.value = current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item];
  } else {
    value.value = value.value === item ? undefined : item;
  }
  emit("update:modelValue", value.value);
};
provideToggleGroup({ modelValue: value, multiple: props.multiple, toggle });
const classes = computed(() => cn("flex items-center justify-center gap-1", props.class));
</script>
<template><div :class="classes" role="group"><slot /></div></template>