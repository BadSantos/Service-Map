<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{
  modelValue?: string | number;
  type?: string;
  class?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
}>(), { type: "text", modelValue: "", disabled: false });
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const classes = computed(() => cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  props.class,
));
</script>

<template>
  <input
    :id="props.id"
    :name="props.name"
    :type="props.type"
    :value="props.modelValue"
    :disabled="props.disabled"
    :placeholder="props.placeholder"
    :class="classes"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>