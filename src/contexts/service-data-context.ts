import { inject, provide, type InjectionKey } from "vue";
import type { ServiceDataSnapshot } from "@/lib/service-data";

export type ServiceDataContextValue = ServiceDataSnapshot;

export const serviceDataKey: InjectionKey<ServiceDataContextValue> = Symbol("service-data");

export function provideServiceData(value: ServiceDataContextValue): ServiceDataContextValue {
  provide(serviceDataKey, value);
  return value;
}

export function useServiceData(): ServiceDataContextValue {
  const context = inject(serviceDataKey);
  if (!context) {
    throw new Error("useServiceData must be used within a Vue service data provider");
  }
  return context;
}