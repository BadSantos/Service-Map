import {
  inject,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  readonly,
  watch,
  type DeepReadonly,
  type InjectionKey,
} from "vue";
import {
  copyShareableLink,
  readUrlState,
  writeUrlState,
  type UrlState,
} from "@/lib/url-state";

interface UrlStateContextValue {
  state: DeepReadonly<UrlState>;
  setState: (patch: Partial<UrlState>) => void;
  copyShareableLink: () => Promise<boolean>;
}

const urlStateKey: InjectionKey<UrlStateContextValue> = Symbol("url-state");

export function provideUrlState(): UrlStateContextValue {
  const state = reactive<UrlState>({ ...readUrlState() });
  const setState = (patch: Partial<UrlState>) => Object.assign(state, patch);
  const syncFromLocation = () => Object.assign(state, readUrlState());

  const stop = watch(state, (next) => writeUrlState(next), { deep: true });
  onMounted(() => window.addEventListener("popstate", syncFromLocation));
  onUnmounted(() => {
    stop();
    window.removeEventListener("popstate", syncFromLocation);
  });

  const value: UrlStateContextValue = {
    state: readonly(state),
    setState,
    copyShareableLink,
  };
  provide(urlStateKey, value);
  return value;
}

export function useUrlState(): UrlStateContextValue {
  const context = inject(urlStateKey);
  if (!context) {
    throw new Error("useUrlState must be used within a Vue URL state provider");
  }
  return context;
}