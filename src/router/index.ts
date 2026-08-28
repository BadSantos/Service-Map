import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import Dashboard from "@/pages/Dashboard.vue";
import ServiceCatalog from "@/pages/ServiceCatalog.vue";
import NotFound from "@/pages/not-found.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "dashboard", component: Dashboard },
  { path: "/services", name: "services", component: ServiceCatalog },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});