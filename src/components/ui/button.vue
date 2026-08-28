<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const props = withDefaults(defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  as?: string;
  disabled?: boolean;
  class?: string;
  type?: "button" | "submit" | "reset";
}>(), {
  variant: "default",
  size: "default",
  as: "button",
  disabled: false,
  type: "button",
});

const classes = computed(() => cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2",
  {
    default: "bg-primary text-primary-foreground border border-primary-border",
    destructive: "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",
    outline: "border [border-color:var(--button-outline)] shadow-xs active:shadow-none",
    secondary: "border bg-secondary text-secondary-foreground border-secondary-border",
    ghost: "border border-transparent",
    link: "text-primary underline-offset-4 hover:underline",
  }[props.variant],
  {
    default: "min-h-9 px-4 py-2",
    sm: "min-h-8 rounded-md px-3 text-xs",
    lg: "min-h-10 rounded-md px-8",
    icon: "h-9 w-9",
  }[props.size],
  props.class,
));
</script>

<template>
  <component
    :is="props.as"
    :class="classes"
    :disabled="props.as === 'button' ? props.disabled : undefined"
    :type="props.as === 'button' ? props.type : undefined"
    :aria-disabled="props.disabled && props.as !== 'button' ? 'true' : undefined"
  >
    <slot />
  </component>
</template>