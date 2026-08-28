import type {
  ClusterMap,
  ServiceTopology,
  ServicesMapCatalog,
} from "./service-data-model";

export interface ServiceDataSnapshot {
  clusterMap: ClusterMap;
  topology: ServiceTopology;
  catalog: ServicesMapCatalog;
}

const defaultDataUrl = `${import.meta.env.BASE_URL}services-data.json`;
const configuredDataUrl = import.meta.env.VITE_SERVICE_DATA_URL?.trim();

// Set VITE_SERVICE_DATA_URL for an external source; the local snapshot remains the default.
export const SERVICE_DATA_URL = configuredDataUrl || defaultDataUrl;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isServiceDataSnapshot(value: unknown): value is ServiceDataSnapshot {
  if (!isRecord(value)) return false;

  const clusterMap = value.clusterMap;
  const topology = value.topology;
  const catalog = value.catalog;

  return isRecord(clusterMap)
    && Array.isArray(clusterMap.services)
    && Array.isArray(clusterMap.dependencies)
    && Array.isArray(clusterMap.initialEdges)
    && isRecord(topology)
    && Array.isArray(topology.serviceLinks)
    && isRecord(topology.serviceInfra)
    && isRecord(topology.serviceExternals)
    && Array.isArray(topology.kafkaMessageFlows)
    && isRecord(catalog)
    && Array.isArray(catalog.entities)
    && Array.isArray(catalog.builds)
    && Array.isArray(catalog.dependencies)
    && isRecord(catalog.layerSummary);
}

export async function loadServiceData(): Promise<ServiceDataSnapshot> {
  const response = await fetch(SERVICE_DATA_URL);
  if (!response.ok) {
    throw new Error(`Unable to load service data: ${response.status} ${response.statusText}`);
  }

  const payload: unknown = await response.json();
  if (!isServiceDataSnapshot(payload)) {
    throw new Error("Service data has an invalid shape");
  }

  return payload;
}