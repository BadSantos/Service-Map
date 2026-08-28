<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { useToggleGroup } from "./toggle-group";

const props = withDefaults(defineProps<{
  value: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  class?: string;
}>(), { variant: "default", size: "default", disabled: false, class: "" });
const group = useToggleGroup();
if (!group) throw new Error("ToggleGroupItem must be used inside ToggleGroup");
const pressed = computed(() => Array.isArray(group.modelValue.value)
  ? group.modelValue.value.includes(props.value)
  : group.modelValue.value === props.value);
const classes = computed(() => cn(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  props.variant === "outline" ? "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground" : "bg-transparent",
  { default: "h-9 px-2 min-w-9", sm: "h-8 px-1.5 min-w-8", lg: "h-10 px-2.5 min-w-10" }[props.size],
  pressed.value ? "bg-accent text-accent-foreground" : "",
  props.class,
));
</script>
<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :disabled="props.disabled"
    :class="classes"
    @click="group.toggle(props.value)"
  ><slot /></button>
</template>