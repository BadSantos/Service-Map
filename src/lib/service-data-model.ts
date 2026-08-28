export type Health = "healthy" | "degraded" | "down";
export type ServiceDependencyType = "sync" | "async";
export type InfraKind = "postgres" | "redis" | "rabbitmq" | "kafka" | "clickhouse" | "s3" | "ldap";
export type ExtKind = "auth" | "payment" | "email" | "fiscal" | "analytics";

export interface DcService {
  name: string;
  namespace: string;
  version: string;
  replicas: number;
  ingresses: string[];
  gitRepo: string;
  elkUrl: string;
  description: string;
  deployedAt?: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  datacenter: string;
  region: string;
  continent: string;
  kind: "gateway" | "service" | "database" | "queue" | "worker" | "cache" | "ml";
  x: number;
  y: number;
  lat: number;
  lng: number;
  description: string;
  team: string;
  teamSlack: string;
  elkUrl: string;
  health?: Health;
  version: string;
  lastRelease: string;
  dcServices: DcService[];
  serviceCount: number;
  totalReplicas: number;
}

export interface ServiceDependency {
  sourceId: string;
  targetId: string;
  type: ServiceDependencyType;
  label: string;
}

export interface NetworkEdge extends ServiceDependency {
  id: string;
  distance: number;
  baseLatencyMs: number;
  currentLatencyMs: number;
  rps: number;
  errorRate: number;
}

export interface ServiceLink {
  source: string;
  target: string;
  type: ServiceDependencyType;
  label: string;
}

export interface KafkaMessageFlow {
  topic: string;
  producers: string[];
  consumers: string[];
  message: string;
}

export interface ClusterMap {
  services: ServiceNode[];
  dependencies: ServiceDependency[];
  initialEdges: NetworkEdge[];
}

export interface ServiceTopology {
  serviceLinks: ServiceLink[];
  serviceInfra: Record<string, InfraKind[]>;
  serviceExternals: Record<string, ExtKind[]>;
  kafkaMessageFlows: KafkaMessageFlow[];
}

export interface CatalogLink {
  kind: string;
  url: string;
}

export interface CatalogEntity {
  id: string;
  kind: "service" | "server" | "external_vendor" | "desktop_product" | "mobile_app" | "inferred_external";
  name: string;
  description: string | null;
  status: string | null;
  team: string | null;
  isExternal: boolean;
  location: string | null;
  trafficLimit: string | null;
  note: string | null;
  brands: string[];
  datacenters: string[];
  ips: string[];
  urls: CatalogLink[];
  links: CatalogLink[];
}

export interface CatalogBuild {
  id: string;
  productId: string;
  name: string;
  os: string;
  brand: string;
  partner: string | null;
  status: string;
  links: CatalogLink[];
}

export interface CatalogDependency {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  rawName: string | null;
  host: string | null;
  endpoint: string | null;
  minVersion: string | null;
  maxVersion: string | null;
  endpoints: string[];
}

export interface ServicesMapCatalog {
  entities: CatalogEntity[];
  builds: CatalogBuild[];
  dependencies: CatalogDependency[];
  layerSummary: {
    services: number;
    servers: number;
    externalVendors: number;
    products: number;
    inferredExternalEndpoints: number;
    builds: number;
    dependencies: number;
  };
}

/** Deterministic historical latency for a given timestamp (ms). */
export function historicalLatency(edge: NetworkEdge, timestampMs: number): number {
  const t = timestampMs / 1000;
  return edge.baseLatencyMs
    + Math.sin(t / 10 + edge.distance * 0.01) * 20
    + Math.cos(t / 7 + edge.distance * 0.02) * 10;
}