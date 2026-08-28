import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const snapshot = JSON.parse(
  await readFile(new URL("../../public/services-data.json", import.meta.url), "utf8"),
) as {
  clusterMap: {
    services: Array<{
      id: string;
      dcServices: Array<{ name: string }>;
    }>;
    initialEdges: Array<{ sourceId: string; targetId: string }>;
  };
  topology: {
    serviceLinks: Array<{ source: string; target: string }>;
  };
  catalog: {
    entities: Array<{ id: string; kind: string }>;
    builds: Array<{ productId: string }>;
    dependencies: Array<{ sourceId: string; targetId: string }>;
    layerSummary: {
      services: number;
      products: number;
      externalVendors: number;
      builds: number;
      dependencies: number;
    };
  };
};

const { catalog, clusterMap, topology: serviceTopology } = snapshot;

test("static service-map snapshot has valid cross-references", () => {
  const datacenterIds = new Set(clusterMap.services.map((service) => service.id));
  const entityIds = new Set(catalog.entities.map((entity) => entity.id));
  const serviceEntityIds = new Set(
    catalog.entities
      .filter((entity) => entity.kind === "service")
      .map((entity) => entity.id),
  );

  for (const edge of clusterMap.initialEdges) {
    assert.ok(datacenterIds.has(edge.sourceId), `unknown edge source ${edge.sourceId}`);
    assert.ok(datacenterIds.has(edge.targetId), `unknown edge target ${edge.targetId}`);
  }

  for (const datacenter of clusterMap.services) {
    for (const service of datacenter.dcServices) {
      assert.ok(serviceEntityIds.has(service.name), `unknown deployed service ${service.name}`);
    }
  }

  for (const build of catalog.builds) {
    assert.ok(entityIds.has(build.productId), `unknown build product ${build.productId}`);
  }

  for (const dependency of catalog.dependencies) {
    assert.ok(entityIds.has(dependency.sourceId), `unknown dependency source ${dependency.sourceId}`);
    assert.ok(entityIds.has(dependency.targetId), `unknown dependency target ${dependency.targetId}`);
  }

  for (const link of serviceTopology.serviceLinks) {
    assert.ok(serviceEntityIds.has(link.source), `unknown service-link source ${link.source}`);
    assert.ok(serviceEntityIds.has(link.target), `unknown service-link target ${link.target}`);
  }

  assert.equal(catalog.layerSummary.services, 4);
  assert.equal(catalog.layerSummary.products, 1);
  assert.equal(catalog.layerSummary.externalVendors, 1);
  assert.equal(catalog.layerSummary.builds, catalog.builds.length);
  assert.equal(catalog.layerSummary.dependencies, catalog.dependencies.length);
});