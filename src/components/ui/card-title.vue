<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
const props = withDefaults(defineProps<{ class?: string }>(), { class: "" });
const classes = computed(() => cn("font-semibold leading-none tracking-tight", props.class));
</script>
<template><div :class="classes"><slot /></div></template>