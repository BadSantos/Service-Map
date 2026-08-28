<script setup lang="ts">
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" aria-live="polite">
    <div
      v-for="item in toasts"
      :key="item.id"
      role="status"
      :class="cn(
        'pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        item.variant === 'destructive'
          ? 'border-destructive bg-destructive text-destructive-foreground'
          : 'border bg-background text-foreground',
        !item.open ? 'opacity-0 translate-x-4' : '',
      )"
    >
      <div class="grid gap-1">
        <div v-if="item.title" class="text-sm font-semibold">{{ item.title }}</div>
        <div v-if="item.description" class="text-sm opacity-90">{{ item.description }}</div>
      </div>
      <button
        type="button"
        class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Close notification"
        @click="dismiss(item.id)"
      >×</button>
    </div>
  </div>
</template>