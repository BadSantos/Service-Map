import { inject, provide, type InjectionKey, type Ref } from "vue";

export type ToggleValue = string | string[] | undefined;
export interface ToggleGroupContext {
  modelValue: Ref<ToggleValue>;
  multiple: boolean;
  toggle: (value: string) => void;
}
export const toggleGroupKey: InjectionKey<ToggleGroupContext> = Symbol("toggle-group");
export function useToggleGroup() {
  return inject(toggleGroupKey);
}
export function provideToggleGroup(context: ToggleGroupContext) {
  provide(toggleGroupKey, context);
}