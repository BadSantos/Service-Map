<script setup lang="ts">
import { RouterView } from "vue-router";
import { provideServiceData } from "@/contexts/service-data-context";
import { provideTheme } from "@/composables/use-theme";
import { provideUrlState } from "@/composables/use-url-state";
import Toaster from "@/components/ui/toaster.vue";
import type { ServiceDataSnapshot } from "@/lib/service-data";

const props = defineProps<{ serviceData: ServiceDataSnapshot }>();

provideTheme();
provideServiceData(props.serviceData);
provideUrlState();
</script>

<template>
  <RouterView />
  <Toaster />
</template>