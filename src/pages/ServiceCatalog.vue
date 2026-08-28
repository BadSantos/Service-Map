<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Badge from "@/components/ui/badge.vue";
import Button from "@/components/ui/button.vue";
import Input from "@/components/ui/input.vue";
import ThemeToggle from "@/components/theme-toggle.vue";
import { useServiceData } from "@/contexts/service-data-context";
import type { CatalogEntity } from "@/lib/service-data-model";

type TabType = "entities" | "builds";
type SortOrder = "asc" | "desc";

const { catalog } = useServiceData();
const router = useRouter();

const activeTab = ref<TabType>("entities");
const search = ref("");
const sortField = ref("name");
const sortOrder = ref<SortOrder>("asc");
const selectedKind = ref("all");
const selectedStatus = ref("all");
const selectedTeam = ref("all");
const selectedBrand = ref("all");

const kinds = computed(() => [...new Set(catalog.entities.map((entity) => entity.kind))].sort());
const statuses = computed(() => [
  ...new Set([
    ...catalog.entities.flatMap((entity) => entity.status ? [entity.status] : []),
    ...catalog.builds.map((build) => build.status),
  ]),
].sort());
const teams = computed(() => [
  ...new Set(catalog.entities.flatMap((entity) => entity.team ? [entity.team] : [])),
].sort());
const brands = computed(() => [
  ...new Set([
    ...catalog.entities.flatMap((entity) => entity.brands),
    ...catalog.builds.map((build) => build.brand),
  ]),
].sort());

const buildsByProduct = computed(() => {
  const result = new Map<string, typeof catalog.builds>();
  catalog.builds.forEach((build) => {
    const productBuilds = result.get(build.productId) ?? [];
    productBuilds.push(build);
    result.set(build.productId, productBuilds);
  });
  return result;
});

const entitiesById = computed(() => new Map(
  catalog.entities.map((entity) => [entity.id, entity]),
));

const normalizedSearch = computed(() => search.value.trim().toLowerCase());

const filteredEntities = computed(() => {
  let result = catalog.entities;
  const query = normalizedSearch.value;

  if (query) {
    result = result.filter((entity) =>
      entity.name.toLowerCase().includes(query)
      || Boolean(entity.description?.toLowerCase().includes(query))
      || Boolean(entity.team?.toLowerCase().includes(query))
      || entity.id.toLowerCase().includes(query),
    );
  }
  if (selectedKind.value !== "all") {
    result = result.filter((entity) => entity.kind === selectedKind.value);
  }
  if (selectedStatus.value !== "all") {
    result = result.filter((entity) => entity.status === selectedStatus.value);
  }
  if (selectedTeam.value !== "all") {
    result = result.filter((entity) => entity.team === selectedTeam.value);
  }
  if (selectedBrand.value !== "all") {
    result = result.filter((entity) =>
      entity.brands.includes(selectedBrand.value)
      || (buildsByProduct.value.get(entity.id) ?? []).some(
        (build) => build.brand === selectedBrand.value,
      ),
    );
  }

  return [...result].sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "name") comparison = a.name.localeCompare(b.name);
    else if (sortField.value === "kind") comparison = a.kind.localeCompare(b.kind);
    else if (sortField.value === "team") comparison = (a.team || "").localeCompare(b.team || "");
    return sortOrder.value === "asc" ? comparison : -comparison;
  });
});

const filteredBuilds = computed(() => {
  let result = catalog.builds;
  const query = normalizedSearch.value;

  if (query) {
    result = result.filter((build) =>
      build.name.toLowerCase().includes(query)
      || build.productId.toLowerCase().includes(query)
      || build.os.toLowerCase().includes(query)
      || build.brand.toLowerCase().includes(query),
    );
  }
  if (selectedStatus.value !== "all") {
    result = result.filter((build) => build.status === selectedStatus.value);
  }
  if (selectedTeam.value !== "all") {
    result = result.filter((build) => entitiesById.value.get(build.productId)?.team === selectedTeam.value);
  }
  if (selectedBrand.value !== "all") {
    result = result.filter((build) => build.brand === selectedBrand.value);
  }

  return [...result].sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "name") comparison = a.name.localeCompare(b.name);
    else if (sortField.value === "os") comparison = a.os.localeCompare(b.os);
    else if (sortField.value === "brand") comparison = a.brand.localeCompare(b.brand);
    return sortOrder.value === "asc" ? comparison : -comparison;
  });
});

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
}

function selectTab(tab: TabType) {
  activeTab.value = tab;
  sortField.value = "name";
}

function sortIconClass(field: string) {
  return sortField.value === field
    ? "opacity-100 text-primary"
    : "opacity-0 group-hover:opacity-50";
}

function backToMap() {
  router.push({ name: "dashboard" });
}

function selectService(entity: CatalogEntity) {
  const view = entity.kind === "server"
    ? "internal"
    : entity.kind === "external_vendor" || entity.kind === "inferred_external"
      ? "external"
      : "service";
  router.push({ name: "dashboard", query: { view, svc: entity.id } });
}
</script>

<template>
  <div class="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
      style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
    />

    <header class="relative z-10 flex-none border-b border-border/50 bg-card/60 px-4 py-3 backdrop-blur-md xl:px-6">
      <div class="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          class="h-9 gap-2 border-border/60 hover:border-accent hover:bg-accent hover:text-accent-foreground"
          data-testid="button-back-to-map"
          @click="backToMap"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
            <path d="M3 12h18M3 12l6-6M3 12l6 6" />
          </svg>
          Back to Map
        </Button>
        <div class="hidden h-6 w-px bg-border/50 sm:block" />
        <h1 class="text-xl font-semibold tracking-tight text-foreground/90">Catalog</h1>

        <div class="flex gap-2">
          <Button
            :variant="activeTab === 'entities' ? 'default' : 'ghost'"
            size="sm"
            class="gap-2"
            data-testid="tab-entities"
            @click="selectTab('entities')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Entities ({{ catalog.entities.length }})
          </Button>
          <Button
            :variant="activeTab === 'builds' ? 'default' : 'ghost'"
            size="sm"
            class="gap-2"
            data-testid="tab-builds"
            @click="selectTab('builds')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
              <path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
            </svg>
            Builds ({{ catalog.builds.length }})
          </Button>
        </div>

        <div class="relative min-w-56 flex-1 xl:max-w-72">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
          </svg>
          <Input
            v-model="search"
            type="text"
            placeholder="Search..."
            class="h-9 border-border/50 bg-background/50 pl-9 focus-visible:ring-1"
            data-testid="input-search"
          />
        </div>

        <div
          v-if="activeTab === 'entities'"
          class="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-background/50 px-1 text-sm focus-within:ring-1 focus-within:ring-ring"
        >
          <span class="pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Kind</span>
          <select
            v-model="selectedKind"
            class="cursor-pointer border-none bg-transparent pr-2 text-sm font-medium text-foreground focus:outline-none"
            data-testid="select-kind"
          >
            <option value="all">All Kinds</option>
            <option v-for="kind in kinds" :key="kind" :value="kind">{{ kind.replace("_", " ") }}</option>
          </select>
        </div>
        <div class="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-background/50 px-1 text-sm focus-within:ring-1 focus-within:ring-ring">
          <span class="pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Status</span>
          <select
            v-model="selectedStatus"
            class="cursor-pointer border-none bg-transparent pr-2 text-sm font-medium text-foreground focus:outline-none"
            data-testid="select-status"
          >
            <option value="all">All</option>
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
        <div class="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-background/50 px-1 text-sm focus-within:ring-1 focus-within:ring-ring">
          <span class="pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Team</span>
          <select
            v-model="selectedTeam"
            class="max-w-40 cursor-pointer border-none bg-transparent pr-2 text-sm font-medium text-foreground focus:outline-none"
            data-testid="select-team"
          >
            <option value="all">All</option>
            <option v-for="team in teams" :key="team" :value="team">{{ team }}</option>
          </select>
        </div>
        <div class="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-background/50 px-1 text-sm focus-within:ring-1 focus-within:ring-ring">
          <span class="pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Brand</span>
          <select
            v-model="selectedBrand"
            class="max-w-40 cursor-pointer border-none bg-transparent pr-2 text-sm font-medium text-foreground focus:outline-none"
            data-testid="select-brand"
          >
            <option value="all">All</option>
            <option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option>
          </select>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <main class="relative z-10 flex-1 overflow-auto p-6">
      <div class="mx-auto max-w-7xl">
        <template v-if="activeTab === 'entities'">
          <div
            v-if="filteredEntities.length === 0"
            class="mt-8 flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border/40 bg-card/20 text-muted-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 h-12 w-12 opacity-20" aria-hidden="true">
              <path d="m8 9 3 3-3 3M13 15h3M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            </svg>
            <p>No entities found matching your criteria.</p>
          </div>
          <div v-else class="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-xl backdrop-blur-sm">
            <div class="overflow-x-auto">
              <table class="w-full whitespace-nowrap text-left text-sm">
                <thead class="sticky top-0 z-10 border-b border-border/60 bg-card/80 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 backdrop-blur-md">
                  <tr>
                    <th class="group cursor-pointer px-5 py-3.5 transition-colors hover:text-foreground" @click="toggleSort('name')">
                      <div class="flex items-center gap-1.5">
                        ENTITY
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['h-3 w-3 transition-opacity', sortIconClass('name')]" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4M12 5v14" /></svg>
                      </div>
                    </th>
                    <th class="group cursor-pointer px-5 py-3.5 transition-colors hover:text-foreground" @click="toggleSort('kind')">
                      <div class="flex items-center gap-1.5">
                        KIND
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['h-3 w-3 transition-opacity', sortIconClass('kind')]" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4M12 5v14" /></svg>
                      </div>
                    </th>
                    <th class="px-5 py-3.5">DESCRIPTION</th>
                    <th class="group cursor-pointer px-5 py-3.5 transition-colors hover:text-foreground" @click="toggleSort('team')">
                      <div class="flex items-center gap-1.5">
                        TEAM
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['h-3 w-3 transition-opacity', sortIconClass('team')]" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4M12 5v14" /></svg>
                      </div>
                    </th>
                    <th class="px-5 py-3.5">INFRA</th>
                    <th class="px-5 py-3.5 text-right">LINKS</th>
                  </tr>
                </thead>
                <TransitionGroup tag="tbody" name="catalog-row" class="divide-y divide-border/40">
                  <tr v-for="entity in filteredEntities" :key="entity.id" class="group transition-colors hover:bg-muted/40">
                    <td class="max-w-[220px] px-5 py-4 align-top">
                      <button
                        type="button"
                        class="-ml-1.5 w-full truncate rounded px-1.5 py-0.5 text-left font-mono text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        :title="entity.name"
                        :data-testid="`button-select-entity-${entity.id}`"
                        @click="selectService(entity)"
                      >{{ entity.name }}</button>
                      <div class="mt-1.5 truncate font-mono text-[10px] text-muted-foreground" :title="entity.id">{{ entity.id }}</div>
                    </td>
                    <td class="px-5 py-4 align-top">
                      <Badge variant="outline" class="bg-background/50 text-[10px] font-mono capitalize tracking-tight">{{ entity.kind.replace("_", " ") }}</Badge>
                      <div v-if="entity.status" class="mt-2 flex items-center gap-1.5">
                        <div class="h-1.5 w-1.5 rounded-full" :class="entity.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'" />
                        <span class="text-[10px] capitalize text-muted-foreground">{{ entity.status }}</span>
                      </div>
                    </td>
                    <td class="max-w-[280px] whitespace-normal px-5 py-4 align-top">
                      <p class="line-clamp-3 text-[12px] leading-relaxed text-muted-foreground/90">
                        <template v-if="entity.description">{{ entity.description }}</template>
                        <span v-else class="italic opacity-50">No description</span>
                      </p>
                    </td>
                    <td class="px-5 py-4 align-top">
                      <span v-if="entity.team" class="rounded border border-border/50 bg-secondary/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/80">{{ entity.team }}</span>
                      <span v-else class="text-xs text-muted-foreground/50">—</span>
                    </td>
                    <td class="max-w-[220px] px-5 py-4 align-top">
                      <div class="flex flex-wrap gap-1">
                        <span v-if="entity.location" class="rounded border border-border/60 bg-background/60 px-1 font-mono text-[9px] text-foreground/75">{{ entity.location }}</span>
                        <span v-for="datacenter in entity.datacenters" :key="datacenter" class="rounded border border-primary/20 bg-primary/10 px-1 font-mono text-[9px] text-primary/80">{{ datacenter }}</span>
                        <span v-for="brand in entity.brands" :key="brand" class="rounded border border-secondary bg-secondary/60 px-1 font-mono text-[9px] text-secondary-foreground">{{ brand }}</span>
                        <span v-for="ip in entity.ips.slice(0, 2)" :key="ip" class="rounded border border-border/60 px-1 font-mono text-[9px] text-muted-foreground">{{ ip }}</span>
                        <span v-if="!entity.location && entity.datacenters.length === 0 && entity.brands.length === 0 && entity.ips.length === 0" class="text-xs text-muted-foreground/50">—</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-right align-top">
                      <div class="flex flex-col items-end gap-1">
                        <a v-for="(link, index) in entity.links" :key="index" :href="link.url" target="_blank" rel="noreferrer" class="text-[11px] capitalize text-primary/80 underline underline-offset-2 hover:text-primary">{{ link.kind }}</a>
                      </div>
                    </td>
                  </tr>
                </TransitionGroup>
              </table>
            </div>
          </div>
        </template>

        <template v-else>
          <div
            v-if="filteredBuilds.length === 0"
            class="mt-8 flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border/40 bg-card/20 text-muted-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 h-12 w-12 opacity-20" aria-hidden="true">
              <path d="m8 9 3 3-3 3M13 15h3M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            </svg>
            <p>No builds found matching your criteria.</p>
          </div>
          <div v-else class="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-xl backdrop-blur-sm">
            <div class="overflow-x-auto">
              <table class="w-full whitespace-nowrap text-left text-sm">
                <thead class="sticky top-0 z-10 border-b border-border/60 bg-card/80 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 backdrop-blur-md">
                  <tr>
                    <th class="group cursor-pointer px-5 py-3.5 transition-colors hover:text-foreground" @click="toggleSort('name')">
                      <div class="flex items-center gap-1.5">
                        NAME
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['h-3 w-3 transition-opacity', sortIconClass('name')]" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4M12 5v14" /></svg>
                      </div>
                    </th>
                    <th class="px-5 py-3.5">PRODUCT ID</th>
                    <th class="group cursor-pointer px-5 py-3.5 transition-colors hover:text-foreground" @click="toggleSort('os')">
                      <div class="flex items-center gap-1.5">
                        OS
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['h-3 w-3 transition-opacity', sortIconClass('os')]" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4M12 5v14" /></svg>
                      </div>
                    </th>
                    <th class="group cursor-pointer px-5 py-3.5 transition-colors hover:text-foreground" @click="toggleSort('brand')">
                      <div class="flex items-center gap-1.5">
                        BRAND
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="['h-3 w-3 transition-opacity', sortIconClass('brand')]" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4M12 5v14" /></svg>
                      </div>
                    </th>
                    <th class="px-5 py-3.5">PARTNER</th>
                    <th class="px-5 py-3.5">STATUS</th>
                  </tr>
                </thead>
                <TransitionGroup tag="tbody" name="catalog-row" class="divide-y divide-border/40">
                  <tr v-for="build in filteredBuilds" :key="build.id" class="group transition-colors hover:bg-muted/40">
                    <td class="px-5 py-4 font-mono text-[13px] font-semibold text-primary">{{ build.name }}</td>
                    <td class="px-5 py-4 font-mono text-[11px] text-muted-foreground">{{ build.productId }}</td>
                    <td class="px-5 py-4"><Badge variant="secondary" class="font-mono text-[10px] uppercase">{{ build.os }}</Badge></td>
                    <td class="px-5 py-4 text-sm font-medium">{{ build.brand }}</td>
                    <td class="px-5 py-4 text-xs text-muted-foreground">{{ build.partner || "—" }}</td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-1.5">
                        <div class="h-1.5 w-1.5 rounded-full" :class="build.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'" />
                        <span class="text-[10px] capitalize text-muted-foreground">{{ build.status }}</span>
                      </div>
                    </td>
                  </tr>
                </TransitionGroup>
              </table>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.catalog-row-enter-active,
.catalog-row-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.catalog-row-enter-from,
.catalog-row-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.catalog-row-move {
  transition: transform 0.18s ease;
}
</style>