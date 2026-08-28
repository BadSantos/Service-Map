<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{
  variant?: "default" | "secondary" | "destructive" | "outline";
  class?: string;
}>(), { variant: "default", class: "" });
const classes = computed(() => cn(
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover-elevate",
  {
    default: "border-transparent bg-primary text-primary-foreground shadow-xs",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow-xs",
    outline: "text-foreground border [border-color:var(--badge-outline)]",
  }[props.variant],
  props.class,
));
</script>
<template><div :class="classes"><slot /></div></template>