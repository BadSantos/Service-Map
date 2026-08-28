<script setup lang="ts">
import { useRouter } from "vue-router";
import Button from "@/components/ui/button.vue";

const router = useRouter();
</script>

<template>
  <div class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.03]"
      style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
    />
    <div class="relative z-10 w-full max-w-md px-4">
      <div class="rounded-xl border border-border bg-card text-card-foreground shadow-xl">
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-8 w-8 text-destructive" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <h1 class="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p class="mt-4 text-sm text-muted-foreground">The requested Services Map route does not exist.</p>
          <Button class="mt-5" data-testid="button-return-to-map" @click="router.push({ name: 'dashboard' })">
            Return to the map
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>