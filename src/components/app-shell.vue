<script setup lang="ts">
import { RouterLink } from "vue-router";
import ThemeToggle from "@/components/theme-toggle.vue";
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-card/80 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <RouterLink to="/" class="font-mono text-sm font-semibold tracking-wide text-primary">
          Services Map
        </RouterLink>
        <nav class="flex items-center gap-1" aria-label="Primary navigation">
          <RouterLink
            to="/"
            class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            active-class="bg-muted text-foreground"
            exact-active-class="bg-muted text-foreground"
          >Map</RouterLink>
          <RouterLink
            to="/services"
            class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            active-class="bg-muted text-foreground"
          >Services</RouterLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
    <main class="mx-auto max-w-7xl p-4 md:p-6">
      <slot />
    </main>
  </div>
</template>